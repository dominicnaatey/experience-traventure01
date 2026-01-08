import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { TourStatus, Difficulty } from '@/app/generated/prisma'

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
    const where: any = {
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
      where.pricePerPerson = {}
      if (minPrice) {
        where.pricePerPerson.gte = parseFloat(minPrice)
      }
      if (maxPrice) {
        where.pricePerPerson.lte = parseFloat(maxPrice)
      }
    }
    
    // Duration filtering
    if (minDuration || maxDuration) {
      where.durationDays = {}
      if (minDuration) {
        where.durationDays.gte = parseInt(minDuration)
      }
      if (maxDuration) {
        where.durationDays.lte = parseInt(maxDuration)
      }
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
        error: 'Failed to fetch tours'
      },
      { status: 500 }
    )
  }
}