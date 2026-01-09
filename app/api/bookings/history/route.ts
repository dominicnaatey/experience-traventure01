import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { BookingService } from '@/app/lib/services/booking';

// GET /api/bookings/history - Get user's booking history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let bookings = await BookingService.getUserBookings(session.user.id);

    // Filter by status if provided
    if (status && ['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      bookings = bookings.filter(booking => booking.status === status);
    }

    // Group bookings by status for summary
    const summary = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'PENDING').length,
      confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
      cancelled: bookings.filter(b => b.status === 'CANCELLED').length
    };

    return NextResponse.json({
      bookings,
      summary
    });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking history' },
      { status: 500 }
    );
  }
}