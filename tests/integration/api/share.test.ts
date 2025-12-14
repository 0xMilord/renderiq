/**
 * Integration tests for /api/share route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/share/route';

describe('POST /api/share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process share target data', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Title');
    formData.append('text', 'Test Text');
    formData.append('url', 'https://example.com');

    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(302); // Redirect
    expect(response.headers.get('location')).toContain('/share');
  });

  it('should handle files in share data', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Title');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    formData.append('files', file);

    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(302);
  });

  it('should handle empty share data', async () => {
    const formData = new FormData();

    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(302);
  });
});

