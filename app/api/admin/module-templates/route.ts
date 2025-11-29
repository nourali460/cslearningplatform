import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, handleAuthError } from '@/lib/auth'

// GET /api/admin/module-templates - Get all module templates (optionally filtered by course)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await requireAdmin()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    // Build query
    const where = courseId ? { courseId } : {}

    const moduleTemplates = await db.moduleTemplate.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        items: {
          select: {
            id: true,
            title: true,
            itemType: true,
            orderIndex: true,
            isPublished: true,
            isRequired: true,
            externalUrl: true,
            pageContent: true,
            assessmentTemplate: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: [{ courseId: 'asc' }, { orderIndex: 'asc' }],
    })

    return NextResponse.json(moduleTemplates)
  } catch (error) {
    console.error('Error fetching module templates:', error)
    return handleAuthError(error)
  }
}

// POST /api/admin/module-templates - Create a new module template
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await requireAdmin()

    const body = await request.json()
    const { courseId, title, description, orderIndex, isActive } = body

    // Validation
    if (!courseId || !title) {
      return NextResponse.json(
        { error: 'Course ID and title are required' },
        { status: 400 }
      )
    }

    // Create module template
    const moduleTemplate = await db.moduleTemplate.create({
      data: {
        courseId,
        title,
        description: description || null,
        orderIndex: orderIndex ?? 0,
        isActive: isActive ?? true,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(moduleTemplate, { status: 201 })
  } catch (error) {
    console.error('Error creating module template:', error)
    return handleAuthError(error)
  }
}
