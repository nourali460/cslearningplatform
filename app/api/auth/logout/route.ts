import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/session'

/**
 * POST /api/auth/logout
 * Clear the session cookie and log out the user
 */
export async function POST(request: NextRequest) {
  try {
    await clearSession()

    return NextResponse.json({
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
