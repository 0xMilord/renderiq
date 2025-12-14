/**
 * Integration tests for /api/ai/extract-style route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/extract-style/route';

describe('POST /api/ai/extract-style', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract style from image', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/extract-style', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: 'base64imagedata',
        imageType: 'image/jpeg',
        extractionOptions: {
          extractCamera: true,
          extractEnvironment: true,
          extractLighting: true,
          extractAtmosphere: true,
          extractColors: true,
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.camera).toBeDefined();
    expect(data.data.environment).toBeDefined();
    expect(data.data.lighting).toBeDefined();
    expect(data.data.atmosphere).toBeDefined();
  });

  it('should require image data', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/extract-style', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Image data is required');
  });

  it('should enforce rate limiting', async () => {
    // Make 21 requests to exceed rate limit
    for (let i = 0; i < 21; i++) {
      const request = new NextRequest('http://localhost:3000/api/ai/extract-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: 'base64imagedata',
        }),
      });

      const response = await POST(request);
      
      if (i >= 20) {
        const data = await response.json();
        expect(response.status).toBe(429);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Rate limit');
        break;
      }
    }
  });
});

