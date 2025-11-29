import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, handleAuthError } from '@/lib/auth'
import { ModuleItemType } from '@prisma/client'

// PUT /api/admin/module-templates/[id]/items/[itemId] - Update a module item template
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    // Verify admin authentication
    const user = await requireAdmin()

    const params = await props.params
    const { itemId } = params

    const body = await request.json()
    const {
      itemType,
      title,
      assessmentTemplateId,
      externalUrl,
      pageContent,
      customDescription,
      orderIndex,
      isPublished,
      isRequired,
    } = body

    // Build update data
    const updateData: any = {}

    if (itemType !== undefined) updateData.itemType = itemType as ModuleItemType
    if (title !== undefined) updateData.title = title
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex
    if (isPublished !== undefined) updateData.isPublished = isPublished
    if (isRequired !== undefined) updateData.isRequired = isRequired

    // Handle conditional fields based on itemType
    if (itemType === 'ASSESSMENT' || (itemType === undefined && assessmentTemplateId !== undefined)) {
      updateData.assessmentTemplateId = assessmentTemplateId
      if (customDescription !== undefined) updateData.customDescription = customDescription
      updateData.externalUrl = null
      updateData.pageContent = null
    } else if (itemType === 'EXTERNAL_LINK' || (itemType === undefined && externalUrl !== undefined)) {
      updateData.externalUrl = externalUrl
      updateData.assessmentTemplateId = null
      updateData.pageContent = null
      updateData.customDescription = null
    } else if (itemType === 'PAGE' || (itemType === undefined && pageContent !== undefined)) {
      updateData.pageContent = pageContent
      updateData.assessmentTemplateId = null
      updateData.externalUrl = null
      updateData.customDescription = null
    }

    // Update module item template
    const moduleItemTemplate = await db.moduleItemTemplate.update({
      where: { id: itemId },
      data: updateData,
      include: {
        assessmentTemplate: {
          select: {
            id: true,
            title: true,
            type: true,
            description: true,
          },
        },
      },
    })

    return NextResponse.json(moduleItemTemplate)
  } catch (error) {
    console.error('Error updating module item template:', error)
    return handleAuthError(error)
  }
}

// DELETE /api/admin/module-templates/[id]/items/[itemId] - Delete a module item template
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    // Verify admin authentication
    const user = await requireAdmin()

    const params = await props.params
    const { itemId } = params

    // Delete module item template
    await db.moduleItemTemplate.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting module item template:', error)
    return handleAuthError(error)
  }
}
