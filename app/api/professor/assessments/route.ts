import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireProfessor, handleAuthError } from '@/lib/auth'

/**
 * GET /api/professor/assessments
 * List all assessments for professor's classes
 */
export async function GET(request: Request) {
  try {
    console.log('[Professor Assessments API] GET request received')

    const professor = await requireProfessor()
    console.log('[Professor Assessments API] Professor authenticated:', professor.id)

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const type = searchParams.get('type')

    // Build where clause
    const whereClause: any = {}

    if (classId && classId !== 'all') {
      whereClause.classId = classId

      // Verify professor owns this class
      const classRecord = await db.class.findFirst({
        where: {
          id: classId,
          professorId: professor.id,
        },
      })

      if (!classRecord) {
        return NextResponse.json(
          { error: 'Class not found or you do not have access to it' },
          { status: 403 }
        )
      }
    } else {
      // Get all professor's classes
      const professorClasses = await db.class.findMany({
        where: { professorId: professor.id },
        select: { id: true },
      })

      whereClause.classId = {
        in: professorClasses.map((c) => c.id),
      }
    }

    if (type && type !== 'all') {
      whereClause.type = type
    }

    console.log('[Professor Assessments API] Querying with where clause:', whereClause)

    const assessments = await db.assessment.findMany({
      where: whereClause,
      include: {
        class: {
          select: {
            id: true,
            sectionNumber: true,
            semester: true,
            year: true,
            course: {
              select: {
                code: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: [
        { orderIndex: 'asc' },
        { type: 'asc' },
        { title: 'asc' },
      ],
    })

    console.log('[Professor Assessments API] Found assessments:', assessments.length)

    // Convert Decimal to number for JSON serialization
    const serializedAssessments = assessments.map((a) => ({
      ...a,
      maxPoints: Number(a.maxPoints),
    }))

    return NextResponse.json({ assessments: serializedAssessments })
  } catch (error) {
    console.error('[Professor Assessments API] Error fetching assessments:', error)
    return handleAuthError(error)
  }
}

/**
 * POST /api/professor/assessments
 * Create a new assessment for a specific class
 */
export async function POST(request: Request) {
  try {
    const professor = await requireProfessor()

    const body = await request.json()
    console.log('[Professor Assessments API] POST body:', body)

    const {
      classId,
      title,
      description,
      type,
      maxPoints,
      submissionType,
      dueAt,
      allowMultipleAttempts,
      maxAttempts,
      orderIndex,
      isPublished,
      includeInGradebook,
    } = body

    // Validation
    if (!classId || !title || !type || !submissionType) {
      console.log('[Professor Assessments API] Validation failed:', { classId, title, type, submissionType })
      return NextResponse.json(
        { error: 'Missing required fields: classId, title, type, submissionType' },
        { status: 400 }
      )
    }

    // Verify professor owns this class
    const classRecord = await db.class.findFirst({
      where: {
        id: classId,
        professorId: professor.id,
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

    if (!classRecord) {
      return NextResponse.json(
        { error: 'Class not found or you do not have access to it' },
        { status: 403 }
      )
    }

    console.log('[Professor Assessments API] Creating assessment with data:', {
      classId,
      title,
      type,
      maxPoints: maxPoints || 100,
      submissionType,
      orderIndex: orderIndex || 0,
      isPublished: isPublished !== undefined ? isPublished : true,
      includeInGradebook: includeInGradebook !== undefined ? includeInGradebook : (type !== 'PAGE'),
    })

    const assessment = await db.assessment.create({
      data: {
        classId,
        title,
        description: description || null,
        type,
        maxPoints: maxPoints || 100,
        submissionType,
        dueAt: dueAt ? new Date(dueAt) : null,
        allowMultipleAttempts: allowMultipleAttempts || false,
        maxAttempts: maxAttempts || 1,
        orderIndex: orderIndex || 0,
        isPublished: isPublished !== undefined ? isPublished : true,
        includeInGradebook: includeInGradebook !== undefined ? includeInGradebook : (type !== 'PAGE'),
      },
      include: {
        class: {
          select: {
            id: true,
            sectionNumber: true,
            semester: true,
            year: true,
            course: {
              select: {
                code: true,
                title: true,
              },
            },
          },
        },
      },
    })

    console.log('[Professor Assessments API] Assessment created successfully:', assessment.id)

    return NextResponse.json(
      {
        success: true,
        message: 'Assessment created successfully',
        assessment: {
          ...assessment,
          maxPoints: Number(assessment.maxPoints),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Professor Assessments API] Error creating assessment:', error)
    return handleAuthError(error)
  }
}
