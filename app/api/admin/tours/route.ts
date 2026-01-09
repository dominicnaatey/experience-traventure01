import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { TourValidator, CreateTourData, TourValidationError } from '@/app/lib/models'
import { UserRole } from '@/app/generated/prisma'

// GET - List all tours for admin (including inactive)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where: any = {}
    if (status) {
      where.status = status
    }
    
    const tours = await prisma.tour.findMany({
      where,
      include: {
        destination: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
            availabilities: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: tours
    })
    
  } catch (error) {
    console.error('Error fetching admin tours:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tours' },
      { status: 500 }
    )
  }
}

// POST - Create new tour
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const tourData: CreateTourData = body
    
    // Validate tour data
    try {
      TourValidator.validateCreateData(tourData)
    } catch (error) {
      if (error instanceof TourValidationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
      throw error
    }
    
    // Verify destination exists
    const destination = await prisma.destination.findUnique({
      where: { id: tourData.destinationId }
    })
    
    if (!destination) {
      return NextResponse.json(
        { success: false, error: 'Destination not found' },
        { status: 400 }
      )
    }
    
    // Create tour
    const tour = await prisma.tour.create({
      data: {
        ...tourData,
        itinerary: JSON.parse(JSON.stringify(tourData.itinerary)) // Prisma handles JSON serialization
      },
      include: {
        destination: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: tour
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating tour:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create tour' },
      { status: 500 }
    )
  }
}