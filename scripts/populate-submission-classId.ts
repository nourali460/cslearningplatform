import { db } from '../lib/db'

async function populateClassId() {
  console.log('Populating classId for existing submissions...')

  // Get all submissions
  const submissions = await db.assessmentSubmission.findMany({
    include: {
      assessment: {
        select: {
          classId: true
        }
      }
    }
  })

  console.log(`Found ${submissions.length} submissions`)

  // Update each submission with its assessment's classId
  let updated = 0
  for (const sub of submissions) {
    await db.assessmentSubmission.update({
      where: { id: sub.id },
      data: { classId: sub.assessment.classId }
    })
    updated++
    if (updated % 10 === 0) {
      console.log(`Updated ${updated}/${submissions.length}...`)
    }
  }

  console.log(`\nCompleted! Updated ${updated} submissions`)

  // Verify
  const check = await db.$queryRaw<Array<{count: bigint}>>`
    SELECT COUNT(*) as count
    FROM assessment_submissions
    WHERE "classId" IS NULL
  `

  console.log(`Submissions with NULL classId: ${check[0].count}`)

  await db.$disconnect()
}

populateClassId().catch(console.error)
