/**
 * Paddle Price Utilities
 * 
 * Helper functions to get Paddle prices from Price ID mapping
 * Since Paddle uses fixed prices in Price IDs, we need to store/retrieve them
 */

import { logger } from './logger';

/**
 * Get Paddle USD price for a package/plan
 * 
 * Note: This requires the actual price to be stored somewhere.
 * Options:
 * 1. Store in database (paddlePriceUSD field)
 * 2. Fetch from Paddle API (slower)
 * 3. Store in extended price mapping (quick fix)
 * 
 * For now, this is a placeholder that returns null.
 * You should implement one of the above options.
 */
export function getPaddlePriceUSD(packageId: string, currency: string = 'USD'): number | null {
  // TODO: Implement price retrieval
  // Option 1: Query database for paddlePriceUSD field
  // Option 2: Fetch from Paddle API using priceId
  // Option 3: Use extended mapping with prices
  
  // For now, return null - frontend should handle this
  return null;
}

/**
 * Get Paddle Price ID for a package/plan
 */
export function getPaddlePriceId(packageId: string, currency: string = 'USD'): string | null {
  const priceIdMap = process.env.PADDLE_PRICE_IDS;
  if (!priceIdMap) {
    return null;
  }

  try {
    const prices = JSON.parse(priceIdMap);
    const key = `${packageId}_${currency}`;
    return prices[key] || null;
  } catch (error) {
    logger.error('❌ PaddlePrices: Error parsing price ID map:', error);
    return null;
  }
}

/**
 * Check if a package/plan has Paddle pricing configured
 */
export function hasPaddlePricing(packageId: string, currency: string = 'USD'): boolean {
  return getPaddlePriceId(packageId, currency) !== null;
}

