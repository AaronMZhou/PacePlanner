export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserIdFromCookie } from '@/lib/cookies'
import { assignmentStrategySchema, WorkWindows } from '@/lib/validators'
import { generateSubtaskPlan } from '@/lib/planner'
import { nowInTimezone } from '@/lib/dates'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { estimatedMinutes, strategy } = body as {
      estimatedMinutes?: number
      strategy?: string
    }

    if (strategy) {
      assignmentStrategySchema.parse(strategy)
    }

    const assignment = await prisma.assignment.findFirst({
      where: {
        id: params.id,
        userId
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true }
    })

    if (!user?.settings) {
      return NextResponse.json(
        { error: 'User settings not found' },
        { status: 400 }
      )
    }

    const workWindows: WorkWindows = JSON.parse(user.settings.workWindowsJson)
    const timezone = user.settings.timezone
    const dailyMaxMinutes = user.settings.dailyMaxMinutes

    const updatedEstimatedMinutes =
      estimatedMinutes !== undefined ? estimatedMinutes : assignment.estimatedMinutes
    const updatedStrategy = (strategy ?? assignment.strategy) as
      | 'even'
      | 'frontload'
      | 'backload'
      | 'custom'

    let generatedSubtasks = 0

    const assignmentUpdates: Record<string, unknown> = {}
    if (estimatedMinutes !== undefined) {
      assignmentUpdates.estimatedMinutes = estimatedMinutes
    }
    if (strategy) {
      assignmentUpdates.strategy = strategy
    }

    if (Object.keys(assignmentUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      )
    }

    const plan =
      updatedEstimatedMinutes &&
      updatedEstimatedMinutes > 0 &&
      assignment.dueAt
        ? generateSubtaskPlan(
            updatedEstimatedMinutes,
            nowInTimezone(timezone),
            assignment.dueAt,
            workWindows,
            timezone,
            updatedStrategy,
            dailyMaxMinutes,
            assignment.title,
            assignment.rawDescription ?? ''
          )
        : []

    await prisma.$transaction(async (tx) => {
      await tx.assignment.update({
        where: { id: assignment.id },
        data: assignmentUpdates
      })

      const shouldClearSubtasks =
        (estimatedMinutes !== undefined && estimatedMinutes <= 0) || plan.length > 0

      if (shouldClearSubtasks) {
        await tx.subtask.deleteMany({
          where: { assignmentId: assignment.id }
        })
      }

      if (plan.length > 0) {
        await tx.subtask.createMany({
          data: plan.map((item, index) => ({
            assignmentId: assignment.id,
            date: item.date,
            minutes: item.minutes,
            label: item.label,
            description: null,
            order: index,
            completed: false
          }))
        })
        generatedSubtasks = plan.length
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      subtasksGenerated: generatedSubtasks
    })
  } catch (error) {
    console.error('Update assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}
