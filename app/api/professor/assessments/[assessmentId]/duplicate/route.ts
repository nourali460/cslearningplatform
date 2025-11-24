import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * POST /api/professor/assessments/[assessmentId]/duplicate
 * Duplicate an assessment
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { assessmentId } = params

    // Fetch original assessment and verify ownership
    const originalAssessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        class: {
          professorId: professor.id,
        },
      },
    })

    if (!originalAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Create duplicate with modified title
    const newTitle = `${originalAssessment.title} (Copy)`
    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const duplicateAssessment = await db.assessment.create({
      data: {
        classId: originalAssessment.classId,
        title: newTitle,
        slug,
        description: originalAssessment.description,
        type: originalAssessment.type,
        submissionType: originalAssessment.submissionType,
        maxPoints: originalAssessment.maxPoints,
        dueAt: null, // Don't copy due date
        allowMultipleAttempts: originalAssessment.allowMultipleAttempts,
        maxAttempts: originalAssessment.maxAttempts,
        orderIndex: originalAssessment.orderIndex,
        rubricId: originalAssessment.rubricId,
      },
      include: {
        rubric: {
          include: {
            criteria: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Assessment duplicated successfully',
      assessment: duplicateAssessment,
    })
  } catch (error) {
    console.error('Error duplicating assessment:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate assessment' },
      { status: 500 }
    )
  }
}
