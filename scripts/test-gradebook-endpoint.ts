import { db } from '../lib/db'

async function testGradebookEndpoint() {
  const jasmyn = await db.user.findFirst({
    where: {
      fullName: 'Jasmyn',
      role: 'professor'
    }
  })

  if (!jasmyn) {
    console.log('Jasmyn not found')
    return
  }

  const classWithAssessments = await db.class.findFirst({
    where: {
      professorId: jasmyn.id
    },
    include: {
      _count: {
        select: {
          assessments: true
        }
      }
    },
    orderBy: {
      assessments: {
        _count: 'desc'
      }
    }
  })

  if (!classWithAssessments) {
    console.log('No class found')
    return
  }

  console.log('Class with most assessments:', classWithAssessments.title)
  console.log('Assessment count:', classWithAssessments._count.assessments)
  console.log('Class ID:', classWithAssessments.id)

  // Test fetching with classId
  const testClassId = classWithAssessments.id

  const enrollments = await db.enrollment.findMany({
    where: {
      classId: testClassId,
      status: 'active',
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
          usernameSchoolId: true,
        },
      },
    },
    orderBy: {
      student: {
        fullName: 'asc',
      },
    },
  })

  console.log('Enrollments:', enrollments.length)

  const assessments = await db.assessment.findMany({
    where: {
      classId: testClassId,
    },
    orderBy: [
      { type: 'asc' },
      { dueAt: 'asc' },
    ],
  })

  console.log('Assessments:', assessments.length)

  const submissions = await db.assessmentSubmission.findMany({
    where: {
      classId: testClassId,
    },
  })

  console.log('Submissions:', submissions.length)

  console.log('\nAPI would return:')
  console.log('Students:', enrollments.length)
  console.log('Assessments:', assessments.length)

  await db.$disconnect()
}

testGradebookEndpoint().catch(console.error)
