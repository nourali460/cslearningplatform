import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * GET /api/professor/classes/[classId]/modules/[moduleId]
 * Get a specific module with all details
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ classId: string; moduleId: string }> }
) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { classId, moduleId } = params

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

    // Fetch module
    const module = await db.module.findFirst({
      where: {
        id: moduleId,
        classId: classId,
      },
      include: {
        items: {
          include: {
            assessment: {
              select: {
                id: true,
                title: true,
                type: true,
                maxPoints: true,
                dueAt: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    return NextResponse.json(module)
  } catch (error) {
    console.error('Error fetching module:', error)
    return NextResponse.json(
      { error: 'Failed to fetch module' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/professor/classes/[classId]/modules/[moduleId]
 * Update a module
 */
export async function PUT(
  request: Request,
  props: { params: Promise<{ classId: string; moduleId: string }> }
) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { classId, moduleId } = params

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

    // Verify module belongs to this class
    const existingModule = await db.module.findFirst({
      where: {
        id: moduleId,
        classId: classId,
      },
    })

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const {
      title,
      description,
      orderIndex,
      isPublished,
      unlockAt,
      prerequisiteIds,
    } = body

    // Update module
    const module = await db.module.update({
      where: { id: moduleId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(isPublished !== undefined && { isPublished }),
        ...(unlockAt !== undefined && { unlockAt: unlockAt ? new Date(unlockAt) : null }),
        ...(prerequisiteIds !== undefined && { prerequisiteIds }),
      },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Module updated successfully',
      module,
    })
  } catch (error) {
    console.error('Error updating module:', error)
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/professor/classes/[classId]/modules/[moduleId]
 * Delete a module
 */
export async function DELETE(
  request: Request,
  props: { params: Promise<{ classId: string; moduleId: string }> }
) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { classId, moduleId } = params

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

    // Verify module belongs to this class
    const existingModule = await db.module.findFirst({
      where: {
        id: moduleId,
        classId: classId,
      },
    })

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Delete module (cascade will delete items and completions)
    await db.module.delete({
      where: { id: moduleId },
    })

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting module:', error)
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    )
  }
}
