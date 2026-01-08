export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplates {
  /**
   * Booking confirmation email template
   */
  static bookingConfirmation(data: {
    customerName: string;
    bookingId: string;
    tourTitle: string;
    travelersCount: number;
    totalPrice: number;
    currency: string;
    tourStartDate: string;
    paymentId: string;
    paymentAmount: number;
    paymentMethod: string;
    paymentProvider: string;
  }): EmailTemplate {
    const subject = `Booking Confirmed - ${data.tourTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Thank you for booking with us! Your tour reservation has been confirmed.</p>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <p><strong>Booking ID:</strong> ${data.bookingId}</p>
              <p><strong>Tour:</strong> ${data.tourTitle}</p>
              <p><strong>Number of Travelers:</strong> ${data.travelersCount}</p>
              <p><strong>Total Amount:</strong> ${data.currency} ${data.totalPrice}</p>
              <p><strong>Tour Start Date:</strong> ${data.tourStartDate}</p>
            </div>

            <div class="booking-details">
              <h3>Payment Receipt</h3>
              <p><strong>Payment ID:</strong> ${data.paymentId}</p>
              <p><strong>Amount:</strong> ${data.currency} ${data.paymentAmount}</p>
              <p><strong>Method:</strong> ${data.paymentMethod}</p>
              <p><strong>Provider:</strong> ${data.paymentProvider}</p>
            </div>

            <p>We look forward to providing you with an amazing travel experience!</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>Travel & Tour Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Dear ${data.customerName},

      Thank you for booking with us! Your tour reservation has been confirmed.

      Booking Details:
      - Booking ID: ${data.bookingId}
      - Tour: ${data.tourTitle}
      - Number of Travelers: ${data.travelersCount}
      - Total Amount: ${data.currency} ${data.totalPrice}
      - Tour Start Date: ${data.tourStartDate}

      Payment Receipt:
      - Payment ID: ${data.paymentId}
      - Amount: ${data.currency} ${data.paymentAmount}
      - Method: ${data.paymentMethod}
      - Provider: ${data.paymentProvider}

      We look forward to providing you with an amazing travel experience!

      Best regards,
      Travel & Tour Team
    `;

    return { subject, html, text };
  }

  /**
   * Tour reminder email template
   */
  static tourReminder(data: {
    customerName: string;
    bookingId: string;
    tourTitle: string;
    tourStartDate: string;
    daysUntilTour: number;
  }): EmailTemplate {
    const subject = `Tour Reminder - ${data.tourTitle} in ${data.daysUntilTour} days`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tour Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .tour-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .countdown { font-size: 24px; font-weight: bold; color: #28a745; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Tour Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>This is a friendly reminder that your tour is coming up soon!</p>
            
            <div class="countdown">
              ${data.daysUntilTour} days to go!
            </div>

            <div class="tour-details">
              <h3>Tour Details</h3>
              <p><strong>Booking ID:</strong> ${data.bookingId}</p>
              <p><strong>Tour:</strong> ${data.tourTitle}</p>
              <p><strong>Start Date:</strong> ${data.tourStartDate}</p>
            </div>

            <p>Please make sure you have all necessary documents and preparations ready.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>Travel & Tour Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Dear ${data.customerName},

      This is a friendly reminder that your tour is coming up soon!

      Tour Details:
      - Booking ID: ${data.bookingId}
      - Tour: ${data.tourTitle}
      - Start Date: ${data.tourStartDate}
      - Days Until Tour: ${data.daysUntilTour}

      Please make sure you have all necessary documents and preparations ready.

      If you have any questions, please don't hesitate to contact us.

      Best regards,
      Travel & Tour Team
    `;

    return { subject, html, text };
  }

  /**
   * Payment status email template
   */
  static paymentStatus(data: {
    customerName: string;
    paymentId: string;
    bookingId: string;
    tourTitle: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
  }): EmailTemplate {
    const statusMessage = data.status === 'SUCCESS' 
      ? 'Your payment has been successfully processed.'
      : data.status === 'FAILED'
      ? 'Unfortunately, your payment could not be processed. Please try again or contact support.'
      : 'Your payment is currently being processed.';

    const statusColor = data.status === 'SUCCESS' ? '#28a745' : data.status === 'FAILED' ? '#dc3545' : '#ffc107';
    
    const subject = `Payment ${data.status} - ${data.tourTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .payment-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .status { font-size: 18px; font-weight: bold; color: ${statusColor}; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Status Update</h1>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            
            <div class="status">
              ${statusMessage}
            </div>

            <div class="payment-details">
              <h3>Payment Details</h3>
              <p><strong>Payment ID:</strong> ${data.paymentId}</p>
              <p><strong>Booking ID:</strong> ${data.bookingId}</p>
              <p><strong>Tour:</strong> ${data.tourTitle}</p>
              <p><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
              <p><strong>Status:</strong> ${data.status}</p>
              <p><strong>Provider:</strong> ${data.provider}</p>
            </div>

            ${data.status === 'FAILED' ? '<p><strong>Please contact our support team if you need assistance.</strong></p>' : ''}
          </div>
          <div class="footer">
            <p>Best regards,<br>Travel & Tour Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Dear ${data.customerName},

      Payment Status Update

      ${statusMessage}

      Payment Details:
      - Payment ID: ${data.paymentId}
      - Booking ID: ${data.bookingId}
      - Tour: ${data.tourTitle}
      - Amount: ${data.currency} ${data.amount}
      - Status: ${data.status}
      - Provider: ${data.provider}

      ${data.status === 'FAILED' ? 'Please contact our support team if you need assistance.' : ''}

      Best regards,
      Travel & Tour Team
    `;

    return { subject, html, text };
  }
}