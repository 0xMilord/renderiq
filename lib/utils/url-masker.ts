/**
 * URL Masking Utility
 * Masks Supabase URLs to use auth.renderiq.io instead of projectid.supabase.co
 * This allows branded auth URLs without purchasing Supabase's custom domain feature
 * 
 * ⚠️ BACKWARD COMPATIBLE: Returns original URL if masking fails or is not configured
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const MASKED_AUTH_DOMAIN = process.env.NEXT_PUBLIC_MASKED_AUTH_DOMAIN || 'auth.renderiq.io';

/**
 * Masks a Supabase URL to use the masked domain
 * Example: https://projectid.supabase.co/auth/v1/verify?token=xyz
 *   -> https://auth.renderiq.io/auth/v1/verify?token=xyz
 * 
 * ⚠️ BACKWARD COMPATIBLE: 
 * - Returns original URL if SUPABASE_URL is not set
 * - Returns original URL if URL doesn't match Supabase domain
 * - Returns original URL if already masked
 * - Returns original URL if any error occurs
 */
export function maskSupabaseUrl(url: string | null | undefined): string {
  // Early return for invalid inputs
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  // Early return if SUPABASE_URL is not configured
  if (!SUPABASE_URL) {
    return url; // Return original - backward compatible
  }

  // Check if URL is already masked (prevent double masking)
  if (url.includes(MASKED_AUTH_DOMAIN)) {
    return url; // Already masked, return as-is
  }

  try {
    // Extract the Supabase domain (e.g., https://projectid.supabase.co)
    const supabaseUrlObj = new URL(SUPABASE_URL);
    const supabaseDomain = supabaseUrlObj.origin; // e.g., https://projectid.supabase.co

    // Only mask if URL actually contains Supabase domain
    if (!url.includes(supabaseUrlObj.hostname)) {
      return url; // Not a Supabase URL, return original - backward compatible
    }

    // Replace the Supabase domain with masked domain
    // Keep everything else (path, query params, etc.) the same
    const maskedUrl = url.replace(supabaseDomain, `https://${MASKED_AUTH_DOMAIN}`);

    // Verify the replacement actually happened
    if (maskedUrl === url) {
      return url; // No replacement occurred, return original - backward compatible
    }

    return maskedUrl;
  } catch (error) {
    // Silently fail and return original URL - backward compatible
    // Don't log errors in production to avoid noise
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ URL Masker: Error masking URL, returning original:', error);
    }
    return url; // Return original if masking fails - backward compatible
  }
}

/**
 * Unmasks a URL back to Supabase domain (for internal use)
 * Example: https://auth.renderiq.io/auth/v1/verify?token=xyz
 *   -> https://projectid.supabase.co/auth/v1/verify?token=xyz
 * 
 * ⚠️ BACKWARD COMPATIBLE: Returns original URL if unmasking fails
 */
export function unmaskAuthUrl(url: string | null | undefined): string {
  // Early return for invalid inputs
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  // Early return if SUPABASE_URL is not configured
  if (!SUPABASE_URL) {
    return url; // Return original - backward compatible
  }

  // If URL doesn't contain masked domain, return as-is
  if (!url.includes(MASKED_AUTH_DOMAIN)) {
    return url; // Not a masked URL, return original - backward compatible
  }

  try {
    const supabaseUrlObj = new URL(SUPABASE_URL);
    const supabaseDomain = supabaseUrlObj.origin;
    const maskedDomain = `https://${MASKED_AUTH_DOMAIN}`;

    // Replace masked domain back to Supabase domain
    const unmaskedUrl = url.replace(maskedDomain, supabaseDomain);

    // Verify the replacement actually happened
    if (unmaskedUrl === url) {
      return url; // No replacement occurred, return original - backward compatible
    }

    return unmaskedUrl;
  } catch (error) {
    // Silently fail and return original URL - backward compatible
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ URL Masker: Error unmasking URL, returning original:', error);
    }
    return url; // Return original if unmasking fails - backward compatible
  }
}

/**
 * Checks if a URL needs masking
 * 
 * ⚠️ BACKWARD COMPATIBLE: Returns false if URL is invalid or already masked
 */
export function shouldMaskUrl(url: string | null | undefined): boolean {
  // Early return for invalid inputs
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Early return if SUPABASE_URL is not configured
  if (!SUPABASE_URL) {
    return false; // Can't mask without Supabase URL - backward compatible
  }

  // Don't mask if already masked
  if (url.includes(MASKED_AUTH_DOMAIN)) {
    return false; // Already masked - backward compatible
  }

  try {
    const supabaseUrlObj = new URL(SUPABASE_URL);
    const supabaseDomain = supabaseUrlObj.hostname; // e.g., projectid.supabase.co

    return url.includes(supabaseDomain);
  } catch {
    // Silently return false on error - backward compatible
    return false;
  }
}

