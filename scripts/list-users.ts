/**
 * List all users in the database
 */
import { db } from '../lib/db'

async function listUsers() {
  try {
    console.log('\n📋 Current Users in Database\n')
    console.log('='.repeat(80))

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' }
    })

    if (users.length === 0) {
      console.log('\n⚠️  No users found in database!\n')
      return
    }

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.role.toUpperCase()} - ${user.fullName || 'No name'}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Clerk ID: ${user.clerkId}`)
      console.log(`   Username: ${user.username || 'Not set'}`)
      console.log(`   Approved: ${user.isApproved ? 'Yes' : 'No'}`)
      console.log(`   Created: ${user.createdAt.toLocaleString()}`)
    })

    console.log('\n' + '='.repeat(80))
    console.log(`\nTotal Users: ${users.length}`)
    console.log(`Admins: ${users.filter(u => u.role === 'admin').length}`)
    console.log(`Professors: ${users.filter(u => u.role === 'professor').length}`)
    console.log(`Students: ${users.filter(u => u.role === 'student').length}`)
    console.log('')

    // Show admin credentials
    const admin = users.find(u => u.role === 'admin')
    if (admin) {
      console.log('\n🔑 ADMIN LOGIN CREDENTIALS:')
      console.log('='.repeat(80))
      console.log(`Email: ${admin.email}`)
      console.log(`Password: You set this when you created the Clerk account`)
      console.log(`Note: Login at /auth/sign-in`)
      console.log('')
    }

  } catch (error) {
    console.error('Error listing users:', error)
  } finally {
    await db.$disconnect()
  }
}

listUsers()
