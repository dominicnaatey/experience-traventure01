import { NextRequest, NextResponse } from 'next/server';
import { PaymentService, WebhookData } from '@/app/lib/services/payment';
import { PaymentProvider, PaymentStatus } from '@/app/lib/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as PaymentProvider;

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider parameter is required' },
        { status: 400 }
      );
    }

    let webhookData;

    // Parse webhook data based on provider
    switch (provider) {
      case 'STRIPE':
        webhookData = parseStripeWebhook(body);
        break;
      case 'PAYSTACK':
        webhookData = parsePaystackWebhook(body);
        break;
      case 'FLUTTERWAVE':
        webhookData = parseFlutterwaveWebhook(body);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported payment provider' },
          { status: 400 }
        );
    }

    if (!webhookData) {
      return NextResponse.json(
        { error: 'Invalid webhook data' },
        { status: 400 }
      );
    }

    // Process webhook
    await PaymentService.processWebhook(webhookData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function parseStripeWebhook(body: Record<string, unknown>): WebhookData | null {
  // TODO: Implement Stripe webhook parsing with signature verification
  // For now, return mock data structure
  const metadata = (body.metadata as Record<string, unknown>) || {};
  const paymentId = metadata.paymentId as string;
  
  if (!paymentId) return null;
  
  return {
    paymentId,
    status: body.status === 'succeeded' ? 'SUCCESS' as PaymentStatus : 'FAILED' as PaymentStatus,
    providerTransactionId: body.id as string,
    provider: 'STRIPE' as PaymentProvider
  };
}

function parsePaystackWebhook(body: Record<string, unknown>): WebhookData | null {
  // TODO: Implement Paystack webhook parsing with signature verification
  // For now, return mock data structure
  const data = (body.data as Record<string, unknown>) || {};
  const metadata = (data.metadata as Record<string, unknown>) || {};
  const paymentId = metadata.paymentId as string;
  
  if (!paymentId) return null;
  
  return {
    paymentId,
    status: body.event === 'charge.success' ? 'SUCCESS' as PaymentStatus : 'FAILED' as PaymentStatus,
    providerTransactionId: data.reference as string,
    provider: 'PAYSTACK' as PaymentProvider
  };
}

function parseFlutterwaveWebhook(body: Record<string, unknown>): WebhookData | null {
  // TODO: Implement Flutterwave webhook parsing with signature verification
  // For now, return mock data structure
  const data = (body.data as Record<string, unknown>) || {};
  const meta = (data.meta as Record<string, unknown>) || {};
  const paymentId = meta.paymentId as string;
  
  if (!paymentId) return null;
  
  return {
    paymentId,
    status: body.event === 'charge.completed' ? 'SUCCESS' as PaymentStatus : 'FAILED' as PaymentStatus,
    providerTransactionId: data.flw_ref as string,
    provider: 'FLUTTERWAVE' as PaymentProvider
  };
}