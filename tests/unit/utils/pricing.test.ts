/**
 * Tests for pricing utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePricePerCredit,
  calculateTotalPrice,
  getPricingTier,
  calculateSavings,
  PRICING_TIERS,
} from '@/lib/utils/pricing';

describe('Pricing Utils', () => {
  describe('calculatePricePerCredit', () => {
    it('should return 10 for single credit', () => {
      expect(calculatePricePerCredit(1)).toBe(10);
    });

    it('should return 5 for standard credits', () => {
      expect(calculatePricePerCredit(2)).toBe(5);
      expect(calculatePricePerCredit(100)).toBe(5);
      expect(calculatePricePerCredit(1000)).toBe(5);
    });

    it('should return 2 for bulk credits (125k+)', () => {
      expect(calculatePricePerCredit(125000)).toBe(2);
      expect(calculatePricePerCredit(200000)).toBe(2);
    });

    it('should return 2 for bulk tier based on total price', () => {
      expect(calculatePricePerCredit(100000, 250000)).toBe(2);
    });

    it('should prioritize total price over credit count for bulk', () => {
      // Even with fewer credits, if total price is 2.5L+, use bulk pricing
      expect(calculatePricePerCredit(100000, 250000)).toBe(2);
    });
  });

  describe('calculateTotalPrice', () => {
    it('should calculate price for single credit', () => {
      expect(calculateTotalPrice(1)).toBe(10);
    });

    it('should calculate price for standard credits', () => {
      expect(calculateTotalPrice(2)).toBe(10);
      expect(calculateTotalPrice(100)).toBe(500);
    });

    it('should calculate price for bulk credits', () => {
      expect(calculateTotalPrice(125000)).toBe(250000);
    });
  });

  describe('getPricingTier', () => {
    it('should return single tier for 1 credit', () => {
      const tier = getPricingTier(1);
      expect(tier.name).toBe('single');
      expect(tier.pricePerCredit).toBe(10);
    });

    it('should return standard tier for 2-124999 credits', () => {
      const tier = getPricingTier(100);
      expect(tier.name).toBe('standard');
      expect(tier.pricePerCredit).toBe(5);
    });

    it('should return bulk tier for 125k+ credits', () => {
      const tier = getPricingTier(125000);
      expect(tier.name).toBe('bulk');
      expect(tier.pricePerCredit).toBe(2);
    });

    it('should return bulk tier based on total price', () => {
      const tier = getPricingTier(100000, 250000);
      expect(tier.name).toBe('bulk');
    });
  });

  describe('calculateSavings', () => {
    it('should calculate savings for bulk tier', () => {
      const savings = calculateSavings(125000, 2);
      expect(savings.amount).toBeGreaterThan(0);
      expect(savings.percentage).toBeGreaterThan(0);
    });

    it('should show no savings for standard tier', () => {
      const savings = calculateSavings(100, 5);
      expect(savings.amount).toBe(0);
      expect(savings.percentage).toBe(0);
    });

    it('should calculate correct savings percentage', () => {
      // Bulk: 2 per credit vs Standard: 5 per credit
      // For 125k credits: (5-2) * 125000 = 375000 savings
      const savings = calculateSavings(125000, 2);
      expect(savings.percentage).toBe(60); // (5-2)/5 * 100 = 60%
    });
  });

  describe('PRICING_TIERS', () => {
    it('should have all three tiers defined', () => {
      expect(PRICING_TIERS).toHaveLength(3);
      expect(PRICING_TIERS.find(t => t.name === 'single')).toBeDefined();
      expect(PRICING_TIERS.find(t => t.name === 'standard')).toBeDefined();
      expect(PRICING_TIERS.find(t => t.name === 'bulk')).toBeDefined();
    });

    it('should have correct price per credit for each tier', () => {
      const single = PRICING_TIERS.find(t => t.name === 'single');
      const standard = PRICING_TIERS.find(t => t.name === 'standard');
      const bulk = PRICING_TIERS.find(t => t.name === 'bulk');

      expect(single?.pricePerCredit).toBe(10);
      expect(standard?.pricePerCredit).toBe(5);
      expect(bulk?.pricePerCredit).toBe(2);
    });
  });
});

