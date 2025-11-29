import { NextResponse } from 'next/server'
import { getProfessor } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateUniquePassword } from '@/lib/password'

export async function POST(request: Request) {
  try {
    // Check if user is a professor
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json(
        { error: 'Unauthorized - Professor access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, fullName, schoolId, classId } = body

    // Validate required fields
    if (!email || !classId) {
      return NextResponse.json(
        { error: 'Email and class ID are required' },
        { status: 400 }
      )
    }

    if (!fullName || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }

    // Verify the class belongs to this professor
    const classToEnroll = await db.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        professorId: true,
        classCode: true,
        title: true
      },
    })

    if (!classToEnroll) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    if (classToEnroll.professorId !== professor.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only create students for your own classes' },
        { status: 403 }
      )
    }

    // Check if user already exists with this email
    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        enrollments: {
          where: { classId },
        },
      },
    })

    if (existingUser) {
      // If user exists and is already enrolled in this class
      if (existingUser.enrollments.length > 0) {
        return NextResponse.json(
          { error: 'Student is already enrolled in this class' },
          { status: 400 }
        )
      }

      // If user exists but is not a student
      if (existingUser.role !== 'student') {
        return NextResponse.json(
          { error: 'A user with this email already exists with a different role' },
          { status: 400 }
        )
      }

      // User exists as student but not enrolled - enroll them
      await db.enrollment.create({
        data: {
          studentId: existingUser.id,
          classId: classId,
          enrollmentStatus: 'active',
        },
      })

      return NextResponse.json({
        success: true,
        student: {
          id: existingUser.id,
          email: existingUser.email,
          fullName: existingUser.fullName,
          schoolId: existingUser.usernameSchoolId,
          password: existingUser.password,
        },
        enrolled: true,
        message: 'Existing student enrolled in class',
      })
    }

    // Generate unique password for new student
    const password = await generateUniquePassword()

    // Create new student and enroll in class (transaction for atomicity)
    const student = await db.user.create({
      data: {
        email,
        password,
        fullName: fullName || null,
        usernameSchoolId: schoolId || null,
        role: 'student',
        enrollments: {
          create: {
            classId: classId,
            enrollmentStatus: 'active',
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        usernameSchoolId: true,
        password: true,
      },
    })

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        email: student.email,
        fullName: student.fullName,
        schoolId: student.usernameSchoolId,
        password: student.password,
      },
      enrolled: true,
      message: 'Student created and enrolled successfully',
    })
  } catch (error: any) {
    console.error('Error creating student:', error)

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
