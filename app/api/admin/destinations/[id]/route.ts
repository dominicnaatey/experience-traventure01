import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { DestinationValidator, UpdateDestinationData, DestinationValidationError } from '@/app/lib/models'
import { UserRole } from '@/app/generated/prisma'

// GET - Get single destination for admin
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params
    
    const destination = await prisma.destination.findUnique({
      where: { id },
      include: {
        tours: {
          select: {
            id: true,
            title: true,
            status: true,
            pricePerPerson: true,
            durationDays: true
          }
        }
      }
    })
    
    if (!destination) {
      return NextResponse.json(
        { success: false, error: 'Destination not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: destination
    })
    
  } catch (error) {
    console.error('Error fetching admin destination:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch destination' },
      { status: 500 }
    )
  }
}

// PUT - Update destination
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params
    const body = await request.json()
    const updateData: UpdateDestinationData = body
    
    // Validate update data
    try {
      DestinationValidator.validateUpdateData(updateData)
    } catch (error) {
      if (error instanceof DestinationValidationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
      throw error
    }
    
    // Check if destination exists
    const existingDestination = await prisma.destination.findUnique({
      where: { id }
    })
    
    if (!existingDestination) {
      return NextResponse.json(
        { success: false, error: 'Destination not found' },
        { status: 404 }
      )
    }
    
    // Update destination
    const updatedDestination = await prisma.destination.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json({
      success: true,
      data: updatedDestination
    })
    
  } catch (error) {
    console.error('Error updating destination:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update destination' },
      { status: 500 }
    )
  }
}

// DELETE - Delete destination
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params
    
    // Check if destination exists and has tours
    const existingDestination = await prisma.destination.findUnique({
      where: { id },
      include: {
        tours: true
      }
    })
    
    if (!existingDestination) {
      return NextResponse.json(
        { success: false, error: 'Destination not found' },
        { status: 404 }
      )
    }
    
    // Prevent deletion if there are tours
    if (existingDestination.tours.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete destination with ${existingDestination.tours.length} associated tours. Delete tours first.` 
        },
        { status: 400 }
      )
    }
    
    // Delete destination
    await prisma.destination.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Destination deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting destination:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete destination' },
      { status: 500 }
    )
  }
}