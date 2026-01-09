import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET /api/admin/dashboard - Get dashboard statistics and recent activity (admin only)
export async function GET() {
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

    // Get date range for recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all dashboard data in parallel
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      revenueData,
      recentBookings,
      failedPayments,
      totalTours,
      totalUsers
    ] = await Promise.all([
      // Booking statistics
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      
      // Revenue data
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true },
        where: { status: 'SUCCESS' }
      }),
      
      // Recent bookings (last 10)
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          tour: {
            select: {
              id: true,
              title: true
            }
          },
          availability: {
            select: {
              startDate: true,
              endDate: true
            }
          }
        }
      }),
      
      // Recent failed payments (last 5)
      prisma.payment.findMany({
        where: { 
          status: 'FAILED',
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              tour: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      }),
      
      // Additional statistics
      prisma.tour.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } })
    ]);

    const dashboardData = {
      statistics: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue: revenueData._sum.amount || 0,
        successfulPayments: revenueData._count.id || 0,
        averageBookingValue: revenueData._avg.amount || 0,
        totalTours,
        totalUsers,
        conversionRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0
      },
      recentActivity: {
        recentBookings: recentBookings.map(booking => ({
          id: booking.id,
          customerName: booking.user.name,
          customerEmail: booking.user.email,
          tourTitle: booking.tour.title,
          tourId: booking.tour.id,
          status: booking.status,
          totalPrice: booking.totalPrice,
          travelersCount: booking.travelersCount,
          tourStartDate: booking.availability?.startDate,
          createdAt: booking.createdAt
        })),
        failedPayments: failedPayments.map(payment => ({
          id: payment.id,
          bookingId: payment.bookingId,
          amount: payment.amount,
          currency: payment.currency,
          provider: payment.provider,
          customerName: payment.booking.user.name,
          customerEmail: payment.booking.user.email,
          tourTitle: payment.booking.tour.title,
          tourId: payment.booking.tour.id,
          createdAt: payment.createdAt
        }))
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
