import { NextResponse } from 'next/server'
import { getStudent } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/student/assessments/[assessmentId]
 * Get assessment details and student's submission status
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const student = await getStudent()

    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { assessmentId } = params

    // Fetch assessment with class and enrollment check
    const assessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        class: {
          enrollments: {
            some: {
              studentId: student.id,
              status: 'active',
            },
          },
        },
      },
      include: {
        class: {
          select: {
            id: true,
            title: true,
            classCode: true,
            term: true,
            year: true,
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
          },
        },
      },
    })

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found or not enrolled' },
        { status: 404 }
      )
    }

    // Fetch module item if this assessment is linked to a module
    const moduleItem = await db.moduleItem.findFirst({
      where: {
        assessmentId: assessmentId,
        module: {
          classId: assessment.classId,
          isPublished: true,
        },
        isPublished: true,
      },
      select: {
        id: true,
        customDescription: true,
        module: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
          },
        },
      },
    })

    // Fetch student's submission (latest attempt)
    const submission = await db.assessmentSubmission.findFirst({
      where: {
        assessmentId: assessmentId,
        studentId: student.id,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
      include: {
        discussionPost: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            _count: {
              select: {
                replies: true,
              },
            },
          },
        },
      },
    })

    // Calculate status
    const now = new Date()
    const isOverdue = assessment.dueAt && assessment.dueAt < now && !submission
    const isSubmitted =
      submission &&
      (submission.status === 'SUBMITTED' ||
        submission.status === 'GRADED' ||
        submission.status === 'LATE')
    const isGraded = submission && submission.status === 'GRADED'
    const isPending = !isSubmitted

    // Calculate discussion-specific data
    let discussionData = null
    if (assessment.type === 'DISCUSSION') {
      const hasPosted = !!submission?.discussionPost
      const replyCount = submission?.discussionReplyCount || 0
      const minimumReplies = assessment.minimumReplyCount || 1
      const meetsRequirements = hasPosted && replyCount >= minimumReplies

      discussionData = {
        hasPosted,
        replyCount,
        minimumReplies,
        meetsRequirements,
        requirePostBeforeViewing: assessment.requirePostBeforeViewing,
        allowPeerReplies: assessment.allowPeerReplies,
        allowAnonymous: assessment.allowAnonymous,
        autoCompleteEnabled: assessment.autoCompleteEnabled,
      }
    }

    // Build response
    const response = {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        slug: assessment.slug,
        description: assessment.description,
        customDescription: moduleItem?.customDescription || null,
        type: assessment.type,
        dueAt: assessment.dueAt,
        maxPoints: assessment.maxPoints,
        submissionType: assessment.submissionType,
        allowMultipleAttempts: assessment.allowMultipleAttempts,
        maxAttempts: assessment.maxAttempts,
        isPublished: assessment.isPublished,
        class: assessment.class,
        module: moduleItem?.module || null,
      },
      submission: submission
        ? {
            id: submission.id,
            submittedAt: submission.submittedAt,
            status: submission.status,
            totalScore: submission.totalScore,
            feedback: submission.feedback,
            isLate: submission.isLate,
            attemptNumber: submission.attemptNumber,
            discussionPost: submission.discussionPost,
            discussionReplyCount: submission.discussionReplyCount,
          }
        : null,
      status: {
        isOverdue,
        isPending,
        isSubmitted,
        isGraded,
        label: isOverdue
          ? 'Overdue'
          : isGraded
            ? 'Graded'
            : isSubmitted
              ? 'Submitted'
              : 'Not Started',
      },
      discussionData,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching assessment details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment details' },
      { status: 500 }
    )
  }
}
