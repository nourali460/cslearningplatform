import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'
import { validateHtmlContent } from '@/lib/sanitize-html'

/**
 * POST /api/professor/discussions/[postId]/reply
 * Create a professor reply to a discussion post
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ postId: string }> }
) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { postId } = params

    // Verify post exists and professor has access
    const post = await db.discussionPost.findFirst({
      where: {
        id: postId,
      },
      include: {
        assessment: {
          include: {
            class: {
              where: {
                professorId: professor.id,
              },
            },
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (!post.assessment.class) {
      return NextResponse.json(
        { error: 'You do not have access to this discussion' },
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

    // Create reply as professor
    const reply = await db.discussionReply.create({
      data: {
        postId: postId,
        authorId: professor.id,
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

    return NextResponse.json({
      success: true,
      message: 'Professor reply created successfully',
      reply,
    })
  } catch (error) {
    console.error('Error creating professor reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
