import { db } from '../lib/db'

async function addUniqueConstraint() {
  console.log('Adding unique constraint on (assessmentId, studentId)...')

  try {
    // First, check if any duplicates exist
    const duplicates = await db.$queryRaw<Array<{
      assessmentId: string,
      studentId: string,
      count: bigint
    }>>`
      SELECT "assessmentId", "studentId", COUNT(*) as count
      FROM assessment_submissions
      GROUP BY "assessmentId", "studentId"
      HAVING COUNT(*) > 1
    `

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate combinations:`)
      duplicates.forEach(d => {
        console.log(`  - assessmentId: ${d.assessmentId}, studentId: ${d.studentId}, count: ${d.count}`)
      })
      console.log('\nCleaning up duplicates (keeping the latest)...')

      // For each duplicate, keep only the most recent submission
      for (const dup of duplicates) {
        await db.$executeRaw`
          DELETE FROM assessment_submissions
          WHERE ("assessmentId", "studentId") = (${dup.assessmentId}, ${dup.studentId})
          AND id NOT IN (
            SELECT id
            FROM assessment_submissions
            WHERE "assessmentId" = ${dup.assessmentId} AND "studentId" = ${dup.studentId}
            ORDER BY "updatedAt" DESC
            LIMIT 1
          )
        `
      }
      console.log('Duplicates cleaned up.')
    } else {
      console.log('No duplicates found.')
    }

    // Now add the unique constraint
    await db.$executeRaw`
      ALTER TABLE assessment_submissions
      ADD CONSTRAINT assessment_submissions_assessmentId_studentId_key
      UNIQUE ("assessmentId", "studentId")
    `

    console.log('✅ Unique constraint added successfully!')
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ Constraint already exists!')
    } else {
      console.error('Error:', error)
      throw error
    }
  }

  await db.$disconnect()
}

addUniqueConstraint().catch(console.error)
