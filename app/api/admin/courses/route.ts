import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * GET /api/admin/courses
 * List all courses
 */
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const courses = await db.course.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: {
            classes: true,
            assessmentTemplates: true,
          },
        },
      },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/courses
 * Create a new course
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { code, title, description, subject, level } = body

    // Validation
    if (!code || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: code, title' },
        { status: 400 }
      )
    }

    // Check if course code already exists
    const existingCourse = await db.course.findUnique({
      where: { code },
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      )
    }

    const course = await db.course.create({
      data: {
        code,
        title,
        description: description || null,
        subject: subject || null,
        level: level || null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Course created successfully',
        course,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
