import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * GET /api/professor/classes/[classId]/assessments
 * Get all assessments for a specific class
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

    // Fetch assessments with submission counts
    const assessments = await db.assessment.findMany({
      where: {
        classId: classId,
      },
      include: {
        rubric: {
          include: {
            criteria: true,
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
        { dueAt: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Get submission statistics for each assessment
    const assessmentsWithStats = await Promise.all(
      assessments.map(async (assessment) => {
        const submissions = await db.assessmentSubmission.findMany({
          where: { assessmentId: assessment.id },
        })

        const totalSubmissions = submissions.length
        const gradedSubmissions = submissions.filter((s) => s.status === 'GRADED').length
        const pendingSubmissions = submissions.filter(
          (s) => s.status === 'SUBMITTED'
        ).length
        const lateSubmissions = submissions.filter((s) => s.isLate).length

        const gradedScores = submissions
          .filter((s) => s.totalScore !== null)
          .map((s) => Number(s.totalScore))

        const averageScore =
          gradedScores.length > 0
            ? gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length
            : null

        return {
          ...assessment,
          stats: {
            totalSubmissions,
            gradedSubmissions,
            pendingSubmissions,
            lateSubmissions,
            averageScore,
          },
        }
      })
    )

    return NextResponse.json({ assessments: assessmentsWithStats })
  } catch (error) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/professor/classes/[classId]/assessments
 * Create a new assessment for a class
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
      type,
      submissionType,
      maxPoints,
      dueAt,
      allowMultipleAttempts,
      maxAttempts,
      orderIndex,
      rubricId,
    } = body

    // Validation
    if (!title || !type || !submissionType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, submissionType' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Create assessment
    const assessment = await db.assessment.create({
      data: {
        classId,
        title,
        slug,
        description: description || null,
        type,
        submissionType,
        maxPoints: maxPoints || 100,
        dueAt: dueAt ? new Date(dueAt) : null,
        allowMultipleAttempts: allowMultipleAttempts || false,
        maxAttempts: maxAttempts || 1,
        orderIndex: orderIndex || null,
        rubricId: rubricId || null,
      },
      include: {
        rubric: {
          include: {
            criteria: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Assessment created successfully',
        assessment,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating assessment:', error)
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    )
  }
}
