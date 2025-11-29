import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * POST /api/professor/classes/[classId]/assessments/from-template
 * Create an assessment from a template for a class
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'professor') {
      return NextResponse.json({ error: 'Unauthorized - Professor access required' }, { status: 401 })
    }

    const params = await props.params
    const { classId } = params

    const body = await request.json()
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json({ error: 'Missing required field: templateId' }, { status: 400 })
    }

    // Verify the class exists and belongs to this professor
    const classRecord = await db.class.findUnique({
      where: { id: classId },
      include: {
        assessments: {
          select: { orderIndex: true },
          orderBy: { orderIndex: 'desc' },
          take: 1,
        },
      },
    })

    if (!classRecord) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (classRecord.professorId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized - Not your class' }, { status: 403 })
    }

    // Fetch the template
    const template = await db.assessmentTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (!template.isActive) {
      return NextResponse.json({ error: 'Template is not active' }, { status: 400 })
    }

    // Validate template belongs to the same course as the class
    if (template.courseId !== classRecord.courseId) {
      return NextResponse.json(
        {
          error: 'Template does not belong to this course',
          details: `Template is for a different course. Expected courseId: ${classRecord.courseId}, got: ${template.courseId}`,
        },
        { status: 400 }
      )
    }

    // Calculate next orderIndex
    const maxOrderIndex = classRecord.assessments[0]?.orderIndex ?? -1
    const nextOrderIndex = maxOrderIndex + 1

    // Generate slug
    const slug = template.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Create assessment from template
    const assessment = await db.assessment.create({
      data: {
        classId,
        title: template.title,
        slug,
        description: template.description,
        type: template.type,
        maxPoints: template.defaultMaxPoints,
        submissionType: template.defaultSubmissionType,
        orderIndex: nextOrderIndex,
        isPublished: true, // ✅ Explicit default - assessments are published by default
      },
    })

    // Create assessment template mapping to track relationship
    await db.assessmentTemplateMapping.create({
      data: {
        classId,
        assessmentId: assessment.id,
        assessmentTemplateId: template.id,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Assessment created from template successfully',
        assessment: {
          ...assessment,
          maxPoints: Number(assessment.maxPoints),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Professor Assessment] Error creating assessment from template:', error)
    return NextResponse.json(
      { error: 'Failed to create assessment from template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
