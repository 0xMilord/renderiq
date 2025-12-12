import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { generateFingerprintHash, parseUserAgent } from '@/lib/utils/device-fingerprint';
import { getClientIdentifier, checkRateLimit } from '@/lib/utils/rate-limit';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';

/**
 * Device Fingerprint API
 * Collects device fingerprint data from client for sybil detection
 * This is called before/during signup to collect device characteristics
 */
export async function POST(request: NextRequest) {
  // ⚡ Fast path: Handle CORS preflight immediately
  const preflight = handleCORSPreflight(request);
  if (preflight) return preflight;

  try {
    // Rate limit fingerprint collection (prevent abuse)
    const ipAddress = getClientIdentifier(request);
    const rateLimit = checkRateLimit(ipAddress, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      const rateLimitResponse = NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
      return withCORS(rateLimitResponse, request);
    }

    const body = await request.json().catch(() => ({}));

    const {
      userAgent,
      language,
      timezone,
      screenResolution,
      colorDepth,
      hardwareConcurrency,
      deviceMemory,
      platform,
      cookieEnabled,
      doNotTrack,
      plugins,
      canvasFingerprint,
    } = body;

    // Validate required fields
    if (!userAgent || !language || !timezone) {
      const validationErrorResponse = NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
      return withCORS(validationErrorResponse, request);
    }

    // Generate fingerprint hash
    const fingerprintData = {
      userAgent,
      language,
      timezone,
      screenResolution,
      colorDepth,
      hardwareConcurrency,
      deviceMemory,
      platform,
      cookieEnabled: cookieEnabled !== false,
      doNotTrack,
      plugins,
      canvasFingerprint,
    };

    const fingerprintHash = generateFingerprintHash(fingerprintData);
    const { browser, os, platform: detectedPlatform } = parseUserAgent(userAgent);

    logger.log('🔍 Device Fingerprint: Collected', {
      fingerprintHash: fingerprintHash.substring(0, 16) + '...',
      browser,
      os,
      platform: detectedPlatform,
    });

    // Return fingerprint hash to client (they'll send it during signup)
    const successResponse = NextResponse.json({
      success: true,
      fingerprintHash,
      deviceInfo: {
        browser,
        os,
        platform: detectedPlatform,
      },
    });
    return withCORS(successResponse, request);
  } catch (error) {
    logger.error('❌ Device Fingerprint: Error collecting fingerprint:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Failed to process fingerprint' },
      { status: 500 }
    );
    return withCORS(errorResponse, request);
  }
}

