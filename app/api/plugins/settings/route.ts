import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest } from '@/lib/utils/plugin-auth';
import { UserSettingsService, type UserPreferences } from '@/lib/services/user-settings';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * GET /api/plugins/settings
 * Get user settings
 */
export async function GET(request: NextRequest) {
  try {
    const platform = detectPlatform(request);
    
    // Apply rate limiting
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    const authResult = await authenticatePluginRequest(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.AUTH_REQUIRED),
        { status: 401 }
      );
    }

    const settings = await UserSettingsService.getUserSettings(authResult.auth.user.id);

    if (!settings) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.NOT_FOUND, { resource: 'settings' }),
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        preferences: settings.preferences,
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('❌ Plugin Settings: Get settings error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/plugins/settings
 * Update user settings
 */
export async function PUT(request: NextRequest) {
  try {
    const platform = detectPlatform(request);
    
    // Apply rate limiting
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    const authResult = await authenticatePluginRequest(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.AUTH_REQUIRED),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.MISSING_REQUIRED_FIELD, { field: 'preferences' }),
        { status: 400 }
      );
    }

    const updatedSettings = await UserSettingsService.updateUserSettings(
      authResult.auth.user.id,
      preferences as Partial<UserPreferences>
    );

    logger.log('✅ Plugin Settings: Settings updated', {
      userId: authResult.auth.user.id,
      platform: platform.platform,
    });

    return NextResponse.json({
      success: true,
      data: {
        preferences: updatedSettings.preferences,
        updatedAt: updatedSettings.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('❌ Plugin Settings: Update settings error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

