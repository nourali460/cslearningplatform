import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { joinClassSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user from database
    const user = await db.user.findUnique({
      where: { clerkId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Verify user is a student
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can enroll in classes' },
        { status: 403 }
      )
    }

    // 4. Parse and validate request body
    const body = await req.json()
    const validatedData = joinClassSchema.parse(body)

    // 5. Find class by code
    const classToJoin = await db.class.findUnique({
      where: { classCode: validatedData.classCode },
      include: {
        course: {
          select: {
            code: true,
            title: true,
          },
        },
        professor: {
          select: {
            fullName: true,
          },
        },
      },
    })

    if (!classToJoin) {
      return NextResponse.json(
        { error: 'Class code not found. Please check the code and try again.' },
        { status: 404 }
      )
    }

    // 6. Verify class is active
    if (!classToJoin.isActive) {
      return NextResponse.json(
        { error: 'This class is no longer active and not accepting enrollments.' },
        { status: 400 }
      )
    }

    // 7. Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classToJoin.id,
          studentId: user.id,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this class.' },
        { status: 400 }
      )
    }

    // 8. Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        classId: classToJoin.id,
        studentId: user.id,
        status: 'active',
      },
    })

    // 9. Return success with class details
    return NextResponse.json(
      {
        message: 'Successfully enrolled in class',
        enrollment: {
          id: enrollment.id,
          class: {
            id: classToJoin.id,
            title: classToJoin.title,
            classCode: classToJoin.classCode,
            term: classToJoin.term,
            year: classToJoin.year,
            course: classToJoin.course,
            professor: classToJoin.professor,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    // Handle Prisma unique constraint violation (duplicate enrollment)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You are already enrolled in this class.' },
        { status: 400 }
      )
    }

    console.error('Error joining class:', error)
    return NextResponse.json(
      { error: 'An error occurred while joining the class. Please try again.' },
      { status: 500 }
    )
  }
}
