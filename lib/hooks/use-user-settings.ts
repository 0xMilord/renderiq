'use client';

import { useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings, updateNotificationSettings, updateRenderSettings } from '@/lib/actions/user-settings.actions';
import type { UserPreferences } from '@/lib/services/user-settings';

export function useUserSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUserSettings();
      
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setError(result.error || 'Failed to load settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (preferences: Partial<UserPreferences>) => {
    try {
      setError(null);
      const result = await updateUserSettings(preferences);
      
      if (result.success && result.data) {
        setSettings(result.data);
        return { success: true };
      } else {
        setError(result.error || 'Failed to update settings');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateNotifications = async (notifications: Partial<UserPreferences['notifications']>) => {
    try {
      setError(null);
      const result = await updateNotificationSettings(notifications);
      
      if (result.success && result.data) {
        setSettings(result.data);
        return { success: true };
      } else {
        setError(result.error || 'Failed to update notification settings');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification settings';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateRenders = async (defaultRenderSettings: Partial<UserPreferences['defaultRenderSettings']>) => {
    try {
      setError(null);
      const result = await updateRenderSettings(defaultRenderSettings);
      
      if (result.success && result.data) {
        setSettings(result.data);
        return { success: true };
      } else {
        setError(result.error || 'Failed to update render settings');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update render settings';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
    updateNotifications,
    updateRenders,
  };
}
