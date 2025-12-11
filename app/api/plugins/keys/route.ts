import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest } from '@/lib/utils/plugin-auth';
import { ApiKeysDAL } from '@/lib/dal/api-keys';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { securityLog } from '@/lib/utils/security';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * POST /api/plugins/keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const platform = detectPlatform(request);
    
    // Apply rate limiting
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    // Must use Bearer token (not API key) to create API keys
    const authResult = await authenticatePluginRequest(request);
    
    if (!authResult.success || authResult.auth.authType !== 'bearer') {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.AUTH_REQUIRED, { reason: 'Bearer token required to create API keys' }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, scopes, expiresAt } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.MISSING_REQUIRED_FIELD, { field: 'name' }),
        { status: 400 }
      );
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.MISSING_REQUIRED_FIELD, { field: 'scopes' }),
        { status: 400 }
      );
    }

    // Validate scopes
    const validScopes = ['renders:create', 'renders:read', 'projects:read', 'webhook:write'];
    const invalidScopes = scopes.filter(s => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { invalidScopes }),
        { status: 400 }
      );
    }

    const apiKey = await ApiKeysDAL.create({
      userId: authResult.auth.user.id,
      name,
      scopes,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    logger.log('✅ Plugin API Keys: API key created', {
      userId: authResult.auth.user.id,
      keyPrefix: apiKey.keyPrefix,
      platform: platform.platform,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.key, // Plain key - only shown once
          keyPrefix: apiKey.keyPrefix,
          scopes: apiKey.scopes,
          expiresAt: apiKey.expiresAt?.toISOString() || null,
          createdAt: apiKey.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('❌ Plugin API Keys: Create error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * GET /api/plugins/keys
 * List user's API keys (keys are masked)
 */
export async function GET(request: NextRequest) {
  try {
    const platform = detectPlatform(request);
    
    // Apply rate limiting
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    // Must use Bearer token to list API keys
    const authResult = await authenticatePluginRequest(request);
    
    if (!authResult.success || authResult.auth.authType !== 'bearer') {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.AUTH_REQUIRED),
        { status: 401 }
      );
    }

    const keys = await ApiKeysDAL.listByUser(authResult.auth.user.id);

    return NextResponse.json({
      success: true,
      data: keys.map(key => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix, // Masked: only show prefix
        scopes: key.scopes,
        expiresAt: key.expiresAt?.toISOString() || null,
        lastUsedAt: key.lastUsedAt?.toISOString() || null,
        isActive: key.isActive,
        createdAt: key.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('❌ Plugin API Keys: List error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

