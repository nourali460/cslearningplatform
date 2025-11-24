import { NextResponse } from 'next/server'
import { requireStudent, handleAuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { joinClassSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    // 1. Require student authentication
    const user = await requireStudent()

    // 2. Parse and validate request body
    const body = await req.json()
    const validatedData = joinClassSchema.parse(body)

    // 3. Find class by code
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

    // 4. Verify class is active
    if (!classToJoin.isActive) {
      return NextResponse.json(
        { error: 'This class is no longer active and not accepting enrollments.' },
        { status: 400 }
      )
    }

    // 5. Check if already enrolled
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

    // 6. Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        classId: classToJoin.id,
        studentId: user.id,
        status: 'active',
      },
    })

    // 7. Return success with class details
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
    return handleAuthError(error)
  }
}
