import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    renderComplete: boolean;
    creditsLow: boolean;
  };
  defaultRenderSettings: {
    style: string;
    quality: string;
    aspectRatio: string;
  };
}

export interface UserSettings {
  id: string;
  userId: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export class UserSettingsService {
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    logger.log('⚙️ UserSettingsService: Getting user settings for:', userId);
    
    try {
      // ✅ OPTIMIZED: Use upsert pattern to get or create settings (2 queries → 1)
      const defaultPreferences: UserPreferences = {
        theme: 'system',
        notifications: {
          email: true,
          push: false,
          renderComplete: true,
          creditsLow: true,
        },
        defaultRenderSettings: {
          style: 'modern',
          quality: 'high',
          aspectRatio: '16:9',
        },
      };

      const [settings] = await db
        .insert(userSettings)
        .values({
          userId,
          preferences: defaultPreferences,
        })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: { updatedAt: new Date() }, // Update timestamp if conflict occurs
        })
        .returning();

      logger.log('✅ UserSettingsService: Settings retrieved/created');
      return settings;
    } catch (error) {
      logger.error('❌ UserSettingsService: Failed to get user settings:', error);
      throw error;
    }
  }

  static async createDefaultSettings(userId: string): Promise<UserSettings> {
    logger.log('🆕 UserSettingsService: Creating default settings for:', userId);
    
    try {
      const defaultPreferences: UserPreferences = {
        theme: 'system',
        notifications: {
          email: true,
          push: false,
          renderComplete: true,
          creditsLow: true,
        },
        defaultRenderSettings: {
          style: 'modern',
          quality: 'high',
          aspectRatio: '16:9',
        },
      };

      const newSettings = await db
        .insert(userSettings)
        .values({
          userId,
          preferences: defaultPreferences,
        })
        .returning();

      logger.log('✅ UserSettingsService: Default settings created');
      return newSettings[0];
    } catch (error) {
      logger.error('❌ UserSettingsService: Failed to create default settings:', error);
      throw error;
    }
  }

  static async updateUserSettings(
    userId: string, 
    preferences: Partial<UserPreferences>
  ): Promise<UserSettings> {
    logger.log('🔄 UserSettingsService: Updating user settings for:', userId);
    
    try {
      // ✅ OPTIMIZED: Get existing settings first to merge properly, then use upsert
      // We still need to get existing settings to merge partial updates correctly
      const existingSettings = await this.getUserSettings(userId);
      
      // Merge with new preferences
      const updatedPreferences: UserPreferences = {
        theme: preferences.theme ?? existingSettings?.preferences.theme ?? 'system',
        notifications: {
          email: preferences.notifications?.email ?? existingSettings?.preferences.notifications.email ?? true,
          push: preferences.notifications?.push ?? existingSettings?.preferences.notifications.push ?? false,
          renderComplete: preferences.notifications?.renderComplete ?? existingSettings?.preferences.notifications.renderComplete ?? true,
          creditsLow: preferences.notifications?.creditsLow ?? existingSettings?.preferences.notifications.creditsLow ?? true,
        },
        defaultRenderSettings: {
          style: preferences.defaultRenderSettings?.style ?? existingSettings?.preferences.defaultRenderSettings.style ?? 'modern',
          quality: preferences.defaultRenderSettings?.quality ?? existingSettings?.preferences.defaultRenderSettings.quality ?? 'high',
          aspectRatio: preferences.defaultRenderSettings?.aspectRatio ?? existingSettings?.preferences.defaultRenderSettings.aspectRatio ?? '16:9',
        },
      };

      // ✅ OPTIMIZED: Use upsert instead of update (handles case where settings don't exist)
      const [updatedSettings] = await db
        .insert(userSettings)
        .values({
          userId,
          preferences: updatedPreferences,
        })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: {
            preferences: updatedPreferences,
            updatedAt: new Date(),
          },
        })
        .returning();

      logger.log('✅ UserSettingsService: Settings updated');
      return updatedSettings;
    } catch (error) {
      logger.error('❌ UserSettingsService: Failed to update user settings:', error);
      throw error;
    }
  }

  static async updateNotificationSettings(
    userId: string,
    notifications: Partial<UserPreferences['notifications']>
  ): Promise<UserSettings> {
    logger.log('🔔 UserSettingsService: Updating notification settings for:', userId);
    
    try {
      const existingSettings = await this.getUserSettings(userId);
      const currentNotifications = existingSettings?.preferences.notifications ?? {
        email: true,
        push: false,
        renderComplete: true,
        creditsLow: true,
      };

      const updatedNotifications = {
        ...currentNotifications,
        ...notifications,
      };

      return await this.updateUserSettings(userId, {
        notifications: updatedNotifications,
      });
    } catch (error) {
      logger.error('❌ UserSettingsService: Failed to update notification settings:', error);
      throw error;
    }
  }

  static async updateRenderSettings(
    userId: string,
    defaultRenderSettings: Partial<UserPreferences['defaultRenderSettings']>
  ): Promise<UserSettings> {
    logger.log('🎨 UserSettingsService: Updating render settings for:', userId);
    
    try {
      const existingSettings = await this.getUserSettings(userId);
      const currentRenderSettings = existingSettings?.preferences.defaultRenderSettings ?? {
        style: 'modern',
        quality: 'high',
        aspectRatio: '16:9',
      };

      const updatedRenderSettings = {
        ...currentRenderSettings,
        ...defaultRenderSettings,
      };

      return await this.updateUserSettings(userId, {
        defaultRenderSettings: updatedRenderSettings,
      });
    } catch (error) {
      logger.error('❌ UserSettingsService: Failed to update render settings:', error);
      throw error;
    }
  }
}
