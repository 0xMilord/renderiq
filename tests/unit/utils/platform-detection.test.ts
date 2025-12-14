/**
 * Tests for platform detection utility
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  detectPlatform,
  isPluginRequest,
  getPlatformRateLimit,
  normalizePlatformForDB,
} from '@/lib/utils/platform-detection';

describe('Platform Detection', () => {
  describe('detectPlatform', () => {
    it('should detect SketchUp from header', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-renderiq-platform': 'sketchup',
        },
      });

      const result = detectPlatform(request);
      expect(result.platform).toBe('sketchup');
    });

    it('should detect Revit from header', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-renderiq-platform': 'revit',
        },
      });

      const result = detectPlatform(request);
      expect(result.platform).toBe('revit');
    });

    it('should detect SketchUp from User-Agent', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'user-agent': 'SketchUp/2023 Renderiq-Sketchup',
        },
      });

      const result = detectPlatform(request);
      expect(result.platform).toBe('sketchup');
    });

    it('should extract version from User-Agent', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'user-agent': 'SketchUp/2023.1',
        },
      });

      const result = detectPlatform(request);
      expect(result.platform).toBe('sketchup');
      expect(result.version).toBe('2023.1');
    });

    it('should return unknown for unrecognized platform', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      });

      const result = detectPlatform(request);
      expect(result.platform).toBe('unknown');
    });

    it('should prioritize header over User-Agent', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-renderiq-platform': 'revit',
          'user-agent': 'SketchUp/2023',
        },
      });

      const result = detectPlatform(request);
      expect(result.platform).toBe('revit');
    });
  });

  describe('isPluginRequest', () => {
    it('should return true for plugin platforms', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-renderiq-platform': 'sketchup',
        },
      });

      expect(isPluginRequest(request)).toBe(true);
    });

    it('should return false for unknown platform', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      });

      expect(isPluginRequest(request)).toBe(false);
    });
  });

  describe('getPlatformRateLimit', () => {
    it('should return platform-specific limits', () => {
      const sketchupLimit = getPlatformRateLimit('sketchup');
      expect(sketchupLimit.maxRequests).toBe(30);

      const revitLimit = getPlatformRateLimit('revit');
      expect(revitLimit.maxRequests).toBe(20);
    });

    it('should return default limits for unknown', () => {
      const limit = getPlatformRateLimit('unknown');
      expect(limit.maxRequests).toBe(30);
      expect(limit.windowMs).toBe(60000);
    });
  });

  describe('normalizePlatformForDB', () => {
    it('should normalize all plugin platforms to render', () => {
      expect(normalizePlatformForDB('sketchup')).toBe('render');
      expect(normalizePlatformForDB('revit')).toBe('render');
      expect(normalizePlatformForDB('autocad')).toBe('render');
      expect(normalizePlatformForDB('unknown')).toBe('render');
    });
  });
});

