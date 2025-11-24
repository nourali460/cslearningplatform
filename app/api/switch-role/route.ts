import { NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/session'

/**
 * POST /api/switch-role
 * Switch user role (for testing purposes only)
 */
export async function POST(req: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await req.json()

    if (!['admin', 'professor', 'student'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, professor, or student' },
        { status: 400 }
      )
    }

    // Update session with new role
    await updateSession({ role: role as 'admin' | 'professor' | 'student' })

    return NextResponse.json({
      success: true,
      message: `Role switched to ${role}`,
      user: {
        userId: session.userId,
        role: role,
        email: session.email,
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
