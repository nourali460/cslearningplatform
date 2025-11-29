import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/validate-class-code
 * Validates a class code for student enrollment
 */
export async function POST(req: Request) {
  try {
    const { classCode } = await req.json()

    if (!classCode || typeof classCode !== 'string') {
      return NextResponse.json(
        { error: 'Class code is required' },
        { status: 400 }
      )
    }

    // Find the class with this code
    const classRecord = await db.class.findUnique({
      where: { classCode: classCode.trim().toUpperCase() },
      include: {
        course: true,
        professor: true,
      },
    })

    if (!classRecord) {
      return NextResponse.json(
        { error: 'Invalid class code. Please check with your professor.' },
        { status: 404 }
      )
    }

    // Return class information (without sensitive data)
    return NextResponse.json({
      valid: true,
      classId: classRecord.id,
      className: `${classRecord.course.code} - ${classRecord.course.title}`,
      term: classRecord.term,
      year: classRecord.year,
      professor: classRecord.professor.fullName || classRecord.professor.email,
    })
  } catch (error) {
    console.error('Error validating class code:', error)
    return NextResponse.json(
      { error: 'Failed to validate class code' },
      { status: 500 }
    )
  }
}
