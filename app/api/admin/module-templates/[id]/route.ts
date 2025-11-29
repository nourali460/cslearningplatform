import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, handleAuthError } from '@/lib/auth'

// GET /api/admin/module-templates/[id] - Get a specific module template
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const user = await requireAdmin()

    const params = await props.params
    const { id } = params

    const moduleTemplate = await db.moduleTemplate.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        items: {
          orderBy: { orderIndex: 'asc' },
          include: {
            assessmentTemplate: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
      },
    })

    if (!moduleTemplate) {
      return NextResponse.json({ error: 'Module template not found' }, { status: 404 })
    }

    return NextResponse.json(moduleTemplate)
  } catch (error) {
    console.error('Error fetching module template:', error)
    return handleAuthError(error)
  }
}

// PUT /api/admin/module-templates/[id] - Update a module template
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const user = await requireAdmin()

    const params = await props.params
    const { id } = params

    const body = await request.json()
    const { title, description, orderIndex, isActive, defaultUnlockAt, defaultPrerequisiteIds } =
      body

    // Update module template
    const moduleTemplate = await db.moduleTemplate.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(isActive !== undefined && { isActive }),
        ...(defaultUnlockAt !== undefined && { defaultUnlockAt }),
        ...(defaultPrerequisiteIds !== undefined && { defaultPrerequisiteIds }),
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        items: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    return NextResponse.json(moduleTemplate)
  } catch (error) {
    console.error('Error updating module template:', error)
    return handleAuthError(error)
  }
}

// DELETE /api/admin/module-templates/[id] - Delete a module template
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const user = await requireAdmin()

    const params = await props.params
    const { id } = params

    // Delete module template (cascade will delete items)
    await db.moduleTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting module template:', error)
    return handleAuthError(error)
  }
}
