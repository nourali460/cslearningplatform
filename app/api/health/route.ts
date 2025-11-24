import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/health
 * Health check endpoint that verifies database connectivity
 */
export async function GET() {
  try {
    // Test database connection with a simple query
    const startTime = Date.now()
    await db.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime

    // Get database stats
    const [userCount, courseCount, classCount] = await Promise.all([
      db.user.count(),
      db.course.count(),
      db.class.count(),
    ])

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        responseTime: `${responseTime}ms`,
        stats: {
          users: userCount,
          courses: courseCount,
          classes: classCount,
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseConfigured: !!process.env.DATABASE_URL,
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          databaseConfigured: !!process.env.DATABASE_URL,
        },
      },
      { status: 503 }
    )
  }
}
