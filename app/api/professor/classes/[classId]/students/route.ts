import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * GET /api/professor/classes/[classId]/students
 * Get all students enrolled in a specific class
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session || session.role !== 'professor') {
      return NextResponse.json(
        { error: 'Unauthorized - Professor access required' },
        { status: 401 }
      )
    }

    const { classId } = await params

    // Verify that this class belongs to the professor
    const classItem = await db.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        professorId: true,
        title: true,
        classCode: true,
        term: true,
        year: true,
        section: true,
        course: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    })

    if (!classItem) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    if (classItem.professorId !== session.userId) {
      return NextResponse.json(
        { error: 'You do not have access to this class' },
        { status: 403 }
      )
    }

    // Get all enrolled students
    const enrollments = await db.enrollment.findMany({
      where: {
        classId: classId,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            usernameSchoolId: true,
            password: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        student: {
          fullName: 'asc',
        },
      },
    })

    return NextResponse.json({
      class: {
        id: classItem.id,
        title: classItem.title,
        classCode: classItem.classCode,
        term: classItem.term,
        year: classItem.year,
        section: classItem.section,
        courseCode: classItem.course.code,
        courseTitle: classItem.course.title,
      },
      students: enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        enrollmentStatus: enrollment.status,
        enrolledAt: enrollment.createdAt,
        id: enrollment.student.id,
        fullName: enrollment.student.fullName,
        email: enrollment.student.email,
        schoolId: enrollment.student.usernameSchoolId,
        password: enrollment.student.password,
        createdAt: enrollment.student.createdAt,
      })),
      total: enrollments.length,
    })
  } catch (error) {
    console.error('Error fetching class students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}
