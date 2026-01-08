import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

// GET /api/admin/reports - Generate revenue and booking conversion reports (admin only)
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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const reportType = searchParams.get('type') || 'monthly';

    // Default to current month if no dates provided
    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam ? new Date(endDateParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate.getTime() - 1);

    // Fetch current period data
    const [
      currentRevenueData,
      currentBookingStats,
      currentTourPerformance,
      previousRevenueData,
      previousBookingStats
    ] = await Promise.all([
      // Current period revenue
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true },
        where: {
          status: 'SUCCESS',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Current period booking statistics
      Promise.all([
        prisma.booking.count({
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        prisma.booking.count({
          where: {
            status: 'CONFIRMED',
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        prisma.booking.count({
          where: {
            status: 'CANCELLED',
            createdAt: { gte: startDate, lte: endDate }
          }
        }),
        prisma.booking.count({
          where: {
            status: 'PENDING',
            createdAt: { gte: startDate, lte: endDate }
          }
        })
      ]),
      
      // Tour performance in current period
      prisma.booking.groupBy({
        by: ['tourId'],
        _count: { id: true },
        _sum: { totalPrice: true },
        where: {
          status: 'CONFIRMED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          _sum: {
            totalPrice: 'desc'
          }
        }
      }),
      
      // Previous period revenue for comparison
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'SUCCESS',
          createdAt: {
            gte: previousStartDate,
            lte: previousEndDate
          }
        }
      }),
      
      // Previous period booking statistics
      Promise.all([
        prisma.booking.count({
          where: {
            createdAt: { gte: previousStartDate, lte: previousEndDate }
          }
        }),
        prisma.booking.count({
          where: {
            status: 'CONFIRMED',
            createdAt: { gte: previousStartDate, lte: previousEndDate }
          }
        })
      ])
    ]);

    // Get tour details for performance report
    const tourIds = currentTourPerformance.map(tp => tp.tourId);
    const tourDetails = await prisma.tour.findMany({
      where: { id: { in: tourIds } },
      select: {
        id: true,
        title: true,
        destination: {
          select: {
            name: true,
            country: true
          }
        }
      }
    });

    const [totalBookings, confirmedBookings, cancelledBookings, pendingBookings] = currentBookingStats;
    const [previousTotalBookings, previousConfirmedBookings] = previousBookingStats;

    // Calculate growth rates
    const revenueGrowth = previousRevenueData._sum.amount 
      ? ((currentRevenueData._sum.amount || 0) - (previousRevenueData._sum.amount || 0)) / (previousRevenueData._sum.amount || 1) * 100
      : 0;

    const bookingGrowth = previousTotalBookings 
      ? (totalBookings - previousTotalBookings) / previousTotalBookings * 100
      : 0;

    const conversionGrowth = previousTotalBookings && previousConfirmedBookings
      ? ((confirmedBookings / totalBookings) - (previousConfirmedBookings / previousTotalBookings)) * 100
      : 0;

    const report = {
      period: {
        startDate,
        endDate,
        type: reportType
      },
      revenueAnalysis: {
        totalRevenue: currentRevenueData._sum.amount || 0,
        totalTransactions: currentRevenueData._count.id || 0,
        averageTransactionValue: currentRevenueData._avg.amount || 0,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        previousPeriodRevenue: previousRevenueData._sum.amount || 0
      },
      bookingConversionMetrics: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        pendingBookings,
        conversionRate: totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 10000) / 100 : 0,
        cancellationRate: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 10000) / 100 : 0,
        bookingGrowth: Math.round(bookingGrowth * 100) / 100,
        conversionGrowth: Math.round(conversionGrowth * 100) / 100
      },
      tourPerformance: currentTourPerformance.map(tour => {
        const tourDetail = tourDetails.find(t => t.id === tour.tourId);
        return {
          tourId: tour.tourId,
          tourTitle: tourDetail?.title || 'Unknown Tour',
          destination: tourDetail?.destination?.name || 'Unknown',
          country: tourDetail?.destination?.country || 'Unknown',
          bookingCount: tour._count.id,
          revenue: tour._sum.totalPrice || 0,
          averageBookingValue: tour._sum.totalPrice && tour._count.id 
            ? Math.round((tour._sum.totalPrice / tour._count.id) * 100) / 100 
            : 0
        };
      }),
      summary: {
        topPerformingTour: currentTourPerformance.length > 0 
          ? {
              tourId: currentTourPerformance[0].tourId,
              revenue: currentTourPerformance[0]._sum.totalPrice || 0,
              bookings: currentTourPerformance[0]._count.id
            }
          : null,
        totalToursWithBookings: currentTourPerformance.length,
        averageRevenuePerTour: currentTourPerformance.length > 0 
          ? Math.round((currentRevenueData._sum.amount || 0) / currentTourPerformance.length * 100) / 100
          : 0
      }
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}