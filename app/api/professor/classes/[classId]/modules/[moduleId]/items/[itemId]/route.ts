import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'
import { ModuleItemType } from '@prisma/client'

/**
 * PUT /api/professor/classes/[classId]/modules/[moduleId]/items/[itemId]
 * Update a module item
 */
export async function PUT(
  request: Request,
  props: { params: Promise<{ classId: string; moduleId: string; itemId: string }> }
) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { classId, moduleId, itemId } = params

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
    const module = await db.module.findFirst({
      where: {
        id: moduleId,
        classId: classId,
      },
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify item belongs to this module
    const existingItem = await db.moduleItem.findFirst({
      where: {
        id: itemId,
        moduleId: moduleId,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Module item not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const {
      itemType,
      title,
      assessmentId,
      externalUrl,
      pageContent,
      customDescription,
      orderIndex,
      isPublished,
      isRequired,
    } = body

    // Type-specific validation
    if (itemType === 'ASSESSMENT' && !assessmentId) {
      return NextResponse.json(
        { error: 'assessmentId is required for ASSESSMENT items' },
        { status: 400 }
      )
    }

    if (itemType === 'EXTERNAL_LINK' && !externalUrl) {
      return NextResponse.json(
        { error: 'externalUrl is required for EXTERNAL_LINK items' },
        { status: 400 }
      )
    }

    // If assessmentId provided, verify it belongs to this class
    if (assessmentId) {
      const assessment = await db.assessment.findFirst({
        where: {
          id: assessmentId,
          classId: classId,
        },
      })

      if (!assessment) {
        return NextResponse.json(
          { error: 'Assessment not found in this class' },
          { status: 404 }
        )
      }
    }

    // Update module item
    const item = await db.moduleItem.update({
      where: { id: itemId },
      data: {
        ...(itemType !== undefined && { itemType: itemType as ModuleItemType }),
        ...(title !== undefined && { title }),
        ...(assessmentId !== undefined && { assessmentId: assessmentId || null }),
        ...(externalUrl !== undefined && { externalUrl: externalUrl || null }),
        ...(pageContent !== undefined && { pageContent: pageContent || null }),
        ...(customDescription !== undefined && { customDescription: customDescription || null }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(isPublished !== undefined && { isPublished }),
        ...(isRequired !== undefined && { isRequired }),
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            description: true,
            maxPoints: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Module item updated successfully',
      item,
    })
  } catch (error) {
    console.error('Error updating module item:', error)
    return NextResponse.json(
      { error: 'Failed to update module item' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/professor/classes/[classId]/modules/[moduleId]/items/[itemId]
 * Delete a module item
 */
export async function DELETE(
  request: Request,
  props: { params: Promise<{ classId: string; moduleId: string; itemId: string }> }
) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { classId, moduleId, itemId } = params

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
    const module = await db.module.findFirst({
      where: {
        id: moduleId,
        classId: classId,
      },
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify item belongs to this module
    const existingItem = await db.moduleItem.findFirst({
      where: {
        id: itemId,
        moduleId: moduleId,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Module item not found' }, { status: 404 })
    }

    // Delete module item (cascade will delete completions)
    await db.moduleItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({
      success: true,
      message: 'Module item deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting module item:', error)
    return NextResponse.json(
      { error: 'Failed to delete module item' },
      { status: 500 }
    )
  }
}
