import { db } from '../lib/db'

async function check() {
  const jaslyn = await db.user.findFirst({
    where: { email: { contains: 'jaslyn', mode: 'insensitive' }, role: 'student' }
  })

  const jasmyn = await db.user.findFirst({
    where: { email: { contains: 'jasmyn', mode: 'insensitive' }, role: 'professor' }
  })

  console.log('Jaslyn (student):', jaslyn?.email, jaslyn?.id)
  console.log('Jasmyn (professor):', jasmyn?.email, jasmyn?.id)

  if (jaslyn) {
    const enrollment = await db.enrollment.findFirst({
      where: { studentId: jaslyn.id },
      include: { class: { include: { professor: true } } }
    })

    console.log('Jaslyn enrolled in class:', enrollment?.class.classCode)
    console.log('Professor for that class:', enrollment?.class.professor.email)
    console.log('Professor ID:', enrollment?.class.professorId)
    console.log('Jasmyn ID:', jasmyn?.id)
    console.log('Match:', enrollment?.class.professorId === jasmyn?.id)
  }

  await db.$disconnect()
}

check()
