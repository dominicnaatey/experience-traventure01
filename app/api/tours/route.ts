import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { TourStatus, Difficulty, Prisma } from '@/app/generated/prisma'

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
    const tours = await prisma.tour.findMany({
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