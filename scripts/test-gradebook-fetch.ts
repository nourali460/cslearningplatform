import { db } from '../lib/db'

async function testGradebookFetch() {
  const classId = '04ae4472-0ab3-48eb-99f0-8783d70a4243' // 112233-CS101-SP25-02

  console.log('Testing gradebook fetch for class:', classId)

  // Get all assessments
  const assessments = await db.assessment.findMany({
    where: { classId },
    orderBy: [{ type: 'asc' }, { dueAt: 'asc' }],
  })

  console.log('Total assessments:', assessments.length)

  // Get all submissions (with new ordering)
  const submissions = await db.assessmentSubmission.findMany({
    where: {
      assessment: { classId },
    },
    orderBy: [
      { assessmentId: 'asc' },
      { studentId: 'asc' },
      { attemptNumber: 'desc' },
    ],
  })

  console.log('Total submissions:', submissions.length)

  // Find Quiz 5
  const quiz5 = assessments.find(a => a.title.includes('Quiz 5'))
  if (quiz5) {
    console.log('\nQuiz 5:', quiz5.title, quiz5.id)

    const quiz5Subs = submissions.filter(s => s.assessmentId === quiz5.id)
    console.log('Quiz 5 submissions:', quiz5Subs.length)
    quiz5Subs.forEach(s => {
      console.log(`  - Student ${s.studentId.substring(0, 8)}: Attempt ${s.attemptNumber}, Score ${s.totalScore}`)
    })

    // Test what find returns
    const jaslyn = await db.user.findFirst({
      where: { email: { contains: 'jaslyn', mode: 'insensitive' }, role: 'student' }
    })

    if (jaslyn) {
      const jaslynSubs = submissions.filter(s => s.studentId === jaslyn.id)
      const quiz5Sub = jaslynSubs.find(s => s.assessmentId === quiz5.id)

      console.log('\nJaslyn Quiz 5 submission (using find on ordered array):')
      console.log('  Score:', quiz5Sub?.totalScore)
      console.log('  Manual Score:', quiz5Sub?.manualScore)
      console.log('  Attempt:', quiz5Sub?.attemptNumber)
      console.log('  Status:', quiz5Sub?.status)
    }
  }

  await db.$disconnect()
}

testGradebookFetch().catch(console.error)
