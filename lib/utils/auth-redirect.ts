/**
 * Auth Redirect Utility
 * 
 * Centralized logic for determining the correct redirect URL for OAuth flows.
 * Ensures localhost:3000 is used in development mode, even if NEXT_PUBLIC_SITE_URL is set.
 */

import { logger } from '@/lib/utils/logger';

/**
 * Get the correct site URL for OAuth redirects
 * Prioritizes localhost detection in development mode
 * 
 * @param request - Optional Request object to detect origin
 * @param origin - Optional origin string (for server actions that can't access request)
 */
export function getAuthRedirectUrl(request?: Request, origin?: string): string {
  // CRITICAL: In production, ALWAYS return production URL, never localhost
  // This ensures email redirects always point to production
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  // Try to get origin from request object first
  let detectedOrigin: string | null = null;
  if (request) {
    try {
      const url = new URL(request.url);
      detectedOrigin = url.origin;
    } catch (error) {
      logger.warn('Failed to parse request URL:', error);
    }
  }
  
  // Use provided origin if available
  if (!detectedOrigin && origin) {
    detectedOrigin = origin;
  }
  
  // Check if origin is localhost
  const isLocalhost = detectedOrigin 
    ? (detectedOrigin.includes('localhost') || detectedOrigin.includes('127.0.0.1'))
    : false;
  
  // CRITICAL: In production, NEVER use localhost, always use production URL
  // Even if request origin is localhost (could be misconfigured proxy)
  if (!isLocalEnv) {
    // Production mode: always use production URL
    const prodUrl = siteUrl || 'https://renderiq.io';
    logger.log('🔧 Auth Redirect: Production mode - Using production URL:', prodUrl);
    return prodUrl;
  }
  
  // Development mode: use localhost if detected
  if (isLocalhost) {
    logger.log('🔧 Auth Redirect: Development mode - Using localhost:3000');
    return 'http://localhost:3000';
  }
  
  // Development mode but no localhost detected
  // Check if NEXT_PUBLIC_SITE_URL is set and is localhost
  if (siteUrl && (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1'))) {
    logger.log('🔧 Auth Redirect: Development mode - Using NEXT_PUBLIC_SITE_URL (localhost):', siteUrl);
    return siteUrl;
  }
  
  // Development mode fallback
  logger.log('🔧 Auth Redirect: Development mode - Using default localhost:3000');
  return 'http://localhost:3000';
}

/**
 * Get the OAuth callback URL with optional next parameter
 * 
 * @param request - Optional Request object to detect origin
 * @param next - Optional redirect path after OAuth (defaults to '/')
 * @param origin - Optional origin string (for server actions)
 */
export function getOAuthCallbackUrl(request?: Request, next: string = '/', origin?: string): string {
  const baseUrl = getAuthRedirectUrl(request, origin);
  const callbackUrl = `${baseUrl}/auth/callback${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`;
  logger.log('🔧 OAuth Callback URL:', callbackUrl);
  return callbackUrl;
}

/**
 * Get the final redirect URL after OAuth callback
 * Handles both development and production scenarios
 */
export function getPostAuthRedirectUrl(request: Request, next: string = '/'): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const { origin } = new URL(request.url);
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  // CRITICAL: In production, NEVER use localhost, always use production URL
  if (!isLocalEnv) {
    // Production mode: prioritize configured site URL
    if (siteUrl) {
      logger.log('🔧 Post Auth Redirect: Production mode - Using NEXT_PUBLIC_SITE_URL:', siteUrl);
      return `${siteUrl}${next}`;
    }
    
    // Fallback to forwarded host (Vercel/Cloudflare)
    if (forwardedHost) {
      logger.log('🔧 Post Auth Redirect: Production mode - Using forwarded host:', forwardedHost);
      return `https://${forwardedHost}${next}`;
    }
    
    // Final fallback: production URL
    const prodUrl = 'https://renderiq.io';
    logger.log('🔧 Post Auth Redirect: Production mode - Using fallback production URL:', prodUrl);
    return `${prodUrl}${next}`;
  }
  
  // Development mode: use localhost if detected
  if (isLocalhost) {
    logger.log('🔧 Post Auth Redirect: Development mode - Using localhost:3000');
    return `http://localhost:3000${next}`;
  }
  
  // Development mode fallback
  logger.log('🔧 Post Auth Redirect: Development mode - Using default localhost:3000');
  return `http://localhost:3000${next}`;
}

