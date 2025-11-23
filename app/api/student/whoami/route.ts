import { NextResponse } from 'next/server'
import { requireStudent } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/student/whoami
 * Returns the current student user's info and their enrollments
 */
export async function GET() {
  try {
    const user = await requireStudent()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Student access required.' },
        { status: 401 }
      )
    }

    // Get student's enrollments with class, course, and professor info
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: user.id,
      },
      include: {
        class: {
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
                email: true,
              },
            },
            _count: {
              select: {
                assessments: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        createdAt: user.createdAt,
      },
      enrollments: enrollments.map((enrollment) => ({
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.createdAt,
        class: {
          id: enrollment.class.id,
          title: enrollment.class.title,
          classCode: enrollment.class.classCode,
          term: enrollment.class.term,
          year: enrollment.class.year,
          section: enrollment.class.section,
          course: enrollment.class.course,
          professor: enrollment.class.professor,
          assessmentCount: enrollment.class._count.assessments,
        },
      })),
      stats: {
        totalEnrollments: enrollments.length,
        activeEnrollments: enrollments.filter((e) => e.status === 'active').length,
      },
    })
  } catch (error) {
    console.error('Student whoami error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
