import { db } from '@/lib/db';
import { pluginApiKeys } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import crypto from 'crypto';

export interface CreateApiKeyData {
  userId: string;
  name: string;
  scopes: string[];
  expiresAt?: Date | null;
}

export interface ApiKeyWithPlainKey {
  id: string;
  userId: string;
  name: string;
  key: string; // Plain key (only shown once)
  keyPrefix: string;
  scopes: string[];
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Generate a secure API key
 * Format: rk_live_<random32chars>
 */
export function generateApiKey(): { key: string; keyPrefix: string; hashedKey: string } {
  const randomBytes = crypto.randomBytes(16);
  const randomPart = randomBytes.toString('hex');
  const key = `rk_live_${randomPart}`;
  const keyPrefix = key.substring(0, 15); // rk_live_xxxx
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
  
  return { key, keyPrefix, hashedKey };
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key against a hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  const keyHash = hashApiKey(key);
  return crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(hash));
}

export class ApiKeysDAL {
  /**
   * Create a new API key
   * Returns the plain key (only shown once)
   */
  static async create(data: CreateApiKeyData): Promise<ApiKeyWithPlainKey> {
    logger.log('🔑 ApiKeysDAL: Creating API key', { userId: data.userId, name: data.name });
    
    const { key, keyPrefix, hashedKey } = generateApiKey();
    
    const [apiKey] = await db
      .insert(pluginApiKeys)
      .values({
        userId: data.userId,
        name: data.name,
        key: hashedKey,
        keyPrefix,
        scopes: data.scopes,
        expiresAt: data.expiresAt || null,
        isActive: true,
      })
      .returning();

    logger.log('✅ ApiKeysDAL: API key created', { id: apiKey.id, keyPrefix });

    return {
      ...apiKey,
      key, // Return plain key (only time it's shown)
    };
  }

  /**
   * Get API key by ID (for user's own keys)
   */
  static async getById(id: string, userId: string) {
    logger.log('🔍 ApiKeysDAL: Getting API key by ID', { id, userId });
    
    const [apiKey] = await db
      .select()
      .from(pluginApiKeys)
      .where(and(eq(pluginApiKeys.id, id), eq(pluginApiKeys.userId, userId)))
      .limit(1);

    return apiKey || null;
  }

  /**
   * Get API key by hashed key (for authentication)
   */
  static async getByKey(hashedKey: string) {
    logger.log('🔍 ApiKeysDAL: Getting API key by hash');
    
    const [apiKey] = await db
      .select()
      .from(pluginApiKeys)
      .where(eq(pluginApiKeys.key, hashedKey))
      .limit(1);

    return apiKey || null;
  }

  /**
   * Verify API key and get user
   */
  static async verifyKey(plainKey: string): Promise<{ apiKey: typeof pluginApiKeys.$inferSelect; user: { id: string } } | null> {
    const hashedKey = hashApiKey(plainKey);
    const apiKey = await this.getByKey(hashedKey);

    if (!apiKey || !apiKey.isActive) {
      return null;
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      logger.warn('⚠️ ApiKeysDAL: API key expired', { id: apiKey.id });
      return null;
    }

    // Update last used timestamp
    await db
      .update(pluginApiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(pluginApiKeys.id, apiKey.id));

    return {
      apiKey,
      user: { id: apiKey.userId },
    };
  }

  /**
   * List user's API keys
   */
  static async listByUser(userId: string) {
    logger.log('🔍 ApiKeysDAL: Listing API keys for user', { userId });
    
    const keys = await db
      .select({
        id: pluginApiKeys.id,
        userId: pluginApiKeys.userId,
        name: pluginApiKeys.name,
        keyPrefix: pluginApiKeys.keyPrefix,
        scopes: pluginApiKeys.scopes,
        expiresAt: pluginApiKeys.expiresAt,
        lastUsedAt: pluginApiKeys.lastUsedAt,
        isActive: pluginApiKeys.isActive,
        createdAt: pluginApiKeys.createdAt,
        updatedAt: pluginApiKeys.updatedAt,
      })
      .from(pluginApiKeys)
      .where(eq(pluginApiKeys.userId, userId))
      .orderBy(desc(pluginApiKeys.createdAt));

    return keys;
  }

  /**
   * Revoke (deactivate) an API key
   */
  static async revoke(id: string, userId: string) {
    logger.log('🗑️ ApiKeysDAL: Revoking API key', { id, userId });
    
    const [revoked] = await db
      .update(pluginApiKeys)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(pluginApiKeys.id, id), eq(pluginApiKeys.userId, userId)))
      .returning();

    return revoked || null;
  }

  /**
   * Check if API key has required scope
   */
  static hasScope(apiKey: typeof pluginApiKeys.$inferSelect, scope: string): boolean {
    return apiKey.scopes.includes(scope) || apiKey.scopes.includes('*'); // * = all scopes
  }
}

