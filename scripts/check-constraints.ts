import { db } from '../lib/db'

async function checkConstraints() {
  console.log('Checking database constraints...')

  const result = await db.$queryRaw<Array<{
    constraint_name: string,
    constraint_type: string
  }>>`
    SELECT constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_name = 'assessment_submissions'
    AND constraint_type = 'UNIQUE'
  `

  console.log('Unique constraints on assessment_submissions:')
  result.forEach(r => {
    console.log(`  - ${r.constraint_name} (${r.constraint_type})`)
  })

  await db.$disconnect()
}

checkConstraints().catch(console.error)
