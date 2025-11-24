import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStudent } from '@/lib/auth'

export async function GET() {
  try {
    const student = await getStudent()

    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all graded submissions for the student
    const submissions = await db.assessmentSubmission.findMany({
      where: {
        studentId: student.id,
        status: 'GRADED',
        totalScore: { not: null },
      },
      include: {
        assessment: {
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
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Calculate overall statistics
    let totalPointsEarned = 0
    let totalPointsPossible = 0
    const gradesByType: Record<string, { earned: number; possible: number; count: number }> = {
      INTERACTIVE_LESSON: { earned: 0, possible: 0, count: 0 },
      LAB: { earned: 0, possible: 0, count: 0 },
      EXAM: { earned: 0, possible: 0, count: 0 },
      QUIZ: { earned: 0, possible: 0, count: 0 },
      DISCUSSION: { earned: 0, possible: 0, count: 0 },
    }

    const gradesByClass: Record<string, {
      classId: string
      className: string
      classCode: string
      courseCode: string
      courseTitle: string
      earned: number
      possible: number
      count: number
      grades: any[]
    }> = {}

    submissions.forEach((submission) => {
      const score = Number(submission.totalScore)
      const maxPoints = Number(submission.assessment.maxPoints)

      totalPointsEarned += score
      totalPointsPossible += maxPoints

      // Group by assessment type
      const type = submission.assessment.type
      if (gradesByType[type]) {
        gradesByType[type].earned += score
        gradesByType[type].possible += maxPoints
        gradesByType[type].count += 1
      }

      // Group by class
      const classId = submission.assessment.class.id
      if (!gradesByClass[classId]) {
        gradesByClass[classId] = {
          classId: classId,
          className: submission.assessment.class.title,
          classCode: submission.assessment.class.classCode,
          courseCode: submission.assessment.class.course.code,
          courseTitle: submission.assessment.class.course.title,
          earned: 0,
          possible: 0,
          count: 0,
          grades: [],
        }
      }

      gradesByClass[classId].earned += score
      gradesByClass[classId].possible += maxPoints
      gradesByClass[classId].count += 1
      gradesByClass[classId].grades.push({
        id: submission.id,
        assessmentId: submission.assessment.id,
        assessmentTitle: submission.assessment.title,
        assessmentType: submission.assessment.type,
        score: score,
        maxPoints: maxPoints,
        percentage: maxPoints > 0 ? (score / maxPoints) * 100 : 0,
        gradedAt: submission.updatedAt,
        feedback: submission.feedback,
      })
    })

    // Calculate overall average
    const overallAverage = totalPointsPossible > 0
      ? (totalPointsEarned / totalPointsPossible) * 100
      : 0

    // Calculate averages by type for pie chart
    const typeBreakdown = Object.entries(gradesByType).map(([type, data]) => ({
      type,
      average: data.possible > 0 ? (data.earned / data.possible) * 100 : 0,
      earned: data.earned,
      possible: data.possible,
      count: data.count,
    })).filter(item => item.count > 0) // Only include types with grades

    // Calculate class averages
    const classSummary = Object.values(gradesByClass).map((classData) => ({
      ...classData,
      average: classData.possible > 0 ? (classData.earned / classData.possible) * 100 : 0,
    }))

    return NextResponse.json({
      overallStats: {
        average: overallAverage,
        totalPointsEarned,
        totalPointsPossible,
        totalGradedAssignments: submissions.length,
      },
      typeBreakdown,
      classSummary,
      allSubmissions: submissions.length,
    })
  } catch (error) {
    console.error('Error fetching student grades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    )
  }
}
