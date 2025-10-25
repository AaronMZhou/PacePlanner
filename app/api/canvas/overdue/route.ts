import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserIdFromCookie } from '@/lib/cookies'
import { nowInTimezone } from '@/lib/dates'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get user from cookie
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Get user settings for timezone
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
    const now = nowInTimezone(timezone)
    
    // Find overdue assignments (due date has passed but status is not 'done')
    const overdueAssignments = await prisma.assignment.findMany({
      where: {
        userId: userId,
        dueAt: {
          lt: now
        },
        status: {
          not: 'done'
        }
      },
      include: {
        subtasks: {
          where: {
            completed: false
          }
        }
      },
      orderBy: {
        dueAt: 'asc'
      }
    })
    
    // Find overdue subtasks (past due date and not completed)
    const overdueSubtasks = await prisma.subtask.findMany({
      where: {
        assignment: {
          userId: userId,
        },
        date: {
          lt: now
        },
        completed: false
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            courseName: true,
            dueAt: true,
            status: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { order: 'asc' }
      ]
    })
    
    return NextResponse.json({
      success: true,
      data: {
        overdueAssignments: overdueAssignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          courseName: assignment.courseName,
          dueAt: assignment.dueAt,
          status: assignment.status,
          incompleteSubtasks: assignment.subtasks.length
        })),
        overdueSubtasks: overdueSubtasks.map(subtask => ({
          id: subtask.id,
          label: subtask.label,
          description: subtask.description,
          minutes: subtask.minutes,
          date: subtask.date,
          assignment: subtask.assignment
        }))
      }
    })
    
  } catch (error) {
    console.error('Overdue check error:', error)
    return NextResponse.json(
      { error: 'Failed to check overdue items' },
      { status: 500 }
    )
  }
}
