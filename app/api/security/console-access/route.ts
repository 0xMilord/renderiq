import { NextRequest, NextResponse } from 'next/server';
import { securityLog } from '@/lib/utils/security';
import { logger } from '@/lib/utils/logger';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';

/**
 * Security endpoint to track console access
 * Helps detect potential account hijacking attempts
 */
export async function POST(request: NextRequest) {
  // ⚡ Fast path: Handle CORS preflight immediately
  const preflight = handleCORSPreflight(request);
  if (preflight) return preflight;

  try {
    const data = await request.json().catch(() => ({}));
    
    // Log security event (redacted, goes to Vercel)
    securityLog('console_access', {
      timestamp: data.timestamp,
      userAgent: data.userAgent?.substring(0, 100), // Truncate
    }, 'info');
    
    // Return success without exposing anything
    const successResponse = NextResponse.json({ success: true }, { status: 200 });
    return withCORS(successResponse, request);
  } catch (error) {
    // Silently fail - don't expose errors
    logger.error('Security logging error:', error);
    const errorResponse = NextResponse.json({ success: true }, { status: 200 });
    return withCORS(errorResponse, request);
  }
}







