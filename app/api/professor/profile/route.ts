import { NextResponse } from 'next/server'
import { requireProfessor, handleAuthError } from '@/lib/auth'

/**
 * GET /api/professor/profile
 * Get the current professor's profile information
 */
export async function GET() {
  try {
    // Check authentication using standardized helper
    const professor = await requireProfessor()

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
    return handleAuthError(error)
  }
}
