'use server';

import { getCachedUser } from '@/lib/services/auth-cache';
import { UserSettingsService, type UserPreferences } from '@/lib/services/user-settings';
import { logger } from '@/lib/utils/logger';

export async function getUserSettings(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const settings = await UserSettingsService.getUserSettings(user.id);
    return { success: true, data: settings };
  } catch (error) {
    logger.error('Error in getUserSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user settings',
    };
  }
}

export async function updateUserSettings(preferences: Partial<UserPreferences>): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const settings = await UserSettingsService.updateUserSettings(user.id, preferences);
    return { success: true, data: settings };
  } catch (error) {
    logger.error('Error in updateUserSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user settings',
    };
  }
}

export async function updateNotificationSettings(notifications: Partial<UserPreferences['notifications']>): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const settings = await UserSettingsService.updateNotificationSettings(user.id, notifications);
    return { success: true, data: settings };
  } catch (error) {
    logger.error('Error in updateNotificationSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update notification settings',
    };
  }
}

export async function updateRenderSettings(defaultRenderSettings: Partial<UserPreferences['defaultRenderSettings']>): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const settings = await UserSettingsService.updateRenderSettings(user.id, defaultRenderSettings);
    return { success: true, data: settings };
  } catch (error) {
    logger.error('Error in updateRenderSettings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update render settings',
    };
  }
}
