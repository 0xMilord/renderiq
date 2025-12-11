/**
 * Plugin Authentication Utility
 * Supports both Bearer token and API key authentication
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiKeysDAL } from '@/lib/dal/api-keys';
import { logger } from '@/lib/utils/logger';

export interface PluginAuthResult {
  user: { id: string };
  authType: 'bearer' | 'api_key';
  apiKey?: {
    id: string;
    scopes: string[];
  };
}

/**
 * Authenticate plugin request (Bearer token or API key)
 */
export async function authenticatePluginRequest(
  request: NextRequest
): Promise<{ success: true; auth: PluginAuthResult } | { success: false; error: string }> {
  // Try Bearer token first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (user && !error) {
        return {
          success: true,
          auth: {
            user: { id: user.id },
            authType: 'bearer',
          },
        };
      }
    } catch (error) {
      logger.warn('❌ Plugin Auth: Failed to validate Bearer token', { error });
    }
  }

  // Try API key
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    const result = await ApiKeysDAL.verifyKey(apiKeyHeader);

    if (result) {
      return {
        success: true,
        auth: {
          user: { id: result.user.id },
          authType: 'api_key',
          apiKey: {
            id: result.apiKey.id,
            scopes: result.apiKey.scopes,
          },
        },
      };
    }
  }

  return {
    success: false,
    error: 'Authentication required. Provide Bearer token or API key.',
  };
}

/**
 * Check if authenticated user has required scope (for API key auth)
 */
export function hasRequiredScope(auth: PluginAuthResult, requiredScope: string): boolean {
  if (auth.authType === 'bearer') {
    // Bearer token auth has all scopes
    return true;
  }

  if (auth.authType === 'api_key' && auth.apiKey) {
    return ApiKeysDAL.hasScope(auth.apiKey as any, requiredScope);
  }

  return false;
}

