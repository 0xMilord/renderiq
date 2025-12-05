'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface FloorplanToFurnishedProps {
  tool: ToolConfig;
  projectId?: string | null;
}

export function FloorplanToFurnished({ tool, projectId }: FloorplanToFurnishedProps) {
  const [furnitureStyle, setFurnitureStyle] = useState<'modern' | 'traditional' | 'minimalist' | 'luxury'>('modern');
  const [roomType, setRoomType] = useState<string>('living-room');

  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="furniture-style" className="text-sm">Furniture Style</Label>
              <Select value={furnitureStyle} onValueChange={(v: any) => setFurnitureStyle(v)}>
                <SelectTrigger id="furniture-style" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="room-type" className="text-sm">Room Type</Label>
              <Select value={roomType} onValueChange={setRoomType}>
                <SelectTrigger id="room-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="living-room">Living Room</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="mixed">Mixed Use</SelectItem>
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
            <li>Upload your empty floor plan</li>
            <li>Choose furniture style and room type</li>
            <li>Generate furnished floor plan</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
