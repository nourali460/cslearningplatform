import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * GET /api/admin/courses/[id]/templates
 * Get all templates linked to a course
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const params = await props.params
    const { id } = params

    // Check if course exists
    const course = await db.course.findUnique({
      where: { id },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get all templates for this course
    const templates = await db.assessmentTemplate.findMany({
      where: { courseId: id },
      orderBy: { orderIndex: 'asc' },
    })

    // Serialize templates
    const serializedTemplates = templates.map((template) => ({
      ...template,
      defaultMaxPoints: Number(template.defaultMaxPoints),
    }))

    return NextResponse.json({ templates: serializedTemplates })
  } catch (error) {
    console.error('[Course Templates API] Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course templates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
