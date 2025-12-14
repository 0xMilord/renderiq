/**
 * Integration tests for profile actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getProfileStats,
  getUserActivity,
  getUserRecentProjects,
  updateUserProfile,
} from '@/lib/actions/profile.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { ProfileStatsService } from '@/lib/services/profile-stats';
import { UserActivityService } from '@/lib/services/user-activity';
import { UserOnboardingService } from '@/lib/services/user-onboarding';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/profile-stats', () => ({
  ProfileStatsService: {
    getUserStats: vi.fn(),
  },
}));

vi.mock('@/lib/services/user-activity', () => ({
  UserActivityService: {
    getUserActivity: vi.fn(),
    getUserRecentProjects: vi.fn(),
  },
}));

vi.mock('@/lib/services/user-onboarding', () => ({
  UserOnboardingService: {
    updateUserProfile: vi.fn(),
  },
}));

describe('Profile Actions', () => {
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

  describe('getProfileStats', () => {
    it('should get profile statistics', async () => {
      vi.mocked(ProfileStatsService.getUserStats).mockResolvedValue({
        totalRenders: 10,
        totalProjects: 5,
      } as any);

      const result = await getProfileStats();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getProfileStats();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });
  });

  describe('getUserActivity', () => {
    it('should get user activity', async () => {
      vi.mocked(UserActivityService.getUserActivity).mockResolvedValue([
        { id: 'activity-1', type: 'render_created' },
      ] as any);

      const result = await getUserActivity();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('getUserRecentProjects', () => {
    it('should get recent projects', async () => {
      vi.mocked(UserActivityService.getUserRecentProjects).mockResolvedValue([
        { id: 'project-1', name: 'Project 1' },
      ] as any);

      const result = await getUserRecentProjects();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      vi.mocked(UserOnboardingService.updateUserProfile).mockResolvedValue({
        success: true,
        data: { id: testUser.id, name: 'Updated Name' },
      } as any);

      const result = await updateUserProfile({
        name: 'Updated Name',
        bio: 'New bio',
      });

      expect(result.success).toBe(true);
    });

    it('should invalidate cache after update', async () => {
      const { invalidateUserCache } = await import('@/lib/services/auth-cache');
      vi.mocked(invalidateUserCache).mockResolvedValue(undefined);

      vi.mocked(UserOnboardingService.updateUserProfile).mockResolvedValue({
        success: true,
        data: { id: testUser.id },
      } as any);

      await updateUserProfile({ name: 'Updated Name' });

      expect(invalidateUserCache).toHaveBeenCalledWith(testUser.id);
    });
  });
});

