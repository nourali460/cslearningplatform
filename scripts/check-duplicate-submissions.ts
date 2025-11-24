import { db } from '../lib/db'

async function checkDuplicates() {
  const jaslyn = await db.user.findFirst({
    where: { email: { contains: 'jaslyn', mode: 'insensitive' }, role: 'student' }
  })

  if (!jaslyn) {
    console.log('Student not found')
    return
  }

  // Find assessments where student has multiple submissions
  const allSubmissions = await db.assessmentSubmission.findMany({
    where: {
      studentId: jaslyn.id
    },
    include: {
      assessment: {
        select: {
          title: true
        }
      }
    },
    orderBy: [
      { assessmentId: 'asc' },
      { attemptNumber: 'asc' }
    ]
  })

  console.log('Total submissions:', allSubmissions.length)

  // Group by assessment
  const byAssessment: Record<string, typeof allSubmissions> = {}
  allSubmissions.forEach(sub => {
    if (!byAssessment[sub.assessmentId]) {
      byAssessment[sub.assessmentId] = []
    }
    byAssessment[sub.assessmentId].push(sub)
  })

  console.log('\nAssessments with multiple submissions:')
  Object.entries(byAssessment).forEach(([assessmentId, subs]) => {
    if (subs.length > 1) {
      console.log(`\n${subs[0].assessment.title}:`)
      subs.forEach(s => {
        console.log(`  - Attempt ${s.attemptNumber}: score=${s.totalScore}, status=${s.status}, updated=${s.updatedAt.toLocaleString()}`)
      })
    }
  })

  // Check Quiz 5 specifically
  const quiz5 = await db.assessment.findFirst({
    where: { title: { contains: 'Quiz 5' } }
  })

  if (quiz5) {
    const quiz5Subs = await db.assessmentSubmission.findMany({
      where: {
        assessmentId: quiz5.id,
        studentId: jaslyn.id
      },
      orderBy: { attemptNumber: 'asc' }
    })

    console.log(`\n\nQuiz 5 submissions (${quiz5Subs.length}):`)
    quiz5Subs.forEach(s => {
      console.log(`  Attempt ${s.attemptNumber}: ID=${s.id}, score=${s.totalScore}, manualScore=${s.manualScore}, status=${s.status}`)
    })

    // Check what findFirst returns
    const firstFound = await db.assessmentSubmission.findFirst({
      where: {
        assessmentId: quiz5.id,
        studentId: jaslyn.id
      }
    })

    console.log('\nfindFirst returns:')
    console.log(`  ID: ${firstFound?.id}`)
    console.log(`  Attempt: ${firstFound?.attemptNumber}`)
    console.log(`  Score: ${firstFound?.totalScore}`)
  }

  await db.$disconnect()
}

checkDuplicates().catch(console.error)
