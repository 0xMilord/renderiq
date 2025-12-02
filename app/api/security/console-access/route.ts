import { NextRequest, NextResponse } from 'next/server';
import { securityLog } from '@/lib/utils/security';
import { logger } from '@/lib/utils/logger';

/**
 * Security endpoint to track console access
 * Helps detect potential account hijacking attempts
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json().catch(() => ({}));
    
    // Log security event (redacted, goes to Vercel)
    securityLog('console_access', {
      timestamp: data.timestamp,
      userAgent: data.userAgent?.substring(0, 100), // Truncate
    }, 'info');
    
    // Return success without exposing anything
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Silently fail - don't expose errors
    logger.error('Security logging error:', error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}


