// Simple JavaScript script to initialize the primary admin user
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const PRIMARY_ADMIN = {
  clerkId: 'user_35rVge67RtsAqrA0Vl4JC6F9dOW',
  email: 'subscriptionnova@gmail.com',
  fullName: 'Nour Ali',
  role: 'admin',
}

async function main() {
  console.log('🔍 Checking for primary admin user...')
  
  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { clerkId: PRIMARY_ADMIN.clerkId }
  })

  if (existing) {
    console.log('✅ Admin user already exists!')
    console.log('   Email:', existing.email)
    console.log('   Name:', existing.fullName)
    console.log('   Role:', existing.role)
    console.log('   ID:', existing.id)
    return existing
  }

  // Create the admin user
  console.log('📝 Creating admin user...')
  const admin = await prisma.user.create({
    data: PRIMARY_ADMIN
  })

  console.log('✅ Admin user created successfully!')
  console.log('   Email:', admin.email)
  console.log('   Name:', admin.fullName)
  console.log('   Role:', admin.role)
  console.log('   ID:', admin.id)
  
  return admin
}

main()
  .catch((error) => {
    console.error('❌ Error:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
