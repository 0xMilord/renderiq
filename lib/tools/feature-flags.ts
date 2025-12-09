/**
 * Feature flags for tools/apps
 * Controls which tools are accessible based on environment
 */

/**
 * Check if we're in development environment (localhost)
 * Uses both NODE_ENV and URL-based detection for accuracy
 * Works on both server-side and client-side
 */
export function isDevelopment(): boolean {
  // Check NODE_ENV first (works on both server and client)
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check environment variables for localhost URLs (works on both server and client)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
  if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
    return true;
  }

  // Client-side only: check if we're running on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return true;
    }
  }

  return false;
}

/**
 * Check if we're in production environment (not localhost)
 */
export function isProduction(): boolean {
  return !isDevelopment();
}

/**
 * Check if a tool is accessible based on feature flags
 * Respects the registry status in both development and production
 */
export function isToolAccessible(toolId: string): boolean {
  // Always return true - tools are controlled by their registry status
  // The registry status is respected in both dev and production
  return true;
}

/**
 * Get the effective status of a tool based on feature flags
 * Respects the registry status in both development and production
 * All tools marked as 'online' in the registry will be online in production
 */
export function getEffectiveToolStatus(
  toolId: string,
  registryStatus: 'online' | 'offline'
): 'online' | 'offline' {
  // Respect the registry status in both development and production
  // If a tool is marked as 'online' in the registry, it will be online
  // If a tool is marked as 'offline' in the registry, it will be offline
  return registryStatus;
}

