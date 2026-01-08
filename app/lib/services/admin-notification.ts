import { prisma } from '../prisma';

export interface AdminNotificationData {
  type: 'PAYMENT_FAILURE' | 'PAYMENT_DISPUTE' | 'NEW_BOOKING' | 'BOOKING_CANCELLATION';
  paymentId?: string;
  bookingId: string;
  amount?: number;
  customerName: string;
  customerEmail: string;
  tourTitle: string;
  provider?: string;
  reason?: string;
}

export class AdminNotificationService {
  /**
   * Send notification to admin users about payment failures or disputes
   */
  static async sendPaymentFailureNotification(data: AdminNotificationData): Promise<void> {
    try {
      // Get all admin users
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true, name: true }
      });

      if (adminUsers.length === 0) {
        console.warn('No admin users found to send notification');
        return;
      }

      // In a real implementation, this would integrate with an email service
      // For now, we'll log the notification and store it in the database
      const notificationContent = this.generateNotificationContent(data);
      
      console.log('Admin Notification:', {
        type: data.type,
        recipients: adminUsers.map(admin => admin.email),
        content: notificationContent
      });

      // Store notification in database for audit trail
      await this.storeNotification(data, adminUsers);

      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      // await this.sendEmail(adminUsers, notificationContent);
      
    } catch (error) {
      console.error('Error sending admin notification:', error);
      throw error;
    }
  }

  /**
   * Send notification about new bookings
   */
  static async sendNewBookingNotification(bookingId: string): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: { select: { name: true, email: true } },
          tour: { select: { title: true } }
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const notificationData: AdminNotificationData = {
        type: 'NEW_BOOKING',
        bookingId: booking.id,
        amount: booking.totalPrice,
        customerName: booking.user.name || 'Unknown',
        customerEmail: booking.user.email,
        tourTitle: booking.tour.title
      };

      await this.sendPaymentFailureNotification(notificationData);
    } catch (error) {
      console.error('Error sending new booking notification:', error);
      throw error;
    }
  }

  /**
   * Generate notification content based on type
   */
  private static generateNotificationContent(data: AdminNotificationData): string {
    switch (data.type) {
      case 'PAYMENT_FAILURE':
        return `
          Payment Failure Alert
          
          A payment has failed for booking ${data.bookingId}.
          
          Details:
          - Customer: ${data.customerName} (${data.customerEmail})
          - Tour: ${data.tourTitle}
          - Amount: $${data.amount}
          - Payment Provider: ${data.provider}
          - Payment ID: ${data.paymentId}
          
          Please review and take appropriate action.
        `;
      
      case 'PAYMENT_DISPUTE':
        return `
          Payment Dispute Alert
          
          A payment dispute has been raised for booking ${data.bookingId}.
          
          Details:
          - Customer: ${data.customerName} (${data.customerEmail})
          - Tour: ${data.tourTitle}
          - Amount: $${data.amount}
          - Payment Provider: ${data.provider}
          - Payment ID: ${data.paymentId}
          
          Please investigate and respond to the dispute.
        `;
      
      case 'NEW_BOOKING':
        return `
          New Booking Alert
          
          A new booking has been created.
          
          Details:
          - Customer: ${data.customerName} (${data.customerEmail})
          - Tour: ${data.tourTitle}
          - Amount: $${data.amount}
          - Booking ID: ${data.bookingId}
          
          Please monitor payment status.
        `;
      
      case 'BOOKING_CANCELLATION':
        return `
          Booking Cancellation Alert
          
          A booking has been cancelled.
          
          Details:
          - Customer: ${data.customerName} (${data.customerEmail})
          - Tour: ${data.tourTitle}
          - Booking ID: ${data.bookingId}
          - Reason: ${data.reason || 'Not specified'}
          
          Please review cancellation policy compliance.
        `;
      
      default:
        return `
          Admin Notification
          
          Type: ${data.type}
          Booking ID: ${data.bookingId}
          Customer: ${data.customerName} (${data.customerEmail})
          Tour: ${data.tourTitle}
        `;
    }
  }

  /**
   * Store notification in database for audit trail
   */
  private static async storeNotification(
    data: AdminNotificationData, 
    adminUsers: { email: string; name: string | null }[]
  ): Promise<void> {
    try {
      // Create notification record
      // Note: This assumes a notifications table exists
      // In a real implementation, you might want to create this table
      console.log('Storing notification:', {
        type: data.type,
        bookingId: data.bookingId,
        paymentId: data.paymentId,
        recipients: adminUsers.length,
        timestamp: new Date()
      });
      
      // TODO: Implement actual database storage
      // await prisma.notification.create({
      //   data: {
      //     type: data.type,
      //     bookingId: data.bookingId,
      //     paymentId: data.paymentId,
      //     content: this.generateNotificationContent(data),
      //     recipients: adminUsers.map(admin => admin.email),
      //     sentAt: new Date()
      //   }
      // });
      
    } catch (error) {
      console.error('Error storing notification:', error);
      // Don't throw here as notification storage failure shouldn't break the main flow
    }
  }

  /**
   * Check for payment failures and send notifications
   */
  static async checkAndNotifyPaymentFailures(): Promise<void> {
    try {
      // Get recent failed payments that haven't been notified
      const failedPayments = await prisma.payment.findMany({
        where: {
          status: 'FAILED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          booking: {
            include: {
              user: { select: { name: true, email: true } },
              tour: { select: { title: true } }
            }
          }
        }
      });

      for (const payment of failedPayments) {
        const notificationData: AdminNotificationData = {
          type: 'PAYMENT_FAILURE',
          paymentId: payment.id,
          bookingId: payment.bookingId,
          amount: payment.amount,
          customerName: payment.booking.user.name || 'Unknown',
          customerEmail: payment.booking.user.email,
          tourTitle: payment.booking.tour.title,
          provider: payment.provider
        };

        await this.sendPaymentFailureNotification(notificationData);
      }
    } catch (error) {
      console.error('Error checking payment failures:', error);
      throw error;
    }
  }
}
