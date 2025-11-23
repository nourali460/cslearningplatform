import { z } from 'zod'

// ---------------------------------------------------------
// USER SCHEMAS
// ---------------------------------------------------------

export const userRoleSchema = z.enum(['admin', 'professor', 'student'])

export const createUserSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  fullName: z.string().optional(),
})

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  role: userRoleSchema.optional(),
})

// ---------------------------------------------------------
// COURSE SCHEMAS
// ---------------------------------------------------------

export const createCourseSchema = z.object({
  code: z.string().min(1).max(20),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  subject: z.string().optional(),
  level: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const updateCourseSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  subject: z.string().optional(),
  level: z.string().optional(),
  isActive: z.boolean().optional(),
})

// ---------------------------------------------------------
// CLASS SCHEMAS
// ---------------------------------------------------------

export const createClassSchema = z.object({
  courseId: z.string().uuid(),
  professorId: z.string().uuid(),
  title: z.string().min(1).max(255),
  term: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  section: z.string().optional(),
  classCode: z.string().min(1).max(50),
  isActive: z.boolean().default(true),
})

export const updateClassSchema = z.object({
  courseId: z.string().uuid().optional(),
  professorId: z.string().uuid().optional(),
  title: z.string().min(1).max(255).optional(),
  term: z.string().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  section: z.string().optional(),
  classCode: z.string().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
})

// ---------------------------------------------------------
// ENROLLMENT SCHEMAS
// ---------------------------------------------------------

export const createEnrollmentSchema = z.object({
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
  status: z.string().default('active'),
})

export const updateEnrollmentSchema = z.object({
  status: z.string(),
})

export const joinClassSchema = z.object({
  classCode: z.string().min(1).max(50),
})

// ---------------------------------------------------------
// ASSESSMENT SCHEMAS
// ---------------------------------------------------------

export const createAssessmentSchema = z.object({
  classId: z.string().uuid(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  maxPoints: z.number().min(0).max(999.99).default(100),
  orderIndex: z.number().int().optional(),
})

export const updateAssessmentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  maxPoints: z.number().min(0).max(999.99).optional(),
  orderIndex: z.number().int().optional(),
})

// ---------------------------------------------------------
// ASSESSMENT SUBMISSION SCHEMAS
// ---------------------------------------------------------

export const createSubmissionSchema = z.object({
  assessmentId: z.string().uuid(),
  studentId: z.string().uuid(),
  autoScore: z.number().min(0).max(999.99).optional(),
  manualScore: z.number().min(0).max(999.99).optional(),
  totalScore: z.number().min(0).max(999.99).optional(),
  feedback: z.string().optional(),
  feedbackFiles: z.any().optional(),
  status: z.string().optional(),
  attemptNumber: z.number().int().min(1).default(1),
})

export const updateSubmissionSchema = z.object({
  autoScore: z.number().min(0).max(999.99).optional(),
  manualScore: z.number().min(0).max(999.99).optional(),
  totalScore: z.number().min(0).max(999.99).optional(),
  feedback: z.string().optional(),
  feedbackFiles: z.any().optional(),
  status: z.string().optional(),
})

// ---------------------------------------------------------
// COMMON SCHEMAS
// ---------------------------------------------------------

export const uuidSchema = z.string().uuid()
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
})
