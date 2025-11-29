import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * DELETE /api/admin/courses/[id]/templates/[templateId]
 * Remove a template from a course
 */
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const params = await props.params
    const { id: courseId, templateId: assessmentTemplateId } = params

    // Find the assessment template and verify it belongs to this course
    const template = await db.assessmentTemplate.findUnique({
      where: {
        id: assessmentTemplateId,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (template.courseId !== courseId) {
      return NextResponse.json({ error: 'Template does not belong to this course' }, { status: 403 })
    }

    // Delete the assessment template
    await db.assessmentTemplate.delete({
      where: {
        id: assessmentTemplateId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Template removed from course successfully',
    })
  } catch (error) {
    console.error('[Course Templates API] Error removing template:', error)
    return NextResponse.json(
      { error: 'Failed to remove template from course', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
