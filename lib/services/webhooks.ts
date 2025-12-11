import crypto from 'crypto';
import { logger } from '@/lib/utils/logger';
import { WebhooksDAL } from '@/lib/dal/webhooks';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify HMAC-SHA256 signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = signWebhookPayload(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Deliver webhook to URL
 */
export async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    const signature = signWebhookPayload(payloadString, secret);

    logger.log('📤 WebhookService: Delivering webhook', {
      url,
      event: payload.event,
      signature: signature.substring(0, 16) + '...',
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Renderiq-Signature': signature,
        'X-Renderiq-Event': payload.event,
        'X-Renderiq-Timestamp': payload.timestamp,
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.warn('⚠️ WebhookService: Webhook delivery failed', {
        url,
        status: response.status,
        error: errorText.substring(0, 200),
      });
      return { success: false, error: `HTTP ${response.status}: ${errorText.substring(0, 100)}` };
    }

    logger.log('✅ WebhookService: Webhook delivered successfully', { url, event: payload.event });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ WebhookService: Webhook delivery error', { url, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Deliver webhook for render status change
 */
export async function deliverRenderWebhook(
  webhookId: string,
  renderId: string,
  status: 'completed' | 'failed' | 'processing',
  outputUrl?: string,
  error?: string
) {
  const webhook = await WebhooksDAL.getById(webhookId, ''); // We'll validate userId separately
  if (!webhook || !webhook.isActive) {
    logger.warn('⚠️ WebhookService: Webhook not found or inactive', { webhookId });
    return { success: false, error: 'Webhook not found or inactive' };
  }

  const event = status === 'completed' ? 'render.completed' : status === 'failed' ? 'render.failed' : 'render.processing';

  // Check if webhook subscribes to this event
  if (!webhook.events.includes(event)) {
    logger.log('ℹ️ WebhookService: Webhook does not subscribe to event', { webhookId, event });
    return { success: false, error: 'Event not subscribed' };
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data: {
      renderId,
      status,
      ...(outputUrl && { outputUrl }),
      ...(error && { error }),
    },
  };

  const result = await deliverWebhook(webhook.url, payload, webhook.secret);

  if (result.success) {
    await WebhooksDAL.recordSuccess(webhookId);
  } else {
    await WebhooksDAL.recordFailure(webhookId);
  }

  return result;
}

/**
 * Deliver webhooks for all users with active webhooks for an event
 * Use this when a render status changes
 */
export async function deliverRenderWebhooksForEvent(
  userId: string,
  renderId: string,
  status: 'completed' | 'failed' | 'processing',
  outputUrl?: string,
  error?: string
) {
  const event = status === 'completed' ? 'render.completed' : status === 'failed' ? 'render.failed' : 'render.processing';
  
  const webhooks = await WebhooksDAL.getActiveByEvent(event);
  
  // Filter to user's webhooks only
  const userWebhooks = webhooks.filter(w => w.userId === userId);

  logger.log('📤 WebhookService: Delivering webhooks for event', {
    userId,
    event,
    count: userWebhooks.length,
  });

  // Deliver all webhooks in parallel
  const results = await Promise.allSettled(
    userWebhooks.map(webhook =>
      deliverRenderWebhook(
        webhook.id,
        renderId,
        status,
        outputUrl,
        error
      )
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  logger.log('📊 WebhookService: Webhook delivery summary', {
    total: userWebhooks.length,
    successful,
    failed,
  });

  return {
    total: userWebhooks.length,
    successful,
    failed,
  };
}

