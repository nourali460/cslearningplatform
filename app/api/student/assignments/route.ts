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
    // IMPORTANT: Only show assessments that are linked to modules (not standalone)
    // Per user requirement: students should only see assessments added to modules
    const assessmentWhere: any = {
      classId: {
        in: classId ? [classId] : enrolledClassIds,
      },
      isPublished: true, // Only show published assessments to students
      moduleItems: {
        some: {
          isPublished: true, // At least one published module item must link to this assessment
        },
      },
    }

    if (type) {
      assessmentWhere.type = type
    }

    // Fetch all assessments for enrolled classes that are linked to modules
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

    // Fetch modules with assessments for assignments list
    // NOTE: We fetch ALL modules (published and unpublished) because assessments
    // should be visible to students as long as they're linked to ANY module
    // and the assessment itself is published. Module publishing only affects
    // whether the module structure is visible, not the assessments within it.
    const modules = await db.module.findMany({
      where: {
        classId: {
          in: classId ? [classId] : enrolledClassIds, // ✅ Respect classId filter for modules view
        },
        // ❌ Removed: isPublished: true
        // ✅ Students see assessments from any module (per user requirement)
      },
      include: {
        class: {
          select: {
            id: true,
            title: true,
            classCode: true,
            course: {
              select: {
                code: true,
                title: true,
              },
            },
          },
        },
        items: {
          where: {
            itemType: 'ASSESSMENT',
            isPublished: true,
          },
          include: {
            assessment: {
              include: {
                submissions: {
                  where: {
                    studentId: student.id,
                  },
                  orderBy: {
                    attemptNumber: 'desc',
                  },
                  take: 1,
                },
              },
              // Note: We need to select isPublished to filter unpublished assessments
              // Since we're using include instead of select, all fields are already included
            },
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    })

    // Process modules with assessments
    const modulesByClass = modules
      .filter((module) => module.items.some((item) => item.assessment))
      .map((module) => {
        // Use a Map to deduplicate assessments by ID
        const assessmentMap = new Map()

        module.items
          .filter((item) => item.assessment && item.assessment.isPublished !== false)
          .forEach((item) => {
            const assessment = item.assessment!

            // Skip if we've already processed this assessment
            if (assessmentMap.has(assessment.id)) {
              return
            }

            const latestSubmission = assessment.submissions[0] || null
            const isOverdue = assessment.dueAt && assessment.dueAt < now && !latestSubmission
            const isSubmitted =
              latestSubmission &&
              (latestSubmission.status === 'SUBMITTED' ||
                latestSubmission.status === 'GRADED' ||
                latestSubmission.status === 'LATE')
            const isGraded = latestSubmission && latestSubmission.status === 'GRADED'
            const isPending = !isSubmitted

            assessmentMap.set(assessment.id, {
              id: assessment.id,
              title: assessment.title,
              type: assessment.type,
              description: item.customDescription || assessment.description,
              dueAt: assessment.dueAt,
              maxPoints: assessment.maxPoints,
              submission: latestSubmission
                ? {
                    id: latestSubmission.id,
                    status: latestSubmission.status,
                    totalScore: latestSubmission.totalScore,
                    isLate: latestSubmission.isLate,
                  }
                : null,
              status: isOverdue ? 'overdue' : isGraded ? 'graded' : isSubmitted ? 'submitted' : 'pending',
              isOverdue,
              isPending,
              isSubmitted,
              isGraded,
            })
          })

        return {
          module: {
            id: module.id,
            title: module.title,
            description: module.description,
            orderIndex: module.orderIndex,
            isPublished: module.isPublished,
            assessments: Array.from(assessmentMap.values()),
          },
          class: module.class,
        }
      })

    return NextResponse.json({
      assignments: filteredAssessments,
      stats,
      modulesByClass,
    })
  } catch (error) {
    console.error('Error fetching student assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}
