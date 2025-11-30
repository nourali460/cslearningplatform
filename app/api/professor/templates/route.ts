import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireProfessor, handleAuthError } from '@/lib/auth'

/**
 * GET /api/professor/templates?courseId=xxx
 * Get all active assessment templates for a specific course
 */
export async function GET(request: Request) {
  try {
    const professor = await requireProfessor()

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const type = searchParams.get('type')

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    // Verify professor has access to a class for this course
    const professorClass = await db.class.findFirst({
      where: {
        courseId,
        professorId: professor.id,
      },
    })

    if (!professorClass) {
      return NextResponse.json(
        { error: 'You do not have access to this course' },
        { status: 403 }
      )
    }

    const whereClause: any = {
      courseId,
      isActive: true, // Only show active templates
    }

    if (type && type !== 'all') {
      whereClause.type = type
    }

    const templates = await db.assessmentTemplate.findMany({
      where: whereClause,
      orderBy: [
        { orderIndex: 'asc' },
        { type: 'asc' },
        { title: 'asc' },
      ],
    })

    // Convert Decimal to number for JSON serialization
    const serializedTemplates = templates.map((t) => ({
      ...t,
      defaultMaxPoints: Number(t.defaultMaxPoints),
    }))

    return NextResponse.json({ templates: serializedTemplates })
  } catch (error) {
    console.error('[Professor Templates API] Error fetching templates:', error)
    return handleAuthError(error)
  }
}
