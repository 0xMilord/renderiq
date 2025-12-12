/**
 * Unified API Route Middleware
 * Production-grade middleware for Next.js API routes
 * 
 * Provides:
 * - Authentication (with Bearer token support)
 * - CORS handling
 * - Rate limiting
 * - Error handling
 * - Request validation
 * - Consistent response formatting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { handleCORSPreflight, withCORS, CORSOptions } from './cors';
import { rateLimitMiddleware, RateLimitConfig } from '@/lib/utils/rate-limit';
import { securityLog, getSafeErrorMessage } from '@/lib/utils/security';
import { logger } from '@/lib/utils/logger';
import * as Sentry from '@sentry/nextjs';

/**
 * API Route Configuration
 */
export interface ApiRouteConfig {
  /**
   * Require authentication
   * @default true
   */
  requireAuth?: boolean;
  
  /**
   * Support Bearer token authentication (for plugins)
   * @default true
   */
  supportBearerToken?: boolean;
  
  /**
   * Enable CORS
   * @default true
   */
  enableCORS?: boolean;
  
  /**
   * CORS options
   */
  corsOptions?: CORSOptions;
  
  /**
   * Enable rate limiting
   * @default false
   */
  enableRateLimit?: boolean;
  
  /**
   * Rate limit configuration
   */
  rateLimitConfig?: RateLimitConfig;
  
  /**
   * Custom error handler
   */
  onError?: (error: unknown, request: NextRequest) => NextResponse | null;
  
  /**
   * Route name for logging/Sentry
   */
  routeName?: string;
  
  /**
   * Maximum request body size (in bytes)
   * @default 4.5MB (Vercel Hobby limit)
   */
  maxBodySize?: number;
}

/**
 * Authenticated request context
 */
export interface AuthenticatedRequest {
  request: NextRequest;
  user: { id: string; email?: string; [key: string]: any };
  bearerToken?: string;
}

/**
 * API Route Handler
 */
export type ApiRouteHandler<T = any> = (
  context: AuthenticatedRequest
) => Promise<NextResponse> | NextResponse;

/**
 * Handle CORS preflight and add CORS headers to response
 * Optimized: Preflight already handled in main wrapper, this just adds headers
 */
function handleCORS(
  request: NextRequest,
  response: NextResponse,
  config: ApiRouteConfig
): NextResponse {
  if (!config.enableCORS) return response;
  
  // Preflight is already handled in main wrapper (fast path)
  // This function just adds CORS headers to actual responses
  return withCORS(response, request, config.corsOptions);
}

/**
 * Authenticate request
 */
async function authenticateRequest(
  request: NextRequest,
  config: ApiRouteConfig
): Promise<{ user: { id: string; [key: string]: any } | null; bearerToken?: string }> {
  if (!config.requireAuth) {
    return { user: null };
  }
  
  let bearerToken: string | undefined;
  
  // Extract Bearer token if supported
  if (config.supportBearerToken) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.substring(7);
    }
  }
  
  try {
    const { user } = await getCachedUser(bearerToken);
    
    if (!user) {
      securityLog('api_auth_failed', { 
        route: config.routeName,
        hasBearerToken: !!bearerToken 
      }, 'warn');
    }
    
    return { user, bearerToken };
  } catch (error) {
    logger.error('❌ Auth error:', error);
    securityLog('api_auth_error', { 
      route: config.routeName,
      error: error instanceof Error ? error.message : 'unknown'
    }, 'error');
    return { user: null, bearerToken };
  }
}

/**
 * Validate request body size
 */
function validateBodySize(
  request: NextRequest,
  config: ApiRouteConfig
): { valid: boolean; error?: NextResponse } {
  if (!config.maxBodySize) return { valid: true };
  
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return { valid: true };
  
  const sizeInBytes = parseInt(contentLength, 10);
  if (sizeInBytes > config.maxBodySize) {
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (config.maxBodySize / (1024 * 1024)).toFixed(2);
    
    const errorResponse = NextResponse.json({
      success: false,
      error: `Request payload too large (${sizeInMB}MB). Maximum allowed size is ${maxSizeMB}MB.`,
      code: 'PAYLOAD_TOO_LARGE'
    }, { status: 413 });
    
    return { valid: false, error: handleCORS(request, errorResponse, config) };
  }
  
  return { valid: true };
}

/**
 * Apply rate limiting
 */
function applyRateLimit(
  request: NextRequest,
  config: ApiRouteConfig
): { allowed: boolean; response?: NextResponse } {
  if (!config.enableRateLimit) {
    return { allowed: true };
  }
  
  const rateLimit = rateLimitMiddleware(request, config.rateLimitConfig);
  
  if (!rateLimit.allowed) {
    const rateLimitResponse = NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Please try again later.' },
      { 
        status: 429,
        headers: rateLimit.response?.headers ? Object.fromEntries(rateLimit.response.headers) : {}
      }
    );
    
    return { 
      allowed: false, 
      response: handleCORS(request, rateLimitResponse, config) 
    };
  }
  
  return { allowed: true };
}

/**
 * Handle errors consistently
 */
function handleError(
  error: unknown,
  request: NextRequest,
  config: ApiRouteConfig
): NextResponse {
  // Custom error handler
  if (config.onError) {
    const customResponse = config.onError(error, request);
    if (customResponse) {
      return handleCORS(request, customResponse, config);
    }
  }
  
  // Log error
  const errorMessage = error instanceof Error ? error.message : String(error);
  const safeErrorMessage = getSafeErrorMessage(error);
  
  logger.error(`❌ API Error [${config.routeName || 'unknown'}]:`, error);
  
  // Send to Sentry
  if (config.routeName) {
    Sentry.setContext('api_route', {
      route: config.routeName,
      error: errorMessage,
    });
    Sentry.captureException(error instanceof Error ? error : new Error(errorMessage));
  }
  
  // Security logging
  securityLog('api_error', {
    route: config.routeName,
    error: safeErrorMessage
  }, 'error');
  
  // Return error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = NextResponse.json({
    success: false,
    error: isDevelopment ? `Internal server error: ${safeErrorMessage}` : 'Internal server error. Please try again or contact support if the issue persists.',
    ...(isDevelopment && error instanceof Error && { details: errorMessage })
  }, { status: 500 });
  
  return handleCORS(request, errorResponse, config);
}

/**
 * Main API route wrapper
 * 
 * @example
 * ```typescript
 * export const POST = withApiRoute(
 *   async ({ request, user }) => {
 *     // Your route logic here
 *     // user is guaranteed to be non-null if requireAuth: true
 *     return NextResponse.json({ success: true, data: {...} });
 *   },
 *   {
 *     requireAuth: true,
 *     enableCORS: true,
 *     enableRateLimit: true,
 *     rateLimitConfig: { maxRequests: 30, windowMs: 60000 },
 *     routeName: 'POST /api/example'
 *   }
 * );
 * ```
 */
export function withApiRoute(
  handler: ApiRouteHandler,
  config: ApiRouteConfig = {}
): (request: NextRequest) => Promise<NextResponse> {
  const finalConfig: Required<ApiRouteConfig> = {
    requireAuth: config.requireAuth ?? true,
    supportBearerToken: config.supportBearerToken ?? true,
    enableCORS: config.enableCORS ?? true,
    corsOptions: config.corsOptions ?? {},
    enableRateLimit: config.enableRateLimit ?? false,
    rateLimitConfig: config.rateLimitConfig ?? { maxRequests: 100, windowMs: 60000 },
    onError: config.onError ?? null,
    routeName: config.routeName ?? 'unknown',
    maxBodySize: config.maxBodySize ?? 4.5 * 1024 * 1024, // 4.5MB default
  };
  
  return async (request: NextRequest): Promise<NextResponse> => {
    // ⚡ PERFORMANCE: Fast path for OPTIONS preflight - return immediately, no processing
    if (finalConfig.enableCORS && request.method === 'OPTIONS') {
      const preflight = handleCORSPreflight(request, finalConfig.corsOptions);
      if (preflight) {
        // Preflight handled - return immediately without any other processing
        // This avoids: body size check, rate limiting, authentication, etc.
        return preflight;
      }
    }
    
    const startTime = Date.now();
    
    try {
      
      // Validate body size
      const bodySizeCheck = validateBodySize(request, finalConfig);
      if (!bodySizeCheck.valid) {
        return bodySizeCheck.error!;
      }
      
      // Apply rate limiting
      const rateLimitCheck = applyRateLimit(request, finalConfig);
      if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
      }
      
      // Authenticate
      const { user, bearerToken } = await authenticateRequest(request, finalConfig);
      
      if (finalConfig.requireAuth && !user) {
        const authErrorResponse = NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
        return handleCORS(request, authErrorResponse, finalConfig);
      }
      
      // Set Sentry transaction name (if available)
      if (finalConfig.routeName) {
        try {
          const { setTransactionName } = await import('@/lib/utils/sentry-performance');
          setTransactionName(finalConfig.routeName);
        } catch {
          // Sentry performance utils not available, skip
        }
      }
      
      // Create authenticated context
      const context: AuthenticatedRequest = {
        request,
        user: user!,
        bearerToken,
      };
      
      // Execute handler
      const response = await handler(context);
      
      // Add CORS headers
      const finalResponse = handleCORS(request, response, finalConfig);
      
      // Log success
      const duration = Date.now() - startTime;
      logger.log(`✅ API [${finalConfig.routeName}]: ${request.method} completed in ${duration}ms`);
      
      return finalResponse;
      
    } catch (error) {
      return handleError(error, request, finalConfig);
    }
  };
}

/**
 * Helper for public routes (no auth required)
 */
export function withPublicApiRoute(
  handler: ApiRouteHandler<{ request: NextRequest }>,
  config: Omit<ApiRouteConfig, 'requireAuth'> = {}
): (request: NextRequest) => Promise<NextResponse> {
  return withApiRoute(
    async ({ request }) => {
      // For public routes, user may be null
      return handler({ request } as any);
    },
    { ...config, requireAuth: false }
  );
}

/**
 * Helper for authenticated routes
 */
export function withAuthenticatedApiRoute(
  handler: ApiRouteHandler,
  config: Omit<ApiRouteConfig, 'requireAuth'> = {}
): (request: NextRequest) => Promise<NextResponse> {
  return withApiRoute(handler, { ...config, requireAuth: true });
}

