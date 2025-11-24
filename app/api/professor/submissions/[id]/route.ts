import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * GET /api/professor/submissions/[id]
 * Get detailed submission information for grading
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { id } = params

    // Fetch submission with all related data
    const submission = await db.assessmentSubmission.findFirst({
      where: {
        id,
        assessment: {
          class: {
            professorId: professor.id,
          },
        },
      },
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
          include: {
            class: {
              include: {
                course: true,
              },
            },
            rubric: {
              include: {
                criteria: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}
