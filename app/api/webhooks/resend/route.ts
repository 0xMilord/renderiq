import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import crypto from 'crypto';

/**
 * Resend Webhook Handler
 * 
 * This webhook receives email events from Resend (delivered, opened, clicked, bounced, etc.)
 * 
 * To set up:
 * 1. Go to Resend Dashboard → Settings → Webhooks
 * 2. Click "Add Webhook"
 * 3. Webhook URL: https://yourdomain.com/api/webhooks/resend
 * 4. Select events:
 *    - email.sent
 *    - email.delivered
 *    - email.delivery_delayed
 *    - email.complained
 *    - email.bounced
 *    - email.opened
 *    - email.clicked
 * 5. Copy the webhook secret
 * 6. Add to environment: RESEND_WEBHOOK_SECRET
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('resend-signature');

    // Verify webhook signature if secret is configured
    if (process.env.RESEND_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RESEND_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.error('❌ ResendWebhook: Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(body);
    const { type, data } = payload;

    logger.log('📧 ResendWebhook: Received event:', { type, email_id: data?.email_id });

    // Handle different event types
    switch (type) {
      case 'email.sent':
        logger.log('✅ ResendWebhook: Email sent:', data.email_id);
        // You can update database to mark email as sent
        break;

      case 'email.delivered':
        logger.log('✅ ResendWebhook: Email delivered:', data.email_id);
        // You can update database to mark email as delivered
        break;

      case 'email.delivery_delayed':
        logger.warn('⚠️ ResendWebhook: Email delivery delayed:', data.email_id);
        // You can log or alert on delayed deliveries
        break;

      case 'email.complained':
        logger.warn('⚠️ ResendWebhook: Email marked as spam:', data.email_id);
        // You should remove this email from your mailing list
        // Consider implementing unsubscribe logic
        break;

      case 'email.bounced':
        logger.warn('⚠️ ResendWebhook: Email bounced:', data.email_id, data.bounce_type);
        // You should mark this email as invalid
        // Consider removing from mailing list if hard bounce
        break;

      case 'email.opened':
        logger.log('📊 ResendWebhook: Email opened:', data.email_id);
        // You can track email opens for analytics
        break;

      case 'email.clicked':
        logger.log('📊 ResendWebhook: Email clicked:', data.email_id, data.link);
        // You can track link clicks for analytics
        break;

      default:
        logger.log('ℹ️ ResendWebhook: Unknown event type:', type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('❌ ResendWebhook: Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

