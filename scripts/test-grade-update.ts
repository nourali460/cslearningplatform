import { db } from '../lib/db'

async function testGradeUpdate() {
  // Get Jaslyn's info
  const jaslyn = await db.user.findFirst({
    where: { email: { contains: 'jaslyn', mode: 'insensitive' }, role: 'student' }
  })

  if (!jaslyn) {
    console.log('Student not found')
    return
  }

  console.log('Student:', jaslyn.fullName, jaslyn.id)

  // Get Jasmyn's class
  const enrollment = await db.enrollment.findFirst({
    where: { studentId: jaslyn.id },
    include: { class: { include: { course: true } } }
  })

  if (!enrollment) {
    console.log('No enrollment found')
    return
  }

  const classId = enrollment.classId
  console.log('Class:', enrollment.class.classCode, enrollment.class.course.title)

  // Get an assessment
  const assessment = await db.assessment.findFirst({
    where: { classId },
  })

  if (!assessment) {
    console.log('No assessments found')
    return
  }

  console.log('Assessment:', assessment.title, assessment.id)
  console.log('Max points:', assessment.maxPoints)

  // Check if submission exists
  let submission = await db.assessmentSubmission.findFirst({
    where: {
      assessmentId: assessment.id,
      studentId: jaslyn.id,
    },
  })

  console.log('\nBefore update:')
  console.log('Submission exists?', !!submission)
  if (submission) {
    console.log('Current score:', submission.totalScore)
    console.log('Status:', submission.status)
  }

  // Update or create submission
  const newScore = 95.5

  if (submission) {
    console.log('\nUpdating existing submission...')
    submission = await db.assessmentSubmission.update({
      where: { id: submission.id },
      data: {
        manualScore: newScore,
        totalScore: newScore,
        status: 'GRADED',
      },
    })
  } else {
    console.log('\nCreating new submission...')
    submission = await db.assessmentSubmission.create({
      data: {
        assessmentId: assessment.id,
        studentId: jaslyn.id,
        submittedAt: new Date(),
        textSubmission: null,
        fileSubmissions: null,
        manualScore: newScore,
        totalScore: newScore,
        status: 'GRADED',
        isLate: false,
        attemptNumber: 1,
      },
    })
  }

  console.log('\nAfter update:')
  console.log('Submission ID:', submission.id)
  console.log('New score:', submission.totalScore)
  console.log('Status:', submission.status)

  // Verify the update
  const verifySubmission = await db.assessmentSubmission.findUnique({
    where: { id: submission.id },
  })

  console.log('\nVerification:')
  console.log('Score persisted?', verifySubmission?.totalScore === newScore)
  console.log('Final score:', verifySubmission?.totalScore)

  await db.$disconnect()
}

testGradeUpdate().catch(console.error)
