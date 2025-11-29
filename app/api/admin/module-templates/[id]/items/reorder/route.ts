import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, handleAuthError } from '@/lib/auth'

// POST /api/admin/module-templates/[id]/items/reorder - Reorder module item templates
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const user = await requireAdmin()

    const params = await props.params
    const { id } = params

    const body = await request.json()
    const { items } = body

    // Validation
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items must be an array' }, { status: 400 })
    }

    // Update order index for each item
    await Promise.all(
      items.map((item: { id: string; orderIndex: number }) =>
        db.moduleItemTemplate.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    )

    // Fetch updated items
    const updatedItems = await db.moduleItemTemplate.findMany({
      where: { moduleTemplateId: id },
      include: {
        assessmentTemplate: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json(updatedItems)
  } catch (error) {
    console.error('Error reordering module item templates:', error)
    return handleAuthError(error)
  }
}
