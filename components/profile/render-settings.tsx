'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Settings, Palette, Zap } from 'lucide-react';

export function RenderSettings() {
  const [settings, setSettings] = useState({
    defaultQuality: 'high',
    defaultStyle: 'modern',
    autoSave: true,
    compressionLevel: 80,
    watermark: false,
    metadata: true,
  });

  const handleSettingChange = (key: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save settings logic here
    console.log('Saving render settings:', settings);
  };

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
                value={settings.defaultQuality}
                onValueChange={(value) => handleSettingChange('defaultQuality', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (1 credit)</SelectItem>
                  <SelectItem value="high">High (2 credits)</SelectItem>
                  <SelectItem value="ultra">Ultra (3 credits)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-style">Default Style</Label>
              <Select
                value={settings.defaultStyle}
                onValueChange={(value) => handleSettingChange('defaultStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="contemporary">Contemporary</SelectItem>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image Compression Level</Label>
              <div className="px-3">
                <Slider
                  value={[settings.compressionLevel]}
                  onValueChange={(value) => handleSettingChange('compressionLevel', value[0])}
                  max={100}
                  min={10}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Smaller file</span>
                  <span>{settings.compressionLevel}%</span>
                  <span>Better quality</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Output Preferences</span>
          </CardTitle>
          <CardDescription>
            Configure how your rendered images are processed and saved
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save">Auto-save Projects</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save your projects as you work
                </p>
              </div>
              <input
                type="checkbox"
                id="auto-save"
                checked={settings.autoSave}
                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="watermark">Add Watermark</Label>
                <p className="text-sm text-muted-foreground">
                  Add AecoSec watermark to generated images
                </p>
              </div>
              <input
                type="checkbox"
                id="watermark"
                checked={settings.watermark}
                onChange={(e) => handleSettingChange('watermark', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="metadata">Include Metadata</Label>
                <p className="text-sm text-muted-foreground">
                  Include generation parameters in image metadata
                </p>
              </div>
              <input
                type="checkbox"
                id="metadata"
                checked={settings.metadata}
                onChange={(e) => handleSettingChange('metadata', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
