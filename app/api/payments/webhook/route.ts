import { NextRequest, NextResponse } from 'next/server';
import { RazorpayService } from '@/lib/services/razorpay.service';
import { logger } from '@/lib/utils/logger';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('X-Razorpay-Signature');

    if (!signature) {
      logger.error('❌ Webhook: Missing signature');
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = RazorpayService.verifyWebhookSignature(body, signature);

    if (!isValid) {
      logger.error('❌ Webhook: Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    logger.log('📨 Webhook: Received event:', event);

    // Handle webhook event
    await RazorpayService.handleWebhook(event, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('❌ Webhook: Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';

