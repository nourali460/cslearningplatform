import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAdminPassword() {
  try {
    const adminEmail = 'subscriptionsnova@gmail.com'
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (!admin) {
      console.log('❌ Admin user not found')
      return
    }

    console.log('📋 Current admin user:')
    console.log(`  Email: ${admin.email}`)
    console.log(`  Password: ${admin.password ? '***SET***' : 'MISSING'}`)
    console.log(`  Role: ${admin.role}`)
    console.log(`  Full Name: ${admin.fullName}`)

    if (!admin.password || admin.password.trim() === '') {
      console.log('\n🔧 Updating admin password...')
      const updated = await prisma.user.update({
        where: { email: adminEmail },
        data: { password: 'admin123' },
      })
      console.log('✅ Admin password updated successfully!')
      console.log(`  New password: admin123`)
    } else {
      console.log('\n✅ Admin password is already set')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminPassword()
