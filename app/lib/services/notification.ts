import { prisma } from '../prisma';

export interface BookingConfirmationData {
  customerEmail: string;
  customerName: string;
  bookingId: string;
  tourTitle: string;
  travelersCount: number;
  totalPrice: number;
  tourStartDate: Date;
  paymentReceipt: {
    id: string;
    amount: number;
    currency: string;
    method: string;
    provider: string;
  };
}

export interface TourReminderData {
  customerEmail: string;
  customerName: string;
  bookingId: string;
  tourTitle: string;
  tourStartDate: Date;
  daysUntilTour: number;
}

export interface PaymentStatusData {
  customerEmail: string;
  customerName: string;
  paymentId: string;
  bookingId: string;
  tourTitle: string;
  amount: number;
  status: string;
  provider: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingConfirmations: boolean;
  tourReminders: boolean;
  paymentUpdates: boolean;
  marketingEmails: boolean;
}

export class NotificationService {
  /**
   * Send booking confirmation email to customer
   */
  static async sendBookingConfirmationEmail(data: BookingConfirmationData): Promise<void> {
    try {
      // Check user notification preferences
      const user = await prisma.user.findUnique({
        where: { email: data.customerEmail },
        include: { notificationPreferences: true }
      });

      if (!user?.notificationPreferences?.bookingConfirmations) {
        console.log(`Booking confirmation email skipped for ${data.customerEmail} - disabled in preferences`);
        return;
      }

      const emailContent = this.generateBookingConfirmationEmail(data);
      
      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      console.log('Booking Confirmation Email:', {
        to: data.customerEmail,
        subject: `Booking Confirmation - ${data.tourTitle}`,
        content: emailContent
      });

      // Store notification record for audit trail
      await this.storeNotificationRecord({
        type: 'BOOKING_CONFIRMATION',
        recipientEmail: data.customerEmail,
        bookingId: data.bookingId,
        content: emailContent
      });

    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send tour reminder email to customer
   */
  static async sendTourReminderEmail(data: TourReminderData): Promise<void> {
    try {
      // Check user notification preferences
      const user = await prisma.user.findUnique({
        where: { email: data.customerEmail },
        include: { notificationPreferences: true }
      });

      if (!user?.notificationPreferences?.tourReminders) {
        console.log(`Tour reminder email skipped for ${data.customerEmail} - disabled in preferences`);
        return;
      }

      const emailContent = this.generateTourReminderEmail(data);
      
      // TODO: Integrate with actual email service
      console.log('Tour Reminder Email:', {
        to: data.customerEmail,
        subject: `Tour Reminder - ${data.tourTitle} in ${data.daysUntilTour} days`,
        content: emailContent
      });

      // Store notification record
      await this.storeNotificationRecord({
        type: 'TOUR_REMINDER',
        recipientEmail: data.customerEmail,
        bookingId: data.bookingId,
        content: emailContent
      });

    } catch (error) {
      console.error('Error sending tour reminder email:', error);
      throw error;
    }
  }

  /**
   * Send payment status notification to customer
   */
  static async sendPaymentStatusEmail(data: PaymentStatusData): Promise<void> {
    try {
      // Check user notification preferences
      const user = await prisma.user.findUnique({
        where: { email: data.customerEmail },
        include: { notificationPreferences: true }
      });

      if (!user?.notificationPreferences?.paymentUpdates) {
        console.log(`Payment status email skipped for ${data.customerEmail} - disabled in preferences`);
        return;
      }

      const emailContent = this.generatePaymentStatusEmail(data);
      
      // TODO: Integrate with actual email service
      console.log('Payment Status Email:', {
        to: data.customerEmail,
        subject: `Payment ${data.status} - ${data.tourTitle}`,
        content: emailContent
      });

      // Store notification record
      await this.storeNotificationRecord({
        type: 'PAYMENT_STATUS',
        recipientEmail: data.customerEmail,
        bookingId: data.bookingId,
        paymentId: data.paymentId,
        content: emailContent
      });

    } catch (error) {
      console.error('Error sending payment status email:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  static async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: {
            upsert: {
              create: {
                emailNotifications: preferences.emailNotifications ?? true,
                smsNotifications: preferences.smsNotifications ?? false,
                bookingConfirmations: preferences.bookingConfirmations ?? true,
                tourReminders: preferences.tourReminders ?? true,
                paymentUpdates: preferences.paymentUpdates ?? true,
                marketingEmails: preferences.marketingEmails ?? false
              },
              update: preferences
            }
          }
        }
      });

      console.log(`Notification preferences updated for user ${userId}`);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Check for upcoming tours and send reminders
   */
  static async sendTourReminders(): Promise<void> {
    try {
      const reminderDays = [7, 3, 1]; // Send reminders 7, 3, and 1 day before tour

      for (const days of reminderDays) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const upcomingBookings = await prisma.booking.findMany({
          where: {
            status: 'CONFIRMED',
            availability: {
              startDate: {
                gte: targetDate,
                lt: nextDay
              }
            }
          },
          include: {
            user: { select: { name: true, email: true } },
            tour: { select: { title: true } },
            availability: { select: { startDate: true, endDate: true } }
          }
        });

        for (const booking of upcomingBookings) {
          await this.sendTourReminderEmail({
            customerEmail: booking.user.email,
            customerName: booking.user.name || 'Valued Customer',
            bookingId: booking.id,
            tourTitle: booking.tour.title,
            tourStartDate: booking.availability.startDate,
            daysUntilTour: days
          });
        }
      }
    } catch (error) {
      console.error('Error sending tour reminders:', error);
      throw error;
    }
  }

  /**
   * Generate booking confirmation email content
   */
  private static generateBookingConfirmationEmail(data: BookingConfirmationData): string {
    return `
      Dear ${data.customerName},

      Thank you for booking with us! Your tour reservation has been confirmed.

      Booking Details:
      - Booking ID: ${data.bookingId}
      - Tour: ${data.tourTitle}
      - Number of Travelers: ${data.travelersCount}
      - Total Amount: ${data.paymentReceipt.currency} ${data.totalPrice}
      - Tour Start Date: ${data.tourStartDate.toDateString()}

      Payment Receipt:
      - Payment ID: ${data.paymentReceipt.id}
      - Amount: ${data.paymentReceipt.currency} ${data.paymentReceipt.amount}
      - Method: ${data.paymentReceipt.method}
      - Provider: ${data.paymentReceipt.provider}

      We look forward to providing you with an amazing travel experience!

      Best regards,
      Travel & Tour Team
    `;
  }

  /**
   * Generate tour reminder email content
   */
  private static generateTourReminderEmail(data: TourReminderData): string {
    return `
      Dear ${data.customerName},

      This is a friendly reminder that your tour is coming up soon!

      Tour Details:
      - Booking ID: ${data.bookingId}
      - Tour: ${data.tourTitle}
      - Start Date: ${data.tourStartDate.toDateString()}
      - Days Until Tour: ${data.daysUntilTour}

      Please make sure you have all necessary documents and preparations ready.

      If you have any questions, please don't hesitate to contact us.

      Best regards,
      Travel & Tour Team
    `;
  }

  /**
   * Generate payment status email content
   */
  private static generatePaymentStatusEmail(data: PaymentStatusData): string {
    const statusMessage = data.status === 'SUCCESS' 
      ? 'Your payment has been successfully processed.'
      : data.status === 'FAILED'
      ? 'Unfortunately, your payment could not be processed. Please try again or contact support.'
      : 'Your payment is currently being processed.';

    return `
      Dear ${data.customerName},

      Payment Status Update

      ${statusMessage}

      Payment Details:
      - Payment ID: ${data.paymentId}
      - Booking ID: ${data.bookingId}
      - Tour: ${data.tourTitle}
      - Amount: ${data.amount}
      - Status: ${data.status}
      - Provider: ${data.provider}

      ${data.status === 'FAILED' ? 'Please contact our support team if you need assistance.' : ''}

      Best regards,
      Travel & Tour Team
    `;
  }

  /**
   * Store notification record for audit trail
   */
  private static async storeNotificationRecord(data: {
    type: string;
    recipientEmail: string;
    bookingId: string;
    paymentId?: string;
    content: string;
  }): Promise<void> {
    try {
      // TODO: Create notifications table in database schema
      console.log('Storing notification record:', {
        type: data.type,
        recipient: data.recipientEmail,
        bookingId: data.bookingId,
        paymentId: data.paymentId,
        timestamp: new Date()
      });

      // In a real implementation, this would store in a notifications table:
      // await prisma.notification.create({
      //   data: {
      //     type: data.type,
      //     recipientEmail: data.recipientEmail,
      //     bookingId: data.bookingId,
      //     paymentId: data.paymentId,
      //     content: data.content,
      //     sentAt: new Date()
      //   }
      // });
    } catch (error) {
      console.error('Error storing notification record:', error);
      // Don't throw here as notification storage failure shouldn't break the main flow
    }
  }
}