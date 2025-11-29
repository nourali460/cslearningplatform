import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * GET /api/professor/assessments/[assessmentId]/discussions/stats
 * Get discussion statistics for an assessment
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

    // Verify assessment exists and professor owns the class
    const assessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        class: {
          professorId: professor.id,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Get total students enrolled
    const totalStudents = assessment.class._count.enrollments

    // Get discussion posts count
    const totalPosts = await db.discussionPost.count({
      where: { assessmentId: assessmentId },
    })

    // Get total replies count
    const totalReplies = await db.discussionReply.count({
      where: {
        post: {
          assessmentId: assessmentId,
        },
      },
    })

    // Get students who have posted (count distinct students)
    const uniqueStudents = await db.discussionPost.groupBy({
      by: ['studentId'],
      where: { assessmentId: assessmentId },
    })
    const studentsWithPosts = uniqueStudents.length

    // Get submission stats
    const submissions = await db.assessmentSubmission.findMany({
      where: { assessmentId: assessmentId },
    })

    const submittedCount = submissions.filter(
      (s) => s.status === 'SUBMITTED' || s.status === 'GRADED'
    ).length

    const gradedCount = submissions.filter((s) => s.status === 'GRADED').length

    const averageScore =
      gradedCount > 0
        ? submissions
            .filter((s) => s.totalScore !== null)
            .reduce((sum, s) => sum + Number(s.totalScore || 0), 0) / gradedCount
        : null

    // Get pinned posts count
    const pinnedPosts = await db.discussionPost.count({
      where: {
        assessmentId: assessmentId,
        isPinned: true,
      },
    })

    return NextResponse.json({
      totalStudents,
      totalPosts,
      totalReplies,
      studentsWithPosts,
      participationRate: totalStudents > 0 ? (studentsWithPosts / totalStudents) * 100 : 0,
      submittedCount,
      gradedCount,
      ungradedCount: submittedCount - gradedCount,
      averageScore,
      pinnedPosts,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        maxPoints: assessment.maxPoints,
        minimumReplyCount: assessment.minimumReplyCount,
        autoCompleteEnabled: assessment.autoCompleteEnabled,
      },
    })
  } catch (error) {
    console.error('Error fetching discussion stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discussion stats' },
      { status: 500 }
    )
  }
}
