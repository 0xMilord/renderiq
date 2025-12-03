/**
 * Rate Limiting Utility
 * Simple in-memory rate limiting (for Vercel serverless)
 * For production, consider using Redis or Vercel Edge Config
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Check rate limit for an identifier (IP, user ID, etc.)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // Clean up expired entries
  if (entry && entry.resetTime < now) {
    rateLimitStore.delete(key);
    entry = undefined;
  }
  
  // Create new entry if needed
  if (!entry) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  
  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier from request or headers
 */
export function getClientIdentifier(requestOrHeaders: Request | Headers): string {
  let headers: Headers;
  
  // Handle both Request and Headers objects
  if (requestOrHeaders instanceof Request) {
    headers = requestOrHeaders.headers;
  } else if (requestOrHeaders instanceof Headers) {
    headers = requestOrHeaders;
  } else {
    // Fallback for server actions or other contexts
    return 'unknown';
  }
  
  // Try to get IP from headers (Vercel provides this)
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  return ip;
}

/**
 * Rate limit middleware helper
 */
export function rateLimitMiddleware(
  request: Request,
  config?: RateLimitConfig
): { allowed: boolean; response?: Response } {
  const identifier = getClientIdentifier(request);
  const { allowed, remaining, resetTime } = checkRateLimit(identifier, config);
  
  if (!allowed) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.' 
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(config?.maxRequests || DEFAULT_CONFIG.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetTime),
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
          },
        }
      ),
    };
  }
  
  return { allowed: true };
}



