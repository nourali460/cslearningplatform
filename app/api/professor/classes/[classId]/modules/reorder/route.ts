import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * POST /api/professor/classes/[classId]/modules/reorder
 * Reorder modules for a class
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ classId: string }> }
) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { classId } = params

    // Verify professor owns this class
    const classItem = await db.class.findFirst({
      where: {
        id: classId,
        professorId: professor.id,
      },
    })

    if (!classItem) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { modules } = body

    // Validation
    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { error: 'modules must be an array' },
        { status: 400 }
      )
    }

    // Update order indices
    await Promise.all(
      modules.map((item: { id: string; orderIndex: number }) =>
        db.module.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'Modules reordered successfully',
    })
  } catch (error) {
    console.error('Error reordering modules:', error)
    return NextResponse.json(
      { error: 'Failed to reorder modules' },
      { status: 500 }
    )
  }
}
