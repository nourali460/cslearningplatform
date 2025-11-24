import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePasswords } from '@/lib/password'
import { createSession } from '@/lib/session'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1), // Allow any non-empty password
})

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid email or password format' },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Compare passwords (plain text)
    if (!comparePasswords(password, user.password)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check professor approval
    if (user.role === 'professor' && !user.isApproved) {
      return NextResponse.json(
        {
          error: 'Professor account pending approval',
          needsApproval: true
        },
        { status: 403 }
      )
    }

    // Create session
    await createSession(user)

    // Return user data (excluding password)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        usernameSchoolId: user.usernameSchoolId,
        isApproved: user.isApproved,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
