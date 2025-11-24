import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { classId } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    // Verify the class belongs to this professor
    const classItem = await db.class.findFirst({
      where: {
        id: classId,
        professorId: professor.id,
      },
    })

    if (!classItem) {
      return NextResponse.json(
        { error: 'Class not found or you do not have permission to modify it' },
        { status: 404 }
      )
    }

    // Toggle the isActive status
    const updatedClass = await db.class.update({
      where: { id: classId },
      data: {
        isActive: !classItem.isActive,
      },
    })

    return NextResponse.json({
      success: true,
      class: updatedClass,
      message: `Class marked as ${updatedClass.isActive ? 'active' : 'past'}`,
    })
  } catch (error) {
    console.error('Error toggling class status:', error)
    return NextResponse.json({ error: 'Failed to update class status' }, { status: 500 })
  }
}
