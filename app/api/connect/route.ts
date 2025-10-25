// app/api/connect/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { canvasBaseUrlSchema, canvasTokenSchema } from '@/lib/validators'
import { verifyCanvasToken } from '@/lib/canvas'
import { encrypt } from '@/lib/crypto'
import { setUserCookie } from '@/lib/cookies'

const prisma = new PrismaClient()

// Rate limiting (simple in-memory store)
const rateLimit = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimit.get(ip)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
    
    const body = await request.json()
    const { baseUrl, token } = body
    
    // Validate inputs
    const validatedBaseUrl = canvasBaseUrlSchema.parse(baseUrl)
    const validatedToken = canvasTokenSchema.parse(token)
    
    // Verify token with Canvas
    const user = await verifyCanvasToken(validatedBaseUrl, validatedToken)
    
    // Encrypt token
    const { ciphertext, iv } = await encrypt(validatedToken)
    
    // Create or update user
    const existingUser = await prisma.user.findFirst({
      where: { canvasBaseUrl: validatedBaseUrl }
    })
    
    const dbUser = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            encToken: ciphertext,
            iv: iv,
          }
        })
      : await prisma.user.create({
          data: {
            canvasBaseUrl: validatedBaseUrl,
            encToken: ciphertext,
            iv: iv,
            settings: {
              create: {
                workWindowsJson: JSON.stringify({
                  "1": [["19:00", "22:00"]], // Monday
                  "2": [["19:00", "22:00"]], // Tuesday
                  "3": [["19:00", "22:00"]], // Wednesday
                  "4": [["19:00", "22:00"]], // Thursday
                  "5": [["19:00", "22:00"]], // Friday
                  "6": [["10:00", "16:00"]], // Saturday
                  "0": [["10:00", "16:00"]], // Sunday
                }),
                dailyMaxMinutes: 180,
                timezone: 'America/New_York',
                useAIEstimates: false,
                aiAggressiveness: 0,
              }
            }
          },
        })
    
    // Set user cookie
    await setUserCookie(dbUser.id)
    
    return NextResponse.json({ 
      ok: true, 
      user: {
        id: dbUser.id,
        name: user.name,
        email: user.email
      }
    })
    
  } catch (error) {
    console.error('Connect error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid Canvas token')) {
        return NextResponse.json(
          { error: 'Invalid Canvas token. Please check your token and try again.' },
          { status: 401 }
        )
      }
      if (error.message.includes('required permissions')) {
        return NextResponse.json(
          { error: 'Canvas token does not have required permissions.' },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to connect to Canvas. Please try again.' },
      { status: 500 }
    )
  }
}
