import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateUniquePassword } from '@/lib/password'
import { createSession } from '@/lib/session'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(['student', 'professor']),
  classCode: z.string().optional(),
  usernameSchoolId: z.string().regex(/^\d+$/).refine(
    (val) => {
      const num = parseInt(val, 10)
      return num >= 0 && num <= 1000000
    },
    { message: 'School ID must be between 0 and 1000000' }
  ),
})

/**
 * POST /api/auth/register
 * Register a new student or professor
 * Students: require classCode for validation
 * Professors: require username, set isApproved=false
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid registration data', details: result.error.errors },
        { status: 400 }
      )
    }

    const { email, fullName, role, classCode, usernameSchoolId } = result.data

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Check if school ID already exists
    const existingSchoolId = await db.user.findUnique({
      where: { usernameSchoolId },
    })

    if (existingSchoolId) {
      return NextResponse.json(
        { error: 'School ID already registered' },
        { status: 409 }
      )
    }

    // Role-specific validations
    if (role === 'student') {
      if (!classCode) {
        return NextResponse.json(
          { error: 'Class code is required for student registration' },
          { status: 400 }
        )
      }

      // Validate class code exists
      const classExists = await db.class.findUnique({
        where: { classCode },
      })

      if (!classExists) {
        return NextResponse.json(
          { error: 'Invalid class code' },
          { status: 404 }
        )
      }
    }

    // Generate unique password
    const password = await generateUniquePassword()

    // Create user
    const user = await db.user.create({
      data: {
        email,
        fullName,
        role,
        usernameSchoolId,
        password,
        isApproved: true, // All users auto-approved
      },
    })

    // For students, auto-enroll in the class
    if (role === 'student' && classCode) {
      const classData = await db.class.findUnique({
        where: { classCode },
      })

      if (classData) {
        await db.enrollment.create({
          data: {
            studentId: user.id,
            classId: classData.id,
            status: 'active',
          },
        })
      }
    }

    // Create session for approved users only
    if (user.isApproved) {
      await createSession(user)
    }

    // Return user data with password
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        usernameSchoolId: user.usernameSchoolId,
        isApproved: user.isApproved,
        password, // Include generated password in response
      },
      message: role === 'professor'
        ? 'Professor account created successfully.'
        : 'Student account created successfully.',
    }, {
      status: 201
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
