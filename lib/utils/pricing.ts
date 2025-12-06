/**
 * Volume-Based Pricing Utility Functions
 * Implements tiered pricing strategy for credit packages
 */

export interface PricingTier {
  name: 'single' | 'standard' | 'bulk';
  minCredits: number;
  maxCredits?: number;
  pricePerCredit: number;
  minTotalPrice?: number;
  description: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'single',
    minCredits: 1,
    maxCredits: 1,
    pricePerCredit: 10,
    description: 'Premium pricing for single-use customers',
  },
  {
    name: 'bulk',
    minCredits: 125000, // 2.5L / 2 = 125k credits minimum
    pricePerCredit: 2,
    minTotalPrice: 250000, // 2.5 Lakh INR minimum
    description: 'Enterprise bulk pricing',
  },
  {
    name: 'standard',
    minCredits: 2,
    pricePerCredit: 5,
    description: 'Standard pricing for regular users',
  },
];

/**
 * Calculate price per credit based on number of credits and total price
 * @param credits - Number of credits
 * @param totalPrice - Optional total price (used for bulk tier determination)
 * @returns Price per credit in INR
 */
export function calculatePricePerCredit(credits: number, totalPrice?: number): number {
  // Check bulk tier first (based on total price)
  if (totalPrice !== undefined && totalPrice >= 250000) {
    return 2;
  }
  
  // Check if credits * 2 would qualify for bulk tier
  if (credits >= 125000) {
    return 2;
  }
  
  // Check single credit
  if (credits === 1) {
    return 10;
  }
  
  // Default to standard pricing
  return 5;
}

/**
 * Calculate total price based on number of credits
 * @param credits - Number of credits
 * @returns Total price in INR
 */
export function calculateTotalPrice(credits: number): number {
  const pricePerCredit = calculatePricePerCredit(credits);
  return credits * pricePerCredit;
}

/**
 * Get pricing tier for given credits and total price
 * @param credits - Number of credits
 * @param totalPrice - Optional total price
 * @returns PricingTier object
 */
export function getPricingTier(credits: number, totalPrice?: number): PricingTier {
  const pricePerCredit = calculatePricePerCredit(credits, totalPrice);
  
  if (pricePerCredit === 10) {
    return PRICING_TIERS.find(t => t.name === 'single')!;
  }
  if (pricePerCredit === 2) {
    return PRICING_TIERS.find(t => t.name === 'bulk')!;
  }
  return PRICING_TIERS.find(t => t.name === 'standard')!;
}

/**
 * Calculate savings compared to standard rate
 * @param credits - Number of credits
 * @param pricePerCredit - Actual price per credit
 * @returns Savings amount and percentage
 */
export function calculateSavings(credits: number, pricePerCredit: number): {
  amount: number;
  percentage: number;
} {
  const standardPrice = credits * 5; // Standard rate is ₹5/credit
  const actualPrice = credits * pricePerCredit;
  const savings = standardPrice - actualPrice;
  const percentage = standardPrice > 0 ? (savings / standardPrice) * 100 : 0;
  
  return {
    amount: Math.max(0, savings),
    percentage: Math.max(0, percentage),
  };
}

/**
 * Validate package pricing
 * @param credits - Number of credits
 * @param price - Package price
 * @returns true if price matches calculated price
 */
export function validatePackagePricing(credits: number, price: number): boolean {
  const calculatedPrice = calculateTotalPrice(credits);
  // Allow small rounding differences (within ₹1)
  return Math.abs(calculatedPrice - price) <= 1;
}

