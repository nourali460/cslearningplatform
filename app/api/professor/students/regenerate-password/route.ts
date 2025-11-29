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
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Find the student and verify they're enrolled in one of professor's classes
    const student = await db.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          include: {
            class: {
              select: {
                id: true,
                professorId: true,
              },
            },
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Verify the student is actually a student
    if (student.role !== 'student') {
      return NextResponse.json(
        { error: 'Can only regenerate passwords for students' },
        { status: 400 }
      )
    }

    // Verify the student is enrolled in at least one of this professor's classes
    const isInProfessorClass = student.enrollments.some(
      (enrollment) => enrollment.class.professorId === professor.id
    )

    if (!isInProfessorClass) {
      return NextResponse.json(
        { error: 'Unauthorized - Student is not in your class' },
        { status: 403 }
      )
    }

    // Generate new unique password
    const newPassword = await generateUniquePassword()

    // Update the student's password (plain-text as per system design)
    await db.user.update({
      where: { id: userId },
      data: { password: newPassword },
    })

    return NextResponse.json({
      success: true,
      newPassword,
      userId: student.id,
      userName: student.fullName || student.email,
    })
  } catch (error) {
    console.error('Error regenerating password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
