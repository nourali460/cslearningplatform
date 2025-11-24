import { db } from '../lib/db'

async function cleanupDuplicates() {
  console.log('Checking for duplicate submissions...')

  // Get all submissions
  const allSubmissions = await db.assessmentSubmission.findMany({
    orderBy: [
      { assessmentId: 'asc' },
      { studentId: 'asc' },
      { attemptNumber: 'desc' },
      { updatedAt: 'desc' },
    ]
  })

  console.log('Total submissions:', allSubmissions.length)

  // Group by assessmentId + studentId
  const grouped: Record<string, typeof allSubmissions> = {}
  allSubmissions.forEach(sub => {
    const key = `${sub.assessmentId}-${sub.studentId}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(sub)
  })

  // Find duplicates
  const duplicates = Object.entries(grouped).filter(([_, subs]) => subs.length > 1)

  console.log('\nDuplicate entries found:', duplicates.length)

  if (duplicates.length > 0) {
    console.log('\nDuplicates:')
    for (const [key, subs] of duplicates) {
      console.log(`\n${key}:`)
      subs.forEach((s, idx) => {
        console.log(`  ${idx === 0 ? 'KEEP' : 'DELETE'}: Attempt ${s.attemptNumber}, Score ${s.totalScore}, Updated ${s.updatedAt.toLocaleString()}`)
      })

      // Delete all except the first (latest) one
      if (subs.length > 1) {
        const toDelete = subs.slice(1)
        for (const sub of toDelete) {
          console.log(`  Deleting submission ${sub.id}...`)
          await db.assessmentSubmission.delete({
            where: { id: sub.id }
          })
        }
      }
    }

    console.log('\nCleanup complete!')
  } else {
    console.log('No duplicates found.')
  }

  // Verify
  const remaining = await db.assessmentSubmission.findMany()
  console.log('\nTotal submissions after cleanup:', remaining.length)

  await db.$disconnect()
}

cleanupDuplicates().catch(console.error)
