import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * GET /api/courses
 * Get all active courses from the catalog
 * Accessible to professors and admins
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Only professors and admins can view course catalog
    if (session.role !== 'professor' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Professors and admins only' },
        { status: 403 }
      )
    }

    // Fetch all active courses
    const courses = await db.course.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        subject: true,
        level: true,
      },
      orderBy: {
        code: 'asc',
      },
    })

    return NextResponse.json({
      courses,
      total: courses.length,
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
