import { NextRequest, NextResponse } from 'next/server'
import { clearUserCookie } from '@/lib/cookies'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  await clearUserCookie()
  const redirectUrl = new URL('/', request.url)
  return NextResponse.redirect(redirectUrl)
}

export async function POST(request: NextRequest) {
  return GET(request)
}
