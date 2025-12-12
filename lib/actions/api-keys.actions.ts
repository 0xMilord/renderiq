'use server';

import { ApiKeysDAL } from '@/lib/dal/api-keys';
import { getUserFromAction } from '@/lib/utils/get-user-from-action';
import { securityLog } from '@/lib/utils/security';
import { logger } from '@/lib/utils/logger';

export interface CreateApiKeyInput {
  name: string;
  scopes: string[];
  expiresAt?: Date | null;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key?: string; // Only present on creation
  keyPrefix: string;
  scopes: string[];
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Create a new API key
 */
export async function createApiKeyAction(
  input: CreateApiKeyInput,
  userId?: string
): Promise<{ success: boolean; data?: ApiKeyResponse; error?: string }> {
  try {
    const { userId: authUserId } = await getUserFromAction(userId);
    if (!authUserId) {
      securityLog('api_key_create_unauthorized', { reason: 'No user ID' }, 'warn');
      return { success: false, error: 'Authentication required' };
    }

    // Validate input
    if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
      return { success: false, error: 'API key name is required' };
    }

    if (!input.scopes || !Array.isArray(input.scopes) || input.scopes.length === 0) {
      return { success: false, error: 'At least one scope is required' };
    }

    // Validate scopes
    const validScopes = ['renders:create', 'renders:read', 'projects:read', 'webhook:write'];
    const invalidScopes = input.scopes.filter(s => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return { success: false, error: `Invalid scopes: ${invalidScopes.join(', ')}` };
    }

    // Create API key
    const apiKey = await ApiKeysDAL.create({
      userId: authUserId,
      name: input.name.trim(),
      scopes: input.scopes,
      expiresAt: input.expiresAt || null,
    });

    securityLog('api_key_created', {
      keyId: apiKey.id,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      userId: authUserId,
    }, 'info');

    logger.log('✅ createApiKeyAction: API key created', {
      keyId: apiKey.id,
      keyPrefix: apiKey.keyPrefix,
    });

    return {
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // Plain key - only shown once
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: null,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
      },
    };
  } catch (error) {
    logger.error('❌ createApiKeyAction: Error creating API key', error);
    securityLog('api_key_create_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'error');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create API key',
    };
  }
}

/**
 * List user's API keys
 */
export async function listApiKeysAction(
  userId?: string
): Promise<{ success: boolean; data?: ApiKeyResponse[]; error?: string }> {
  try {
    const { userId: authUserId } = await getUserFromAction(userId);
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }

    const keys = await ApiKeysDAL.listByUser(authUserId);

    return {
      success: true,
      data: keys.map(key => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        scopes: key.scopes,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        isActive: key.isActive,
        createdAt: key.createdAt,
      })),
    };
  } catch (error) {
    logger.error('❌ listApiKeysAction: Error listing API keys', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list API keys',
    };
  }
}

/**
 * Revoke (deactivate) an API key
 */
export async function revokeApiKeyAction(
  keyId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId: authUserId } = await getUserFromAction(userId);
    if (!authUserId) {
      securityLog('api_key_revoke_unauthorized', { keyId, reason: 'No user ID' }, 'warn');
      return { success: false, error: 'Authentication required' };
    }

    // Get key to verify ownership
    const apiKey = await ApiKeysDAL.getById(keyId, authUserId);
    if (!apiKey) {
      securityLog('api_key_revoke_unauthorized', { keyId, reason: 'Key not found or not owned by user' }, 'warn');
      return { success: false, error: 'API key not found' };
    }

    // Revoke the key
    const revoked = await ApiKeysDAL.revoke(keyId, authUserId);
    if (!revoked) {
      return { success: false, error: 'Failed to revoke API key' };
    }

    securityLog('api_key_revoked', {
      keyId: revoked.id,
      keyPrefix: revoked.keyPrefix,
      userId: authUserId,
    }, 'info');

    logger.log('✅ revokeApiKeyAction: API key revoked', {
      keyId: revoked.id,
      keyPrefix: revoked.keyPrefix,
    });

    return { success: true };
  } catch (error) {
    logger.error('❌ revokeApiKeyAction: Error revoking API key', error);
    securityLog('api_key_revoke_error', {
      keyId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'error');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke API key',
    };
  }
}

