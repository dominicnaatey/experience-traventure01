import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET /api/bookings - Get user's bookings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id
      },
      include: {
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
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tourId, availabilityId, travelersCount } = body;

    // Validate required fields
    if (!tourId || !availabilityId || !travelersCount) {
      return NextResponse.json(
        { error: 'Missing required fields: tourId, availabilityId, travelersCount' },
        { status: 400 }
      );
    }

    if (travelersCount <= 0) {
      return NextResponse.json(
        { error: 'Travelers count must be greater than 0' },
        { status: 400 }
      );
    }

    // Check availability
    const availability = await prisma.tourAvailability.findUnique({
      where: { id: availabilityId },
      include: {
        tour: true
      }
    });

    if (!availability) {
      return NextResponse.json(
        { error: 'Tour availability not found' },
        { status: 404 }
      );
    }

    if (availability.availableSlots < travelersCount) {
      return NextResponse.json(
        { error: 'Not enough available slots' },
        { status: 400 }
      );
    }

    // Calculate total price
    const totalPrice = availability.tour.pricePerPerson * travelersCount;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        tourId,
        availabilityId,
        travelersCount,
        totalPrice,
        status: 'PENDING'
      },
      include: {
        tour: {
          include: {
            destination: true
          }
        },
        availability: true
      }
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
