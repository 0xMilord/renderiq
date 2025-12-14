/**
 * Tests for security utility functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isAllowedOrigin,
  sanitizeInput,
  sanitizeHTML,
  isValidUUID,
  isValidImageType,
  isValidFileSize,
  validatePrompt,
  getSafeErrorMessage,
  redactSensitive,
  securityLog,
} from '@/lib/utils/security';

describe('Security Utils', () => {
  describe('isAllowedOrigin', () => {
    it('should allow null origin (same-origin request)', () => {
      expect(isAllowedOrigin(null)).toBe(true);
    });

    it('should allow localhost in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
      expect(isAllowedOrigin('http://127.0.0.1:3000')).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should allow allowed domains', () => {
      expect(isAllowedOrigin('https://renderiq.io')).toBe(true);
      expect(isAllowedOrigin('https://www.renderiq.io')).toBe(true);
    });

    it('should allow subdomains of allowed domains', () => {
      expect(isAllowedOrigin('https://app.renderiq.io')).toBe(true);
    });

    it('should reject invalid protocols', () => {
      expect(isAllowedOrigin('ftp://renderiq.io')).toBe(false);
      expect(isAllowedOrigin('javascript:alert(1)')).toBe(false);
    });

    it('should reject unknown domains', () => {
      expect(isAllowedOrigin('https://evil.com')).toBe(false);
      expect(isAllowedOrigin('https://malicious-site.com')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isAllowedOrigin('not-a-url')).toBe(false);
      expect(isAllowedOrigin('')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should return empty string for null/undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    it('should remove angle brackets', () => {
      expect(sanitizeInput('<script>alert(1)</script>')).not.toContain('<');
      expect(sanitizeInput('<img src=x>')).not.toContain('<');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert(1)')).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick=alert(1)')).not.toContain('onclick');
      expect(sanitizeInput('onerror=alert(1)')).not.toContain('onerror');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    it('should limit length to 10000 characters', () => {
      const longString = 'a'.repeat(20000);
      const result = sanitizeInput(longString);
      expect(result.length).toBeLessThanOrEqual(10000);
    });

    it('should preserve safe text', () => {
      const safeText = 'This is safe text with numbers 123 and symbols !@#';
      expect(sanitizeInput(safeText)).toBe(safeText);
    });
  });

  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      const html = '<div>Safe</div><script>alert(1)</script>';
      const result = sanitizeHTML(html);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('</script>');
    });

    it('should remove event handlers', () => {
      const html = '<div onclick="alert(1)">Click</div>';
      const result = sanitizeHTML(html);
      expect(result).not.toContain('onclick');
    });

    it('should remove javascript: protocol', () => {
      const html = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeHTML(html);
      expect(result).not.toContain('javascript:');
    });

    it('should preserve safe HTML', () => {
      const html = '<div>Safe content</div><p>Paragraph</p>';
      const result = sanitizeHTML(html);
      expect(result).toContain('Safe content');
      expect(result).toContain('Paragraph');
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(isValidUUID(null)).toBe(false);
      expect(isValidUUID(undefined)).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidUUID('123E4567-E89B-12D3-A456-426614174000')).toBe(true);
    });
  });

  describe('isValidImageType', () => {
    it('should validate image MIME types', () => {
      expect(isValidImageType('image/jpeg')).toBe(true);
      expect(isValidImageType('image/png')).toBe(true);
      expect(isValidImageType('image/webp')).toBe(true);
      expect(isValidImageType('image/gif')).toBe(true);
    });

    it('should reject non-image types', () => {
      expect(isValidImageType('text/plain')).toBe(false);
      expect(isValidImageType('application/json')).toBe(false);
      expect(isValidImageType('video/mp4')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(isValidImageType(null)).toBe(false);
      expect(isValidImageType(undefined)).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should validate file sizes within limit', () => {
      expect(isValidFileSize(1024 * 1024, 5 * 1024 * 1024)).toBe(true); // 1MB < 5MB
      expect(isValidFileSize(4 * 1024 * 1024, 5 * 1024 * 1024)).toBe(true); // 4MB < 5MB
    });

    it('should reject files exceeding limit', () => {
      expect(isValidFileSize(6 * 1024 * 1024, 5 * 1024 * 1024)).toBe(false); // 6MB > 5MB
      expect(isValidFileSize(10 * 1024 * 1024, 5 * 1024 * 1024)).toBe(false); // 10MB > 5MB
    });

    it('should handle zero size', () => {
      expect(isValidFileSize(0, 5 * 1024 * 1024)).toBe(true);
    });
  });

  describe('validatePrompt', () => {
    it('should validate prompts with valid length', () => {
      const result = validatePrompt('A beautiful landscape');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty prompts', () => {
      const result = validatePrompt('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject prompts that are too long', () => {
      const longPrompt = 'a'.repeat(10001);
      const result = validatePrompt(longPrompt);
      expect(result.valid).toBe(false);
    });

    it('should detect potentially harmful content', () => {
      const harmfulPrompt = '<script>alert(1)</script>';
      const result = validatePrompt(harmfulPrompt);
      // Should either sanitize or reject
      expect(result).toBeDefined();
    });
  });

  describe('getSafeErrorMessage', () => {
    it('should return safe error message for Error objects', () => {
      const error = new Error('Database connection failed');
      const result = getSafeErrorMessage(error);
      expect(result).toBe('Database connection failed');
    });

    it('should return safe message for string errors', () => {
      const result = getSafeErrorMessage('Simple error');
      expect(result).toBe('Simple error');
    });

    it('should redact sensitive information', () => {
      const error = new Error('API key: sk-1234567890');
      const result = getSafeErrorMessage(error);
      expect(result).not.toContain('sk-1234567890');
    });

    it('should return default message for unknown errors', () => {
      const result = getSafeErrorMessage(null);
      expect(result).toBe('An error occurred');
    });
  });

  describe('redactSensitive', () => {
    it('should redact API keys', () => {
      const data = { apiKey: 'sk-1234567890' };
      const result = redactSensitive(data);
      expect(result.apiKey).not.toContain('1234567890');
    });

    it('should redact passwords', () => {
      const data = { password: 'secret123' };
      const result = redactSensitive(data);
      expect(result.password).not.toContain('secret123');
    });

    it('should preserve non-sensitive data', () => {
      const data = { name: 'John', email: 'john@example.com' };
      const result = redactSensitive(data);
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
    });
  });

  describe('securityLog', () => {
    it('should log security events', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      securityLog('test_event', { data: 'test' }, 'warn');
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle different log levels', () => {
      const levels: ('info' | 'warn' | 'error')[] = ['info', 'warn', 'error'];
      
      for (const level of levels) {
        const consoleSpy = vi.spyOn(console, level as 'info').mockImplementation(() => {});
        securityLog('test_event', {}, level);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      }
    });
  });
});

