import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await req.json()

    if (!['admin', 'professor', 'student'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, professor, or student' },
        { status: 400 }
      )
    }

    // Update user role
    const user = await db.user.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        role,
        email: 'test@example.com',  // Placeholder
      },
      update: {
        role,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Role switched to ${role}`,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error('Role switch error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
