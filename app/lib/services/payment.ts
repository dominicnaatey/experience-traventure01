import { prisma } from '@/app/lib/prisma';
import { PaymentMethod, PaymentProvider, PaymentStatus, Payment } from '@/app/generated/prisma';
import { BusinessRuleValidator } from '@/app/lib/validation/business-rules';
import { AdminNotificationService } from './admin-notification';
import { NotificationService } from './notification';

export interface PaymentInitData {
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: PaymentProvider;
}

export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  paymentUrl?: string;
  providerTransactionId?: string;
}

export interface WebhookData {
  paymentId: string;
  status: PaymentStatus;
  providerTransactionId: string;
  provider: PaymentProvider;
}

export class PaymentService {
  /**
   * Initialize a payment for a booking
   */
  static async initializePayment(data: PaymentInitData): Promise<PaymentResponse> {
    // Validate payment business rules
    BusinessRuleValidator.validatePayment(data.amount, data.currency, data.method, data.provider);

    // Verify booking exists and is in pending status
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { payments: true }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'PENDING') {
      throw new Error('Booking is not in pending status');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        provider: data.provider,
        status: 'PENDING'
      }
    });

    // Initialize payment with provider
    const providerResponse = await this.initializeWithProvider(payment, data);

    // Update payment with provider transaction ID if available
    if (providerResponse.providerTransactionId) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerTransactionId: providerResponse.providerTransactionId }
      });
    }

    return {
      id: payment.id,
      status: payment.status,
      paymentUrl: providerResponse.paymentUrl,
      providerTransactionId: providerResponse.providerTransactionId
    };
  }

  /**
   * Verify payment status
   */
  static async verifyPayment(paymentId: string): Promise<Payment> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Verify with provider if still pending
    if (payment.status === 'PENDING' && payment.providerTransactionId) {
      const providerStatus = await this.verifyWithProvider(payment);
      
      if (providerStatus !== payment.status) {
        return await this.updatePaymentStatus(paymentId, providerStatus, payment.providerTransactionId);
      }
    }

    return payment;
  }

  /**
   * Process webhook from payment provider
   */
  static async processWebhook(webhookData: WebhookData): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { id: webhookData.paymentId },
      include: { booking: true }
    });

    if (!payment) {
      throw new Error('Payment not found for webhook');
    }

    if (payment.provider !== webhookData.provider) {
      throw new Error('Provider mismatch in webhook');
    }

    // Update payment status based on webhook
    await this.updatePaymentStatus(
      webhookData.paymentId,
      webhookData.status,
      webhookData.providerTransactionId
    );
  }

  /**
   * Update payment status and handle booking confirmation
   */
  static async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    providerTransactionId?: string
  ): Promise<Payment> {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        providerTransactionId: providerTransactionId || undefined
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

    // Send payment status notification to customer
    try {
      await NotificationService.sendPaymentStatusEmail({
        customerEmail: payment.booking.user.email,
        customerName: payment.booking.user.name || 'Valued Customer',
        paymentId: payment.id,
        bookingId: payment.bookingId,
        tourTitle: payment.booking.tour.title,
        amount: payment.amount,
        status: payment.status,
        provider: payment.provider
      });
    } catch (notificationError) {
      console.error('Failed to send payment status notification:', notificationError);
      // Don't fail the payment update if notification fails
    }

    // Update booking status based on payment status
    if (status === 'SUCCESS' && payment.booking.status === 'PENDING') {
      await this.confirmBooking(payment.bookingId);
    }

    // Send admin notification for failed payments
    if (status === 'FAILED') {
      try {
        await AdminNotificationService.sendPaymentFailureNotification({
          type: 'PAYMENT_FAILURE',
          paymentId: payment.id,
          bookingId: payment.bookingId,
          amount: payment.amount,
          customerName: payment.booking.user.name || 'Unknown',
          customerEmail: payment.booking.user.email,
          tourTitle: payment.booking.tour.title,
          provider: payment.provider
        });
      } catch (notificationError) {
        console.error('Failed to send payment failure notification:', notificationError);
        // Don't fail the payment update if notification fails
      }
    }

    return payment;
  }

  /**
   * Confirm booking after successful payment
   */
  private static async confirmBooking(bookingId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Update booking status
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
        include: { availability: true }
      });

      // Reduce available slots
      await tx.tourAvailability.update({
        where: { id: booking.availabilityId },
        data: {
          availableSlots: {
            decrement: booking.travelersCount
          }
        }
      });
    });
  }

  /**
   * Generate invoice for a payment
   */
  static async generateInvoice(bookingId: string): Promise<{
    invoiceNumber: string;
    bookingId: string;
    customerName: string;
    customerEmail: string;
    tourTitle: string;
    destination: string;
    tourDate: Date;
    travelersCount: number;
    totalAmount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    paymentDate: Date;
    status: string;
  }> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        tour: { include: { destination: true } },
        availability: true,
        payments: { where: { status: 'SUCCESS' } }
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const successfulPayment = booking.payments.find(p => p.status === 'SUCCESS');
    if (!successfulPayment) {
      throw new Error('No successful payment found for booking');
    }

    return {
      invoiceNumber: `INV-${booking.id}`,
      bookingId: booking.id,
      customerName: booking.user.name,
      customerEmail: booking.user.email,
      tourTitle: booking.tour.title,
      destination: booking.tour.destination.name,
      tourDate: booking.availability.startDate,
      travelersCount: booking.travelersCount,
      totalAmount: booking.totalPrice,
      currency: successfulPayment.currency,
      paymentMethod: successfulPayment.method,
      paymentDate: successfulPayment.updatedAt,
      status: booking.status
    };
  }

  /**
   * Initialize payment with specific provider
   */
  private static async initializeWithProvider(
    payment: Payment,
    data: PaymentInitData
  ): Promise<{ paymentUrl?: string; providerTransactionId?: string }> {
    switch (data.provider) {
      case 'STRIPE':
        return await this.initializeStripePayment(payment, data);
      case 'PAYSTACK':
        return await this.initializePaystackPayment(payment, data);
      case 'FLUTTERWAVE':
        return await this.initializeFlutterwavePayment(payment, data);
      default:
        throw new Error(`Unsupported payment provider: ${data.provider}`);
    }
  }

  /**
   * Verify payment with specific provider
   */
  private static async verifyWithProvider(payment: Payment): Promise<PaymentStatus> {
    switch (payment.provider) {
      case 'STRIPE':
        return await this.verifyStripePayment(payment);
      case 'PAYSTACK':
        return await this.verifyPaystackPayment(payment);
      case 'FLUTTERWAVE':
        return await this.verifyFlutterwavePayment(payment);
      default:
        throw new Error(`Unsupported payment provider: ${payment.provider}`);
    }
  }

  /**
   * Stripe payment initialization
   */
  private static async initializeStripePayment(
    payment: Payment,
    _data: PaymentInitData
  ): Promise<{ paymentUrl?: string; providerTransactionId?: string }> {
    // TODO: Implement Stripe integration
    // For now, return mock response
    return {
      paymentUrl: `https://checkout.stripe.com/pay/${payment.id}`,
      providerTransactionId: `stripe_${payment.id}`
    };
  }

  /**
   * Paystack payment initialization
   */
  private static async initializePaystackPayment(
    payment: Payment,
    _data: PaymentInitData
  ): Promise<{ paymentUrl?: string; providerTransactionId?: string }> {
    // TODO: Implement Paystack integration
    // For now, return mock response
    return {
      paymentUrl: `https://checkout.paystack.com/pay/${payment.id}`,
      providerTransactionId: `paystack_${payment.id}`
    };
  }

  /**
   * Flutterwave payment initialization
   */
  private static async initializeFlutterwavePayment(
    payment: Payment,
    _data: PaymentInitData
  ): Promise<{ paymentUrl?: string; providerTransactionId?: string }> {
    // TODO: Implement Flutterwave integration
    // For now, return mock response
    return {
      paymentUrl: `https://checkout.flutterwave.com/pay/${payment.id}`,
      providerTransactionId: `flutterwave_${payment.id}`
    };
  }

  /**
   * Stripe payment verification
   */
  private static async verifyStripePayment(payment: Payment): Promise<PaymentStatus> {
    // TODO: Implement Stripe verification
    // For now, return current status
    return payment.status;
  }

  /**
   * Paystack payment verification
   */
  private static async verifyPaystackPayment(payment: Payment): Promise<PaymentStatus> {
    // TODO: Implement Paystack verification
    // For now, return current status
    return payment.status;
  }

  /**
   * Flutterwave payment verification
   */
  private static async verifyFlutterwavePayment(payment: Payment): Promise<PaymentStatus> {
    // TODO: Implement Flutterwave verification
    // For now, return current status
    return payment.status;
  }
}