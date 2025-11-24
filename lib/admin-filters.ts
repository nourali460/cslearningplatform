import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

export type AdminFilters = {
  term?: string
  year?: number
  professorId?: string
  courseId?: string
  classId?: string
  studentId?: string
  assessmentId?: string
}

/**
 * Builds a Prisma where clause for Class queries based on admin filters.
 * All filters are combinable and optional.
 */
export function buildClassFilters(filters: AdminFilters): Prisma.ClassWhereInput {
  const where: Prisma.ClassWhereInput = {}

  if (filters.term) {
    where.term = filters.term
  }

  if (filters.year) {
    where.year = filters.year
  }

  if (filters.professorId) {
    where.professorId = filters.professorId
  }

  if (filters.courseId) {
    where.courseId = filters.courseId
  }

  if (filters.classId) {
    where.id = filters.classId
  }

  return where
}

/**
 * Builds a Prisma where clause for Assessment queries based on admin filters.
 * Filters are applied through the class relationship.
 */
export function buildAssessmentFilters(
  filters: AdminFilters
): Prisma.AssessmentWhereInput {
  const classFilters = buildClassFilters(filters)

  if (Object.keys(classFilters).length === 0) {
    return {}
  }

  return {
    class: classFilters,
  }
}

/**
 * Builds a Prisma where clause for Enrollment queries based on admin filters.
 * Filters are applied through the class relationship.
 */
export function buildEnrollmentFilters(
  filters: AdminFilters
): Prisma.EnrollmentWhereInput {
  const classFilters = buildClassFilters(filters)

  if (Object.keys(classFilters).length === 0) {
    return {}
  }

  return {
    class: classFilters,
  }
}

/**
 * Builds a Prisma where clause for AssessmentSubmission queries based on admin filters.
 * Filters are applied through the assessment -> class relationship and studentId.
 */
export function buildSubmissionFilters(
  filters: AdminFilters
): Prisma.AssessmentSubmissionWhereInput {
  const assessmentFilters = buildAssessmentFilters(filters)
  const where: Prisma.AssessmentSubmissionWhereInput = {}

  if (Object.keys(assessmentFilters).length > 0) {
    where.assessment = assessmentFilters
  }

  if (filters.studentId) {
    where.studentId = filters.studentId
  }

  if (filters.assessmentId) {
    where.assessmentId = filters.assessmentId
  }

  return where
}

/**
 * Fetches available filter options with cascading logic.
 * Returns only options that have matching classes given the current filters.
 */
export async function getFilterOptions(currentFilters: AdminFilters) {
  const classFilters = buildClassFilters(currentFilters)

  // Get all classes matching current filters
  const matchingClasses = await db.class.findMany({
    where: classFilters,
    select: {
      term: true,
      year: true,
      professorId: true,
      courseId: true,
      id: true,
      professor: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
      title: true,
      classCode: true,
    },
  })

  // Extract unique terms
  const terms = Array.from(new Set(matchingClasses.map((c) => c.term))).sort()

  // Extract unique years (descending)
  const years = Array.from(new Set(matchingClasses.map((c) => c.year))).sort(
    (a, b) => b - a
  )

  // Extract unique professors
  const professorMap = new Map<string, { id: string; name: string }>()
  matchingClasses.forEach((c) => {
    if (!professorMap.has(c.professorId)) {
      professorMap.set(c.professorId, {
        id: c.professorId,
        name: c.professor.fullName || c.professor.email,
      })
    }
  })
  const professors = Array.from(professorMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  // Extract unique courses
  const courseMap = new Map<string, { id: string; code: string; title: string }>()
  matchingClasses.forEach((c) => {
    if (!courseMap.has(c.courseId)) {
      courseMap.set(c.courseId, {
        id: c.courseId,
        code: c.course.code,
        title: c.course.title,
      })
    }
  })
  const courses = Array.from(courseMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code)
  )

  // Extract all classes
  const classes = matchingClasses
    .map((c) => ({
      id: c.id,
      code: c.classCode,
      title: c.title,
    }))
    .sort((a, b) => a.code.localeCompare(b.code))

  // Fetch students enrolled in matching classes
  const classIds = matchingClasses.map((c) => c.id)
  const enrolledStudents = await db.enrollment.findMany({
    where: {
      classId: {
        in: classIds,
      },
    },
    select: {
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  })

  // Extract unique students
  const studentMap = new Map<string, { id: string; name: string }>(  )
  enrolledStudents.forEach((enrollment) => {
    if (!studentMap.has(enrollment.student.id)) {
      studentMap.set(enrollment.student.id, {
        id: enrollment.student.id,
        name: enrollment.student.fullName || enrollment.student.email,
      })
    }
  })
  const students = Array.from(studentMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  // Fetch assessments from matching classes
  const assessments = await db.assessment.findMany({
    where: {
      classId: {
        in: classIds,
      },
    },
    select: {
      id: true,
      title: true,
      class: {
        select: {
          course: {
            select: {
              code: true,
            },
          },
        },
      },
    },
    orderBy: [
      { orderIndex: 'asc' },
      { createdAt: 'asc' },
    ],
  })

  // Format assessments for dropdown
  const formattedAssessments = assessments.map((assessment) => ({
    id: assessment.id,
    title: assessment.title,
    courseCode: assessment.class.course.code,
  }))

  return {
    terms,
    years,
    professors,
    courses,
    classes,
    students,
    assessments: formattedAssessments,
  }
}
