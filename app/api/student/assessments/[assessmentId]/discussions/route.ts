import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStudent } from '@/lib/auth'
import { validateHtmlContent } from '@/lib/sanitize-html'

/**
 * GET /api/student/assessments/[assessmentId]/discussions
 * Get all discussion posts for an assessment (student view)
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

    // Verify assessment exists and student is enrolled
    const assessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        class: {
          enrollments: {
            some: {
              studentId: student.id,
            },
          },
        },
      },
      include: {
        class: {
          select: {
            id: true,
            classCode: true,
          },
        },
      },
    })

    // Fetch module item if this assessment is linked to a module
    const moduleItem = await db.moduleItem.findFirst({
      where: {
        assessmentId: assessmentId,
        module: {
          classId: assessment?.classId,
          isPublished: true,
        },
        isPublished: true,
      },
      select: {
        id: true,
        customDescription: true,
      },
    })

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found or not enrolled' },
        { status: 404 }
      )
    }

    // Check if student needs to post before viewing
    if (assessment.requirePostBeforeViewing) {
      const studentPost = await db.discussionPost.findFirst({
        where: {
          assessmentId: assessmentId,
          studentId: student.id,
        },
      })

      if (!studentPost) {
        return NextResponse.json({
          requirePost: true,
          assessment: {
            ...assessment,
            customDescription: moduleItem?.customDescription || null,
          },
        })
      }
    }

    // Fetch discussion posts
    const posts = await db.discussionPost.findMany({
      where: {
        assessmentId: assessmentId,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: assessment.allowAnonymous ? false : true,
            email: assessment.allowAnonymous ? false : true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                fullName: assessment.allowAnonymous ? false : true,
                email: assessment.allowAnonymous ? false : true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Get student's submission to track reply count
    const submission = await db.assessmentSubmission.findFirst({
      where: {
        assessmentId: assessmentId,
        studentId: student.id,
      },
    })

    return NextResponse.json({
      posts,
      assessment: {
        ...assessment,
        customDescription: moduleItem?.customDescription || null,
      },
      requirePost: false,
      replyCount: submission?.discussionReplyCount || 0,
    })
  } catch (error) {
    console.error('Error fetching discussions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/student/assessments/[assessmentId]/discussions
 * Create a new discussion post
 */
export async function POST(
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

    // Verify assessment exists and student is enrolled
    const assessment = await db.assessment.findFirst({
      where: {
        id: assessmentId,
        class: {
          enrollments: {
            some: {
              studentId: student.id,
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

    // Check if student already posted (one post per student)
    const existingPost = await db.discussionPost.findFirst({
      where: {
        assessmentId: assessmentId,
        studentId: student.id,
      },
    })

    if (existingPost) {
      return NextResponse.json(
        { error: 'You have already posted to this discussion' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { content, attachmentIds } = body

    // Validate and sanitize HTML content
    const validation = validateHtmlContent(content, 50, 10000)

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid content' },
        { status: 400 }
      )
    }

    // Process attachments if provided
    let attachments = null
    if (attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0) {
      // Fetch file uploads to verify ownership
      const fileUploads = await db.fileUpload.findMany({
        where: {
          id: { in: attachmentIds },
          userId: student.id, // Verify the student owns these files
        },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          publicUrl: true,
        },
      })

      if (fileUploads.length !== attachmentIds.length) {
        return NextResponse.json(
          { error: 'One or more attachments not found or unauthorized' },
          { status: 400 }
        )
      }

      // Build attachments JSON
      attachments = fileUploads.map(file => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: Number(file.fileSize),
        mimeType: file.mimeType,
        url: file.publicUrl,
      }))
    }

    // Create discussion post
    const post = await db.discussionPost.create({
      data: {
        assessmentId: assessmentId,
        classId: assessment.classId,
        studentId: student.id,
        content: validation.sanitized,
        attachments: attachments,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    // Create or update submission
    const submission = await db.assessmentSubmission.upsert({
      where: {
        assessmentId_studentId: {
          assessmentId: assessmentId,
          studentId: student.id,
        },
      },
      create: {
        studentId: student.id,
        assessmentId: assessmentId,
        status: 'SUBMITTED',
        discussionPostId: post.id,
        discussionReplyCount: 0,
        submittedAt: new Date(),
      },
      update: {
        discussionPostId: post.id,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      post,
      submission,
    })
  } catch (error) {
    console.error('Error creating discussion post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
