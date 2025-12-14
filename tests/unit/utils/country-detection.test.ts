/**
 * Tests for country detection utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectUserCountry,
  shouldUseRazorpay,
  shouldUsePaddle,
  getPaymentProviderForCountry,
} from '@/lib/utils/country-detection';

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('Country Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectUserCountry', () => {
    it('should detect country from Cloudflare header', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'cf-ipcountry': 'IN',
        },
      });

      const country = await detectUserCountry(request);
      expect(country).toBe('IN');
    });

    it('should detect country from Vercel header', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-vercel-ip-country': 'US',
        },
      });

      const country = await detectUserCountry(request);
      expect(country).toBe('US');
    });

    it('should prioritize Cloudflare over Vercel', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'cf-ipcountry': 'IN',
          'x-vercel-ip-country': 'US',
        },
      });

      const country = await detectUserCountry(request);
      expect(country).toBe('IN');
    });

    it('should default to US when no headers', async () => {
      const request = new Request('https://example.com');
      const country = await detectUserCountry(request);
      expect(country).toBe('US');
    });

    it('should ignore invalid country codes', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'cf-ipcountry': 'XX',
        },
      });

      const country = await detectUserCountry(request);
      expect(country).toBe('US'); // Defaults to US
    });
  });

  describe('shouldUseRazorpay', () => {
    it('should return true for India', () => {
      expect(shouldUseRazorpay('IN')).toBe(true);
    });

    it('should return false for other countries', () => {
      expect(shouldUseRazorpay('US')).toBe(false);
      expect(shouldUseRazorpay('GB')).toBe(false);
      expect(shouldUseRazorpay('CA')).toBe(false);
    });
  });

  describe('shouldUsePaddle', () => {
    it('should return true for non-India countries', () => {
      expect(shouldUsePaddle('US')).toBe(true);
      expect(shouldUsePaddle('GB')).toBe(true);
      expect(shouldUsePaddle('CA')).toBe(true);
    });

    it('should return false for India', () => {
      expect(shouldUsePaddle('IN')).toBe(false);
    });
  });

  describe('getPaymentProviderForCountry', () => {
    it('should return razorpay for India', () => {
      expect(getPaymentProviderForCountry('IN')).toBe('razorpay');
    });

    it('should return paddle for other countries', () => {
      expect(getPaymentProviderForCountry('US')).toBe('paddle');
      expect(getPaymentProviderForCountry('GB')).toBe('paddle');
      expect(getPaymentProviderForCountry('CA')).toBe('paddle');
    });
  });
});

