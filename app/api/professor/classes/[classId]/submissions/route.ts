import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * GET /api/professor/classes/[classId]/submissions
 * Get all submissions for assessments in a specific class
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ classId: string }> }
) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { classId } = params

    // Verify professor owns this class
    const classItem = await db.class.findFirst({
      where: {
        id: classId,
        professorId: professor.id,
      },
    })

    if (!classItem) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessmentId')
    const status = searchParams.get('status')
    const studentId = searchParams.get('studentId')

    // Build where clause
    const whereClause: any = {
      assessment: {
        classId: classId,
      },
    }

    if (assessmentId) {
      whereClause.assessmentId = assessmentId
    }

    if (status) {
      whereClause.status = status
    }

    if (studentId) {
      whereClause.studentId = studentId
    }

    // Fetch submissions
    const submissions = await db.assessmentSubmission.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            usernameSchoolId: true,
          },
        },
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            maxPoints: true,
            dueAt: true,
          },
        },
      },
      orderBy: [
        { assessment: { dueAt: 'desc' } },
        { submittedAt: 'desc' },
      ],
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
