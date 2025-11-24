import { db } from '../lib/db'

async function testJasmynGradebook() {
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

  console.log('Professor Jasmyn:', jasmyn.email)

  const classItem = await db.class.findFirst({
    where: {
      professorId: jasmyn.id
    },
    include: {
      course: true
    }
  })

  if (!classItem) {
    console.log('No class found')
    return
  }

  console.log('Class:', classItem.title, classItem.classCode)
  console.log('Class ID:', classItem.id)

  const enrollments = await db.enrollment.findMany({
    where: {
      classId: classItem.id,
      status: 'active',
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  })

  console.log('\nEnrollments:', enrollments.length)

  const assessments = await db.assessment.findMany({
    where: {
      classId: classItem.id,
    },
    orderBy: [
      { type: 'asc' },
      { dueAt: 'asc' },
    ],
  })

  console.log('Assessments:', assessments.length)

  const submissions = await db.assessmentSubmission.findMany({
    where: {
      classId: classItem.id,
    },
  })

  console.log('Submissions:', submissions.length)

  console.log('\nGradebook would show:')
  console.log('- Students (rows):', enrollments.length)
  console.log('- Assessments (columns):', assessments.length)
  console.log('- Total cells:', enrollments.length * assessments.length)
  console.log('- Filled cells:', submissions.length)

  await db.$disconnect()
}

testJasmynGradebook().catch(console.error)
