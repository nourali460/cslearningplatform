import { db } from './db'
import { ModuleItemType } from '@prisma/client'

/**
 * Creates modules from course templates when a class is created
 * Also creates ModuleTemplateMapping and ModuleItemTemplateMapping records to track relationships
 * @param classId - The ID of the newly created class
 * @param courseId - The ID of the course
 * @returns Number of modules created
 */
export async function createModulesFromTemplates(
  classId: string,
  courseId: string
): Promise<number> {
  try {
    // Fetch all active module templates for this course
    const moduleTemplates = await db.moduleTemplate.findMany({
      where: {
        courseId,
        isActive: true,
      },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    })

    if (moduleTemplates.length === 0) {
      console.log(`[Module Templates] No templates found for course ${courseId}`)
      return 0
    }

    console.log(
      `[Module Templates] Creating ${moduleTemplates.length} modules for class ${classId}`
    )

    // Get all assessment template mappings for this class to link module items
    const assessmentMappings = await db.assessmentTemplateMapping.findMany({
      where: { classId },
      select: {
        assessmentId: true,
        assessmentTemplateId: true,
      },
    })

    // Create a lookup map: templateId -> assessmentId
    const assessmentLookup = new Map<string, string>()
    assessmentMappings.forEach((mapping) => {
      assessmentLookup.set(mapping.assessmentTemplateId, mapping.assessmentId)
    })

    // Create modules from templates
    const results = await Promise.all(
      moduleTemplates.map(async (template) => {
        // Create the module
        const module = await db.module.create({
          data: {
            classId,
            title: template.title,
            description: template.description,
            orderIndex: template.orderIndex,
            isPublished: true,
            unlockAt: template.defaultUnlockAt,
            // Note: prerequisiteIds will need to be resolved after all modules are created
            prerequisiteIds: [],
          },
        })

        // Create module template mapping
        await db.moduleTemplateMapping.create({
          data: {
            classId,
            moduleId: module.id,
            moduleTemplateId: template.id,
          },
        })

        // Create module items from templates
        if (template.items.length > 0) {
          await Promise.all(
            template.items.map(async (itemTemplate) => {
              // Determine assessmentId if this is an ASSESSMENT type item
              let assessmentId: string | null = null
              if (
                itemTemplate.itemType === 'ASSESSMENT' &&
                itemTemplate.assessmentTemplateId
              ) {
                // Look up the cloned assessment ID
                assessmentId =
                  assessmentLookup.get(itemTemplate.assessmentTemplateId) || null

                if (!assessmentId) {
                  // ✅ CRITICAL: Throw error instead of just warning
                  // This ensures we don't create broken module items that students can't see
                  throw new Error(
                    `[Module Templates] CRITICAL: Cannot find assessment for template ${itemTemplate.assessmentTemplateId}. ` +
                    `Module item "${itemTemplate.title}" requires this assessment to be created first. ` +
                    `Available assessment templates: ${Array.from(assessmentLookup.keys()).join(', ')}`
                  )
                }
              }

              // Create the module item
              const moduleItem = await db.moduleItem.create({
                data: {
                  moduleId: module.id,
                  itemType: itemTemplate.itemType,
                  title: itemTemplate.title,
                  assessmentId,
                  externalUrl: itemTemplate.externalUrl,
                  pageContent: itemTemplate.pageContent,
                  customDescription: itemTemplate.customDescription,
                  orderIndex: itemTemplate.orderIndex,
                  isPublished: itemTemplate.isPublished,
                  isRequired: itemTemplate.isRequired,
                },
              })

              // Create module item template mapping
              await db.moduleItemTemplateMapping.create({
                data: {
                  moduleId: module.id,
                  moduleItemId: moduleItem.id,
                  moduleItemTemplateId: itemTemplate.id,
                },
              })
            })
          )
        }

        return module
      })
    )

    // Second pass: Resolve prerequisite module IDs based on template prerequisites
    // This maps template prerequisite IDs to actual module IDs
    const moduleMappings = await db.moduleTemplateMapping.findMany({
      where: { classId },
      select: {
        moduleId: true,
        moduleTemplateId: true,
      },
    })

    // Create a lookup map: templateId -> moduleId
    const templateToModuleMap = new Map<string, string>()
    moduleMappings.forEach((mapping) => {
      templateToModuleMap.set(mapping.moduleTemplateId, mapping.moduleId)
    })

    // Update modules with resolved prerequisite IDs
    for (const template of moduleTemplates) {
      if (
        template.defaultPrerequisiteIds &&
        template.defaultPrerequisiteIds.length > 0
      ) {
        // Resolve template IDs to actual module IDs
        const resolvedPrerequisiteIds = template.defaultPrerequisiteIds
          .map((templateId) => templateToModuleMap.get(templateId))
          .filter((id): id is string => id !== undefined)

        // Find the corresponding module
        const moduleId = templateToModuleMap.get(template.id)
        if (moduleId && resolvedPrerequisiteIds.length > 0) {
          await db.module.update({
            where: { id: moduleId },
            data: {
              prerequisiteIds: resolvedPrerequisiteIds,
            },
          })
          console.log(
            `[Module Templates] Resolved ${resolvedPrerequisiteIds.length} prerequisites for module ${moduleId}`
          )
        }
      }
    }

    console.log(
      `[Module Templates] Successfully created ${results.length} modules with their items`
    )

    return results.length
  } catch (error) {
    console.error('[Module Templates] Error creating modules:', error)
    throw error
  }
}

/**
 * Gets the template that a module was created from (if any)
 * @param moduleId - The ID of the module
 * @returns The module template or null if not created from a template
 */
export async function getModuleTemplate(moduleId: string) {
  const mapping = await db.moduleTemplateMapping.findUnique({
    where: { moduleId },
    include: { moduleTemplate: true },
  })

  return mapping?.moduleTemplate || null
}

/**
 * Checks if a module was created from a template
 * @param moduleId - The ID of the module
 * @returns True if created from a template
 */
export async function isModuleFromTemplate(moduleId: string): Promise<boolean> {
  const mapping = await db.moduleTemplateMapping.findUnique({
    where: { moduleId },
  })

  return mapping !== null
}

/**
 * Gets the template that a module item was created from (if any)
 * @param moduleItemId - The ID of the module item
 * @returns The module item template or null if not created from a template
 */
export async function getModuleItemTemplate(moduleItemId: string) {
  const mapping = await db.moduleItemTemplateMapping.findUnique({
    where: { moduleItemId },
    include: { moduleItemTemplate: true },
  })

  return mapping?.moduleItemTemplate || null
}

/**
 * Checks if a module item was created from a template
 * @param moduleItemId - The ID of the module item
 * @returns True if created from a template
 */
export async function isModuleItemFromTemplate(
  moduleItemId: string
): Promise<boolean> {
  const mapping = await db.moduleItemTemplateMapping.findUnique({
    where: { moduleItemId },
  })

  return mapping !== null
}
