/**
 * CDN URL utilities with fallback support
 * Handles DNS resolution issues and provides fallback to direct GCS URLs
 */

/**
 * Convert CDN URL to direct GCS URL as fallback
 * New structure: https://cdn.renderiq.io/renders/... -> https://storage.googleapis.com/renderiq-renders/...
 *                https://cdn.renderiq.io/uploads/... -> https://storage.googleapis.com/renderiq-uploads/...
 * Old structure (backward compat): https://cdn.renderiq.io/renderiq-renders/... -> https://storage.googleapis.com/renderiq-renders/...
 */
export function cdnToDirectGCS(cdnUrl: string): string {
  if (!cdnUrl || typeof cdnUrl !== 'string') {
    return cdnUrl || '';
  }

  // Check for CDN domain (supports both env var and hardcoded)
  const cdnDomain = process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || 'cdn.renderiq.io';
  
  if (!cdnUrl.includes(cdnDomain)) {
    return cdnUrl; // Not a CDN URL, return as-is
  }

  // Map new simplified paths to full bucket names
  // New structure: /renders/... -> renderiq-renders/...
  //                /uploads/... -> renderiq-uploads/...
  let gcsUrl = cdnUrl.replace(cdnDomain, 'storage.googleapis.com');
  
  // Handle new simplified path structure
  if (gcsUrl.includes('/renders/')) {
    gcsUrl = gcsUrl.replace('/renders/', '/renderiq-renders/');
  } else if (gcsUrl.includes('/uploads/')) {
    gcsUrl = gcsUrl.replace('/uploads/', '/renderiq-uploads/');
  }
  // Old structure (renderiq-renders/ and renderiq-uploads/) is already correct, no change needed

  return gcsUrl;
}

/**
 * Check if URL is a CDN URL that can fallback to direct GCS
 */
export function isCDNUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const cdnDomain = process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || 'cdn.renderiq.io';
  return url.includes(cdnDomain);
}

/**
 * Get fallback URL for CDN (returns direct GCS URL)
 * Use this in onError handlers to automatically fallback
 */
export function getCDNFallbackUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Only provide fallback for CDN URLs
  if (isCDNUrl(url)) {
    return cdnToDirectGCS(url);
  }
  
  return null;
}

/**
 * Handle image error with CDN fallback
 * Returns the fallback URL if available, otherwise returns placeholder
 */
export function handleImageErrorWithFallback(
  originalUrl: string | null | undefined,
  event: React.SyntheticEvent<HTMLImageElement, Event>
): string {
  const fallbackUrl = getCDNFallbackUrl(originalUrl);
  
  if (fallbackUrl) {
    // Try direct GCS URL as fallback
    return fallbackUrl;
  }
  
  // No fallback available, use placeholder
  return '/placeholder-image.jpg';
}

/**
 * Get image URL with CDN fallback
 * Returns CDN URL if available, falls back to direct GCS URL server-side
 */
export function getImageUrlWithFallback(url: string | null | undefined): string {
  if (!url) return '/placeholder-image.jpg';
  
  // If it's already a direct GCS URL, use it
  if (url.includes('storage.googleapis.com')) {
    return url;
  }
  
  // If it's a CDN URL, use it (browser will handle DNS)
  // Server-side should use direct GCS to avoid DNS issues
  if (isCDNUrl(url)) {
    // Client-side: use CDN URL (will fallback on error)
    if (typeof window !== 'undefined') {
      return url;
    }
    // Server-side: fallback to direct GCS to avoid DNS resolution issues
    return cdnToDirectGCS(url);
  }
  
  return url;
}

