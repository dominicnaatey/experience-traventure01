import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { PaymentService } from '@/app/lib/services/payment';
import { PaymentMethod, PaymentProvider } from '@/app/lib/models';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, amount, currency, method, provider } = body;

    // Validate required fields
    if (!bookingId || !amount || !currency || !method || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, amount, currency, method, provider' },
        { status: 400 }
      );
    }

    // Initialize payment
    const paymentResponse = await PaymentService.initializePayment({
      bookingId,
      amount: parseFloat(amount),
      currency,
      method: method as PaymentMethod,
      provider: provider as PaymentProvider
    });

    return NextResponse.json(paymentResponse);
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment initialization failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Verify payment status
    const payment = await PaymentService.verifyPayment(paymentId);

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment verification failed' },
      { status: 500 }
    );
  }
}