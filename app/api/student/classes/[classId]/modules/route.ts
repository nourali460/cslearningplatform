import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStudent } from '@/lib/auth'

/**
 * GET /api/student/classes/[classId]/modules
 * Get all modules for a class (student view) with completion status
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ classId: string }> }
) {
  try {
    const student = await getStudent()

    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { classId } = params

    // Verify student is enrolled in this class
    const enrollment = await db.enrollment.findFirst({
      where: {
        classId: classId,
        studentId: student.id,
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 403 })
    }

    // Fetch modules with items and student's completion status
    const modules = await db.module.findMany({
      where: {
        classId: classId,
        isPublished: true,
      },
      include: {
        items: {
          where: {
            isPublished: true,
          },
          include: {
            assessment: {
              select: {
                id: true,
                title: true,
                type: true,
                description: true,
                maxPoints: true,
                dueAt: true,
                isPublished: true, // Include to filter unpublished assessments
              },
            },
            moduleItemCompletions: {
              where: {
                studentId: student.id,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        moduleCompletions: {
          where: {
            studentId: student.id,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    })

    // Check if module is locked based on unlockAt and prerequisites
    const now = new Date()
    const modulesWithLockStatus = modules.map((module) => {
      // FILTER: Remove module items with unpublished assessments
      const publishedItems = module.items.filter((item) => {
        // If item is not an assessment, keep it
        if (item.itemType !== 'ASSESSMENT') return true

        // If assessment doesn't exist (null), exclude it (broken reference)
        if (!item.assessment) {
          console.warn(`Module item ${item.id} has no assessment linked (broken reference)`)
          return false
        }

        // If assessment is unpublished, exclude it
        if (item.assessment.isPublished === false) {
          console.log(`Filtering out unpublished assessment: ${item.assessment.title}`)
          return false
        }

        // Keep published assessments
        return true
      })

      const isTimeLocked = module.unlockAt && new Date(module.unlockAt) > now

      // Check prerequisites (simplified - you may want more complex logic)
      let isPrerequisiteLocked = false
      if (module.prerequisiteIds && module.prerequisiteIds.length > 0) {
        // Check if all prerequisite modules are completed
        const prerequisiteCompletions = modules.filter((m) =>
          module.prerequisiteIds!.includes(m.id)
        )
        isPrerequisiteLocked = prerequisiteCompletions.some(
          (prereq) => prereq.moduleCompletions.length === 0
        )
      }

      const isLocked = isTimeLocked || isPrerequisiteLocked
      const isCompleted = module.moduleCompletions.length > 0

      // Calculate progress based on FILTERED items (only published)
      const totalItems = publishedItems.length
      const completedItems = publishedItems.filter(
        (item) => item.moduleItemCompletions.length > 0
      ).length
      const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

      return {
        ...module,
        items: publishedItems, // Use filtered items
        isLocked,
        isCompleted,
        progress,
        completedItems,
        totalItems,
      }
    })

    return NextResponse.json({ modules: modulesWithLockStatus })
  } catch (error) {
    console.error('Error fetching modules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    )
  }
}
