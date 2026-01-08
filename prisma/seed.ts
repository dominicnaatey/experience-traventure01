import { PrismaClient } from '../app/generated/prisma'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'

// Load environment variables
config()

// Extract direct database URL from the Accelerate URL
const accelerateUrl = process.env.DATABASE_URL
let directDbUrl = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&connection_limit=1&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&single_use_connections=true&socket_timeout=0"

if (accelerateUrl?.startsWith('prisma+')) {
  try {
    // Extract the API key and decode it to get the direct URL
    const apiKey = accelerateUrl.split('api_key=')[1]
    const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString())
    directDbUrl = decoded.databaseUrl
  } catch {
    console.log('Using fallback direct database URL')
  }
}

// Initialize Prisma client for seeding with direct TCP connection
const prisma = new PrismaClient({
  accelerateUrl: directDbUrl
})

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default admin user
  const adminEmail = 'admin@traventure.com'
  const adminPassword = 'ADMIN@123log'
  
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists')
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(adminPassword, 12)

      // Create admin user
      const admin = await prisma.user.create({
        data: {
          name: 'System Administrator',
          email: adminEmail,
          passwordHash: hashedPassword,
          role: 'ADMIN',
          phone: '+1234567890'
        }
      })

      console.log('✅ Created admin user:', {
        id: admin.id,
        email: admin.email,
        role: admin.role
      })
    }

    // Create sample destinations
    const destinations = [
      {
        name: 'Paris',
        country: 'France',
        description: 'The City of Light, famous for its art, fashion, gastronomy, and culture.',
        coverImage: 'https://example.com/paris.jpg'
      },
      {
        name: 'Tokyo',
        country: 'Japan',
        description: 'A bustling metropolis blending traditional culture with modern innovation.',
        coverImage: 'https://example.com/tokyo.jpg'
      },
      {
        name: 'Bali',
        country: 'Indonesia',
        description: 'Tropical paradise known for its beaches, temples, and vibrant culture.',
        coverImage: 'https://example.com/bali.jpg'
      }
    ]

    for (const destData of destinations) {
      const existing = await prisma.destination.findFirst({
        where: { name: destData.name, country: destData.country }
      })

      if (!existing) {
        await prisma.destination.create({ data: destData })
        console.log(`✅ Created destination: ${destData.name}, ${destData.country}`)
      }
    }

    // Create sample content
    const sampleContent = [
      {
        type: 'PAGE' as const,
        title: 'About Us',
        body: 'Welcome to Traventure, your premier travel booking platform. We specialize in creating unforgettable travel experiences around the world.',
        published: true
      },
      {
        type: 'FAQ' as const,
        title: 'Frequently Asked Questions',
        body: 'Here are some common questions about our travel booking service...',
        published: true
      },
      {
        type: 'BLOG' as const,
        title: 'Top 10 Travel Destinations for 2024',
        body: 'Discover the most exciting travel destinations to visit this year...',
        published: false
      }
    ]

    for (const contentData of sampleContent) {
      const existing = await prisma.content.findFirst({
        where: { title: contentData.title }
      })

      if (!existing) {
        await prisma.content.create({ data: contentData })
        console.log(`✅ Created content: ${contentData.title}`)
      }
    }

    console.log('🎉 Database seed completed!')
    console.log('')
    console.log('📋 Admin Login Credentials:')
    console.log('Email: admin@traventure.com')
    console.log('Password: ADMIN@123log')
    console.log('')
    console.log('⚠️  Please change the admin password after first login!')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })