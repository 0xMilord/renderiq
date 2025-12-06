'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface ChangeLightingProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
}

export function ChangeLighting({ tool, projectId, onHintChange }: ChangeLightingProps) {
  const [lightingType, setLightingType] = useState<'natural' | 'warm' | 'cool' | 'dramatic' | 'soft'>('natural');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night' | 'dawn'>('day');

  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      onHintChange={onHintChange}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="lighting-type" className="text-sm">Lighting Type</Label>
              <Select value={lightingType} onValueChange={(v: any) => setLightingType(v)}>
                <SelectTrigger id="lighting-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cool">Cool</SelectItem>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="time-of-day" className="text-sm">Time of Day</Label>
              <Select value={timeOfDay} onValueChange={(v: any) => setTimeOfDay(v)}>
                <SelectTrigger id="time-of-day" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="dawn">Dawn</SelectItem>
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
            <li>Upload your interior render</li>
            <li>Choose lighting type and time of day</li>
            <li>Transform lighting conditions</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
