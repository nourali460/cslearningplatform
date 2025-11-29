import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * POST /api/professor/discussions/[postId]/pin
 * Toggle pin status of a discussion post
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

    // Verify post exists and professor owns the class
    const post = await db.discussionPost.findFirst({
      where: {
        id: postId,
      },
      include: {
        assessment: {
          include: {
            class: {
              select: {
                professorId: true,
              },
            },
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.assessment.class.professorId !== professor.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Toggle pin status
    const updatedPost = await db.discussionPost.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
    })

    return NextResponse.json({
      success: true,
      message: updatedPost.isPinned ? 'Post pinned' : 'Post unpinned',
      isPinned: updatedPost.isPinned,
    })
  } catch (error) {
    console.error('Error toggling pin:', error)
    return NextResponse.json(
      { error: 'Failed to toggle pin' },
      { status: 500 }
    )
  }
}
