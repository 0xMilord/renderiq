/**
 * Centralized CORS Middleware
 * Production-grade CORS handling with proper security headers
 * 
 * Features:
 * - Origin validation using centralized security utilities
 * - Proper CORS response headers
 * - OPTIONS preflight handling
 * - Credentials support for authenticated requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAllowedOrigin, securityLog } from '@/lib/utils/security';

export interface CORSOptions {
  /**
   * Allowed HTTP methods
   * @default ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
   */
  allowedMethods?: string[];
  
  /**
   * Allowed request headers
   * @default ['Content-Type', 'Authorization', 'X-Requested-With']
   */
  allowedHeaders?: string[];
  
  /**
   * Exposed response headers
   * @default []
   */
  exposedHeaders?: string[];
  
  /**
   * Max age for preflight cache (seconds)
   * @default 86400 (24 hours)
   */
  maxAge?: number;
  
  /**
   * Allow credentials (cookies, authorization headers)
   * @default true
   */
  allowCredentials?: boolean;
  
  /**
   * Skip origin validation (use with caution)
   * @default false
   */
  skipOriginCheck?: boolean;
}

const DEFAULT_OPTIONS: Required<CORSOptions> = {
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name',
  ],
  exposedHeaders: [],
  maxAge: 86400, // 24 hours
  allowCredentials: true,
  skipOriginCheck: false,
};

/**
 * Get CORS headers for a given origin
 */
export function getCORSHeaders(
  origin: string | null,
  options: CORSOptions = {}
): Headers {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const headers = new Headers();

  // Validate origin
  if (opts.skipOriginCheck) {
    // Allow any origin (use with extreme caution)
    headers.set('Access-Control-Allow-Origin', '*');
  } else if (origin && isAllowedOrigin(origin)) {
    // Set specific origin (required for credentials)
    headers.set('Access-Control-Allow-Origin', origin);
    
    if (opts.allowCredentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }
  } else if (origin) {
    // Invalid origin - don't set CORS headers (will be blocked by browser)
    // ⚡ PERFORMANCE: Log asynchronously to avoid blocking preflight response
    Promise.resolve().then(() => {
      securityLog('cors_invalid_origin', { origin }, 'warn');
    });
    return headers; // Return empty headers to block request
  }
  // No origin header = same-origin request, no CORS headers needed

  // Set allowed methods
  headers.set('Access-Control-Allow-Methods', opts.allowedMethods.join(', '));

  // Set allowed headers
  headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));

  // Set exposed headers
  if (opts.exposedHeaders.length > 0) {
    headers.set('Access-Control-Expose-Headers', opts.exposedHeaders.join(', '));
  }

  // Set max age for preflight cache
  headers.set('Access-Control-Max-Age', opts.maxAge.toString());

  return headers;
}

/**
 * Handle CORS preflight (OPTIONS) requests
 * Optimized for minimal blocking time - fast path for preflight
 */
export function handleCORSPreflight(
  request: NextRequest,
  options: CORSOptions = {}
): NextResponse | null {
  // Fast path: Early return if not OPTIONS (most common case)
  if (request.method !== 'OPTIONS') {
    return null;
  }

  // Fast path: Get origin early (no async operations)
  const origin = request.headers.get('origin');
  
  // Fast path: If no origin, allow (same-origin request)
  if (!origin) {
    // Same-origin request, return minimal preflight response
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const headers = new Headers();
    headers.set('Access-Control-Allow-Methods', opts.allowedMethods.join(', '));
    headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));
    headers.set('Access-Control-Max-Age', opts.maxAge.toString());
    // Cache preflight response for 24 hours to reduce future requests
    headers.set('Cache-Control', `public, max-age=${opts.maxAge}, immutable`);
    
    return new NextResponse(null, {
      status: 204,
      headers,
    });
  }

  // Validate origin (fast synchronous check)
  const headers = getCORSHeaders(origin, options);

  // If headers are empty, origin was invalid
  if (headers.get('Access-Control-Allow-Origin') === null) {
    // Log asynchronously to avoid blocking
    Promise.resolve().then(() => {
      securityLog('cors_preflight_blocked', { origin }, 'warn');
    });
    
    return NextResponse.json(
      { error: 'CORS policy: Origin not allowed' },
      { status: 403, headers }
    );
  }

  // Add cache headers to reduce future preflight requests
  // Browsers will cache this response based on Access-Control-Max-Age
  const opts = { ...DEFAULT_OPTIONS, ...options };
  headers.set('Cache-Control', `public, max-age=${opts.maxAge}, immutable`);

  return new NextResponse(null, {
    status: 204, // No Content - fastest response
    headers,
  });
}

/**
 * Add CORS headers to response
 * Use this in API route handlers
 */
export function withCORS(
  response: NextResponse,
  request: NextRequest,
  options: CORSOptions = {}
): NextResponse {
  const origin = request.headers.get('origin');
  const corsHeaders = getCORSHeaders(origin, options);

  // Merge CORS headers into response
  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * CORS middleware wrapper for API routes
 * Handles both preflight and actual requests
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   // Handle preflight
 *   const preflight = handleCORSPreflight(request);
 *   if (preflight) return preflight;
 *   
 *   // Your route logic
 *   const response = NextResponse.json({ data: '...' });
 *   return withCORS(response, request);
 * }
 * ```
 */
export function corsMiddleware(
  request: NextRequest,
  options: CORSOptions = {}
): {
  handlePreflight: () => NextResponse | null;
  addHeaders: (response: NextResponse) => NextResponse;
} {
  return {
    handlePreflight: () => handleCORSPreflight(request, options),
    addHeaders: (response: NextResponse) => withCORS(response, request, options),
  };
}

/**
 * Helper function to create CORS-enabled JSON responses
 * Simplifies adding CORS to API route responses
 * 
 * @example
 * ```typescript
 * return corsJsonResponse(request, { success: true, data: {...} }, { status: 200 });
 * ```
 */
export function corsJsonResponse(
  request: NextRequest,
  data: any,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(data, init);
  return withCORS(response, request);
}

