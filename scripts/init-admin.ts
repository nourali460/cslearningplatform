// Simple script to initialize the primary admin user
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PRIMARY_ADMIN = {
  email: 'subscriptionsnova@gmail.com',
  password: 'admin123',
  fullName: 'Nour Ali',
  role: 'admin',
}

async function main() {
  console.log('Checking for primary admin user...')

  const existing = await prisma.user.findUnique({
    where: { email: PRIMARY_ADMIN.email }
  })

  if (existing) {
    console.log('✅ Admin user already exists:', existing.email)
    console.log('📋 Checking password...')

    if (!existing.password || existing.password.trim() === '') {
      console.log('🔧 Password missing - updating...')
      await prisma.user.update({
        where: { email: PRIMARY_ADMIN.email },
        data: { password: PRIMARY_ADMIN.password }
      })
      console.log('✅ Password updated successfully!')
    } else {
      console.log('✅ Password already set')
    }
    return
  }

  const admin = await prisma.user.create({
    data: PRIMARY_ADMIN
  })

  console.log('✅ Created admin user:', admin.email)
  console.log('📧 Email:', admin.email)
  console.log('🔑 Password: admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
