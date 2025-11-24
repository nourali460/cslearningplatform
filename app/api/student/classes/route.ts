import { NextResponse } from 'next/server'
import { getStudent } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const student = await getStudent()

    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all enrolled classes with comprehensive stats
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: student.id,
        status: 'active',
      },
      include: {
        class: {
          include: {
            course: {
              select: {
                code: true,
                title: true,
                description: true,
              },
            },
            professor: {
              select: {
                fullName: true,
                email: true,
              },
            },
            _count: {
              select: {
                assessments: true,
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate stats for each class
    const classesWithStats = await Promise.all(
      enrollments.map(async (enrollment) => {
        const classId = enrollment.class.id

        // Get all assessments for this class
        const assessments = await db.assessment.findMany({
          where: { classId },
          select: {
            id: true,
            type: true,
            maxPoints: true,
          },
        })

        // Get student's submissions for this class
        const submissions = await db.assessmentSubmission.findMany({
          where: {
            studentId: student.id,
            assessment: {
              classId,
            },
          },
          select: {
            assessmentId: true,
            status: true,
            totalScore: true,
            isLate: true,
            assessment: {
              select: {
                maxPoints: true,
              },
            },
          },
        })

        // Calculate statistics
        const totalAssessments = assessments.length
        const submittedCount = submissions.filter(
          (s) => s.status === 'SUBMITTED' || s.status === 'GRADED' || s.status === 'LATE'
        ).length
        const gradedCount = submissions.filter((s) => s.status === 'GRADED').length
        const pendingCount = totalAssessments - submittedCount

        // Calculate average grade for this class
        const gradedSubmissions = submissions.filter(
          (s) => s.status === 'GRADED' && s.totalScore !== null
        )
        let averageGrade = null
        if (gradedSubmissions.length > 0) {
          const totalPercentage = gradedSubmissions.reduce((sum, submission) => {
            const percentage =
              (Number(submission.totalScore) / Number(submission.assessment.maxPoints)) * 100
            return sum + percentage
          }, 0)
          averageGrade = totalPercentage / gradedSubmissions.length
        }

        // Calculate completion rate
        const completionRate =
          totalAssessments > 0 ? (submittedCount / totalAssessments) * 100 : 0

        // Count by assessment type
        const assessmentsByType = assessments.reduce(
          (acc, assessment) => {
            acc[assessment.type] = (acc[assessment.type] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        )

        return {
          id: enrollment.id,
          enrolledAt: enrollment.createdAt,
          class: {
            id: enrollment.class.id,
            title: enrollment.class.title,
            classCode: enrollment.class.classCode,
            term: enrollment.class.term,
            year: enrollment.class.year,
            section: enrollment.class.section,
            isActive: enrollment.class.isActive,
            course: enrollment.class.course,
            professor: enrollment.class.professor,
            studentCount: enrollment.class._count.enrollments,
          },
          stats: {
            totalAssessments,
            submitted: submittedCount,
            graded: gradedCount,
            pending: pendingCount,
            completionRate: Math.round(completionRate * 10) / 10,
            averageGrade: averageGrade ? Math.round(averageGrade * 10) / 10 : null,
            assessmentsByType,
          },
        }
      })
    )

    return NextResponse.json({
      classes: classesWithStats,
      totalClasses: classesWithStats.length,
    })
  } catch (error) {
    console.error('Error fetching student classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}
