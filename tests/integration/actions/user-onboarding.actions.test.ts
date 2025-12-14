/**
 * Integration tests for user onboarding actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getUserProfileAction,
  createUserProfileAction,
  updateUserProfileAction,
} from '@/lib/actions/user-onboarding.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { UserOnboardingService } from '@/lib/services/user-onboarding';

vi.mock('@/lib/services/user-onboarding', () => ({
  UserOnboardingService: {
    getUserProfile: vi.fn(),
    createUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

describe('User Onboarding Actions', () => {
  let testUser: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  describe('getUserProfileAction', () => {
    it('should get user profile', async () => {
      vi.mocked(UserOnboardingService.getUserProfile).mockResolvedValue({
        success: true,
        data: {
          id: testUser.id,
          email: testUser.email,
          name: 'Test User',
        },
      } as any);

      const result = await getUserProfileAction(testUser.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('createUserProfileAction', () => {
    it('should create user profile', async () => {
      vi.mocked(UserOnboardingService.createUserProfile).mockResolvedValue({
        success: true,
        data: {
          id: 'user-id',
          email: 'test@example.com',
        },
      } as any);

      const result = await createUserProfileAction({
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle device fingerprint', async () => {
      vi.mocked(UserOnboardingService.createUserProfile).mockResolvedValue({
        success: true,
        data: { id: 'user-id' },
      } as any);

      const result = await createUserProfileAction(
        {
          id: 'user-id',
          email: 'test@example.com',
        },
        {
          userAgent: 'test-agent',
          screenResolution: '1920x1080',
        } as any
      );

      expect(result.success).toBe(true);
      expect(UserOnboardingService.createUserProfile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          deviceFingerprint: expect.any(Object),
        })
      );
    });
  });

  describe('updateUserProfileAction', () => {
    it('should update user profile', async () => {
      vi.mocked(UserOnboardingService.updateUserProfile).mockResolvedValue({
        success: true,
        data: {
          id: testUser.id,
          name: 'Updated Name',
        },
      } as any);

      const result = await updateUserProfileAction(testUser.id, {
        name: 'Updated Name',
        bio: 'New bio',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

