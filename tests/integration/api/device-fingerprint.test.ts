/**
 * Integration tests for /api/device-fingerprint route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/device-fingerprint/route';
import { generateFingerprintHash, parseUserAgent } from '@/lib/utils/device-fingerprint';

vi.mock('@/lib/utils/device-fingerprint', () => ({
  generateFingerprintHash: vi.fn(),
  parseUserAgent: vi.fn(),
}));

describe('POST /api/device-fingerprint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateFingerprintHash).mockReturnValue('fingerprint-hash-123');
    vi.mocked(parseUserAgent).mockReturnValue({
      browser: 'chrome',
      os: 'windows',
      platform: 'desktop',
    });
  });

  it('should collect device fingerprint', async () => {
    const request = new NextRequest('http://localhost:3000/api/device-fingerprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAgent: 'Mozilla/5.0',
        language: 'en-US',
        timezone: 'America/New_York',
        screenResolution: '1920x1080',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.fingerprintHash).toBeDefined();
    expect(data.deviceInfo).toBeDefined();
  });

  it('should require userAgent, language, and timezone', async () => {
    const request = new NextRequest('http://localhost:3000/api/device-fingerprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAgent: 'Mozilla/5.0',
        // Missing language and timezone
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Missing required fields');
  });

  it('should enforce rate limiting', async () => {
    // Make 11 requests to exceed rate limit
    for (let i = 0; i < 11; i++) {
      const request = new NextRequest('http://localhost:3000/api/device-fingerprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: 'Mozilla/5.0',
          language: 'en-US',
          timezone: 'America/New_York',
        }),
      });

      const response = await POST(request);
      
      if (i >= 10) {
        const data = await response.json();
        expect(response.status).toBe(429);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Rate limit');
        break;
      }
    }
  });
});

