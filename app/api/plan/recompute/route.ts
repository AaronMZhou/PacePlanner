import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserIdFromCookie } from '@/lib/cookies'
import { reflowSubtasks, generateSubtaskPlan } from '@/lib/planner'
import { nowInTimezone, startOfDay } from '@/lib/dates'

const prisma = new PrismaClient()

type AssignmentSubtask = {
  id: string
  order: number
  label: string
  completed: boolean
  minutes: number
  createdAt: Date
}

function compareSubtasks<T extends AssignmentSubtask>(a: T, b: T): number {
  if (a.completed !== b.completed) {
    return a.completed ? -1 : 1
  }

  const timeDelta = a.createdAt.getTime() - b.createdAt.getTime()
  if (timeDelta !== 0) {
    return timeDelta
  }

  return a.id.localeCompare(b.id)
}

function dedupeSubtasks<T extends AssignmentSubtask>(subtasks: T[]): {
  uniqueSubtasks: T[]
  duplicateIds: string[]
} {
  if (subtasks.length <= 1) {
    return {
      uniqueSubtasks: subtasks,
      duplicateIds: []
    }
  }

  const duplicates = new Set<string>()
  const orderGroups = new Map<number, T[]>()

  for (const subtask of subtasks) {
    if (!orderGroups.has(subtask.order)) {
      orderGroups.set(subtask.order, [])
    }
    orderGroups.get(subtask.order)!.push(subtask)
  }

  for (const group of orderGroups.values()) {
    group.sort(compareSubtasks)
    const [, ...rest] = group
    for (const duplicate of rest) {
      duplicates.add(duplicate.id)
    }
  }

  const afterOrder = subtasks.filter(subtask => !duplicates.has(subtask.id))
  const labelGroups = new Map<string, T[]>()

  for (const subtask of afterOrder) {
    if (!labelGroups.has(subtask.label)) {
      labelGroups.set(subtask.label, [])
    }
    labelGroups.get(subtask.label)!.push(subtask)
  }

  for (const group of labelGroups.values()) {
    group.sort(compareSubtasks)
    const [, ...rest] = group
    for (const duplicate of rest) {
      duplicates.add(duplicate.id)
    }
  }

  const uniqueSubtasks = subtasks.filter(subtask => !duplicates.has(subtask.id))

  return {
    uniqueSubtasks,
    duplicateIds: Array.from(duplicates)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from cookie
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Get user and settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true }
    })
    
    if (!user || !user.settings) {
      return NextResponse.json(
        { error: 'User settings not found' },
        { status: 404 }
      )
    }
    
    const timezone = user.settings.timezone
    const workWindows = JSON.parse(user.settings.workWindowsJson)
    const dailyMaxMinutes = user.settings.dailyMaxMinutes
    const now = nowInTimezone(timezone)
    
    // Get all assignments that need recomputation (not done)
    const assignments = await prisma.assignment.findMany({
      where: {
        userId: userId,
        status: {
          not: 'done'
        },
        estimatedMinutes: {
          not: null
        }
      },
      include: {
        subtasks: {
          orderBy: [
            { order: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    })
    
    let recomputedCount = 0
    let reflowedCount = 0
    
    for (const assignment of assignments) {
      if (!assignment.estimatedMinutes || !assignment.dueAt) {
        continue
      }

      const { uniqueSubtasks, duplicateIds } = dedupeSubtasks(assignment.subtasks)

      if (duplicateIds.length > 0) {
        await prisma.subtask.deleteMany({
          where: {
            id: {
              in: duplicateIds
            }
          }
        })
      }

      const completedSubtasks = uniqueSubtasks.filter(st => st.completed)
      const completedMinutes = completedSubtasks.reduce(
        (total, subtask) => total + subtask.minutes,
        0
      )
      const remainingMinutes = Math.max(assignment.estimatedMinutes - completedMinutes, 0)
      
      // Delete existing incomplete subtasks
      await prisma.subtask.deleteMany({
        where: {
          assignmentId: assignment.id,
          completed: false
        }
      })
      
      if (remainingMinutes > 0) {
        // Generate new subtask plan for remaining work only
        const newPlan = generateSubtaskPlan(
          remainingMinutes,
          now,
          assignment.dueAt,
          workWindows,
          timezone,
          assignment.strategy as any,
          dailyMaxMinutes,
          assignment.title,
          assignment.rawDescription || ''
        )
        
        const completedOrders = completedSubtasks
          .map(subtask => subtask.order)
          .filter((order): order is number => order !== null && order !== undefined)
        const orderOffset = completedOrders.length > 0 ? Math.max(...completedOrders) + 1 : 0
        
        if (newPlan.length > 0) {
          // Create new subtasks with order continuing after completed ones
          await prisma.subtask.createMany({
            data: newPlan.map((plan, index) => ({
              assignmentId: assignment.id,
              date: plan.date,
              minutes: plan.minutes,
              label: plan.label,
              description: null,
              order: orderOffset + index,
              completed: false
            }))
          })
        }
      }
      
      recomputedCount++
    }
    
    // Reflow any incomplete subtasks that are now in the past
    const pastIncompleteSubtasks = await prisma.subtask.findMany({
      where: {
        assignment: {
          userId: userId,
        },
        date: {
          lt: startOfDay(now, timezone)
        },
        completed: false
      },
      include: {
        assignment: {
          select: {
            dueAt: true
          }
        }
      }
    })
    
    // Group by assignment and reflow
    const subtasksByAssignment = new Map<string, typeof pastIncompleteSubtasks>()
    
    for (const subtask of pastIncompleteSubtasks) {
      const assignmentId = subtask.assignmentId
      if (!subtasksByAssignment.has(assignmentId)) {
        subtasksByAssignment.set(assignmentId, [])
      }
      subtasksByAssignment.get(assignmentId)!.push(subtask)
    }
    
    for (const [assignmentId, subtasks] of Array.from(subtasksByAssignment.entries())) {
      const assignment = subtasks[0].assignment
      if (!assignment.dueAt) continue
      
      const reflowed = reflowSubtasks(
        subtasks.map(st => ({
          id: st.id,
          date: st.date,
          minutes: st.minutes,
          label: st.label,
          order: st.order
        })),
        workWindows,
        timezone,
        dailyMaxMinutes,
        assignment.dueAt
      )
      
      // Update subtasks with new dates and minutes
      for (const reflowedSubtask of reflowed) {
        await prisma.subtask.update({
          where: { id: reflowedSubtask.id },
          data: {
            date: reflowedSubtask.date,
            minutes: reflowedSubtask.minutes
          }
        })
      }
      
      reflowedCount += subtasks.length
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        recomputedAssignments: recomputedCount,
        reflowedSubtasks: reflowedCount
      }
    })
    
  } catch (error) {
    console.error('Recompute error:', error)
    return NextResponse.json(
      { error: 'Failed to recompute plan' },
      { status: 500 }
    )
  }
}

