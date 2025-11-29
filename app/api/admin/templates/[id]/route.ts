import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * PUT /api/admin/templates/[id]
 * Update an assessment template
 */
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const params = await props.params
    const { id } = params

    const body = await request.json()
    const {
      courseId,
      title,
      description,
      type,
      defaultMaxPoints,
      defaultSubmissionType,
      orderIndex,
      isActive,
    } = body

    // Check if template exists
    const existingTemplate = await db.assessmentTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // If courseId is being updated, verify the new course exists
    if (courseId && courseId !== existingTemplate.courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
      })
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
    }

    // Update template
    const template = await db.assessmentTemplate.update({
      where: { id },
      data: {
        courseId: courseId || existingTemplate.courseId,
        title: title || existingTemplate.title,
        description: description !== undefined ? description : existingTemplate.description,
        type: type || existingTemplate.type,
        defaultMaxPoints: defaultMaxPoints !== undefined ? defaultMaxPoints : existingTemplate.defaultMaxPoints,
        defaultSubmissionType: defaultSubmissionType || existingTemplate.defaultSubmissionType,
        orderIndex: orderIndex !== undefined ? orderIndex : existingTemplate.orderIndex,
        isActive: isActive !== undefined ? isActive : existingTemplate.isActive,
      },
      include: {
        course: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      template: {
        ...template,
        defaultMaxPoints: Number(template.defaultMaxPoints),
      },
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/templates/[id]
 * Delete an assessment template
 */
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const params = await props.params
    const { id } = params

    // Check if template exists
    const template = await db.assessmentTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Delete template (cascade will handle related records)
    await db.assessmentTemplate.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
