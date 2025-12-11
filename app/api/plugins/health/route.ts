import { NextRequest, NextResponse } from 'next/server';
import { detectPlatform } from '@/lib/utils/platform-detection';

/**
 * GET /api/plugins/health
 * Health check endpoint for plugin API
 * Useful for plugin initialization and connectivity testing
 */
export async function GET(request: NextRequest) {
  const platform = detectPlatform(request);
  
  return NextResponse.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api: {
      version: '1.0.0',
      platform: platform.platform,
      version_detected: platform.version || null,
    },
    services: {
      api: 'operational',
      authentication: 'operational',
      rendering: 'operational',
      storage: 'operational',
    },
  });
}

