/**
 * Unit tests for device fingerprint utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateFingerprintHash,
  parseUserAgent,
  normalizeIpAddress,
  isDisposableEmail,
  isSequentialEmail,
} from '@/lib/utils/device-fingerprint';

describe('Device Fingerprint Utilities', () => {
  describe('generateFingerprintHash', () => {
    it('should generate consistent hash for same input', () => {
      const data = {
        userAgent: 'Mozilla/5.0',
        language: 'en-US',
        timezone: 'America/New_York',
        screenResolution: '1920x1080',
        platform: 'desktop',
        cookieEnabled: true,
      };

      const hash1 = generateFingerprintHash(data);
      const hash2 = generateFingerprintHash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string
    });

    it('should generate different hash for different input', () => {
      const data1 = {
        userAgent: 'Mozilla/5.0',
        language: 'en-US',
        timezone: 'America/New_York',
        platform: 'desktop',
        cookieEnabled: true,
      };

      const data2 = {
        ...data1,
        language: 'fr-FR',
      };

      const hash1 = generateFingerprintHash(data1);
      const hash2 = generateFingerprintHash(data2);

      expect(hash1).not.toBe(hash2);
    });

    it('should filter out undefined values', () => {
      const data = {
        userAgent: 'Mozilla/5.0',
        language: 'en-US',
        timezone: 'UTC',
        platform: 'desktop',
        cookieEnabled: true,
        screenResolution: undefined,
      };

      const hash = generateFingerprintHash(data);
      expect(hash).toBeDefined();
    });
  });

  describe('parseUserAgent', () => {
    it('should detect Chrome browser', () => {
      const result = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      expect(result.browser).toBe('chrome');
    });

    it('should detect Firefox browser', () => {
      const result = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0');
      expect(result.browser).toBe('firefox');
    });

    it('should detect Safari browser', () => {
      const result = parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15');
      expect(result.browser).toBe('safari');
    });

    it('should detect Windows OS', () => {
      const result = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      expect(result.os).toBe('windows');
    });

    it('should detect macOS', () => {
      const result = parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      expect(result.os).toBe('macos');
    });

    it('should detect mobile platform', () => {
      const result = parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
      expect(result.platform).toBe('mobile');
    });
  });

  describe('normalizeIpAddress', () => {
    it('should remove port from IPv4', () => {
      const result = normalizeIpAddress('192.168.1.1:8080');
      expect(result).toBe('192.168.1.1');
    });

    it('should handle IPv6 mapped IPv4', () => {
      const result = normalizeIpAddress('::ffff:192.168.1.1');
      expect(result).toBe('192.168.1.1');
    });

    it('should return IPv4 as-is', () => {
      const result = normalizeIpAddress('192.168.1.1');
      expect(result).toBe('192.168.1.1');
    });
  });

  describe('isDisposableEmail', () => {
    it('should detect disposable email domains', () => {
      expect(isDisposableEmail('test@tempmail.com')).toBe(true);
      expect(isDisposableEmail('test@guerrillamail.com')).toBe(true);
      expect(isDisposableEmail('test@mailinator.com')).toBe(true);
    });

    it('should not flag regular email domains', () => {
      expect(isDisposableEmail('test@gmail.com')).toBe(false);
      expect(isDisposableEmail('test@example.com')).toBe(false);
      expect(isDisposableEmail('test@company.com')).toBe(false);
    });
  });

  describe('isSequentialEmail', () => {
    it('should detect sequential email patterns', () => {
      expect(isSequentialEmail('user123@gmail.com')).toBe(true);
      expect(isSequentialEmail('test456@gmail.com')).toBe(true);
      expect(isSequentialEmail('user1@gmail.com')).toBe(true);
    });

    it('should not flag normal email addresses', () => {
      expect(isSequentialEmail('john.doe@gmail.com')).toBe(false);
      expect(isSequentialEmail('jane@gmail.com')).toBe(false);
      expect(isSequentialEmail('contact@company.com')).toBe(false);
    });
  });
});

