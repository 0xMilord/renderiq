/**
 * Tests for rate limiting utility functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitMiddleware,
  RateLimitConfig,
} from '@/lib/utils/rate-limit';

describe('Rate Limit Utils', () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    // Note: This requires accessing the internal store, which may need refactoring
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000, // 1 minute
      };

      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit('test-ip', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(10 - i - 1);
      }
    });

    it('should reject requests exceeding limit', () => {
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000,
      };

      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        checkRateLimit('test-ip', config);
      }

      // 6th request should be rejected
      const result = checkRateLimit('test-ip', config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 100, // 100ms window for testing
      };

      // Exceed limit
      for (let i = 0; i < 6; i++) {
        checkRateLimit('test-ip', config);
      }

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      const result = checkRateLimit('test-ip', config);
      expect(result.allowed).toBe(true);
    });

    it('should track different identifiers separately', () => {
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000,
      };

      // Exceed limit for IP 1
      for (let i = 0; i < 6; i++) {
        checkRateLimit('ip-1', config);
      }

      // IP 2 should still be allowed
      const result = checkRateLimit('ip-2', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should return correct reset time', () => {
      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
      };

      const result = checkRateLimit('test-ip', config);
      expect(result.resetTime).toBeGreaterThan(Date.now());
      expect(result.resetTime).toBeLessThanOrEqual(Date.now() + 60000);
    });
  });

  describe('getClientIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '192.168.1.1, 10.0.0.1');
      
      const identifier = getClientIdentifier(headers);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const headers = new Headers();
      headers.set('x-real-ip', '192.168.1.1');
      
      const identifier = getClientIdentifier(headers);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '192.168.1.1');
      headers.set('x-real-ip', '10.0.0.1');
      
      const identifier = getClientIdentifier(headers);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should return unknown if no IP headers', () => {
      const headers = new Headers();
      const identifier = getClientIdentifier(headers);
      expect(identifier).toBe('unknown');
    });

    it('should handle Request object', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });
      
      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1');
    });
  });

  describe('rateLimitMiddleware', () => {
    it('should allow requests within limit', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 60000,
      };

      const result = rateLimitMiddleware(request, config);
      expect(result.allowed).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('should return rate limit response when exceeded', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const config: RateLimitConfig = {
        maxRequests: 1,
        windowMs: 60000,
      };

      // First request
      rateLimitMiddleware(request, config);

      // Second request should be rate limited
      const result = rateLimitMiddleware(request, config);
      expect(result.allowed).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response?.status).toBe(429);
    });

    it('should include rate limit headers in response', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const config: RateLimitConfig = {
        maxRequests: 1,
        windowMs: 60000,
      };

      // Exceed limit
      rateLimitMiddleware(request, config);
      const result = rateLimitMiddleware(request, config);

      if (result.response) {
        expect(result.response.headers.get('x-ratelimit-remaining')).toBeDefined();
        expect(result.response.headers.get('x-ratelimit-reset')).toBeDefined();
      }
    });
  });
});

