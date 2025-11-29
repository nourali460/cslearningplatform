import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * PUT /api/admin/courses/[id]/templates/reorder
 * Update the order of templates in a course
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
    const { id: courseId } = params

    const body = await request.json()
    const { templateOrders } = body

    // templateOrders should be: [{ assessmentTemplateId: string, orderIndex: number }]
    if (!Array.isArray(templateOrders)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
    }

    // Update each template's orderIndex
    await Promise.all(
      templateOrders.map((item: { assessmentTemplateId: string; orderIndex: number }) =>
        db.assessmentTemplate.update({
          where: {
            id: item.assessmentTemplateId,
          },
          data: {
            orderIndex: item.orderIndex,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'Templates reordered successfully',
    })
  } catch (error) {
    console.error('[Course Templates API] Error reordering templates:', error)
    return NextResponse.json(
      { error: 'Failed to reorder templates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
