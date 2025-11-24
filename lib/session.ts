import { cookies } from 'next/headers'
import { signToken, verifyToken, type JWTPayload } from './jwt'
import type { User } from '@prisma/client'

const SESSION_COOKIE_NAME = 'session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

/**
 * Create a session for a user and set the session cookie
 */
export async function createSession(user: User): Promise<string> {
  // Create JWT payload
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role as 'admin' | 'professor' | 'student',
  }

  // Sign the token
  const token = await signToken(payload)

  // Set the cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  return token
}

/**
 * Get the current session from the request cookies
 */
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  // Verify and decode the token
  const payload = await verifyToken(sessionCookie.value)
  return payload
}

/**
 * Clear the session cookie (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Update the session with new data (e.g., role change for testing)
 */
export async function updateSession(updates: Partial<JWTPayload>): Promise<void> {
  const currentSession = await getSession()

  if (!currentSession) {
    throw new Error('No active session to update')
  }

  // Merge the updates
  const newPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: currentSession.userId,
    email: currentSession.email,
    role: updates.role || currentSession.role,
  }

  // Sign new token
  const token = await signToken(newPayload)

  // Update cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}
