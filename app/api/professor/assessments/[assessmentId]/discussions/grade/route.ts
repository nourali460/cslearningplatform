import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * POST /api/professor/assessments/[assessmentId]/discussions/grade
 * Grade all discussion submissions for an assessment (auto-grade or manual)
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

    // Verify assessment exists and professor owns the class
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

    // Get auto-grading settings
    const {
      autoCompleteEnabled,
      minimumReplyCount,
      maxPoints,
    } = assessment

    const minReplies = minimumReplyCount ?? 1
    const maxPointsNum = Number(maxPoints)

    // Fetch all submissions for this discussion assessment
    const submissions = await db.assessmentSubmission.findMany({
      where: {
        assessmentId: assessmentId,
      },
      include: {
        discussionPost: {
          include: {
            _count: {
              select: {
                replies: true,
              },
            },
          },
        },
      },
    })

    // Auto-grade submissions if enabled
    if (autoCompleteEnabled) {
      const gradedSubmissions = await Promise.all(
        submissions.map(async (submission) => {
          if (submission.status === 'GRADED') {
            // Skip already graded submissions
            return submission
          }

          // Check if submission meets criteria
          const hasPost = !!submission.discussionPost
          const replyCount = submission.discussionReplyCount || 0
          const meetsRequirements = hasPost && replyCount >= minReplies

          if (meetsRequirements) {
            // Award full points
            return await db.assessmentSubmission.update({
              where: { id: submission.id },
              data: {
                status: 'GRADED',
                totalScore: maxPointsNum,
              },
            })
          } else {
            // Partial credit based on reply count
            const partialScore = Math.min(
              (replyCount / minReplies) * maxPointsNum,
              maxPointsNum
            )

            return await db.assessmentSubmission.update({
              where: { id: submission.id },
              data: {
                status: 'GRADED',
                totalScore: partialScore,
              },
            })
          }
        })
      )

      return NextResponse.json({
        success: true,
        message: `Auto-graded ${gradedSubmissions.length} submissions`,
        gradedCount: gradedSubmissions.length,
      })
    } else {
      return NextResponse.json(
        { error: 'Auto-grading is not enabled for this assessment' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error grading discussions:', error)
    return NextResponse.json(
      { error: 'Failed to grade discussions' },
      { status: 500 }
    )
  }
}
