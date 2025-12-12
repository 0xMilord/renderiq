import { NextRequest, NextResponse } from 'next/server';
import { PaddleService } from '@/lib/services/paddle.service';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('paddle-signature');

    if (!signature) {
      logger.error('❌ Paddle Webhook: Missing signature');
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const paddleService = new PaddleService();
    const isValid = paddleService.verifyWebhook(body, signature);

    if (!isValid) {
      logger.error('❌ Paddle Webhook: Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const event = payload.event_name || payload.event;

    logger.log('📨 Paddle Webhook: Received event:', event);

    // Handle webhook event
    const result = await paddleService.handleWebhook(event, payload);

    if (!result.success) {
      logger.error('❌ Paddle Webhook: Error handling event:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('❌ Paddle Webhook: Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';

