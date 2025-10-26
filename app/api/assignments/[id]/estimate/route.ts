export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserIdFromCookie } from '@/lib/cookies'
import { requestTimeEstimate } from '@/lib/ai'
import { generateSubtaskPlan } from '@/lib/planner'
import { nowInTimezone } from '@/lib/dates'
import type { WorkWindows } from '@/lib/validators'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const assignment = await prisma.assignment.findFirst({
      where: {
        id: params.id,
        userId
      },
      include: {
        subtasks: true
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

    if (!user.settings.useAIEstimates) {
      return NextResponse.json(
        { error: 'AI estimates are disabled in settings' },
        { status: 403 }
      )
    }

    let aiResult
    try {
      aiResult = await requestTimeEstimate({
        title: assignment.title,
        description: assignment.rawDescription,
        courseName: assignment.courseName,
        dueAt: assignment.dueAt,
        pointsPossible: assignment.pointsPossible,
        existingEstimate: assignment.estimatedMinutes ?? undefined,
        subtasksCount: assignment.subtasks.length,
        aiAggressiveness: user.settings.aiAggressiveness
      })
    } catch (error) {
      console.error('AI estimate error:', error)
      return NextResponse.json(
        { error: 'Failed to generate AI estimate' },
        { status: 502 }
      )
    }

    const estimatedMinutes = Math.max(0, Math.round(aiResult.minutes))

    const workWindows: WorkWindows = JSON.parse(user.settings.workWindowsJson)
    const timezone = user.settings.timezone
    const dailyMaxMinutes = user.settings.dailyMaxMinutes

    const plan =
      estimatedMinutes > 0 && assignment.dueAt
        ? generateSubtaskPlan(
            estimatedMinutes,
            nowInTimezone(timezone),
            assignment.dueAt,
            workWindows,
            timezone,
            assignment.strategy as any,
            dailyMaxMinutes,
            assignment.title,
            assignment.rawDescription ?? ''
          )
        : []

    let generatedSubtasks = 0

    await prisma.$transaction(async (tx) => {
      await tx.assignment.update({
        where: { id: assignment.id },
        data: {
          estimatedMinutes
        }
      })

      const shouldClearSubtasks = plan.length > 0 || estimatedMinutes === 0

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
      minutes: estimatedMinutes,
      explanation: aiResult.explanation,
      rawOutput: aiResult.rawOutput,
      subtasksGenerated: generatedSubtasks
    })
  } catch (error) {
    console.error('AI estimate route error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI estimate' },
      { status: 500 }
    )
  }
}
