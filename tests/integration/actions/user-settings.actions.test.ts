/**
 * Integration tests for user settings actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getUserSettings,
  updateUserSettings,
  updateNotificationSettings,
  updateRenderSettings,
} from '@/lib/actions/user-settings.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { UserSettingsService } from '@/lib/services/user-settings';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/user-settings', () => ({
  UserSettingsService: {
    getUserSettings: vi.fn(),
    updateUserSettings: vi.fn(),
    updateNotificationSettings: vi.fn(),
    updateRenderSettings: vi.fn(),
  },
}));

describe('User Settings Actions', () => {
  let testUser: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();

    vi.mocked(getCachedUser).mockResolvedValue({
      user: testUser as any,
      fromCache: false,
    });
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  describe('getUserSettings', () => {
    it('should get user settings', async () => {
      vi.mocked(UserSettingsService.getUserSettings).mockResolvedValue({
        theme: 'dark',
        notifications: { email: true },
      } as any);

      const result = await getUserSettings();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getUserSettings();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });
  });

  describe('updateUserSettings', () => {
    it('should update user settings', async () => {
      vi.mocked(UserSettingsService.updateUserSettings).mockResolvedValue({
        theme: 'light',
      } as any);

      const result = await updateUserSettings({
        theme: 'light',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update notification settings', async () => {
      vi.mocked(UserSettingsService.updateNotificationSettings).mockResolvedValue({
        notifications: { email: false },
      } as any);

      const result = await updateNotificationSettings({
        email: false,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('updateRenderSettings', () => {
    it('should update render settings', async () => {
      vi.mocked(UserSettingsService.updateRenderSettings).mockResolvedValue({
        defaultRenderSettings: {
          quality: 'high',
          style: 'modern',
        },
      } as any);

      const result = await updateRenderSettings({
        quality: 'high',
      });

      expect(result.success).toBe(true);
    });
  });
});

