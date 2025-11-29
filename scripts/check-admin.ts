import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'subscriptionsnova@gmail.com' },
    })

    if (!admin) {
      console.log('❌ Admin user not found')
      return
    }

    console.log('📋 Admin User Details:')
    console.log('  Email:', admin.email)
    console.log('  Full Name:', admin.fullName)
    console.log('  Role:', admin.role)
    console.log('  Password:', admin.password ? `${admin.password.substring(0, 4)}***` : 'MISSING')
    console.log('  Is Approved:', admin.isApproved)
    console.log('  Username/School ID:', admin.usernameSchoolId || 'Not set')
    console.log('\n✅ Admin credentials:')
    console.log('  Email: subscriptionsnova@gmail.com')
    console.log('  Password: admin123')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
