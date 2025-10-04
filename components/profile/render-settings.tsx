'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUserSettings } from '@/lib/hooks/use-user-settings';
import { Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function RenderSettings() {
  const { settings, loading, updateRenders } = useUserSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    style: 'modern',
    quality: 'high',
    aspectRatio: '16:9',
  });

  // Update local settings when data loads
  useEffect(() => {
    if (settings?.preferences?.defaultRenderSettings) {
      setLocalSettings(settings.preferences.defaultRenderSettings);
    }
  }, [settings]);

  const handleSettingChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateRenders(localSettings);
      
      if (result.success) {
        toast.success('Render settings updated successfully');
      } else {
        toast.error(result.error || 'Failed to update render settings');
      }
    } catch (error) {
      console.error('Failed to save render settings:', error);
      toast.error('Failed to update render settings');
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
            <span className="ml-2">Loading render settings...</span>
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
            <Settings className="h-5 w-5" />
            <span>Default Render Settings</span>
          </CardTitle>
          <CardDescription>
            Configure your default preferences for image generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="default-quality">Default Quality</Label>
              <Select
                value={localSettings.quality}
                onValueChange={(value) => handleSettingChange('quality', value)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Fast)</SelectItem>
                  <SelectItem value="medium">Medium (Balanced)</SelectItem>
                  <SelectItem value="high">High (Detailed)</SelectItem>
                  <SelectItem value="ultra">Ultra (Maximum)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-style">Default Style</Label>
              <Select
                value={localSettings.style}
                onValueChange={(value) => handleSettingChange('style', value)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="scandinavian">Scandinavian</SelectItem>
                  <SelectItem value="contemporary">Contemporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
              <Select
                value={localSettings.aspectRatio}
                onValueChange={(value) => handleSettingChange('aspectRatio', value)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                </SelectContent>
              </Select>
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