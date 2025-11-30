import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireProfessor, handleAuthError } from '@/lib/auth'

/**
 * PUT /api/professor/classes/[classId]/modules/[moduleId]/items/reorder
 * Reorder module items
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string; moduleId: string }> }
) {
  try {
    const professor = await requireProfessor()

    const { classId, moduleId } = await params
    const body = await request.json()
    const { itemIds } = body

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'itemIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Verify the class belongs to the professor
    const classData = await db.class.findUnique({
      where: {
        id: classId,
        professorId: professor.id,
      },
      include: {
        modules: {
          where: { id: moduleId },
          include: {
            items: {
              select: { id: true },
            },
          },
        },
      },
    })

    if (!classData) {
      return NextResponse.json({ error: 'Class not found or access denied' }, { status: 404 })
    }

    const module = classData.modules[0]
    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify all itemIds belong to this module
    const existingItemIds = module.items.map((item) => item.id)
    const allItemsValid = itemIds.every((id) => existingItemIds.includes(id))

    if (!allItemsValid) {
      return NextResponse.json(
        { error: 'Some item IDs do not belong to this module' },
        { status: 400 }
      )
    }

    // Update orderIndex for each item in a transaction
    await db.$transaction(
      itemIds.map((itemId, index) =>
        db.moduleItem.update({
          where: { id: itemId },
          data: { orderIndex: index },
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'Module items reordered successfully',
    })
  } catch (error) {
    console.error('Error reordering module items:', error)
    return handleAuthError(error)
  }
}
