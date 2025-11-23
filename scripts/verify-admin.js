// Simple verification script to check if admin user exists
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const PRIMARY_ADMIN_CLERK_ID = 'user_35rVge67RtsAqrA0Vl4JC6F9dOW'

async function main() {
  console.log('🔍 Checking for primary admin user...')

  try {
    const admin = await prisma.user.findUnique({
      where: { clerkId: PRIMARY_ADMIN_CLERK_ID }
    })

    if (admin) {
      console.log('✅ Admin user exists in database!')
      console.log('   ID:', admin.id)
      console.log('   Clerk ID:', admin.clerkId)
      console.log('   Email:', admin.email)
      console.log('   Full Name:', admin.fullName)
      console.log('   Role:', admin.role)
      console.log('   Created:', admin.createdAt)
      return admin
    } else {
      console.log('❌ Admin user NOT found in database')
      return null
    }
  } catch (error) {
    console.error('❌ Error querying database:', error.message)
    throw error
  }
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
