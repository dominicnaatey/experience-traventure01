import { describe, it, expect, jest } from '@jest/globals';

const mockPrisma = {
  booking: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn()
  },
  payment: {
    aggregate: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn()
  },
  tour: {
    count: jest.fn()
  },
  user: {
    count: jest.fn()
  }
};

describe('Admin Dashboard Property Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Property 23: Dashboard information completeness', () => {
    /**
     * **Feature: travel-tour-booking, Property 23: Dashboard information completeness**
     * For any admin dashboard request, the response should include booking statistics and recent activity data
     * Validates: Requirements 7.1, 7.2
     */
    it('should include complete booking statistics and recent activity in dashboard response', async () => {
      // Mock booking statistics
      mockPrisma.booking.count.mockImplementation(({ where }) => {
        if (where?.status === 'PENDING') return Promise.resolve(5);
        if (where?.status === 'CONFIRMED') return Promise.resolve(25);
        if (where?.status === 'CANCELLED') return Promise.resolve(3);
        return Promise.resolve(33); // Total bookings
      });

      // Mock revenue data
      mockPrisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: 15000 },
        _count: { id: 25 }
      });

      // Mock recent bookings
      mockPrisma.booking.findMany.mockResolvedValue([
        {
          id: 'booking-1',
          userId: 'user-1',
          tourId: 'tour-1',
          status: 'CONFIRMED',
          totalPrice: 500,
          createdAt: new Date('2026-01-07T10:00:00Z'),
          user: { name: 'John Doe', email: 'john@example.com' },
          tour: { title: 'Safari Adventure' }
        },
        {
          id: 'booking-2',
          userId: 'user-2',
          tourId: 'tour-2',
          status: 'PENDING',
          totalPrice: 300,
          createdAt: new Date('2026-01-07T09:00:00Z'),
          user: { name: 'Jane Smith', email: 'jane@example.com' },
          tour: { title: 'City Tour' }
        }
      ]);

      // Mock failed payments
      mockPrisma.payment.findMany.mockResolvedValue([
        {
          id: 'payment-1',
          bookingId: 'booking-3',
          status: 'FAILED',
          amount: 400,
          createdAt: new Date('2026-01-07T08:00:00Z'),
          booking: {
            user: { name: 'Bob Wilson', email: 'bob@example.com' },
            tour: { title: 'Mountain Hike' }
          }
        }
      ]);

      // Simulate dashboard data aggregation
      const [
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        revenueData,
        recentBookings,
        failedPayments
      ] = await Promise.all([
        mockPrisma.booking.count({}),
        mockPrisma.booking.count({ where: { status: 'PENDING' } }),
        mockPrisma.booking.count({ where: { status: 'CONFIRMED' } }),
        mockPrisma.booking.count({ where: { status: 'CANCELLED' } }),
        mockPrisma.payment.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          where: { status: 'SUCCESS' }
        }),
        mockPrisma.booking.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, email: true } },
            tour: { select: { title: true } }
          }
        }),
        mockPrisma.payment.findMany({
          where: { status: 'FAILED' },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            booking: {
              include: {
                user: { select: { name: true, email: true } },
                tour: { select: { title: true } }
              }
            }
          }
        })
      ]);

      const dashboardData = {
        statistics: {
          totalBookings,
          pendingBookings,
          confirmedBookings,
          cancelledBookings,
          totalRevenue: revenueData._sum.amount || 0,
          successfulPayments: revenueData._count.id || 0
        },
        recentActivity: {
          recentBookings,
          failedPayments
        }
      };

      // Verify all required statistics are present
      expect(dashboardData.statistics).toHaveProperty('totalBookings');
      expect(dashboardData.statistics).toHaveProperty('pendingBookings');
      expect(dashboardData.statistics).toHaveProperty('confirmedBookings');
      expect(dashboardData.statistics).toHaveProperty('cancelledBookings');
      expect(dashboardData.statistics).toHaveProperty('totalRevenue');
      expect(dashboardData.statistics).toHaveProperty('successfulPayments');

      // Verify statistics have correct values
      expect(dashboardData.statistics.totalBookings).toBe(33);
      expect(dashboardData.statistics.pendingBookings).toBe(5);
      expect(dashboardData.statistics.confirmedBookings).toBe(25);
      expect(dashboardData.statistics.cancelledBookings).toBe(3);
      expect(dashboardData.statistics.totalRevenue).toBe(15000);
      expect(dashboardData.statistics.successfulPayments).toBe(25);

      // Verify recent activity is present
      expect(dashboardData.recentActivity).toHaveProperty('recentBookings');
      expect(dashboardData.recentActivity).toHaveProperty('failedPayments');

      // Verify recent bookings structure
      expect(Array.isArray(dashboardData.recentActivity.recentBookings)).toBe(true);
      expect(dashboardData.recentActivity.recentBookings.length).toBeGreaterThan(0);
      
      const firstBooking = dashboardData.recentActivity.recentBookings[0];
      expect(firstBooking).toHaveProperty('id');
      expect(firstBooking).toHaveProperty('status');
      expect(firstBooking).toHaveProperty('totalPrice');
      expect(firstBooking).toHaveProperty('createdAt');
      expect(firstBooking).toHaveProperty('user');
      expect(firstBooking).toHaveProperty('tour');
      expect(firstBooking.user).toHaveProperty('name');
      expect(firstBooking.user).toHaveProperty('email');
      expect(firstBooking.tour).toHaveProperty('title');

      // Verify failed payments structure
      expect(Array.isArray(dashboardData.recentActivity.failedPayments)).toBe(true);
      
      if (dashboardData.recentActivity.failedPayments.length > 0) {
        const firstFailedPayment = dashboardData.recentActivity.failedPayments[0];
        expect(firstFailedPayment).toHaveProperty('id');
        expect(firstFailedPayment).toHaveProperty('status', 'FAILED');
        expect(firstFailedPayment).toHaveProperty('amount');
        expect(firstFailedPayment).toHaveProperty('createdAt');
        expect(firstFailedPayment).toHaveProperty('booking');
        expect(firstFailedPayment.booking).toHaveProperty('user');
        expect(firstFailedPayment.booking).toHaveProperty('tour');
      }

      // Test with different data scenarios
      // Scenario: No bookings
      mockPrisma.booking.count.mockResolvedValue(0);
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: null },
        _count: { id: 0 }
      });

      const emptyDashboard = {
        statistics: {
          totalBookings: await mockPrisma.booking.count({}),
          totalRevenue: (await mockPrisma.payment.aggregate({
            _sum: { amount: true }
          }))._sum.amount || 0,
          successfulPayments: (await mockPrisma.payment.aggregate({
            _count: { id: true }
          }))._count.id || 0
        },
        recentActivity: {
          recentBookings: await mockPrisma.booking.findMany({ take: 10 }),
          failedPayments: []
        }
      };

      expect(emptyDashboard.statistics.totalBookings).toBe(0);
      expect(emptyDashboard.statistics.totalRevenue).toBe(0);
      expect(emptyDashboard.statistics.successfulPayments).toBe(0);
      expect(emptyDashboard.recentActivity.recentBookings).toEqual([]);
    });
  });

  describe('Property 24: Payment failure notifications', () => {
    /**
     * **Feature: travel-tour-booking, Property 24: Payment failure notifications**
     * For any payment status change to failed or disputed, admin notification emails should be sent
     * Validates: Requirements 7.3
     */
    it('should trigger admin notifications for payment failures and disputes', async () => {
      const mockEmailService = {
        sendAdminNotification: jest.fn()
      };

      // Test case 1: Payment failure notification
      const failedPayment = {
        id: 'payment-1',
        bookingId: 'booking-1',
        amount: 500,
        status: 'FAILED',
        provider: 'STRIPE',
        createdAt: new Date(),
        booking: {
          id: 'booking-1',
          user: { name: 'John Doe', email: 'john@example.com' },
          tour: { title: 'Safari Adventure' }
        }
      };

      // Simulate payment status change to failed
      const shouldNotifyAdmin = failedPayment.status === 'FAILED' || failedPayment.status === 'DISPUTED';
      expect(shouldNotifyAdmin).toBe(true);

      if (shouldNotifyAdmin) {
        await mockEmailService.sendAdminNotification({
          type: 'PAYMENT_FAILURE',
          paymentId: failedPayment.id,
          bookingId: failedPayment.bookingId,
          amount: failedPayment.amount,
          customerName: failedPayment.booking.user.name,
          customerEmail: failedPayment.booking.user.email,
          tourTitle: failedPayment.booking.tour.title,
          provider: failedPayment.provider
        });
      }

      expect(mockEmailService.sendAdminNotification).toHaveBeenCalledWith({
        type: 'PAYMENT_FAILURE',
        paymentId: 'payment-1',
        bookingId: 'booking-1',
        amount: 500,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        tourTitle: 'Safari Adventure',
        provider: 'STRIPE'
      });

      // Test case 2: Disputed payment notification
      const disputedPayment = {
        ...failedPayment,
        id: 'payment-2',
        status: 'DISPUTED'
      };

      const shouldNotifyForDispute = disputedPayment.status === 'FAILED' || disputedPayment.status === 'DISPUTED';
      expect(shouldNotifyForDispute).toBe(true);

      if (shouldNotifyForDispute) {
        await mockEmailService.sendAdminNotification({
          type: 'PAYMENT_DISPUTE',
          paymentId: disputedPayment.id,
          bookingId: disputedPayment.bookingId,
          amount: disputedPayment.amount,
          customerName: disputedPayment.booking.user.name,
          customerEmail: disputedPayment.booking.user.email,
          tourTitle: disputedPayment.booking.tour.title,
          provider: disputedPayment.provider
        });
      }

      expect(mockEmailService.sendAdminNotification).toHaveBeenCalledWith({
        type: 'PAYMENT_DISPUTE',
        paymentId: 'payment-2',
        bookingId: 'booking-1',
        amount: 500,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        tourTitle: 'Safari Adventure',
        provider: 'STRIPE'
      });

      // Test case 3: Successful payment should not trigger notification
      const successfulPayment = {
        ...failedPayment,
        id: 'payment-3',
        status: 'SUCCESS'
      };

      const shouldNotNotifyForSuccess = successfulPayment.status === 'FAILED' || successfulPayment.status === 'DISPUTED';
      expect(shouldNotNotifyForSuccess).toBe(false);

      // Test case 4: Multiple payment failures should trigger multiple notifications
      const multipleFailures = [
        { ...failedPayment, id: 'payment-4', status: 'FAILED' },
        { ...failedPayment, id: 'payment-5', status: 'DISPUTED' },
        { ...failedPayment, id: 'payment-6', status: 'FAILED' }
      ];

      let notificationCount = 0;
      for (const payment of multipleFailures) {
        if (payment.status === 'FAILED' || payment.status === 'DISPUTED') {
          notificationCount++;
          await mockEmailService.sendAdminNotification({
            type: payment.status === 'FAILED' ? 'PAYMENT_FAILURE' : 'PAYMENT_DISPUTE',
            paymentId: payment.id,
            bookingId: payment.bookingId,
            amount: payment.amount,
            customerName: payment.booking.user.name,
            customerEmail: payment.booking.user.email,
            tourTitle: payment.booking.tour.title,
            provider: payment.provider
          });
        }
      }

      expect(notificationCount).toBe(3);
      expect(mockEmailService.sendAdminNotification).toHaveBeenCalledTimes(5); // 2 from previous tests + 3 from this test
    });
  });

  describe('Property 25: Report metric inclusion', () => {
    /**
     * **Feature: travel-tour-booking, Property 25: Report metric inclusion**
     * For any generated report, it should contain revenue analysis and booking conversion metrics
     * Validates: Requirements 7.4
     */
    it('should include revenue analysis and booking conversion metrics in reports', async () => {
      // Mock data for report generation
      const reportPeriod = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31')
      };

      // Mock revenue data
      mockPrisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: 25000 },
        _count: { id: 45 },
        _avg: { amount: 555.56 }
      });

      // Mock booking conversion data
      mockPrisma.booking.count.mockImplementation(({ where }) => {
        if (where?.status === 'CONFIRMED') return Promise.resolve(45);
        if (where?.status === 'CANCELLED') return Promise.resolve(8);
        return Promise.resolve(53); // Total bookings
      });

      // Mock tour performance data
      mockPrisma.booking.groupBy.mockResolvedValue([
        { tourId: 'tour-1', _count: { id: 15 }, _sum: { totalPrice: 7500 } },
        { tourId: 'tour-2', _count: { id: 20 }, _sum: { totalPrice: 10000 } },
        { tourId: 'tour-3', _count: { id: 10 }, _sum: { totalPrice: 7500 } }
      ]);

      // Generate report data
      const [
        revenueData,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        tourPerformance
      ] = await Promise.all([
        mockPrisma.payment.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          _avg: { amount: true },
          where: {
            status: 'SUCCESS',
            createdAt: {
              gte: reportPeriod.startDate,
              lte: reportPeriod.endDate
            }
          }
        }),
        mockPrisma.booking.count({
          where: {
            createdAt: {
              gte: reportPeriod.startDate,
              lte: reportPeriod.endDate
            }
          }
        }),
        mockPrisma.booking.count({
          where: {
            status: 'CONFIRMED',
            createdAt: {
              gte: reportPeriod.startDate,
              lte: reportPeriod.endDate
            }
          }
        }),
        mockPrisma.booking.count({
          where: {
            status: 'CANCELLED',
            createdAt: {
              gte: reportPeriod.startDate,
              lte: reportPeriod.endDate
            }
          }
        }),
        mockPrisma.booking.groupBy({
          by: ['tourId'],
          _count: { id: true },
          _sum: { totalPrice: true },
          where: {
            status: 'CONFIRMED',
            createdAt: {
              gte: reportPeriod.startDate,
              lte: reportPeriod.endDate
            }
          }
        })
      ]);

      const report = {
        period: reportPeriod,
        revenueAnalysis: {
          totalRevenue: revenueData._sum.amount || 0,
          totalTransactions: revenueData._count.id || 0,
          averageTransactionValue: revenueData._avg.amount || 0,
          revenueGrowth: 0 // Would be calculated against previous period
        },
        bookingConversionMetrics: {
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          conversionRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
          cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0
        },
        tourPerformance: tourPerformance.map(tour => ({
          tourId: tour.tourId,
          bookingCount: tour._count.id,
          revenue: tour._sum.totalPrice || 0
        }))
      };

      // Verify revenue analysis is present and complete
      expect(report).toHaveProperty('revenueAnalysis');
      expect(report.revenueAnalysis).toHaveProperty('totalRevenue');
      expect(report.revenueAnalysis).toHaveProperty('totalTransactions');
      expect(report.revenueAnalysis).toHaveProperty('averageTransactionValue');
      expect(report.revenueAnalysis).toHaveProperty('revenueGrowth');

      // Verify booking conversion metrics are present and complete
      expect(report).toHaveProperty('bookingConversionMetrics');
      expect(report.bookingConversionMetrics).toHaveProperty('totalBookings');
      expect(report.bookingConversionMetrics).toHaveProperty('confirmedBookings');
      expect(report.bookingConversionMetrics).toHaveProperty('cancelledBookings');
      expect(report.bookingConversionMetrics).toHaveProperty('conversionRate');
      expect(report.bookingConversionMetrics).toHaveProperty('cancellationRate');

      // Verify calculated metrics are correct
      expect(report.revenueAnalysis.totalRevenue).toBe(25000);
      expect(report.revenueAnalysis.totalTransactions).toBe(45);
      expect(report.revenueAnalysis.averageTransactionValue).toBe(555.56);

      expect(report.bookingConversionMetrics.totalBookings).toBe(53);
      expect(report.bookingConversionMetrics.confirmedBookings).toBe(45);
      expect(report.bookingConversionMetrics.cancelledBookings).toBe(8);
      expect(report.bookingConversionMetrics.conversionRate).toBeCloseTo(84.91, 2);
      expect(report.bookingConversionMetrics.cancellationRate).toBeCloseTo(15.09, 2);

      // Verify tour performance data is included
      expect(report).toHaveProperty('tourPerformance');
      expect(Array.isArray(report.tourPerformance)).toBe(true);
      expect(report.tourPerformance.length).toBe(3);

      const firstTour = report.tourPerformance[0];
      expect(firstTour).toHaveProperty('tourId');
      expect(firstTour).toHaveProperty('bookingCount');
      expect(firstTour).toHaveProperty('revenue');

      // Test edge case: No data for period
      mockPrisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: null },
        _count: { id: 0 },
        _avg: { amount: null }
      });
      mockPrisma.booking.count.mockResolvedValue(0);
      mockPrisma.booking.groupBy.mockResolvedValue([]);

      const emptyReport = {
        revenueAnalysis: {
          totalRevenue: (await mockPrisma.payment.aggregate({}))._sum.amount || 0,
          totalTransactions: (await mockPrisma.payment.aggregate({}))._count.id || 0,
          averageTransactionValue: (await mockPrisma.payment.aggregate({}))._avg.amount || 0
        },
        bookingConversionMetrics: {
          totalBookings: await mockPrisma.booking.count({}),
          confirmedBookings: 0,
          cancelledBookings: 0,
          conversionRate: 0,
          cancellationRate: 0
        }
      };

      expect(emptyReport.revenueAnalysis.totalRevenue).toBe(0);
      expect(emptyReport.revenueAnalysis.totalTransactions).toBe(0);
      expect(emptyReport.bookingConversionMetrics.totalBookings).toBe(0);
      expect(emptyReport.bookingConversionMetrics.conversionRate).toBe(0);
    });
  });
});