import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const PRIMARY_ADMIN = {
  clerkId: 'user_35rVge67RtsAqrA0Vl4JC6F9dOW',
  email: 'subscriptionnova@gmail.com',
  fullName: 'Nour Ali',
  role: 'admin',
}

/**
 * GET /api/init-admin
 * Initializes the primary admin user if it doesn't exist
 */
export async function GET() {
  try {
    // Check if admin already exists
    const existing = await db.user.findUnique({
      where: { clerkId: PRIMARY_ADMIN.clerkId }
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

    // Create the admin user
    const admin = await db.user.create({
      data: PRIMARY_ADMIN
    })

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      }
    })
  } catch (error) {
    console.error('Init admin error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize admin user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
