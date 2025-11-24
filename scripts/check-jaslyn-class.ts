import { db } from '../lib/db'

async function checkJaslynClass() {
  const jaslyn = await db.user.findFirst({
    where: {
      email: { contains: 'jaslyn' }
    }
  })

  if (jaslyn) {
    console.log('Found Jaslyn:', jaslyn.fullName, jaslyn.email, 'Role:', jaslyn.role)

    const enrollment = await db.enrollment.findFirst({
      where: { studentId: jaslyn.id },
      include: {
        class: {
          include: {
            course: true,
            professor: true
          }
        }
      }
    })

    if (enrollment) {
      console.log('Enrolled in:', enrollment.class.title)
      console.log('Professor:', enrollment.class.professor.fullName)
      console.log('Class ID:', enrollment.class.id)

      const assessments = await db.assessment.findMany({
        where: { classId: enrollment.class.id }
      })

      console.log('\nAssessments in this class:', assessments.length)
      assessments.forEach(a => {
        console.log('  -', a.title, a.type, a.maxPoints, 'pts')
      })

      const submissions = await db.assessmentSubmission.findMany({
        where: {
          classId: enrollment.class.id,
          studentId: jaslyn.id
        }
      })

      console.log('\nJaslyn submissions:', submissions.length)
    } else {
      console.log('Jaslyn not enrolled in any class')
    }
  } else {
    console.log('Jaslyn not found')
  }

  await db.$disconnect()
}

checkJaslynClass().catch(console.error)
