import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { DestinationValidator, CreateDestinationData, DestinationValidationError } from '@/app/lib/models'
import { UserRole } from '@/app/generated/prisma'

// GET - List all destinations for admin
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
    
    const destinations = await prisma.destination.findMany({
      include: {
        _count: {
          select: {
            tours: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: destinations
    })
    
  } catch (error) {
    console.error('Error fetching admin destinations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch destinations' },
      { status: 500 }
    )
  }
}

// POST - Create new destination
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
    const destinationData: CreateDestinationData = body
    
    // Validate destination data
    try {
      DestinationValidator.validateCreateData(destinationData)
    } catch (error) {
      if (error instanceof DestinationValidationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
      throw error
    }
    
    // Create destination
    const destination = await prisma.destination.create({
      data: destinationData
    })
    
    return NextResponse.json({
      success: true,
      data: destination
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating destination:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create destination' },
      { status: 500 }
    )
  }
}