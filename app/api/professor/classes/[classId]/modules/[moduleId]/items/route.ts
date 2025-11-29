import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'
import { ModuleItemType } from '@prisma/client'

/**
 * GET /api/professor/classes/[classId]/modules/[moduleId]/items
 * Get all items for a specific module
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

    // Fetch items
    const items = await db.moduleItem.findMany({
      where: {
        moduleId: moduleId,
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            description: true,
            maxPoints: true,
            dueAt: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching module items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch module items' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/professor/classes/[classId]/modules/[moduleId]/items
 * Create a new item for a module
 */
export async function POST(
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
    const module = await db.module.findFirst({
      where: {
        id: moduleId,
        classId: classId,
      },
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
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

    // Validation
    if (!itemType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: itemType, title' },
        { status: 400 }
      )
    }

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

    // Create module item
    const item = await db.moduleItem.create({
      data: {
        moduleId,
        itemType: itemType as ModuleItemType,
        title,
        assessmentId: assessmentId || null,
        externalUrl: externalUrl || null,
        pageContent: pageContent || null,
        customDescription: itemType === 'ASSESSMENT' ? customDescription : null,
        orderIndex: orderIndex ?? 0,
        isPublished: isPublished ?? true,
        isRequired: isRequired ?? true,
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

    return NextResponse.json(
      {
        success: true,
        message: 'Module item created successfully',
        item,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating module item:', error)
    return NextResponse.json(
      {
        error: 'Failed to create module item',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
