import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const approveSchema = z.object({
  userId: z.string().uuid(),
  isApproved: z.boolean(),
})

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get admin user from database
    const adminUser = await db.user.findUnique({
      where: { clerkId },
    })

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await req.json()
    const { userId, isApproved } = approveSchema.parse(body)

    // 4. Get the professor to approve
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

    // 5. Update approval status
    const updatedProfessor = await db.user.update({
      where: { id: userId },
      data: { isApproved },
    })

    // 6. Return success
    return NextResponse.json(
      {
        message: isApproved
          ? 'Professor approved successfully'
          : 'Professor approval revoked',
        user: {
          id: updatedProfessor.id,
          email: updatedProfessor.email,
          fullName: updatedProfessor.fullName,
          username: updatedProfessor.username,
          isApproved: updatedProfessor.isApproved,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error approving professor:', error)
    return NextResponse.json(
      {
        error: 'An error occurred while updating professor approval status.',
      },
      { status: 500 }
    )
  }
}
