import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/db/schema';

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
    console.log('⚙️ UserSettingsService: Getting user settings for:', userId);
    
    try {
      const settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      if (settings.length === 0) {
        console.log('📝 UserSettingsService: No settings found, creating default settings');
        return await this.createDefaultSettings(userId);
      }

      console.log('✅ UserSettingsService: Settings found');
      return settings[0];
    } catch (error) {
      console.error('❌ UserSettingsService: Failed to get user settings:', error);
      throw error;
    }
  }

  static async createDefaultSettings(userId: string): Promise<UserSettings> {
    console.log('🆕 UserSettingsService: Creating default settings for:', userId);
    
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

      console.log('✅ UserSettingsService: Default settings created');
      return newSettings[0];
    } catch (error) {
      console.error('❌ UserSettingsService: Failed to create default settings:', error);
      throw error;
    }
  }

  static async updateUserSettings(
    userId: string, 
    preferences: Partial<UserPreferences>
  ): Promise<UserSettings> {
    console.log('🔄 UserSettingsService: Updating user settings for:', userId);
    
    try {
      // Get existing settings
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

      const updatedSettings = await db
        .update(userSettings)
        .set({
          preferences: updatedPreferences,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning();

      console.log('✅ UserSettingsService: Settings updated');
      return updatedSettings[0];
    } catch (error) {
      console.error('❌ UserSettingsService: Failed to update user settings:', error);
      throw error;
    }
  }

  static async updateNotificationSettings(
    userId: string,
    notifications: Partial<UserPreferences['notifications']>
  ): Promise<UserSettings> {
    console.log('🔔 UserSettingsService: Updating notification settings for:', userId);
    
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
      console.error('❌ UserSettingsService: Failed to update notification settings:', error);
      throw error;
    }
  }

  static async updateRenderSettings(
    userId: string,
    defaultRenderSettings: Partial<UserPreferences['defaultRenderSettings']>
  ): Promise<UserSettings> {
    console.log('🎨 UserSettingsService: Updating render settings for:', userId);
    
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
      console.error('❌ UserSettingsService: Failed to update render settings:', error);
      throw error;
    }
  }
}
