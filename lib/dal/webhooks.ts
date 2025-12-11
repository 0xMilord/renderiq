import { db } from '@/lib/db';
import { pluginWebhooks } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import crypto from 'crypto';

export interface CreateWebhookData {
  userId: string;
  url: string;
  events: string[];
  secret?: string; // Optional, will generate if not provided
}

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export class WebhooksDAL {
  /**
   * Create a new webhook
   */
  static async create(data: CreateWebhookData) {
    logger.log('🔔 WebhooksDAL: Creating webhook', { userId: data.userId, url: data.url });
    
    const secret = data.secret || generateWebhookSecret();
    
    const [webhook] = await db
      .insert(pluginWebhooks)
      .values({
        userId: data.userId,
        url: data.url,
        secret,
        events: data.events,
        isActive: true,
        failureCount: 0,
      })
      .returning();

    logger.log('✅ WebhooksDAL: Webhook created', { id: webhook.id, url: data.url });

    return webhook;
  }

  /**
   * Get webhook by ID
   */
  static async getById(id: string, userId: string) {
    logger.log('🔍 WebhooksDAL: Getting webhook by ID', { id, userId });
    
    const [webhook] = await db
      .select()
      .from(pluginWebhooks)
      .where(and(eq(pluginWebhooks.id, id), eq(pluginWebhooks.userId, userId)))
      .limit(1);

    return webhook || null;
  }

  /**
   * List user's webhooks
   */
  static async listByUser(userId: string) {
    logger.log('🔍 WebhooksDAL: Listing webhooks for user', { userId });
    
    const webhooks = await db
      .select()
      .from(pluginWebhooks)
      .where(eq(pluginWebhooks.userId, userId))
      .orderBy(desc(pluginWebhooks.createdAt));

    return webhooks;
  }

  /**
   * Get active webhooks for a specific event
   */
  static async getActiveByEvent(event: string) {
    logger.log('🔍 WebhooksDAL: Getting active webhooks for event', { event });
    
    const webhooks = await db
      .select()
      .from(pluginWebhooks)
      .where(eq(pluginWebhooks.isActive, true));

    // Filter by event (events array contains the event)
    return webhooks.filter(w => w.events.includes(event));
  }

  /**
   * Update webhook
   */
  static async update(id: string, userId: string, data: Partial<CreateWebhookData>) {
    logger.log('✏️ WebhooksDAL: Updating webhook', { id, userId });
    
    const [updated] = await db
      .update(pluginWebhooks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(pluginWebhooks.id, id), eq(pluginWebhooks.userId, userId)))
      .returning();

    return updated || null;
  }

  /**
   * Delete (deactivate) a webhook
   */
  static async delete(id: string, userId: string) {
    logger.log('🗑️ WebhooksDAL: Deleting webhook', { id, userId });
    
    const [deleted] = await db
      .update(pluginWebhooks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(pluginWebhooks.id, id), eq(pluginWebhooks.userId, userId)))
      .returning();

    return deleted || null;
  }

  /**
   * Record webhook delivery success
   */
  static async recordSuccess(id: string) {
    await db
      .update(pluginWebhooks)
      .set({
        lastTriggeredAt: new Date(),
        failureCount: 0, // Reset failure count on success
        updatedAt: new Date(),
      })
      .where(eq(pluginWebhooks.id, id));
  }

  /**
   * Record webhook delivery failure
   */
  static async recordFailure(id: string) {
    const webhook = await this.getById(id, ''); // We need to get current failure count
    if (!webhook) return;

    await db
      .update(pluginWebhooks)
      .set({
        failureCount: webhook.failureCount + 1,
        lastFailureAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pluginWebhooks.id, id));

    // Deactivate if too many failures
    if (webhook.failureCount + 1 >= 10) {
      logger.warn('⚠️ WebhooksDAL: Deactivating webhook due to excessive failures', { id });
      await db
        .update(pluginWebhooks)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(pluginWebhooks.id, id));
    }
  }
}

