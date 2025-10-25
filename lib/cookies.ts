import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const secret = new TextEncoder().encode(JWT_SECRET)

/**
 * Create a signed cookie with user ID
 */
export async function setUserCookie(userId: string): Promise<void> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set('user-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })
}

/**
 * Get user ID from signed cookie
 */
export async function getUserIdFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('user-session')?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, secret)
    return payload.userId as string
  } catch (error) {
    console.error('Error verifying user cookie:', error)
    return null
  }
}

/**
 * Clear user cookie
 */
export async function clearUserCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('user-session')
}
