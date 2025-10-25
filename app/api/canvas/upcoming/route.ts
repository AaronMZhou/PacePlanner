import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserIdFromCookie } from '@/lib/cookies'
import { startOfDay, nowInTimezone } from '@/lib/dates'

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
    
    // Get days parameter (default to 14)
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '14', 10)
    
    // Get user settings
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
    const endDate = new Date(now)
    endDate.setDate(now.getDate() + days)
    
    // Get subtasks for the date range
    const subtasks = await prisma.subtask.findMany({
      where: {
        assignment: {
          userId: userId,
        },
        date: {
          gte: startOfDay(now, timezone),
          lt: startOfDay(endDate, timezone),
        }
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            courseName: true,
            dueAt: true,
            pointsPossible: true,
            status: true,
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { order: 'asc' }
      ]
    })
    
    // Group subtasks by date
    const groupedSubtasks: Record<string, Array<{
      id: string
      minutes: number
      label: string
      description: string | null
      completed: boolean
      order: number
      assignment: {
        id: string
        title: string
        courseName: string
        dueAt: Date | null
        pointsPossible: number | null
        status: string
      }
    }>> = {}
    
    subtasks.forEach(subtask => {
      const dateKey = subtask.date.toISOString().split('T')[0]
      if (!groupedSubtasks[dateKey]) {
        groupedSubtasks[dateKey] = []
      }
      
      groupedSubtasks[dateKey].push({
        id: subtask.id,
        minutes: subtask.minutes,
        label: subtask.label,
        description: subtask.description ?? null,
        completed: subtask.completed,
        order: subtask.order,
        assignment: subtask.assignment
      })
    })
    
    return NextResponse.json({
      success: true,
      data: groupedSubtasks,
      dateRange: {
        start: startOfDay(now, timezone).toISOString(),
        end: startOfDay(endDate, timezone).toISOString(),
      }
    })
    
  } catch (error) {
    console.error('Upcoming subtasks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming subtasks' },
      { status: 500 }
    )
  }
}
