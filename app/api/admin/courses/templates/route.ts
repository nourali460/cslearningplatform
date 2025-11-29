import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * POST /api/admin/courses/templates
 * Link an assessment template to a course
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, assessmentTemplateId, orderIndex } = body

    // Validation
    if (!courseId || !assessmentTemplateId || orderIndex === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, assessmentTemplateId, orderIndex' },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if template exists
    const template = await db.assessmentTemplate.findUnique({
      where: { id: assessmentTemplateId },
    })

    if (!template) {
      return NextResponse.json({ error: 'Assessment template not found' }, { status: 404 })
    }

    // Check if template already belongs to this course
    if (template.courseId === courseId) {
      return NextResponse.json(
        { error: 'Template already belongs to this course' },
        { status: 400 }
      )
    }

    // Update template to belong to this course (move it)
    const updatedTemplate = await db.assessmentTemplate.update({
      where: { id: assessmentTemplateId },
      data: {
        courseId,
        orderIndex,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Template moved to course successfully',
        template: updatedTemplate,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error linking template to course:', error)
    return NextResponse.json(
      { error: 'Failed to link template to course' },
      { status: 500 }
    )
  }
}
