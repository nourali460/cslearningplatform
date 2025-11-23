import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/admin/whoami
 * Returns the current admin user's info
 */
export async function GET() {
  try {
    const user = await requireAdmin()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    // Get additional admin-level data
    const stats = await db.$transaction([
      db.user.count(),
      db.course.count(),
      db.class.count(),
      db.enrollment.count(),
    ])

    const [totalUsers, totalCourses, totalClasses, totalEnrollments] = stats

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        createdAt: user.createdAt,
      },
      stats: {
        totalUsers,
        totalCourses,
        totalClasses,
        totalEnrollments,
      },
    })
  } catch (error) {
    console.error('Admin whoami error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
