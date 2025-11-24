import { db } from '../lib/db'

async function checkAssessments() {
  const classId = '04ae4472-0ab3-48eb-99f0-8783d70a4243' // 112233-CS101-SP25-02

  const classInfo = await db.class.findUnique({
    where: { id: classId },
    include: { course: true, professor: true }
  })

  console.log('Class:', classInfo?.classCode, classInfo?.course.title)
  console.log('Professor:', classInfo?.professor.email)

  const assessments = await db.assessment.findMany({
    where: { classId },
    orderBy: { title: 'asc' }
  })

  console.log('\nAssessments in this class:', assessments.length)
  assessments.forEach(a => {
    console.log(`- ${a.title} (${a.type}) - Max: ${a.maxPoints} pts`)
  })

  const enrollments = await db.enrollment.findMany({
    where: { classId },
    include: { student: true }
  })

  console.log('\nStudents enrolled:', enrollments.length)
  enrollments.forEach(e => {
    console.log(`- ${e.student.fullName || e.student.email}`)
  })

  const submissions = await db.assessmentSubmission.findMany({
    where: {
      assessment: { classId }
    },
    include: {
      student: true,
      assessment: true
    }
  })

  console.log('\nSubmissions:', submissions.length)
  submissions.forEach(s => {
    console.log(`- ${s.student.fullName || s.student.email} -> ${s.assessment.title} (${s.status}, score: ${s.totalScore})`)
  })

  await db.$disconnect()
}

checkAssessments().catch(console.error)
