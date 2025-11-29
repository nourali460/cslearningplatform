import { NextResponse } from 'next/server'
import { requireAdmin, handleAuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const approveSchema = z.object({
  userId: z.string().uuid(),
  isApproved: z.boolean(),
})

export async function POST(req: Request) {
  try {
    // 1. Require admin authentication
    await requireAdmin()

    // 2. Parse and validate request body
    const body = await req.json()
    const { userId, isApproved } = approveSchema.parse(body)

    // 3. Get the professor to approve
    const professor = await db.user.findUnique({
      where: { id: userId },
    })

    if (!professor) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (professor.role !== 'professor') {
      return NextResponse.json(
        { error: 'User is not a professor' },
        { status: 400 }
      )
    }

    // 4. Update approval status
    const updatedProfessor = await db.user.update({
      where: { id: userId },
      data: { isApproved },
    })

    // 5. Return success
    return NextResponse.json(
      {
        message: isApproved
          ? 'Professor approved successfully'
          : 'Professor approval revoked',
        user: {
          id: updatedProfessor.id,
          email: updatedProfessor.email,
          fullName: updatedProfessor.fullName,
          usernameSchoolId: updatedProfessor.usernameSchoolId,
          isApproved: updatedProfessor.isApproved,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error approving professor:', error)
    return handleAuthError(error)
  }
}
