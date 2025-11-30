/**
 * Cleanup Script: Delete Orphaned Assessments
 *
 * This script finds and deletes all Assessment records that are not linked
 * to any ModuleItem. These orphaned assessments are not visible to students
 * and violate our architectural constraint that "all assessments must be in modules."
 *
 * Run with: npx tsx scripts/cleanup-orphaned-assessments.ts
 */

import { db } from '@/lib/db'

async function cleanupOrphanedAssessments() {
  try {
    console.log('🔍 Searching for orphaned assessments...\n')

    // Find all assessments that don't have any module items
    const orphanedAssessments = await db.assessment.findMany({
      where: {
        moduleItems: {
          none: {},
        },
      },
      include: {
        class: {
          select: {
            title: true,
            classCode: true,
          },
        },
      },
    })

    if (orphanedAssessments.length === 0) {
      console.log('✅ No orphaned assessments found. Database is clean!')
      return
    }

    console.log(`⚠️  Found ${orphanedAssessments.length} orphaned assessment(s):\n`)

    // Display orphaned assessments
    orphanedAssessments.forEach((assessment, index) => {
      console.log(`${index + 1}. "${assessment.title}"`)
      console.log(`   Type: ${assessment.type}`)
      console.log(`   Class: ${assessment.class.title} (${assessment.class.classCode})`)
      console.log(`   ID: ${assessment.id}`)
      console.log(`   Created: ${assessment.createdAt.toLocaleDateString()}`)
      console.log('')
    })

    console.log('🗑️  Deleting orphaned assessments...\n')

    // Delete all orphaned assessments in a transaction
    const result = await db.$transaction(async (tx) => {
      // Note: Related records (Submission, Grade, etc.) will be cascade deleted
      // based on the schema's onDelete rules
      const deleted = await tx.assessment.deleteMany({
        where: {
          id: {
            in: orphanedAssessments.map((a) => a.id),
          },
        },
      })

      return deleted
    })

    console.log(`✅ Successfully deleted ${result.count} orphaned assessment(s)`)
    console.log('')
    console.log('📊 Summary:')
    console.log(`   - Assessments deleted: ${result.count}`)
    console.log(`   - Related submissions, grades, and discussions also deleted (cascade)`)
    console.log('')
    console.log('✨ Cleanup complete! All assessments must now be in modules.')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Run the cleanup
cleanupOrphanedAssessments()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to complete cleanup:', error)
    process.exit(1)
  })
