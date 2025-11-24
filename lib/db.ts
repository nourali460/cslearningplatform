import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma Client with logging
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'pretty',
  })

// Connection error handler
db.$connect()
  .then(() => {
    console.log('✅ Database connected successfully')
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error)
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
    if (process.env.DATABASE_URL) {
      // Log connection string without password
      const url = new URL(process.env.DATABASE_URL)
      console.error('Database host:', url.host)
      console.error('Database name:', url.pathname)
    }
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
