// Simple script to initialize the primary admin user
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PRIMARY_ADMIN = {
  clerkId: 'user_35rVge67RtsAqrA0Vl4JC6F9dOW',
  email: 'subscriptionnova@gmail.com',
  fullName: 'Nour Ali',
  role: 'admin',
}

async function main() {
  console.log('Checking for primary admin user...')
  
  const existing = await prisma.user.findUnique({
    where: { clerkId: PRIMARY_ADMIN.clerkId }
  })

  if (existing) {
    console.log('✅ Admin user already exists:', existing.email)
    return
  }

  const admin = await prisma.user.create({
    data: PRIMARY_ADMIN
  })

  console.log('✅ Created admin user:', admin.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
