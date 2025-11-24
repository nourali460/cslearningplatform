import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * PUT /api/professor/submissions/[id]/grade
 * Grade a submission
 */
export async function PUT(
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

    // Verify professor owns the class this submission belongs to
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
        assessment: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { manualScore, feedback, feedbackFiles, status, isLate } = body

    // Validation
    if (manualScore !== undefined) {
      const maxPoints = Number(submission.assessment.maxPoints)
      if (manualScore < 0 || manualScore > maxPoints) {
        return NextResponse.json(
          { error: `Score must be between 0 and ${maxPoints}` },
          { status: 400 }
        )
      }
    }

    // Calculate total score (in this case, manual score = total score)
    // In future, could combine autoScore + manualScore
    const totalScore = manualScore !== undefined ? manualScore : submission.totalScore

    // Update submission
    const updatedSubmission = await db.assessmentSubmission.update({
      where: { id },
      data: {
        manualScore: manualScore !== undefined ? manualScore : submission.manualScore,
        totalScore: totalScore,
        feedback: feedback !== undefined ? feedback : submission.feedback,
        feedbackFiles: feedbackFiles !== undefined ? feedbackFiles : submission.feedbackFiles,
        status: status || (totalScore !== null ? 'GRADED' : submission.status),
        isLate: isLate !== undefined ? isLate : submission.isLate,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            maxPoints: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Submission graded successfully',
      submission: updatedSubmission,
    })
  } catch (error) {
    console.error('Error grading submission:', error)
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    )
  }
}
