'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface MoodboardToRenderProps {
  tool: ToolConfig;
}

export function MoodboardToRender({ tool }: MoodboardToRenderProps) {
  const [style, setStyle] = useState<'cohesive' | 'eclectic' | 'minimalist'>('cohesive');
  const [roomType, setRoomType] = useState<'living' | 'bedroom' | 'kitchen' | 'office'>('living');

  return (
    <BaseToolComponent
      tool={tool}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="style" className="text-sm">Style Approach</Label>
              <Select value={style} onValueChange={(v: any) => setStyle(v)}>
                <SelectTrigger id="style" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cohesive">Cohesive</SelectItem>
                  <SelectItem value="eclectic">Eclectic</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="room-type" className="text-sm">Room Type</Label>
              <Select value={roomType} onValueChange={(v: any) => setRoomType(v)}>
                <SelectTrigger id="room-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="living">Living Room</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
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
            <li>Upload your moodboard</li>
            <li>Choose style approach and room type</li>
            <li>Transform into photorealistic render</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
