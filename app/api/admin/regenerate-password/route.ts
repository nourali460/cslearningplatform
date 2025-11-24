import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

// Generate a random 6-character password
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        email: true,
        fullName: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only allow regenerating passwords for students and professors
    if (user.role !== 'student' && user.role !== 'professor') {
      return NextResponse.json(
        { error: 'Can only regenerate passwords for students and professors' },
        { status: 400 }
      )
    }

    // Generate new password
    const newPassword = generatePassword()

    // Update the user's password (plain-text as per system design)
    await db.user.update({
      where: { id: userId },
      data: { password: newPassword },
    })

    return NextResponse.json({
      success: true,
      newPassword,
      userId: user.id,
      userName: user.fullName || user.email,
    })
  } catch (error) {
    console.error('Error regenerating password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
