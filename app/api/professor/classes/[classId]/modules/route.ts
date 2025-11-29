import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * GET /api/professor/classes/[classId]/modules
 * Get all modules for a specific class
 */
export async function GET(
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

    // Fetch modules with items and completion stats
    const modules = await db.module.findMany({
      where: {
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
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: {
            items: true,
            moduleCompletions: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Error fetching modules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/professor/classes/[classId]/modules
 * Create a new module for a class
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
    const {
      title,
      description,
      orderIndex,
      isPublished,
      unlockAt,
      prerequisiteIds,
    } = body

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      )
    }

    // Create module
    const module = await db.module.create({
      data: {
        classId,
        title,
        description: description || null,
        orderIndex: orderIndex ?? 0,
        isPublished: isPublished ?? true,
        unlockAt: unlockAt ? new Date(unlockAt) : null,
        prerequisiteIds: prerequisiteIds || [],
      },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Module created successfully',
        module,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating module:', error)
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    )
  }
}
