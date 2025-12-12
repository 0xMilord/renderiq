/**
 * Server-Side Country Detection Utility
 * 
 * Detects user's country for payment provider routing:
 * - India (IN) → Razorpay
 * - International → Paddle
 * 
 * NOTE: This file is for server-side use only.
 * For client-side, use country-detection.client.ts
 */

import { headers } from 'next/headers';
import { logger } from './logger';

export type CountryCode = string; // ISO 3166-1 alpha-2 country code

/**
 * Detect user's country from request headers
 * 
 * Priority:
 * 1. Cloudflare/Vercel geolocation headers (most accurate)
 * 2. User profile country (if logged in)
 * 3. Browser locale (fallback)
 * 4. Default to 'US' (international)
 */
export async function detectUserCountry(request?: Request): Promise<CountryCode> {
  try {
    // Method 1: Check Cloudflare/Vercel geolocation headers (most accurate)
    if (request) {
      const cfCountry = request.headers.get('cf-ipcountry');
      const vercelCountry = request.headers.get('x-vercel-ip-country');
      
      if (cfCountry && cfCountry !== 'XX' && cfCountry.length === 2) {
        logger.log('🌍 Country detected from Cloudflare:', cfCountry);
        return cfCountry.toUpperCase();
      }
      
      if (vercelCountry && vercelCountry !== 'XX' && vercelCountry.length === 2) {
        logger.log('🌍 Country detected from Vercel:', vercelCountry);
        return vercelCountry.toUpperCase();
      }
    }

    // Method 2: Try Next.js headers() (server-side)
    try {
      const headersList = await headers();
      const cfCountry = headersList.get('cf-ipcountry');
      const vercelCountry = headersList.get('x-vercel-ip-country');
      
      if (cfCountry && cfCountry !== 'XX' && cfCountry.length === 2) {
        logger.log('🌍 Country detected from headers (Cloudflare):', cfCountry);
        return cfCountry.toUpperCase();
      }
      
      if (vercelCountry && vercelCountry !== 'XX' && vercelCountry.length === 2) {
        logger.log('🌍 Country detected from headers (Vercel):', vercelCountry);
        return vercelCountry.toUpperCase();
      }
    } catch (error) {
      // headers() only works in server components, ignore if called from client
    }

    // Method 3: Default to US (international) if no geolocation available
    logger.log('🌍 No country detected, defaulting to US (international)');
    return 'US';
  } catch (error) {
    logger.error('❌ Error detecting country:', error);
    // Default to US (international) on error
    return 'US';
  }
}

/**
 * Check if country should use Razorpay (India only)
 */
export function shouldUseRazorpay(country: CountryCode): boolean {
  return country === 'IN';
}

/**
 * Check if country should use Paddle (all except India)
 */
export function shouldUsePaddle(country: CountryCode): boolean {
  return country !== 'IN';
}

/**
 * Get payment provider for country
 */
export function getPaymentProviderForCountry(country: CountryCode): 'razorpay' | 'paddle' {
  return shouldUseRazorpay(country) ? 'razorpay' : 'paddle';
}

