import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStudent } from '@/lib/auth'
import { validateHtmlContent } from '@/lib/sanitize-html'

/**
 * POST /api/student/discussions/[postId]/replies
 * Reply to a discussion post
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ postId: string }> }
) {
  try {
    const student = await getStudent()

    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { postId } = params

    // Verify post exists and student has access
    const post = await db.discussionPost.findFirst({
      where: {
        id: postId,
      },
      include: {
        assessment: {
          include: {
            class: {
              include: {
                enrollments: {
                  where: {
                    studentId: student.id,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.assessment.class.enrollments.length === 0) {
      return NextResponse.json(
        { error: 'Not enrolled in this class' },
        { status: 403 }
      )
    }

    // Check if peer replies are allowed
    if (!post.assessment.allowPeerReplies) {
      return NextResponse.json(
        { error: 'Peer replies are not allowed for this discussion' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { content } = body

    // Validate and sanitize HTML content (no minimum length for replies)
    const validation = validateHtmlContent(content, 0, 10000)

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid content' },
        { status: 400 }
      )
    }

    // Create reply
    const reply = await db.discussionReply.create({
      data: {
        postId: postId,
        authorId: student.id,
        assessmentId: post.assessmentId,
        classId: post.classId,
        content: validation.sanitized,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    // Update submission reply count
    const submission = await db.assessmentSubmission.findFirst({
      where: {
        studentId: student.id,
        assessmentId: post.assessmentId,
      },
    })

    if (submission) {
      await db.assessmentSubmission.update({
        where: { id: submission.id },
        data: {
          discussionReplyCount: (submission.discussionReplyCount || 0) + 1,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Reply created successfully',
      reply,
    })
  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
