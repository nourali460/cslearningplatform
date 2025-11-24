import { db } from '../lib/db'

async function testUniqueConstraint() {
  const jaslyn = await db.user.findFirst({
    where: { email: { contains: 'jaslyn', mode: 'insensitive' }, role: 'student' }
  })

  const quiz5 = await db.assessment.findFirst({
    where: { title: { contains: 'Quiz 5' } }
  })

  if (!jaslyn || !quiz5) {
    console.log('Student or assessment not found')
    return
  }

  console.log('Testing unique constraint...')
  console.log('Student:', jaslyn.email)
  console.log('Assessment:', quiz5.title)

  // Test 1: Find using unique constraint
  const submission = await db.assessmentSubmission.findUnique({
    where: {
      assessmentId_studentId: {
        assessmentId: quiz5.id,
        studentId: jaslyn.id,
      },
    },
  })

  console.log('\nfindUnique result:')
  console.log('  Found:', !!submission)
  console.log('  Score:', submission?.totalScore)
  console.log('  Manual Score:', submission?.manualScore)
  console.log('  Status:', submission?.status)

  // Test 2: Update using unique constraint
  if (submission) {
    console.log('\nUpdating grade to 75...')
    const updated = await db.assessmentSubmission.update({
      where: {
        assessmentId_studentId: {
          assessmentId: quiz5.id,
          studentId: jaslyn.id,
        },
      },
      data: {
        manualScore: 75,
        totalScore: 75,
        status: 'GRADED',
      },
    })

    console.log('Updated successfully!')
    console.log('  New score:', updated.totalScore)

    // Verify
    const verified = await db.assessmentSubmission.findUnique({
      where: {
        assessmentId_studentId: {
          assessmentId: quiz5.id,
          studentId: jaslyn.id,
        },
      },
    })

    console.log('\nVerification:')
    console.log('  Actual score:', verified?.totalScore, 'Type:', typeof verified?.totalScore)
    console.log('  Score persisted:', Number(verified?.totalScore) === 75)
  }

  await db.$disconnect()
}

testUniqueConstraint().catch(console.error)
