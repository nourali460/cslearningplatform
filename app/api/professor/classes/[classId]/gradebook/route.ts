import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

/**
 * GET /api/professor/classes/[classId]/gradebook
 * Get gradebook data for a class (grid format)
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

    // Get all students enrolled in this class
    const enrollments = await db.enrollment.findMany({
      where: {
        classId: classId,
        status: 'active',
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            usernameSchoolId: true,
          },
        },
      },
      orderBy: {
        student: {
          fullName: 'asc',
        },
      },
    })

    // Get all assessments for this class
    const assessments = await db.assessment.findMany({
      where: {
        classId: classId,
      },
      orderBy: [
        { type: 'asc' },
        { dueAt: 'asc' },
      ],
    })

    // Get all submissions for this class
    // Note: With @@unique([assessmentId, studentId]), there's only ONE submission per student per assessment
    const submissions = await db.assessmentSubmission.findMany({
      where: {
        classId: classId, // Direct class filter for better performance
      },
    })

    // Build gradebook grid
    const students = enrollments.map((enrollment) => {
      const studentId = enrollment.student.id

      // Get submissions for this student
      const studentSubmissions = submissions.filter((s) => s.studentId === studentId)

      // Build grade map by assessment ID - create entries for ALL assessments
      const grades: Record<string, any> = {}
      assessments.forEach((assessment) => {
        // Find existing submission for this assessment (exactly ONE per student per assessment)
        const existingSubmission = studentSubmissions.find((s) => s.assessmentId === assessment.id)

        if (existingSubmission) {
          grades[assessment.id] = {
            submissionId: existingSubmission.id,
            score: existingSubmission.totalScore ? Number(existingSubmission.totalScore) : null,
            status: existingSubmission.status,
            isLate: existingSubmission.isLate,
          }
        } else {
          // No submission yet - create placeholder
          grades[assessment.id] = {
            submissionId: null,
            score: null,
            status: 'NOT_SUBMITTED',
            isLate: false,
          }
        }
      })

      // Calculate statistics by type
      const statsByType: Record<string, { earned: number; possible: number; count: number }> = {}

      assessments.forEach((assessment) => {
        const type = assessment.type
        if (!statsByType[type]) {
          statsByType[type] = { earned: 0, possible: 0, count: 0 }
        }

        const grade = grades[assessment.id]
        if (grade && grade.score !== null) {
          statsByType[type].earned += grade.score
          statsByType[type].possible += Number(assessment.maxPoints)
          statsByType[type].count += 1
        }
      })

      // Calculate overall stats
      let totalEarned = 0
      let totalPossible = 0
      Object.values(statsByType).forEach((stats) => {
        totalEarned += stats.earned
        totalPossible += stats.possible
      })

      const overallPercentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0

      // Calculate category percentages
      const categoryPercentages: Record<string, number> = {}
      Object.entries(statsByType).forEach(([type, stats]) => {
        categoryPercentages[type] = stats.possible > 0 ? (stats.earned / stats.possible) * 100 : 0
      })

      return {
        student: enrollment.student,
        grades,
        categoryPercentages,
        categoryStats: statsByType,
        overallPercentage,
        totalEarned,
        totalPossible,
      }
    })

    return NextResponse.json({
      students,
      assessments,
    })
  } catch (error) {
    console.error('Error fetching gradebook:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch gradebook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
