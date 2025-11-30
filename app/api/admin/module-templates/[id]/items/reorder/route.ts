import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * PUT /api/admin/module-templates/[id]/items/reorder
 * Reorder module item templates
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { id: moduleId } = await params
    const body = await request.json()
    const { itemIds } = body

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'itemIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Verify the module template exists
    const moduleTemplate = await db.moduleTemplate.findUnique({
      where: { id: moduleId },
      include: {
        items: {
          select: { id: true },
        },
      },
    })

    if (!moduleTemplate) {
      return NextResponse.json({ error: 'Module template not found' }, { status: 404 })
    }

    // Verify all itemIds belong to this module template
    const existingItemIds = moduleTemplate.items.map((item) => item.id)
    const allItemsValid = itemIds.every((id) => existingItemIds.includes(id))

    if (!allItemsValid) {
      return NextResponse.json(
        { error: 'Some item IDs do not belong to this module template' },
        { status: 400 }
      )
    }

    // Update orderIndex for each item template in a transaction
    await db.$transaction(
      itemIds.map((itemId, index) =>
        db.moduleItemTemplate.update({
          where: { id: itemId },
          data: { orderIndex: index },
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'Module item templates reordered successfully',
    })
  } catch (error) {
    console.error('Error reordering module item templates:', error)
    return NextResponse.json(
      { error: 'Failed to reorder module item templates' },
      { status: 500 }
    )
  }
}
