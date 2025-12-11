/**
 * Platform-specific rate limiting for plugin API
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectPlatform, getPlatformRateLimit } from './platform-detection';
import { rateLimitMiddleware } from './rate-limit';
import { createErrorResponse, PluginErrorCode } from './plugin-error-codes';
import { authenticatePluginRequest } from './plugin-auth';

/**
 * Apply platform-specific rate limiting to plugin request
 * Returns rate limit info for adding to response headers
 */
export async function applyPluginRateLimit(
  request: NextRequest
): Promise<{ 
  allowed: boolean; 
  response?: NextResponse;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetTime: number;
  };
}> {
  const platform = detectPlatform(request);
  const rateLimitConfig = getPlatformRateLimit(platform.platform);

  // Get identifier (user ID if authenticated, otherwise IP)
  let identifier: string;
  
  try {
    const authResult = await authenticatePluginRequest(request);
    if (authResult.success) {
      identifier = `plugin:${platform.platform}:user:${authResult.auth.user.id}`;
    } else {
      // Fallback to IP if not authenticated
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      identifier = `plugin:${platform.platform}:ip:${ip}`;
    }
  } catch {
    // If auth fails, use IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    identifier = `plugin:${platform.platform}:ip:${ip}`;
  }

  // Check rate limit using the detailed function
  const { checkRateLimit } = await import('./rate-limit');
  const { allowed, remaining, resetTime } = checkRateLimit(identifier, rateLimitConfig);

  if (!allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        createErrorResponse(PluginErrorCode.RATE_LIMIT_EXCEEDED, {
          platform: platform.platform,
          limit: rateLimitConfig.maxRequests,
          windowMs: rateLimitConfig.windowMs,
        }),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitConfig.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetTime),
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
          },
        }
      ),
      rateLimitInfo: {
        limit: rateLimitConfig.maxRequests,
        remaining: 0,
        resetTime,
      },
    };
  }

  return { 
    allowed: true,
    rateLimitInfo: {
      limit: rateLimitConfig.maxRequests,
      remaining,
      resetTime,
    },
  };
}

