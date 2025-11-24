import { db } from '../lib/db'

async function verifyGrade() {
  // Find the Quiz 5: Divide and Conquer assessment (the one you just edited to 50)
  const assessment = await db.assessment.findFirst({
    where: {
      title: { contains: 'Quiz 5' }
    }
  })

  if (!assessment) {
    console.log('Assessment not found')
    return
  }

  console.log('Assessment:', assessment.title, assessment.id)

  // Find Jaslyn
  const jaslyn = await db.user.findFirst({
    where: { email: { contains: 'jaslyn', mode: 'insensitive' }, role: 'student' }
  })

  if (!jaslyn) {
    console.log('Student not found')
    return
  }

  // Get the submission
  const submission = await db.assessmentSubmission.findFirst({
    where: {
      assessmentId: assessment.id,
      studentId: jaslyn.id,
    }
  })

  console.log('\nSubmission details:')
  console.log('ID:', submission?.id)
  console.log('Manual Score:', submission?.manualScore)
  console.log('Total Score:', submission?.totalScore)
  console.log('Status:', submission?.status)
  console.log('Updated At:', submission?.updatedAt)

  // Get ALL submissions for this student in this class
  const enrollment = await db.enrollment.findFirst({
    where: { studentId: jaslyn.id }
  })

  if (enrollment) {
    const allSubmissions = await db.assessmentSubmission.findMany({
      where: {
        studentId: jaslyn.id,
        assessment: {
          classId: enrollment.classId
        }
      },
      include: {
        assessment: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    })

    console.log('\nRecent submissions (last 5):')
    allSubmissions.forEach(s => {
      console.log(`- ${s.assessment.title}: ${s.totalScore} (updated: ${s.updatedAt.toLocaleString()})`)
    })
  }

  await db.$disconnect()
}

verifyGrade().catch(console.error)
