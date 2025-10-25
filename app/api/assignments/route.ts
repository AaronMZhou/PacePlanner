import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserIdFromCookie } from '@/lib/cookies'

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
    
    // Get assignments with subtasks
    const assignments = await prisma.assignment.findMany({
      where: {
        userId: userId,
      },
      include: {
        subtasks: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        dueAt: 'asc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: assignments
    })
    
  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
