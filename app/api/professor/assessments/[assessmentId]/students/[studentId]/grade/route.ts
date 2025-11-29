import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * PUT /api/professor/assessments/[assessmentId]/students/[studentId]/grade
 * Create or update a grade for a student's assessment
 * This handles cases where no submission exists yet
 */
export async function PUT(
  request: Request,
  props: { params: Promise<{ assessmentId: string; studentId: string }> }
) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { assessmentId, studentId } = params
    console.log('Grade update request:', { assessmentId, studentId, professorId: professor.id })

    // Verify professor owns the class this assessment belongs to
    const assessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        class: {
          professorId: professor.id,
        },
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Verify student is enrolled in the class
    const enrollment = await db.enrollment.findFirst({
      where: {
        studentId: studentId,
        classId: assessment.classId,
        status: 'active',
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Student not enrolled in this class' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { manualScore } = body

    // Validation
    if (manualScore === undefined || manualScore === null) {
      return NextResponse.json({ error: 'Score is required' }, { status: 400 })
    }

    const score = Number(manualScore)
    const maxPoints = Number(assessment.maxPoints)

    console.log('Parsed score:', score, 'type:', typeof score)

    if (isNaN(score) || score < 0 || score > maxPoints) {
      return NextResponse.json(
        { error: `Score must be between 0 and ${maxPoints}` },
        { status: 400 }
      )
    }

    // Check if submission already exists (using unique constraint)
    let submission = await db.assessmentSubmission.findUnique({
      where: {
        assessmentId_studentId: {
          assessmentId: assessmentId,
          studentId: studentId,
        },
      },
    })

    console.log('Existing submission:', submission ? 'Found' : 'Not found')

    if (submission) {
      // Update existing submission
      console.log('Updating submission:', submission.id, 'with score:', score)
      try {
        submission = await db.assessmentSubmission.update({
          where: { id: submission.id },
          data: {
            manualScore: score,
            totalScore: score,
            status: 'GRADED',
          },
        })
        console.log('Update successful. New totalScore:', submission.totalScore)
      } catch (updateError) {
        console.error('Error during update:', updateError)
        throw updateError
      }
    } else {
      // Create new submission with grade
      console.log('Creating new submission with grade:', score)
      submission = await db.assessmentSubmission.create({
        data: {
          assessmentId: assessmentId,
          studentId: studentId,
          classId: assessment.classId, // Direct class association
          submittedAt: new Date(), // Mark as submitted now
          manualScore: score,
          totalScore: score,
          status: 'GRADED',
          isLate: false, // Not late if professor is entering grade directly
          attemptNumber: 1,
        },
      })
    }

    console.log('Grade saved successfully:', { submissionId: submission.id, score: submission.totalScore })

    return NextResponse.json({
      success: true,
      message: 'Grade saved successfully',
      submission: {
        id: submission.id,
        totalScore: submission.totalScore,
        status: submission.status,
      },
    })
  } catch (error) {
    console.error('Error saving grade:', error)
    console.error('Full error:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: 'Failed to save grade', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
