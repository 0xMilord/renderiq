import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

/**
 * API route to detect user's country from IP address
 * Uses free IP geolocation services as fallback
 */
export async function GET(request: NextRequest) {
  try {
    // Get client IP from request
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               request.ip || 
               '';

    // Method 1: Check Cloudflare/Vercel headers first (most accurate)
    const cfCountry = request.headers.get('cf-ipcountry');
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    
    if (cfCountry && cfCountry !== 'XX' && cfCountry.length === 2) {
      logger.log('🌍 Country detected from Cloudflare header:', cfCountry);
      return NextResponse.json({ 
        success: true, 
        country: cfCountry.toUpperCase(),
        method: 'cloudflare-header'
      });
    }
    
    if (vercelCountry && vercelCountry !== 'XX' && vercelCountry.length === 2) {
      logger.log('🌍 Country detected from Vercel header:', vercelCountry);
      return NextResponse.json({ 
        success: true, 
        country: vercelCountry.toUpperCase(),
        method: 'vercel-header'
      });
    }

    // Method 2: Use free IP geolocation API (ip-api.com - no API key needed)
    if (ip && ip !== '::1' && !ip.startsWith('127.')) {
      try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode`, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.countryCode && data.countryCode.length === 2) {
            logger.log('🌍 Country detected from IP-API:', data.countryCode);
            return NextResponse.json({ 
              success: true, 
              country: data.countryCode.toUpperCase(),
              method: 'ip-api'
            });
          }
        }
      } catch (error) {
        logger.warn('⚠️ IP-API request failed:', error);
      }
    }

    // Method 3: Fallback to Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      const locale = acceptLanguage.split(',')[0];
      const countryCode = locale.split('-')[1]?.toUpperCase();
      if (countryCode && countryCode.length === 2) {
        logger.log('🌍 Country detected from Accept-Language:', countryCode);
        return NextResponse.json({ 
          success: true, 
          country: countryCode,
          method: 'accept-language'
        });
      }
    }

    // Default fallback
    logger.log('🌍 No country detected, defaulting to US');
    return NextResponse.json({ 
      success: true, 
      country: 'US',
      method: 'default'
    });
  } catch (error) {
    logger.error('❌ Error detecting country:', error);
    return NextResponse.json({ 
      success: true, 
      country: 'US',
      method: 'error-fallback'
    });
  }
}

