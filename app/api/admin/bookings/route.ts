import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { BookingStatus } from '@prisma/client';
import { AdminNotificationService } from '@/app/lib/services/admin-notification';
import { prisma } from '@/app/lib/prisma';

// GET /api/admin/bookings - Get all bookings (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tourId = searchParams.get('tourId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: {
      status?: BookingStatus;
      tourId?: string;
    } = {};
    if (status && ['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      whereClause.status = status as BookingStatus;
    }
    if (tourId) {
      whereClause.tourId = tourId;
    }

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          tour: {
            include: {
              destination: true
            }
          },
          availability: true,
          payments: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.booking.count({
        where: whereClause
      })
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/bookings - Update booking status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bookingId, status, reason } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'Booking ID and status are required' },
        { status: 400 }
      );
    }

    if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, CONFIRMED, or CANCELLED' },
        { status: 400 }
      );
    }

    // Get current booking
    const currentBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { name: true, email: true } },
        tour: { select: { title: true } },
        availability: true
      }
    });

    if (!currentBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Handle slot management for status changes
    let updatedBooking;
    
    if (status === 'CONFIRMED' && currentBooking.status !== 'CONFIRMED') {
      // Confirming booking - reduce available slots
      await prisma.$transaction(async (tx) => {
        // Update booking status
        updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: { 
            status: status as BookingStatus,
            updatedAt: new Date()
          },
          include: {
            user: { select: { name: true, email: true } },
            tour: { select: { title: true } },
            availability: true
          }
        });

        // Reduce available slots
        if (currentBooking.availability) {
          await tx.tourAvailability.update({
            where: { id: currentBooking.availabilityId },
            data: {
              availableSlots: {
                decrement: currentBooking.travelersCount
              }
            }
          });
        }
      });
    } else if (status === 'CANCELLED' && currentBooking.status === 'CONFIRMED') {
      // Cancelling confirmed booking - restore available slots
      await prisma.$transaction(async (tx) => {
        // Update booking status
        updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: { 
            status: status as BookingStatus,
            updatedAt: new Date()
          },
          include: {
            user: { select: { name: true, email: true } },
            tour: { select: { title: true } },
            availability: true
          }
        });

        // Restore available slots
        if (currentBooking.availability) {
          await tx.tourAvailability.update({
            where: { id: currentBooking.availabilityId },
            data: {
              availableSlots: {
                increment: currentBooking.travelersCount
              }
            }
          });
        }
      });

      // Send cancellation notification
      try {
        await AdminNotificationService.sendPaymentFailureNotification({
          type: 'BOOKING_CANCELLATION',
          bookingId: bookingId,
          customerName: currentBooking.user.name || 'Unknown',
          customerEmail: currentBooking.user.email,
          tourTitle: currentBooking.tour.title,
          reason: reason || 'Manual admin cancellation'
        });
      } catch (notificationError) {
        console.error('Failed to send cancellation notification:', notificationError);
        // Don't fail the request if notification fails
      }
    } else {
      // Simple status update without slot changes
      updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          status: status as BookingStatus,
          updatedAt: new Date()
        },
        include: {
          user: { select: { name: true, email: true } },
          tour: { select: { title: true } },
          availability: true
        }
      });
    }

    return NextResponse.json({
      message: 'Booking status updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}
