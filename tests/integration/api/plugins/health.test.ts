/**
 * Integration tests for /api/plugins/health route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/plugins/health/route';
import { detectPlatform } from '@/lib/utils/platform-detection';

vi.mock('@/lib/utils/platform-detection', () => ({
  detectPlatform: vi.fn(),
}));

describe('GET /api/plugins/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(detectPlatform).mockReturnValue({ platform: 'figma', version: '1.0.0' } as any);
  });

  it('should return health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/plugins/health');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('healthy');
    expect(data.api).toBeDefined();
    expect(data.services).toBeDefined();
  });

  it('should detect platform', async () => {
    vi.mocked(detectPlatform).mockReturnValue({ platform: 'sketch', version: '2.0.0' } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/health');

    const response = await GET(request);
    const data = await response.json();

    expect(data.api.platform).toBe('sketch');
    expect(data.api.version_detected).toBe('2.0.0');
  });
});

