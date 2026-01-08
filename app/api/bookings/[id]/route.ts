import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// GET /api/bookings/[id] - Get specific booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: {
        id: id
      },
      include: {
        tour: {
          include: {
            destination: true
          }
        },
        availability: true,
        payments: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user owns this booking or is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (booking.userId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings/[id] - Update booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, CONFIRMED, or CANCELLED' },
        { status: 400 }
      );
    }

    // Get current booking
    const currentBooking = await prisma.booking.findUnique({
      where: { id: id },
      include: {
        availability: true
      }
    });

    if (!currentBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (currentBooking.userId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Handle slot management for status changes
    let updatedBooking;
    
    if (status === 'CONFIRMED' && currentBooking.status === 'PENDING') {
      // Reduce available slots when confirming
      await prisma.$transaction(async (tx) => {
        await tx.tourAvailability.update({
          where: { id: currentBooking.availabilityId },
          data: {
            availableSlots: {
              decrement: currentBooking.travelersCount
            }
          }
        });

        updatedBooking = await tx.booking.update({
          where: { id: id },
          data: { status },
          include: {
            tour: {
              include: {
                destination: true
              }
            },
            availability: true,
            payments: true
          }
        });
      });
    } else if (status === 'CANCELLED' && currentBooking.status === 'CONFIRMED') {
      // Restore available slots when cancelling confirmed booking
      await prisma.$transaction(async (tx) => {
        await tx.tourAvailability.update({
          where: { id: currentBooking.availabilityId },
          data: {
            availableSlots: {
              increment: currentBooking.travelersCount
            }
          }
        });

        updatedBooking = await tx.booking.update({
          where: { id: id },
          data: { status },
          include: {
            tour: {
              include: {
                destination: true
              }
            },
            availability: true,
            payments: true
          }
        });
      });
    } else {
      // Simple status update without slot changes
      updatedBooking = await prisma.booking.update({
        where: { id: id },
        data: { status },
        include: {
          tour: {
            include: {
              destination: true
            }
          },
          availability: true,
          payments: true
        }
      });
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}
