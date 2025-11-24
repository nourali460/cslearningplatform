import { NextResponse } from 'next/server'
import { getStudent } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const student = await getStudent()

    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const type = searchParams.get('type')
    const status = searchParams.get('status') // pending, submitted, graded
    const sortBy = searchParams.get('sortBy') || 'dueDate' // dueDate, title, type

    // Get all enrolled class IDs
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: student.id,
        status: 'active',
      },
      select: {
        classId: true,
      },
    })

    const enrolledClassIds = enrollments.map((e) => e.classId)

    // Build assessment where clause
    const assessmentWhere: any = {
      classId: {
        in: classId ? [classId] : enrolledClassIds,
      },
    }

    if (type) {
      assessmentWhere.type = type
    }

    // Fetch all assessments for enrolled classes
    const assessments = await db.assessment.findMany({
      where: assessmentWhere,
      include: {
        class: {
          include: {
            course: {
              select: {
                code: true,
                title: true,
              },
            },
            professor: {
              select: {
                fullName: true,
              },
            },
          },
        },
        submissions: {
          where: {
            studentId: student.id,
          },
          orderBy: {
            attemptNumber: 'desc',
          },
          take: 1, // Get only the latest submission
        },
      },
      orderBy:
        sortBy === 'title'
          ? { title: 'asc' }
          : sortBy === 'type'
            ? { type: 'asc' }
            : { dueAt: 'asc' },
    })

    // Process assessments with submission status
    const now = new Date()
    const processedAssessments = assessments.map((assessment) => {
      const latestSubmission = assessment.submissions[0] || null
      const isOverdue = assessment.dueAt && assessment.dueAt < now && !latestSubmission
      const isSubmitted =
        latestSubmission &&
        (latestSubmission.status === 'SUBMITTED' ||
          latestSubmission.status === 'GRADED' ||
          latestSubmission.status === 'LATE')
      const isGraded = latestSubmission && latestSubmission.status === 'GRADED'
      const isPending = !isSubmitted

      // Determine overall status
      let overallStatus = 'pending'
      if (isOverdue) {
        overallStatus = 'overdue'
      } else if (isGraded) {
        overallStatus = 'graded'
      } else if (isSubmitted) {
        overallStatus = 'submitted'
      }

      return {
        id: assessment.id,
        title: assessment.title,
        slug: assessment.slug,
        description: assessment.description,
        dueAt: assessment.dueAt,
        maxPoints: assessment.maxPoints,
        type: assessment.type,
        submissionType: assessment.submissionType,
        allowMultipleAttempts: assessment.allowMultipleAttempts,
        maxAttempts: assessment.maxAttempts,
        class: {
          id: assessment.class.id,
          title: assessment.class.title,
          classCode: assessment.class.classCode,
          term: assessment.class.term,
          year: assessment.class.year,
          course: assessment.class.course,
          professor: assessment.class.professor,
        },
        submission: latestSubmission
          ? {
              id: latestSubmission.id,
              submittedAt: latestSubmission.submittedAt,
              status: latestSubmission.status,
              totalScore: latestSubmission.totalScore,
              feedback: latestSubmission.feedback,
              isLate: latestSubmission.isLate,
              attemptNumber: latestSubmission.attemptNumber,
            }
          : null,
        status: overallStatus,
        isOverdue,
        isPending,
        isSubmitted,
        isGraded,
      }
    })

    // Apply status filter
    let filteredAssessments = processedAssessments
    if (status === 'pending') {
      filteredAssessments = processedAssessments.filter((a) => a.isPending)
    } else if (status === 'submitted') {
      filteredAssessments = processedAssessments.filter((a) => a.isSubmitted && !a.isGraded)
    } else if (status === 'graded') {
      filteredAssessments = processedAssessments.filter((a) => a.isGraded)
    } else if (status === 'overdue') {
      filteredAssessments = processedAssessments.filter((a) => a.isOverdue)
    }

    // Calculate statistics
    const stats = {
      total: processedAssessments.length,
      pending: processedAssessments.filter((a) => a.isPending).length,
      submitted: processedAssessments.filter((a) => a.isSubmitted && !a.isGraded).length,
      graded: processedAssessments.filter((a) => a.isGraded).length,
      overdue: processedAssessments.filter((a) => a.isOverdue).length,
      byType: processedAssessments.reduce(
        (acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
    }

    return NextResponse.json({
      assignments: filteredAssessments,
      stats,
    })
  } catch (error) {
    console.error('Error fetching student assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}
