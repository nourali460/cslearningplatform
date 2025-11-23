import { NextResponse } from 'next/server'
import { requireProfessor } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/professor/whoami
 * Returns the current professor user's info and their classes
 */
export async function GET() {
  try {
    const user = await requireProfessor()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Professor access required.' },
        { status: 401 }
      )
    }

    // Get professor's classes with course and enrollment info
    const classes = await db.class.findMany({
      where: {
        professorId: user.id,
      },
      include: {
        course: {
          select: {
            code: true,
            title: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            assessments: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { term: 'desc' },
      ],
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        createdAt: user.createdAt,
      },
      classes: classes.map((cls) => ({
        id: cls.id,
        title: cls.title,
        classCode: cls.classCode,
        term: cls.term,
        year: cls.year,
        section: cls.section,
        isActive: cls.isActive,
        course: cls.course,
        studentCount: cls._count.enrollments,
        assessmentCount: cls._count.assessments,
      })),
      stats: {
        totalClasses: classes.length,
        activeClasses: classes.filter((c) => c.isActive).length,
      },
    })
  } catch (error) {
    console.error('Professor whoami error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
