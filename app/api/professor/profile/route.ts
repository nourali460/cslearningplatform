import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

/**
 * GET /api/professor/profile
 * Get the current professor's profile information
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getSession()
    if (!session || session.role !== 'professor') {
      return NextResponse.json(
        { error: 'Unauthorized - Professor access required' },
        { status: 401 }
      )
    }

    // Get professor details
    const professor = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        usernameSchoolId: true,
        isApproved: true,
      },
    })

    if (!professor) {
      return NextResponse.json(
        { error: 'Professor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      professor: {
        id: professor.id,
        fullName: professor.fullName,
        email: professor.email,
        schoolId: professor.usernameSchoolId,
        isApproved: professor.isApproved,
      },
    })
  } catch (error) {
    console.error('Error fetching professor profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
