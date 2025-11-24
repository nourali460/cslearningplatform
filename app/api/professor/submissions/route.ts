import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getProfessor } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const professor = await getProfessor()

    if (!professor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10

    const submissions = await db.assessmentSubmission.findMany({
      where: {
        assessment: {
          class: {
            professorId: professor.id,
          },
        },
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assessment: {
          select: {
            id: true,
            title: true,
            maxPoints: true,
            class: {
              select: {
                id: true,
                classCode: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching professor submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}
