export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserIdFromCookie } from '@/lib/cookies'
import { userSettingsSchema } from '@/lib/validators'

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
    
    return NextResponse.json({
      success: true,
      settings: {
        workWindowsJson: user.settings.workWindowsJson,
        dailyMaxMinutes: user.settings.dailyMaxMinutes,
        timezone: user.settings.timezone,
        useAIEstimates: user.settings.useAIEstimates,
        aiAggressiveness: user.settings.aiAggressiveness,
      }
    })
    
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    
    // Validate settings
    const validatedSettings = userSettingsSchema.parse({
      workWindowsJson: body.workWindowsJson,
      dailyMaxMinutes: body.dailyMaxMinutes,
      timezone: body.timezone,
      useAIEstimates: body.useAIEstimates,
      aiAggressiveness: body.aiAggressiveness,
    })
    
    // Update or create settings
    await prisma.userSettings.upsert({
      where: { userId: userId },
      update: {
        workWindowsJson: validatedSettings.workWindowsJson,
        dailyMaxMinutes: validatedSettings.dailyMaxMinutes,
        timezone: validatedSettings.timezone,
        useAIEstimates: validatedSettings.useAIEstimates,
        aiAggressiveness: validatedSettings.aiAggressiveness,
      },
      create: {
        userId: userId,
        workWindowsJson: validatedSettings.workWindowsJson,
        dailyMaxMinutes: validatedSettings.dailyMaxMinutes,
        timezone: validatedSettings.timezone,
        useAIEstimates: validatedSettings.useAIEstimates,
        aiAggressiveness: validatedSettings.aiAggressiveness,
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })
    
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
