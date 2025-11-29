import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStudent } from '@/lib/auth'

/**
 * POST /api/student/module-items/[itemId]/complete
 * Mark a module item as complete and update module completion
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ itemId: string }> }
) {
  try {
    const student = await getStudent()

    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { itemId } = params

    // Verify item exists and student has access
    const item = await db.moduleItem.findFirst({
      where: {
        id: itemId,
        isPublished: true,
      },
      include: {
        module: {
          include: {
            class: {
              include: {
                enrollments: {
                  where: {
                    studentId: student.id,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Module item not found' }, { status: 404 })
    }

    if (item.module.class.enrollments.length === 0) {
      return NextResponse.json(
        { error: 'Not enrolled in this class' },
        { status: 403 }
      )
    }

    // Check if already completed
    const existingCompletion = await db.moduleItemCompletion.findUnique({
      where: {
        moduleItemId_studentId: {
          moduleItemId: itemId,
          studentId: student.id,
        },
      },
    })

    if (existingCompletion) {
      return NextResponse.json({
        success: true,
        message: 'Item already marked as complete',
        completion: existingCompletion,
      })
    }

    // Create completion record
    const completion = await db.moduleItemCompletion.create({
      data: {
        studentId: student.id,
        moduleItemId: itemId,
        classId: item.module.class.id,
      },
    })

    // Check if all required items in the module are now complete
    const allItems = await db.moduleItem.findMany({
      where: {
        moduleId: item.moduleId,
        isPublished: true,
        isRequired: true,
      },
      include: {
        moduleItemCompletions: {
          where: {
            studentId: student.id,
          },
        },
      },
    })

    const allRequiredItemsComplete = allItems.every(
      (moduleItem) => moduleItem.moduleItemCompletions.length > 0
    )

    // If all required items are complete, mark module as complete
    if (allRequiredItemsComplete) {
      const moduleCompletion = await db.moduleCompletion.findUnique({
        where: {
          moduleId_studentId: {
            moduleId: item.moduleId,
            studentId: student.id,
          },
        },
      })

      if (!moduleCompletion) {
        await db.moduleCompletion.create({
          data: {
            studentId: student.id,
            moduleId: item.moduleId,
            classId: item.module.class.id,
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Item marked as complete. Module completed!',
        completion,
        moduleCompleted: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Item marked as complete',
      completion,
      moduleCompleted: false,
    })
  } catch (error) {
    console.error('Error marking item as complete:', error)
    return NextResponse.json(
      { error: 'Failed to mark item as complete' },
      { status: 500 }
    )
  }
}
