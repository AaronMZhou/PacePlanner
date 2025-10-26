export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserIdFromCookie } from '@/lib/cookies'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user from cookie
    const userId = await getUserIdFromCookie()
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { completed, date, label, minutes, description } = body as {
      completed?: boolean
      date?: string
      label?: string
      minutes?: number
      description?: string | null
    }

    const updateData: Record<string, unknown> = {}

    if (completed !== undefined) {
      updateData.completed = completed
    }

    if (date) {
      const newDate = new Date(date)
      if (Number.isNaN(newDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date provided' },
          { status: 400 }
        )
      }
      updateData.date = newDate
    }

    if (label !== undefined) {
      const trimmedLabel = label.trim()
      if (!trimmedLabel) {
        return NextResponse.json(
          { error: 'Subtask label cannot be empty' },
          { status: 400 }
        )
      }
      updateData.label = trimmedLabel
    }

    if (minutes !== undefined) {
      if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0) {
        return NextResponse.json(
          { error: 'Minutes must be a non-negative number' },
          { status: 400 }
        )
      }
      updateData.minutes = Math.round(minutes)
    }

    if (description !== undefined) {
      if (description === null) {
        updateData.description = null
      } else if (typeof description === 'string') {
        updateData.description = description.trim() || null
      } else {
        return NextResponse.json(
          { error: 'Description must be a string or null' },
          { status: 400 }
        )
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No subtask fields provided for update' },
        { status: 400 }
      )
    }
    
    // Update subtask
    const subtask = await prisma.subtask.updateMany({
      where: {
        id: params.id,
        assignment: {
          userId: userId, // Ensure user owns this subtask
        }
      },
      data: updateData
    })
    
    if (subtask.count === 0) {
      return NextResponse.json(
        { error: 'Subtask not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subtask updated successfully'
    })
    
  } catch (error) {
    console.error('Update subtask error:', error)
    return NextResponse.json(
      { error: 'Failed to update subtask' },
      { status: 500 }
    )
  }
}
