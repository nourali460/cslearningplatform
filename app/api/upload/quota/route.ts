import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { getUserQuota } from '@/lib/upload-helper'

/**
 * GET /api/upload/quota
 *
 * Get user's storage quota information
 *
 * Response: {
 *   used: number (MB),
 *   limit: number (MB),
 *   remaining: number (MB),
 *   percentage: number (0-100)
 * }
 */
export async function GET() {
  try {
    // Authenticate user
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get quota information
    const quota = await getUserQuota(user.id)

    return NextResponse.json({
      used: parseFloat(quota.usedMB.toFixed(2)),
      limit: quota.limitMB,
      remaining: parseFloat(quota.remainingMB.toFixed(2)),
      percentage: parseFloat(((quota.usedMB / quota.limitMB) * 100).toFixed(2)),
    })
  } catch (error) {
    console.error('Error fetching quota:', error)
    return NextResponse.json(
      { error: 'Failed to fetch storage quota' },
      { status: 500 }
    )
  }
}
