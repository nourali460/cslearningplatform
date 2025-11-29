import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, handleAuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { updateSession } from '@/lib/session'
import { z } from 'zod'

const setRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['student', 'professor', 'admin']),
})

/**
 * POST /api/set-role
 * Admin endpoint to change a user's role
 * Also updates the session if changing the current user's role
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()

    // Validate input
    const result = setRoleSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      )
    }

    const { userId, role } = result.data

    // Find the user to update
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user's role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        role,
        // Reset approval status if changing to professor
        isApproved: role !== 'professor' ? true : user.isApproved,
      },
    })

    // If updating the current admin's role, update their session
    if (userId === admin.id) {
      await updateSession({ role: role as 'admin' | 'professor' | 'student' })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        isApproved: updatedUser.isApproved,
      },
    })
  } catch (error) {
    console.error('Set role error:', error)
    return handleAuthError(error)
  }
}
