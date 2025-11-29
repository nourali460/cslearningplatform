import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStudent } from '@/lib/auth'

export async function GET() {
  try {
    const student = await getStudent()

    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all enrolled classes
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: student.id,
      },
      select: {
        classId: true,
      },
    })

    const enrolledClassIds = enrollments.map((e) => e.classId)

    // Get all assessments from enrolled classes
    const assessments = await db.assessment.findMany({
      where: {
        classId: {
          in: enrolledClassIds,
        },
      },
      include: {
        class: {
          include: {
            course: {
              select: {
                code: true,
                title: true,
              },
            },
          },
        },
        submissions: {
          where: {
            studentId: student.id,
          },
          orderBy: {
            submittedAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        dueAt: 'desc',
      },
    })

    // Calculate overall statistics
    let totalPointsEarned = 0
    let totalPointsPossible = 0
    let totalGradedCount = 0
    let totalAssessmentsCount = assessments.length

    const gradesByType: Record<string, { earned: number; possible: number; graded: number; total: number }> = {
      INTERACTIVE_LESSON: { earned: 0, possible: 0, graded: 0, total: 0 },
      LAB: { earned: 0, possible: 0, graded: 0, total: 0 },
      EXAM: { earned: 0, possible: 0, graded: 0, total: 0 },
      QUIZ: { earned: 0, possible: 0, graded: 0, total: 0 },
      DISCUSSION: { earned: 0, possible: 0, graded: 0, total: 0 },
    }

    const gradesByClass: Record<string, {
      classId: string
      className: string
      classCode: string
      courseCode: string
      courseTitle: string
      earned: number
      possible: number
      graded: number
      total: number
      grades: any[]
    }> = {}

    assessments.forEach((assessment) => {
      const maxPoints = Number(assessment.maxPoints)
      const submission = assessment.submissions[0] || null
      const isGraded = submission?.status === 'GRADED' && submission?.totalScore !== null
      const isSubmitted = !!submission
      const score = isGraded ? Number(submission.totalScore) : 0

      // Determine status
      let status: 'graded' | 'pending' | 'not_submitted'
      if (isGraded) {
        status = 'graded'
        totalPointsEarned += score
        totalPointsPossible += maxPoints
        totalGradedCount += 1
      } else if (isSubmitted) {
        status = 'pending'
      } else {
        status = 'not_submitted'
      }

      // Group by assessment type
      const type = assessment.type
      if (gradesByType[type]) {
        gradesByType[type].total += 1
        if (isGraded) {
          gradesByType[type].earned += score
          gradesByType[type].possible += maxPoints
          gradesByType[type].graded += 1
        }
      }

      // Group by class
      const classId = assessment.class.id
      if (!gradesByClass[classId]) {
        gradesByClass[classId] = {
          classId: classId,
          className: assessment.class.title,
          classCode: assessment.class.classCode,
          courseCode: assessment.class.course.code,
          courseTitle: assessment.class.course.title,
          earned: 0,
          possible: 0,
          graded: 0,
          total: 0,
          grades: [],
        }
      }

      gradesByClass[classId].total += 1
      if (isGraded) {
        gradesByClass[classId].earned += score
        gradesByClass[classId].possible += maxPoints
        gradesByClass[classId].graded += 1
      }

      gradesByClass[classId].grades.push({
        id: submission?.id || assessment.id,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        assessmentType: assessment.type,
        score: isGraded ? score : null,
        maxPoints: maxPoints,
        percentage: isGraded && maxPoints > 0 ? (score / maxPoints) * 100 : null,
        gradedAt: isGraded ? submission.updatedAt : null,
        submittedAt: submission?.submittedAt || null,
        feedback: submission?.feedback || null,
        status: status,
      })
    })

    // Calculate overall average (only from graded work)
    const overallAverage = totalPointsPossible > 0
      ? (totalPointsEarned / totalPointsPossible) * 100
      : 0

    // Calculate completion rate
    const completionRate = totalAssessmentsCount > 0
      ? (totalGradedCount / totalAssessmentsCount) * 100
      : 0

    // Calculate averages by type
    const typeBreakdown = Object.entries(gradesByType).map(([type, data]) => ({
      type,
      average: data.possible > 0 ? (data.earned / data.possible) * 100 : 0,
      earned: data.earned,
      possible: data.possible,
      graded: data.graded,
      total: data.total,
      completionRate: data.total > 0 ? (data.graded / data.total) * 100 : 0,
    })).filter(item => item.total > 0) // Only include types with assessments

    // Calculate class averages and sort grades by status
    const classSummary = Object.values(gradesByClass).map((classData) => {
      // Sort: graded first, then pending, then not submitted
      const sortedGrades = classData.grades.sort((a, b) => {
        const statusOrder = { graded: 0, pending: 1, not_submitted: 2 }
        return statusOrder[a.status] - statusOrder[b.status]
      })

      return {
        ...classData,
        average: classData.possible > 0 ? (classData.earned / classData.possible) * 100 : 0,
        completionRate: classData.total > 0 ? (classData.graded / classData.total) * 100 : 0,
        grades: sortedGrades,
      }
    })

    return NextResponse.json({
      student: {
        name: student.fullName || student.email.split('@')[0],
        email: student.email,
      },
      overallStats: {
        average: overallAverage,
        totalPointsEarned,
        totalPointsPossible,
        totalGradedAssignments: totalGradedCount,
        totalAssignments: totalAssessmentsCount,
        completionRate,
      },
      typeBreakdown,
      classSummary,
      allSubmissions: totalGradedCount,
    })
  } catch (error) {
    console.error('Error fetching student grades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    )
  }
}
