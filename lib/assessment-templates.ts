import { db } from './db'
import { AssessmentType } from '@prisma/client'

/**
 * Creates assessments from course templates when a class is created
 * Also creates AssessmentTemplateMapping records to track template→assessment relationships
 * @param classId - The ID of the newly created class
 * @param courseId - The ID of the course
 * @returns Number of assessments created
 */
export async function createAssessmentsFromTemplates(
  classId: string,
  courseId: string
): Promise<number> {
  try {
    // Fetch all active templates for this course
    const templates = await db.assessmentTemplate.findMany({
      where: {
        courseId,
        isActive: true,
      },
      orderBy: { orderIndex: 'asc' },
    })

    if (templates.length === 0) {
      console.log(`[Assessment Templates] No templates found for course ${courseId}`)
      return 0
    }

    console.log(
      `[Assessment Templates] Creating ${templates.length} assessments for class ${classId}`
    )

    // Create assessments from templates and track mappings
    const results = await Promise.all(
      templates.map(async (template) => {
        // Create the assessment
        const assessment = await db.assessment.create({
          data: {
            classId,
            title: template.title,
            slug: generateSlug(template.title),
            description: template.description,
            type: template.type,
            maxPoints: template.defaultMaxPoints,
            submissionType: template.defaultSubmissionType,
            orderIndex: template.orderIndex,
            isPublished: true, // ✅ Explicitly publish all seeded assessments
            // Copy discussion-specific settings if this is a discussion
            ...(template.type === 'DISCUSSION' && {
              allowPeerReplies: template.defaultAllowPeerReplies,
              minimumReplyCount: template.defaultMinimumReplyCount,
              autoCompleteEnabled: template.defaultAutoCompleteEnabled,
              lockedAfterDue: template.defaultLockedAfterDue,
              requirePostBeforeViewing: template.defaultRequirePostBeforeViewing,
              allowAnonymous: template.defaultAllowAnonymous,
            }),
            // Leave dueAt, allowMultipleAttempts, maxAttempts as defaults
            // Professor can set these later
          },
        })

        // Create mapping to track which template this assessment came from
        await db.assessmentTemplateMapping.create({
          data: {
            classId,
            assessmentId: assessment.id,
            assessmentTemplateId: template.id,
          },
        })

        return assessment
      })
    )

    console.log(
      `[Assessment Templates] Successfully created ${results.length} assessments`
    )

    return results.length
  } catch (error) {
    console.error('[Assessment Templates] Error creating assessments:', error)
    throw error
  }
}

/**
 * Gets the template that an assessment was created from (if any)
 * @param assessmentId - The ID of the assessment
 * @returns The assessment template or null if not created from a template
 */
export async function getAssessmentTemplate(assessmentId: string) {
  const mapping = await db.assessmentTemplateMapping.findUnique({
    where: { assessmentId },
    include: { assessmentTemplate: true },
  })

  return mapping?.assessmentTemplate || null
}

/**
 * Checks if an assessment was created from a template
 * @param assessmentId - The ID of the assessment
 * @returns True if created from a template
 */
export async function isAssessmentFromTemplate(assessmentId: string): Promise<boolean> {
  const mapping = await db.assessmentTemplateMapping.findUnique({
    where: { assessmentId },
  })

  return mapping !== null
}

/**
 * Generates a URL-friendly slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}
