import { db } from '../lib/db'

async function testGradebookAPI() {
  console.log('Testing gradebook data...\n')

  const professor = await db.user.findFirst({
    where: { role: 'professor' }
  })

  if (!professor) {
    console.log('❌ No professor found')
    return
  }

  console.log('✅ Professor:', professor.fullName, professor.email)

  const classItem = await db.class.findFirst({
    where: { professorId: professor.id }
  })

  if (!classItem) {
    console.log('❌ No class found for professor')
    return
  }

  console.log('✅ Class:', classItem.title, classItem.classCode)

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
          usernameSchoolId: true,
        },
      },
    },
  })

  console.log('✅ Enrollments:', enrollments.length)

  const assessments = await db.assessment.findMany({
    where: {
      classId: classItem.id,
    },
    orderBy: [
      { type: 'asc' },
      { dueAt: 'asc' },
    ],
  })

  console.log('✅ Assessments:', assessments.length)

  const submissions = await db.assessmentSubmission.findMany({
    where: {
      classId: classItem.id,
    },
  })

  console.log('✅ Submissions:', submissions.length)
  console.log('\n📊 Expected response structure:')
  console.log('- Students:', enrollments.length)
  console.log('- Assessments:', assessments.length)

  await db.$disconnect()
}

testGradebookAPI().catch(console.error)
