/**
 * Auth Redirect Utility
 * 
 * Centralized logic for determining the correct redirect URL for OAuth flows.
 * Ensures localhost:3000 is used in development mode, even if NEXT_PUBLIC_SITE_URL is set.
 */

/**
 * Get the correct site URL for OAuth redirects
 * Prioritizes localhost detection in development mode
 * 
 * @param request - Optional Request object to detect origin
 * @param origin - Optional origin string (for server actions that can't access request)
 */
export function getAuthRedirectUrl(request?: Request, origin?: string): string {
  const isLocalEnv = process.env.NODE_ENV === 'development';
  
  // Try to get origin from request object first
  let detectedOrigin: string | null = null;
  if (request) {
    try {
      const url = new URL(request.url);
      detectedOrigin = url.origin;
    } catch (error) {
      console.warn('Failed to parse request URL:', error);
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
  
  // In development, always use localhost:3000 if origin is localhost
  if (isLocalEnv && isLocalhost) {
    console.log('🔧 Auth Redirect: Using localhost:3000 for development');
    return 'http://localhost:3000';
  }
  
  // Check if we're in development mode (even without request)
  if (isLocalEnv) {
    // In dev, prefer localhost:3000 unless explicitly overridden
    // But allow NEXT_PUBLIC_SITE_URL to override if it's also localhost
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl && (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1'))) {
      console.log('🔧 Auth Redirect: Using NEXT_PUBLIC_SITE_URL (localhost):', siteUrl);
      return siteUrl;
    }
    console.log('🔧 Auth Redirect: Using default localhost:3000 for development');
    return 'http://localhost:3000';
  }
  
  // Production: use configured site URL or fallback
  const prodUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.com';
  console.log('🔧 Auth Redirect: Using production URL:', prodUrl);
  return prodUrl;
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
  console.log('🔧 OAuth Callback URL:', callbackUrl);
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
  
  // Priority 1: Development + localhost → force localhost:3000
  if (isLocalEnv && isLocalhost) {
    return `http://localhost:3000${next}`;
  }
  
  // Priority 2: Use configured site URL
  if (siteUrl) {
    return `${siteUrl}${next}`;
  }
  
  // Priority 3: Use forwarded host (production)
  if (forwardedHost) {
    return `https://${forwardedHost}${next}`;
  }
  
  // Priority 4: Fallback to origin
  return `${origin}${next}`;
}

