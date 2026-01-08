import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { PaymentService } from '@/app/lib/services/payment';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Generate invoice
    const invoice = await PaymentService.generateInvoice(bookingId);

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invoice generation failed' },
      { status: 500 }
    );
  }
}