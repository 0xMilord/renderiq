/**
 * Integration tests for /api/plugins/settings route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/plugins/settings/route';
import { authenticatePluginRequest } from '@/lib/utils/plugin-auth';
import { UserSettingsService } from '@/lib/services/user-settings';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';

vi.mock('@/lib/utils/plugin-auth', () => ({
  authenticatePluginRequest: vi.fn(),
}));

vi.mock('@/lib/services/user-settings', () => ({
  UserSettingsService: {
    getUserSettings: vi.fn(),
    updateUserSettings: vi.fn(),
  },
}));

vi.mock('@/lib/utils/plugin-rate-limit', () => ({
  applyPluginRateLimit: vi.fn(),
}));

describe('GET /api/plugins/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyPluginRateLimit).mockResolvedValue({ allowed: true } as any);
  });

  it('should get user settings', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: { id: 'user-id' },
        authType: 'bearer',
      },
    } as any);

    vi.mocked(UserSettingsService.getUserSettings).mockResolvedValue({
      preferences: { theme: 'dark' },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/settings', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer token' },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.preferences).toBeDefined();
  });
});

describe('PUT /api/plugins/settings', () => {
  it('should update user settings', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: { id: 'user-id' },
        authType: 'bearer',
      },
    } as any);

    vi.mocked(UserSettingsService.updateUserSettings).mockResolvedValue({
      preferences: { theme: 'light' },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/settings', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preferences: { theme: 'light' },
      }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

