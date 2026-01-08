import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { TourValidator, UpdateTourData } from '@/app/lib/models'
import type { TourValidationError } from '@/app/lib/models'
import { UserRole } from '@/app/generated/prisma'

// GET - Get single tour for admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    
    const { id } = await params
    
    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        destination: true,
        availabilities: true,
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })
    
    if (!tour) {
      return NextResponse.json(
        { success: false, error: 'Tour not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: tour
    })
    
  } catch (error) {
    console.error('Error fetching admin tour:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tour' },
      { status: 500 }
    )
  }
}

// PUT - Update tour
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    
    const { id } = await params
    const body = await request.json()
    const updateData: UpdateTourData = body
    
    // Validate update data
    try {
      TourValidator.validateUpdateData(updateData)
    } catch (error) {
      if (error instanceof TourValidationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
      throw error
    }
    
    // Check if tour exists
    const existingTour = await prisma.tour.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: 'CONFIRMED'
          }
        }
      }
    })
    
    if (!existingTour) {
      return NextResponse.json(
        { success: false, error: 'Tour not found' },
        { status: 404 }
      )
    }
    
    // If destination is being updated, verify it exists
    if (updateData.destinationId) {
      const destination = await prisma.destination.findUnique({
        where: { id: updateData.destinationId }
      })
      
      if (!destination) {
        return NextResponse.json(
          { success: false, error: 'Destination not found' },
          { status: 400 }
        )
      }
    }
    
    // Update tour while preserving existing bookings
    const updatedTour = await prisma.tour.update({
      where: { id },
      data: {
        ...updateData,
        itinerary: updateData.itinerary ? updateData.itinerary as unknown : undefined
      },
      include: {
        destination: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedTour,
      message: existingTour.bookings.length > 0 
        ? `Tour updated successfully. ${existingTour.bookings.length} existing bookings preserved.`
        : 'Tour updated successfully.'
    })
    
  } catch (error) {
    console.error('Error updating tour:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update tour' },
      { status: 500 }
    )
  }
}

// DELETE - Delete tour
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    
    const { id } = await params
    
    // Check if tour exists and has bookings
    const existingTour = await prisma.tour.findUnique({
      where: { id },
      include: {
        bookings: true
      }
    })
    
    if (!existingTour) {
      return NextResponse.json(
        { success: false, error: 'Tour not found' },
        { status: 404 }
      )
    }
    
    // Prevent deletion if there are confirmed bookings
    const confirmedBookings = existingTour.bookings.filter(
      booking => booking.status === 'CONFIRMED'
    )
    
    if (confirmedBookings.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete tour with ${confirmedBookings.length} confirmed bookings. Set status to inactive instead.` 
        },
        { status: 400 }
      )
    }
    
    // Delete tour (cascade will handle related records)
    await prisma.tour.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Tour deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting tour:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete tour' },
      { status: 500 }
    )
  }
}