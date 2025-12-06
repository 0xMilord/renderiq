'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface ThreeDToRenderProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function ThreeDToRender({ tool, projectId, onHintChange, hintMessage }: ThreeDToRenderProps) {
  const [lightingStyle, setLightingStyle] = useState<string>('natural');
  const [environment, setEnvironment] = useState<string>('none');
  const [cameraAngle, setCameraAngle] = useState<string>('eye-level');

  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      onHintChange={onHintChange}
      hintMessage={hintMessage}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="lighting-style" className="text-sm">Lighting Style</Label>
              <Select value={lightingStyle} onValueChange={setLightingStyle}>
                <SelectTrigger id="lighting-style" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural Daylight</SelectItem>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                  <SelectItem value="studio">Studio Lighting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="environment" className="text-sm">Environment</Label>
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger id="environment" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="urban">Urban</SelectItem>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="camera-angle" className="text-sm">Camera Angle</Label>
              <Select value={cameraAngle} onValueChange={setCameraAngle}>
                <SelectTrigger id="camera-angle" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eye-level">Eye Level</SelectItem>
                  <SelectItem value="aerial">Aerial</SelectItem>
                  <SelectItem value="low-angle">Low Angle</SelectItem>
                  <SelectItem value="close-up">Close Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
            <li>Upload 3D model screenshot</li>
            <li>Configure lighting and environment</li>
            <li>Choose camera angle</li>
            <li>Generate photorealistic render</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
