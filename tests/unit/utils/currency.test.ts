/**
 * Comprehensive tests for currency utility functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumberCompact,
  getRazorpayCurrencyCode,
  isCurrencySupported,
  detectUserCurrency,
  getExchangeRate,
  convertCurrency,
  SUPPORTED_CURRENCIES,
} from '@/lib/utils/currency';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format INR currency correctly', () => {
      expect(formatCurrency(1000, 'INR')).toBe('₹1,000.00');
      expect(formatCurrency(1000000, 'INR')).toBe('₹1,000,000.00');
      expect(formatCurrency(0, 'INR')).toBe('₹0.00');
    });

    it('should format USD currency correctly', () => {
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
      expect(formatCurrency(99.99, 'USD')).toBe('$99.99');
    });

    it('should format EUR currency correctly', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
    });

    it('should format GBP currency correctly', () => {
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00');
    });

    it('should format JPY without decimals', () => {
      expect(formatCurrency(1000, 'JPY')).toBe('¥1,000');
      expect(formatCurrency(1000.50, 'JPY')).toBe('¥1,001'); // Rounded
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-1000, 'INR')).toBe('₹-1,000.00');
    });

    it('should handle decimal amounts', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
      expect(formatCurrency(0.99, 'USD')).toBe('$0.99');
    });

    it('should default to INR for unsupported currency', () => {
      expect(formatCurrency(1000, 'UNKNOWN')).toBe('₹1,000.00');
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(999999999.99, 'USD')).toBe('$999,999,999.99');
    });

    it('should handle very small numbers', () => {
      expect(formatCurrency(0.01, 'USD')).toBe('$0.01');
    });
  });

  describe('formatNumberCompact', () => {
    it('should format numbers with k suffix', () => {
      expect(formatNumberCompact(1000)).toBe('1k');
      expect(formatNumberCompact(1500)).toBe('1.5k');
      expect(formatNumberCompact(9999)).toBe('10k');
    });

    it('should format numbers with m suffix', () => {
      expect(formatNumberCompact(1000000)).toBe('1m');
      expect(formatNumberCompact(1500000)).toBe('1.5m');
      expect(formatNumberCompact(9999999)).toBe('10m');
    });

    it('should format numbers with b suffix', () => {
      expect(formatNumberCompact(1000000000)).toBe('1b');
      expect(formatNumberCompact(1500000000)).toBe('1.5b');
    });

    it('should format numbers less than 1000 without suffix', () => {
      expect(formatNumberCompact(999)).toBe('999');
      expect(formatNumberCompact(100)).toBe('100');
      expect(formatNumberCompact(0)).toBe('0');
    });

    it('should handle string numbers', () => {
      expect(formatNumberCompact('1000')).toBe('1k');
      expect(formatNumberCompact('1500000')).toBe('1.5m');
    });

    it('should handle null and undefined', () => {
      expect(formatNumberCompact(null)).toBe('0');
      expect(formatNumberCompact(undefined)).toBe('0');
    });

    it('should handle NaN', () => {
      expect(formatNumberCompact(NaN)).toBe('0');
    });

    it('should remove .0 suffix', () => {
      expect(formatNumberCompact(2000)).toBe('2k');
      expect(formatNumberCompact(2000000)).toBe('2m');
    });
  });

  describe('formatCurrencyCompact', () => {
    it('should format currency with compact notation', () => {
      expect(formatCurrencyCompact(1000, 'USD')).toBe('$1k');
      expect(formatCurrencyCompact(1500000, 'USD')).toBe('$1.5m');
      expect(formatCurrencyCompact(2000000000, 'USD')).toBe('$2b');
    });

    it('should use correct currency symbol', () => {
      expect(formatCurrencyCompact(1000, 'INR')).toBe('₹1k');
      expect(formatCurrencyCompact(1000, 'EUR')).toBe('€1k');
      expect(formatCurrencyCompact(1000, 'GBP')).toBe('£1k');
    });

    it('should handle amounts less than 1000', () => {
      expect(formatCurrencyCompact(999, 'USD')).toBe('$999');
      expect(formatCurrencyCompact(100, 'USD')).toBe('$100');
    });
  });

  describe('getRazorpayCurrencyCode', () => {
    it('should return valid 3-letter currency code', () => {
      expect(getRazorpayCurrencyCode('USD')).toBe('USD');
      expect(getRazorpayCurrencyCode('INR')).toBe('INR');
      expect(getRazorpayCurrencyCode('EUR')).toBe('EUR');
    });

    it('should default to INR for invalid format', () => {
      expect(getRazorpayCurrencyCode('invalid')).toBe('INR');
      expect(getRazorpayCurrencyCode('US')).toBe('INR');
      expect(getRazorpayCurrencyCode('USDD')).toBe('INR');
    });

    it('should handle lowercase codes', () => {
      expect(getRazorpayCurrencyCode('usd')).toBe('INR'); // Must be uppercase
      expect(getRazorpayCurrencyCode('USD')).toBe('USD');
    });

    it('should handle empty string', () => {
      expect(getRazorpayCurrencyCode('')).toBe('INR');
    });

    it('should handle special characters', () => {
      expect(getRazorpayCurrencyCode('US$')).toBe('INR');
      expect(getRazorpayCurrencyCode('123')).toBe('INR');
    });
  });

  describe('isCurrencySupported', () => {
    it('should return true for supported currencies', () => {
      expect(isCurrencySupported('USD')).toBe(true);
      expect(isCurrencySupported('INR')).toBe(true);
      expect(isCurrencySupported('EUR')).toBe(true);
    });

    it('should return true for valid 3-letter ISO codes', () => {
      expect(isCurrencySupported('ABC')).toBe(true);
      expect(isCurrencySupported('XYZ')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isCurrencySupported('US')).toBe(false);
      expect(isCurrencySupported('USDD')).toBe(false);
      expect(isCurrencySupported('invalid')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isCurrencySupported('')).toBe(false);
    });
  });

  describe('detectUserCurrency', () => {
    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      global.localStorage = localStorageMock as any;
      
      // Mock navigator
      global.navigator = {
        language: 'en-US',
      } as any;
    });

    it('should return saved currency from localStorage', () => {
      (global.localStorage.getItem as any).mockReturnValue('EUR');
      expect(detectUserCurrency()).toBe('EUR');
    });

    it('should default to INR if USD is saved', () => {
      (global.localStorage.getItem as any).mockReturnValue('USD');
      expect(detectUserCurrency()).toBe('INR');
    });

    it('should default to INR if no currency saved', () => {
      (global.localStorage.getItem as any).mockReturnValue(null);
      expect(detectUserCurrency()).toBe('INR');
    });

    it('should detect currency from browser locale', () => {
      (global.localStorage.getItem as any).mockReturnValue(null);
      (global.navigator as any).language = 'en-GB';
      expect(detectUserCurrency()).toBe('GBP');
    });

    it('should handle server-side (no window)', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(detectUserCurrency()).toBe('INR');
      
      global.window = originalWindow;
    });
  });

  describe('getExchangeRate', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return 1 for base currency (INR)', async () => {
      const rate = await getExchangeRate('INR');
      expect(rate).toBe(1);
    });

    it('should fetch exchange rate for target currency', async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          rates: {
            USD: 0.012,
            EUR: 0.011,
          },
        }),
      });

      const rate = await getExchangeRate('USD');
      expect(rate).toBe(0.012);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should cache exchange rates', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          rates: { USD: 0.012 },
        }),
      });

      const rate1 = await getExchangeRate('USD');
      const rate2 = await getExchangeRate('USD');
      
      expect(rate1).toBe(rate2);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Should only fetch once
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

      const rate = await getExchangeRate('USD');
      // Should return fallback or cached rate
      expect(typeof rate).toBe('number');
    });

    it('should return 1 for unsupported currency', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          rates: {},
        }),
      });

      const rate = await getExchangeRate('UNKNOWN');
      expect(rate).toBe(1);
    });
  });

  describe('convertCurrency', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          rates: { USD: 0.012 },
        }),
      });
    });

    it('should return same amount for base currency', async () => {
      const converted = await convertCurrency(1000, 'INR');
      expect(converted).toBe(1000);
    });

    it('should convert amount using exchange rate', async () => {
      const converted = await convertCurrency(1000, 'USD');
      expect(converted).toBe(12); // 1000 * 0.012
    });

    it('should handle zero amount', async () => {
      const converted = await convertCurrency(0, 'USD');
      expect(converted).toBe(0);
    });

    it('should handle negative amount', async () => {
      const converted = await convertCurrency(-1000, 'USD');
      expect(converted).toBe(-12);
    });
  });

  describe('SUPPORTED_CURRENCIES', () => {
    it('should contain major currencies', () => {
      expect(SUPPORTED_CURRENCIES).toHaveProperty('INR');
      expect(SUPPORTED_CURRENCIES).toHaveProperty('USD');
      expect(SUPPORTED_CURRENCIES).toHaveProperty('EUR');
      expect(SUPPORTED_CURRENCIES).toHaveProperty('GBP');
    });

    it('should have correct currency info structure', () => {
      const inr = SUPPORTED_CURRENCIES['INR'];
      expect(inr).toHaveProperty('code');
      expect(inr).toHaveProperty('symbol');
      expect(inr).toHaveProperty('name');
      expect(inr.code).toBe('INR');
      expect(inr.symbol).toBe('₹');
    });
  });
});








