import { NextResponse } from 'next/server'
import { getSession } from './session'
import { db } from './db'
import type { User } from '@prisma/client'

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()

  if (!session) {
    return null
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
  })

  return user
}

/**
 * Require authentication - returns user or throws 401
 * Use in API routes
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Require specific role - returns user or throws 401/403
 * Use in API routes
 */
export async function requireRole(role: 'admin' | 'professor' | 'student'): Promise<User> {
  const user = await requireAuth()

  if (user.role !== role) {
    throw new Error('Forbidden: Insufficient permissions')
  }

  return user
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<User> {
  return requireRole('admin')
}

/**
 * Require professor role
 */
export async function requireProfessor(): Promise<User> {
  const user = await requireRole('professor')

  // Check if professor is approved
  if (!user.isApproved) {
    throw new Error('Professor account pending approval')
  }

  return user
}

/**
 * Require student role
 */
export async function requireStudent(): Promise<User> {
  return requireRole('student')
}

/**
 * Get professor without approval check (for pending approval page)
 */
export async function getProfessorUnapproved(): Promise<User | null> {
  const session = await getSession()

  if (!session || session.role !== 'professor') {
    return null
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
  })

  return user
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}

/**
 * Handle auth errors in API routes
 * Converts Error to appropriate NextResponse
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message.includes('Forbidden') || error.message.includes('pending approval')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
