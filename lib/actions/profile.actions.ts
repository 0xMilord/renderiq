'use server';

import { ProfileStatsService } from '@/lib/services/profile-stats';
import { UserActivityService } from '@/lib/services/user-activity';
import { UserOnboardingService } from '@/lib/services/user-onboarding';
import { getCachedUser } from '@/lib/services/auth-cache';
import type { ProfileStats } from '@/lib/services/profile-stats';
import type { ActivityItem } from '@/lib/services/user-activity';
import { logger } from '@/lib/utils/logger';

export async function getProfileStats(): Promise<{ success: boolean; data?: ProfileStats; error?: string }> {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const stats = await ProfileStatsService.getUserStats(user.id);
    return { success: true, data: stats };
  } catch (error) {
    logger.error('Error in getProfileStats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get profile stats',
    };
  }
}

export async function getUserActivity(): Promise<{ success: boolean; data?: ActivityItem[]; error?: string }> {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const activities = await UserActivityService.getUserActivity(user.id);
    return { success: true, data: activities };
  } catch (error) {
    logger.error('Error in getUserActivity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user activity',
    };
  }
}

export async function getUserRecentProjects(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const projects = await UserActivityService.getUserRecentProjects(user.id);
    return { success: true, data: projects };
  } catch (error) {
    logger.error('Error in getUserRecentProjects:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recent projects',
    };
  }
}

export async function updateUserProfile(updates: {
  name?: string;
  bio?: string;
  website?: string;
  location?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await UserOnboardingService.updateUserProfile(user.id, updates);
    
    // Invalidate auth cache after profile update
    if (result.success) {
      const { invalidateUserCache } = await import('@/lib/services/auth-cache');
      await invalidateUserCache(user.id);
    }
    
    return result;
  } catch (error) {
    logger.error('Error in updateUserProfile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}
