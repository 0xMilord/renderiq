/**
 * Fingerprint Parser Utility
 * Centralized logic for parsing device fingerprints from cookies and headers
 */

import type { DeviceFingerprintInput } from '@/lib/services/sybil-detection';
import { logger } from '@/lib/utils/logger';

/**
 * Parse device fingerprint from cookie
 */
export function parseFingerprintFromCookie(cookieHeader: string | null): DeviceFingerprintInput | undefined {
  if (!cookieHeader) return undefined;

  try {
    const fingerprintCookie = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('device_fingerprint='));
    
    if (!fingerprintCookie) return undefined;

    const cookieData = decodeURIComponent(fingerprintCookie.split('=')[1]);
    const parsed = JSON.parse(cookieData);
    
    return {
      userAgent: parsed.userAgent || '',
      language: parsed.language || 'en',
      timezone: parsed.timezone || 'UTC',
      screenResolution: parsed.screenResolution,
      colorDepth: parsed.colorDepth,
      hardwareConcurrency: parsed.hardwareConcurrency,
      deviceMemory: parsed.deviceMemory,
      platform: parsed.platform || 'unknown',
      cookieEnabled: parsed.cookieEnabled !== false,
      doNotTrack: parsed.doNotTrack,
      plugins: parsed.plugins,
      canvasFingerprint: parsed.canvasFingerprint,
    };
  } catch (error) {
    logger.warn('⚠️ FingerprintParser: Failed to parse fingerprint cookie:', error);
    return undefined;
  }
}

/**
 * Create minimal fingerprint from request headers
 */
export function createMinimalFingerprintFromHeaders(
  headers: Headers,
  userAgent?: string | null
): DeviceFingerprintInput {
  const ua = userAgent || headers.get('user-agent') || '';
  const acceptLanguage = headers.get('accept-language')?.split(',')[0] || 'en';
  
  // Try to get timezone from cookie if available
  const cookieHeader = headers.get('cookie');
  let timezone = 'UTC';
  if (cookieHeader) {
    const timezoneCookie = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('timezone='));
    if (timezoneCookie) {
      timezone = decodeURIComponent(timezoneCookie.split('=')[1]);
    }
  }
  
  return {
    userAgent: ua,
    language: acceptLanguage,
    timezone,
    platform: 'unknown',
    cookieEnabled: true,
  };
}

/**
 * Parse fingerprint from cookie or create minimal from headers
 */
export function getFingerprintFromRequest(
  request: Request,
  providedFingerprint?: DeviceFingerprintInput
): DeviceFingerprintInput | undefined {
  // Use provided fingerprint if available
  if (providedFingerprint) {
    return providedFingerprint;
  }

  // Try to parse from cookie
  const cookieHeader = request.headers.get('cookie');
  const cookieFingerprint = parseFingerprintFromCookie(cookieHeader);
  if (cookieFingerprint) {
    // Enhance with user agent from headers if missing
    if (!cookieFingerprint.userAgent) {
      cookieFingerprint.userAgent = request.headers.get('user-agent') || '';
    }
    return cookieFingerprint;
  }

  // Fallback: create minimal fingerprint from headers
  return createMinimalFingerprintFromHeaders(
    request.headers,
    request.headers.get('user-agent')
  );
}

