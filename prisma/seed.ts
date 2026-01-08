import { PrismaClient } from '../app/generated/prisma'
import { config } from 'dotenv'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Load environment variables
config()

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

// Initialize Prisma client for seeding
const { Pool } = pg
const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminEmail = 'admin@traventure.com'
  
  // Use the provided bcrypt hash for 'ADMIN@123log'
  // Hash: $2b$12$zlDRIg4R7mEGzeJpg7.61e97DYCyIAU1ZkCRs9/4F/NxiHXyIaNxq
  const hashedPassword = '$2b$12$zlDRIg4R7mEGzeJpg7.61e97DYCyIAU1ZkCRs9/4F/NxiHXyIaNxq'

  console.log('Seeding database...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      passwordHash: hashedPassword
    },
    create: {
      email: adminEmail,
      name: 'System Administrator',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phone: '+1234567890'
    }
  })

  console.log({ admin })
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
