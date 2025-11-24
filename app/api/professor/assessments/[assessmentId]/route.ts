import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * GET /api/professor/assessments/[assessmentId]
 * Get a single assessment with details
 */
export async function GET(
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

    // Fetch assessment and verify ownership
    const assessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        class: {
          professorId: professor.id,
        },
      },
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
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error('Error fetching assessment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/professor/assessments/[assessmentId]
 * Update an assessment
 */
export async function PUT(
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

    // Verify ownership
    const existingAssessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        class: {
          professorId: professor.id,
        },
      },
    })

    if (!existingAssessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const {
      title,
      description,
      type,
      submissionType,
      maxPoints,
      dueAt,
      allowMultipleAttempts,
      maxAttempts,
      orderIndex,
      rubricId,
    } = body

    // Generate new slug if title changed
    const slug =
      title && title !== existingAssessment.title
        ? title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : existingAssessment.slug

    // Update assessment
    const assessment = await db.assessment.update({
      where: { id: assessmentId },
      data: {
        title: title || existingAssessment.title,
        slug,
        description: description !== undefined ? description : existingAssessment.description,
        type: type || existingAssessment.type,
        submissionType: submissionType || existingAssessment.submissionType,
        maxPoints: maxPoints !== undefined ? maxPoints : existingAssessment.maxPoints,
        dueAt: dueAt !== undefined ? (dueAt ? new Date(dueAt) : null) : existingAssessment.dueAt,
        allowMultipleAttempts:
          allowMultipleAttempts !== undefined
            ? allowMultipleAttempts
            : existingAssessment.allowMultipleAttempts,
        maxAttempts: maxAttempts !== undefined ? maxAttempts : existingAssessment.maxAttempts,
        orderIndex: orderIndex !== undefined ? orderIndex : existingAssessment.orderIndex,
        rubricId: rubricId !== undefined ? rubricId : existingAssessment.rubricId,
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
      message: 'Assessment updated successfully',
      assessment,
    })
  } catch (error) {
    console.error('Error updating assessment:', error)
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/professor/assessments/[assessmentId]
 * Delete an assessment
 */
export async function DELETE(
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

    // Verify ownership
    const assessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        class: {
          professorId: professor.id,
        },
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Check if there are submissions
    if (assessment._count.submissions > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete assessment with ${assessment._count.submissions} submission(s). Please delete submissions first.`,
        },
        { status: 400 }
      )
    }

    // Delete assessment
    await db.assessment.delete({
      where: { id: assessmentId },
    })

    return NextResponse.json({
      success: true,
      message: 'Assessment deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting assessment:', error)
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    )
  }
}
