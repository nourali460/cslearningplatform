import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, handleAuthError } from '@/lib/auth'
import { ModuleItemType } from '@prisma/client'

// GET /api/admin/module-templates/[id]/items - Get all items for a module template
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const user = await requireAdmin()

    const params = await props.params
    const { id } = params

    const items = await db.moduleItemTemplate.findMany({
      where: { moduleTemplateId: id },
      include: {
        assessmentTemplate: {
          select: {
            id: true,
            title: true,
            type: true,
            defaultMaxPoints: true,
            description: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching module item templates:', error)
    return handleAuthError(error)
  }
}

// POST /api/admin/module-templates/[id]/items - Create a new module item template
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

    // Validation
    if (!itemType || !title) {
      return NextResponse.json(
        { error: 'Item type and title are required' },
        { status: 400 }
      )
    }

    // Validate itemType-specific requirements
    if (itemType === 'ASSESSMENT' && !assessmentTemplateId) {
      return NextResponse.json(
        { error: 'Assessment template ID is required for ASSESSMENT type' },
        { status: 400 }
      )
    }

    if (itemType === 'EXTERNAL_LINK' && !externalUrl) {
      return NextResponse.json(
        { error: 'External URL is required for EXTERNAL_LINK type' },
        { status: 400 }
      )
    }

    // Create module item template
    const moduleItemTemplate = await db.moduleItemTemplate.create({
      data: {
        moduleTemplateId: id,
        itemType: itemType as ModuleItemType,
        title,
        assessmentTemplateId: itemType === 'ASSESSMENT' ? assessmentTemplateId : null,
        externalUrl: itemType === 'EXTERNAL_LINK' ? externalUrl : null,
        pageContent: itemType === 'PAGE' ? pageContent : null,
        customDescription: itemType === 'ASSESSMENT' ? customDescription : null,
        orderIndex: orderIndex ?? 0,
        isPublished: isPublished ?? true,
        isRequired: isRequired ?? true,
      },
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

    return NextResponse.json(moduleItemTemplate, { status: 201 })
  } catch (error) {
    console.error('Error creating module item template:', error)
    return handleAuthError(error)
  }
}
