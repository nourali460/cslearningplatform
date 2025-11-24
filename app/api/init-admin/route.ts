import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const PRIMARY_ADMIN = {
  email: 'subscriptionsnova@gmail.com',
  fullName: 'Nour Ali',
  role: 'admin',
  password: 'Hassan56$', // Fixed admin password
}

/**
 * GET /api/init-admin
 * Initializes the primary admin user if it doesn't exist
 * Uses fixed password: Hassan56$
 */
export async function GET() {
  try {
    // Check if admin already exists
    const existing = await db.user.findUnique({
      where: { email: PRIMARY_ADMIN.email }
    })

    if (existing) {
      return NextResponse.json({
        message: 'Admin user already exists',
        user: {
          id: existing.id,
          email: existing.email,
          fullName: existing.fullName,
          role: existing.role,
        }
      })
    }

    // Create the admin user with fixed password
    const admin = await db.user.create({
      data: {
        ...PRIMARY_ADMIN,
        isApproved: true,
      }
    })

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
      note: 'Admin password is: Hassan56$'
    }, { status: 201 })
  } catch (error) {
    console.error('Init admin error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize admin user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
