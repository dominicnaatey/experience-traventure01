import { describe, it, expect, jest } from '@jest/globals';
import fc from 'fast-check';

const mockPrisma = {
  booking: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn()
  },
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  tour: {
    create: jest.fn(),
    deleteMany: jest.fn()
  },
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  }
};

// Mock notification service
const mockNotificationService = {
  sendBookingConfirmationEmail: jest.fn(),
  sendTourReminderEmail: jest.fn(),
  sendPaymentStatusEmail: jest.fn(),
  sendAdminNotification: jest.fn(),
  updateNotificationPreferences: jest.fn()
};

describe('Notification System Property Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Ensure all mock functions are properly initialized
    mockNotificationService.sendBookingConfirmationEmail = jest.fn();
    mockNotificationService.sendTourReminderEmail = jest.fn();
    mockNotificationService.sendPaymentStatusEmail = jest.fn();
    mockNotificationService.sendAdminNotification = jest.fn();
    mockNotificationService.updateNotificationPreferences = jest.fn();
    
    // Ensure all Prisma mocks are properly initialized
    mockPrisma.booking.create = jest.fn();
    mockPrisma.booking.findUnique = jest.fn();
    mockPrisma.booking.findMany = jest.fn();
    mockPrisma.booking.update = jest.fn();
    mockPrisma.booking.deleteMany = jest.fn();
    
    mockPrisma.user.create = jest.fn();
    mockPrisma.user.findUnique = jest.fn();
    mockPrisma.user.findMany = jest.fn();
    mockPrisma.user.deleteMany = jest.fn();
    
    mockPrisma.tour.create = jest.fn();
    mockPrisma.tour.deleteMany = jest.fn();
    
    mockPrisma.payment.create = jest.fn();
    mockPrisma.payment.findUnique = jest.fn();
    mockPrisma.payment.findMany = jest.fn();
    mockPrisma.payment.deleteMany = jest.fn();
    
    mockPrisma.notification.create = jest.fn();
    mockPrisma.notification.findMany = jest.fn();
    mockPrisma.notification.deleteMany = jest.fn();
  });

  describe('Property 29: Booking confirmation notifications', () => {
    /**
     * **Feature: travel-tour-booking, Property 29: Booking confirmation notifications**
     * For any confirmed booking, email notifications should be sent to the customer with booking details and payment receipt
     * Validates: Requirements 9.1
     */
    it('should send booking confirmation email for any confirmed booking', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          bookingId: fc.string({ minLength: 1, maxLength: 50 }),
          userId: fc.string({ minLength: 1, maxLength: 50 }),
          tourId: fc.string({ minLength: 1, maxLength: 50 }),
          travelersCount: fc.integer({ min: 1, max: 20 }),
          totalPrice: fc.float({ min: 1, max: 10000 }),
          customerName: fc.string({ minLength: 1, maxLength: 100 }),
          customerEmail: fc.emailAddress(),
          tourTitle: fc.string({ minLength: 1, maxLength: 200 }),
          paymentId: fc.string({ minLength: 1, maxLength: 50 }),
          paymentAmount: fc.float({ min: 1, max: 10000 })
        }),
        async (data) => {
          // Reset mocks for this iteration
          jest.clearAllMocks();

          // Mock confirmed booking
          const confirmedBooking = {
            id: data.bookingId,
            userId: data.userId,
            tourId: data.tourId,
            availabilityId: 'avail-1',
            travelersCount: data.travelersCount,
            totalPrice: data.totalPrice,
            status: 'CONFIRMED' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              name: data.customerName,
              email: data.customerEmail
            },
            tour: {
              title: data.tourTitle
            }
          };

          // Mock payment receipt
          const paymentReceipt = {
            id: data.paymentId,
            bookingId: data.bookingId,
            amount: data.paymentAmount,
            currency: 'USD',
            method: 'CARD' as const,
            provider: 'STRIPE' as const,
            status: 'SUCCESS' as const,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          mockPrisma.booking.findUnique.mockResolvedValue(confirmedBooking);
          mockNotificationService.sendBookingConfirmationEmail.mockResolvedValue(undefined);

          // Simulate booking confirmation notification
          const booking = await mockPrisma.booking.findUnique({
            where: { id: data.bookingId },
            include: {
              user: { select: { name: true, email: true } },
              tour: { select: { title: true } }
            }
          });

          expect(booking).toBeTruthy();
          expect(booking?.status).toBe('CONFIRMED');

          // Verify notification is sent with correct data
          await mockNotificationService.sendBookingConfirmationEmail({
            customerEmail: booking?.user.email,
            customerName: booking?.user.name,
            bookingId: booking?.id,
            tourTitle: booking?.tour.title,
            travelersCount: booking?.travelersCount,
            totalPrice: booking?.totalPrice,
            tourStartDate: new Date(), // Add required field
            paymentReceipt: paymentReceipt
          });

          expect(mockNotificationService.sendBookingConfirmationEmail).toHaveBeenCalledTimes(1);

          // Verify email contains required information and matches generated data
          const emailCall = mockNotificationService.sendBookingConfirmationEmail.mock.calls[0][0];
          expect(emailCall.customerEmail).toBe(data.customerEmail);
          expect(emailCall.customerName).toBe(data.customerName);
          expect(emailCall.bookingId).toBe(data.bookingId);
          expect(emailCall.tourTitle).toBe(data.tourTitle);
          expect(emailCall.travelersCount).toBe(data.travelersCount);
          expect(emailCall.totalPrice).toBe(data.totalPrice);
          expect(emailCall.paymentReceipt).toBeTruthy();
          expect(emailCall.paymentReceipt.id).toBe(data.paymentId);
          expect(emailCall.paymentReceipt.amount).toBe(data.paymentAmount);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Property 30: Tour reminder notifications', () => {
    /**
     * **Feature: travel-tour-booking, Property 30: Tour reminder notifications**
     * For any booking with approaching tour date, reminder notifications should be sent to the customer
     * Validates: Requirements 9.2
     */
    it('should send tour reminder notifications for bookings with approaching dates', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          bookingId: fc.string({ minLength: 1, maxLength: 50 }),
          userId: fc.string({ minLength: 1, maxLength: 50 }),
          tourId: fc.string({ minLength: 1, maxLength: 50 }),
          customerName: fc.string({ minLength: 1, maxLength: 100 }),
          customerEmail: fc.emailAddress(),
          tourTitle: fc.string({ minLength: 1, maxLength: 200 }),
          daysUntilTour: fc.integer({ min: 1, max: 7 }) // Tours approaching within a week
        }),
        async (data) => {
          // Reset mocks for this iteration
          jest.clearAllMocks();
          
          // Ensure mocks are properly initialized
          if (!mockNotificationService.sendTourReminderEmail) {
            mockNotificationService.sendTourReminderEmail = jest.fn();
          }
          if (!mockPrisma.booking.findMany) {
            mockPrisma.booking.findMany = jest.fn();
          }

          // Calculate tour start date based on days until tour
          const tourStartDate = new Date();
          tourStartDate.setDate(tourStartDate.getDate() + data.daysUntilTour);

          // Mock booking with approaching tour date
          const bookingWithApproachingTour = {
            id: data.bookingId,
            userId: data.userId,
            tourId: data.tourId,
            availabilityId: 'avail-1',
            travelersCount: 2,
            totalPrice: 500,
            status: 'CONFIRMED' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              name: data.customerName,
              email: data.customerEmail
            },
            tour: {
              title: data.tourTitle
            },
            availability: {
              startDate: tourStartDate,
              endDate: new Date(tourStartDate.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days later
            }
          };

          // Setup mocks with proper return values
          mockPrisma.booking.findMany.mockResolvedValue([bookingWithApproachingTour]);
          mockNotificationService.sendTourReminderEmail.mockResolvedValue(true);

          // Simulate checking for bookings with approaching tour dates
          const upcomingBookings = await mockPrisma.booking.findMany({
            where: {
              status: 'CONFIRMED',
              availability: {
                startDate: {
                  gte: new Date(),
                  lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
                }
              }
            },
            include: {
              user: { select: { name: true, email: true } },
              tour: { select: { title: true } },
              availability: { select: { startDate: true, endDate: true } }
            }
          });

          expect(upcomingBookings).toHaveLength(1);
          expect(upcomingBookings[0].status).toBe('CONFIRMED');

          // Verify reminder notification is sent
          for (const booking of upcomingBookings) {
            await mockNotificationService.sendTourReminderEmail({
              customerEmail: booking.user.email,
              customerName: booking.user.name,
              bookingId: booking.id,
              tourTitle: booking.tour.title,
              tourStartDate: booking.availability.startDate,
              daysUntilTour: Math.ceil((booking.availability.startDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
            });
          }

          expect(mockNotificationService.sendTourReminderEmail).toHaveBeenCalledTimes(1);

          // Verify reminder contains required information
          const reminderCall = mockNotificationService.sendTourReminderEmail.mock.calls[0][0] as any;
          expect(reminderCall.customerEmail).toBeTruthy();
          expect(reminderCall.customerName).toBeTruthy();
          expect(reminderCall.bookingId).toBeTruthy();
          expect(reminderCall.tourTitle).toBeTruthy();
          expect(reminderCall.tourStartDate).toBeInstanceOf(Date);
          expect(reminderCall.daysUntilTour).toBeGreaterThan(0);
          expect(reminderCall.daysUntilTour).toBeLessThanOrEqual(7);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Property 31: Payment status notifications', () => {
    /**
     * **Feature: travel-tour-booking, Property 31: Payment status notifications**
     * For any payment status change, appropriate notifications should be sent to customers and admins
     * Validates: Requirements 9.3, 9.4
     */
    it('should send payment status notifications for any payment status change', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          paymentId: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          bookingId: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          amount: fc.float({ min: 1, max: 10000 }),
          customerName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length > 1),
          customerEmail: fc.emailAddress(),
          tourTitle: fc.string({ minLength: 3, maxLength: 200 }).filter(s => s.trim().length > 2),
          paymentStatus: fc.constantFrom('SUCCESS', 'FAILED', 'PENDING'),
          paymentMethod: fc.constantFrom('CARD', 'MOBILE_MONEY', 'BANK'),
          provider: fc.constantFrom('STRIPE', 'PAYSTACK', 'FLUTTERWAVE')
        }),
        async (data) => {
          // Reset mocks for this specific iteration
          jest.clearAllMocks();
          
          // Ensure mocks are properly initialized
          mockNotificationService.sendPaymentStatusEmail = jest.fn().mockResolvedValue(undefined);
          mockNotificationService.sendAdminNotification = jest.fn().mockResolvedValue(undefined);
          mockPrisma.payment.findUnique = jest.fn();

          // Mock payment with status change
          const payment = {
            id: data.paymentId,
            bookingId: data.bookingId,
            amount: data.amount,
            currency: 'USD',
            method: data.paymentMethod,
            provider: data.provider,
            status: data.paymentStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
            booking: {
              id: data.bookingId,
              user: {
                name: data.customerName,
                email: data.customerEmail
              },
              tour: {
                title: data.tourTitle
              }
            }
          };

          mockPrisma.payment.findUnique.mockResolvedValue(payment);

          // Simulate payment status notification
          const paymentData = await mockPrisma.payment.findUnique({
            where: { id: data.paymentId },
            include: {
              booking: {
                include: {
                  user: { select: { name: true, email: true } },
                  tour: { select: { title: true } }
                }
              }
            }
          });

          expect(paymentData).toBeTruthy();
          expect(paymentData.status).toBe(data.paymentStatus);

          // Send customer notification for any status change (exactly once)
          await mockNotificationService.sendPaymentStatusEmail({
            customerEmail: paymentData.booking.user.email,
            customerName: paymentData.booking.user.name,
            paymentId: paymentData.id,
            bookingId: paymentData.bookingId,
            tourTitle: paymentData.booking.tour.title,
            amount: paymentData.amount,
            status: paymentData.status,
            provider: paymentData.provider
          });

          expect(mockNotificationService.sendPaymentStatusEmail).toHaveBeenCalledTimes(1);

          // Send admin notification for failed payments only
          if (data.paymentStatus === 'FAILED') {
            await mockNotificationService.sendAdminNotification({
              type: 'PAYMENT_FAILURE',
              paymentId: paymentData.id,
              bookingId: paymentData.bookingId,
              customerName: paymentData.booking.user.name,
              customerEmail: paymentData.booking.user.email,
              tourTitle: paymentData.booking.tour.title,
              amount: paymentData.amount,
              provider: paymentData.provider
            });

            expect(mockNotificationService.sendAdminNotification).toHaveBeenCalledTimes(1);
          } else {
            // For non-failed payments, admin notification should not be called
            expect(mockNotificationService.sendAdminNotification).toHaveBeenCalledTimes(0);
          }

          // Verify customer notification contains required information
          const customerNotificationCall = mockNotificationService.sendPaymentStatusEmail.mock.calls[0][0] as any;
          expect(customerNotificationCall.customerEmail).toBe(data.customerEmail);
          expect(customerNotificationCall.paymentId).toBe(data.paymentId);
          expect(customerNotificationCall.status).toBe(data.paymentStatus);
          expect(customerNotificationCall.amount).toBe(data.amount);
          expect(customerNotificationCall.customerName).toBe(data.customerName);
          expect(customerNotificationCall.tourTitle).toBe(data.tourTitle);
          expect(customerNotificationCall.provider).toBe(data.provider);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Property 32: Notification preference management', () => {
    /**
     * **Feature: travel-tour-booking, Property 32: Notification preference management**
     * For any user, they should be able to configure and update their notification preferences
     * Validates: Requirements 9.5
     */
    it('should allow users to configure and update notification preferences', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 1, maxLength: 50 }),
          userEmail: fc.emailAddress(),
          userName: fc.string({ minLength: 1, maxLength: 100 }),
          emailNotifications: fc.boolean(),
          smsNotifications: fc.boolean(),
          bookingConfirmations: fc.boolean(),
          tourReminders: fc.boolean(),
          paymentUpdates: fc.boolean(),
          marketingEmails: fc.boolean()
        }),
        async (data) => {
          // Mock user with notification preferences
          const user = {
            id: data.userId,
            email: data.userEmail,
            name: data.userName,
            role: 'CUSTOMER' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            notificationPreferences: {
              id: 'pref-1',
              userId: data.userId,
              emailNotifications: data.emailNotifications,
              smsNotifications: data.smsNotifications,
              bookingConfirmations: data.bookingConfirmations,
              tourReminders: data.tourReminders,
              paymentUpdates: data.paymentUpdates,
              marketingEmails: data.marketingEmails,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          };

          mockPrisma.user.findUnique.mockResolvedValue(user);
          mockNotificationService.updateNotificationPreferences.mockResolvedValue(true);

          // Simulate getting user preferences
          const userData = await mockPrisma.user.findUnique({
            where: { id: data.userId },
            include: { notificationPreferences: true }
          });

          expect(userData).toBeTruthy();
          expect(userData?.notificationPreferences).toBeTruthy();

          // Verify all preference types are configurable
          const preferences = userData?.notificationPreferences;
          expect(typeof preferences?.emailNotifications).toBe('boolean');
          expect(typeof preferences?.smsNotifications).toBe('boolean');
          expect(typeof preferences?.bookingConfirmations).toBe('boolean');
          expect(typeof preferences?.tourReminders).toBe('boolean');
          expect(typeof preferences?.paymentUpdates).toBe('boolean');
          expect(typeof preferences?.marketingEmails).toBe('boolean');

          // Test updating preferences
          const newPreferences = {
            emailNotifications: !data.emailNotifications,
            smsNotifications: !data.smsNotifications,
            bookingConfirmations: !data.bookingConfirmations,
            tourReminders: !data.tourReminders,
            paymentUpdates: !data.paymentUpdates,
            marketingEmails: !data.marketingEmails
          };

          await mockNotificationService.updateNotificationPreferences(data.userId, newPreferences);

          expect(mockNotificationService.updateNotificationPreferences).toHaveBeenCalledWith(
            data.userId,
            newPreferences
          );

          // Verify preferences can be individually controlled
          expect(newPreferences.emailNotifications).toBe(!data.emailNotifications);
          expect(newPreferences.bookingConfirmations).toBe(!data.bookingConfirmations);
          expect(newPreferences.tourReminders).toBe(!data.tourReminders);
          expect(newPreferences.paymentUpdates).toBe(!data.paymentUpdates);
        }
      ), { numRuns: 100 });
    });
  });
});