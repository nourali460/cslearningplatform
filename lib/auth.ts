import { auth } from '@clerk/nextjs/server'
import { db } from './db'
import { User } from '@prisma/client'

/**
 * Get the currently authenticated user from Clerk and return the corresponding local User record
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId: clerkId } = await auth()
  
  if (!clerkId) {
    return null
  }

  const user = await db.user.findUnique({
    where: { clerkId }
  })

  return user
}

/**
 * Verify that the current user has the required role(s)
 * @param allowedRoles - Single role or array of allowed roles
 * @returns The user if authorized, null otherwise
 */
export async function requireRole(
  allowedRoles: string | string[]
): Promise<User | null> {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  
  if (!roles.includes(user.role)) {
    return null
  }

  return user
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<User | null> {
  return requireRole('admin')
}

/**
 * Require professor role
 */
export async function requireProfessor(): Promise<User | null> {
  return requireRole('professor')
}

/**
 * Require student role
 */
export async function requireStudent(): Promise<User | null> {
  return requireRole('student')
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}
