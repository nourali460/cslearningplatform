import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * GET /api/admin/templates
 * List all assessment templates
 */
export async function GET(request: Request) {
  try {
    console.log('[Templates API] GET request received')

    const session = await getSession()
    console.log('[Templates API] Session:', session)

    if (!session || session.role !== 'admin') {
      console.log('[Templates API] Unauthorized - session:', session)
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const active = searchParams.get('active')
    const courseId = searchParams.get('courseId')

    const whereClause: any = {}

    if (courseId && courseId !== 'all') {
      whereClause.courseId = courseId
    }

    if (type && type !== 'all') {
      whereClause.type = type
    }

    if (active !== null && active !== 'all') {
      whereClause.isActive = active === 'true'
    }

    console.log('[Templates API] Querying with where clause:', whereClause)

    const templates = await db.assessmentTemplate.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            code: true,
            title: true,
          },
        },
      },
      orderBy: [
        { orderIndex: 'asc' },
        { type: 'asc' },
        { title: 'asc' },
      ],
    })

    console.log('[Templates API] Found templates:', templates.length)

    // Convert Decimal to number for JSON serialization
    const serializedTemplates = templates.map((t) => ({
      ...t,
      defaultMaxPoints: Number(t.defaultMaxPoints),
    }))

    return NextResponse.json({ templates: serializedTemplates })
  } catch (error) {
    console.error('[Templates API] Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/templates
 * Create a new assessment template
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[Templates API] POST body:', body)

    const {
      courseId,
      title,
      description,
      type,
      defaultMaxPoints,
      defaultSubmissionType,
      orderIndex,
      isActive,
      defaultIncludeInGradebook,
    } = body

    // Validation
    if (!courseId || !title || !type || !defaultSubmissionType) {
      console.log('[Templates API] Validation failed:', { courseId, title, type, defaultSubmissionType })
      return NextResponse.json(
        { error: 'Missing required fields: courseId, title, type, defaultSubmissionType' },
        { status: 400 }
      )
    }

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    console.log('[Templates API] Creating template with data:', {
      courseId,
      title,
      type,
      defaultMaxPoints: defaultMaxPoints || 100,
      defaultSubmissionType,
      orderIndex: orderIndex || 0,
      isActive: isActive !== undefined ? isActive : true,
      defaultIncludeInGradebook: defaultIncludeInGradebook !== undefined ? defaultIncludeInGradebook : true,
    })

    const template = await db.assessmentTemplate.create({
      data: {
        courseId,
        title,
        description: description || null,
        type,
        defaultMaxPoints: defaultMaxPoints || 100,
        defaultSubmissionType,
        orderIndex: orderIndex || 0,
        isActive: isActive !== undefined ? isActive : true,
        defaultIncludeInGradebook: defaultIncludeInGradebook !== undefined ? defaultIncludeInGradebook : true,
      },
      include: {
        course: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    })

    console.log('[Templates API] Template created successfully:', template.id)

    return NextResponse.json(
      {
        success: true,
        message: 'Template created successfully',
        template: {
          ...template,
          defaultMaxPoints: Number(template.defaultMaxPoints),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Templates API] Error creating template:', error)
    return NextResponse.json(
      {
        error: 'Failed to create template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
