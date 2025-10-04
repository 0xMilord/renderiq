'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUserSettings } from '@/lib/hooks/use-user-settings';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettings() {
  const { settings, loading, updateNotifications } = useUserSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    email: true,
    push: false,
    renderComplete: true,
    creditsLow: true,
  });

  // Update local settings when data loads
  useEffect(() => {
    if (settings?.preferences?.notifications) {
      setLocalSettings(settings.preferences.notifications);
    }
  }, [settings]);

  const handleSettingChange = (key: string, value: boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateNotifications(localSettings);
      
      if (result.success) {
        toast.success('Notification settings updated successfully');
      } else {
        toast.error(result.error || 'Failed to update notification settings');
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading notification settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about updates and activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={localSettings.email}
                onCheckedChange={(checked) => handleSettingChange('email', checked)}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in your browser
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={localSettings.push}
                onCheckedChange={(checked) => handleSettingChange('push', checked)}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="render-complete">Render Complete</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when your renders are completed
                </p>
              </div>
              <Switch
                id="render-complete"
                checked={localSettings.renderComplete}
                onCheckedChange={(checked) => handleSettingChange('renderComplete', checked)}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="credits-low">Credits Low Alert</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when your credits are running low
                </p>
              </div>
              <Switch
                id="credits-low"
                checked={localSettings.creditsLow}
                onCheckedChange={(checked) => handleSettingChange('creditsLow', checked)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}