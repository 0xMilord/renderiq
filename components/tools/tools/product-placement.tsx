'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface ProductPlacementProps {
  tool: ToolConfig;
}

export function ProductPlacement({ tool }: ProductPlacementProps) {
  const [placementStyle, setPlacementStyle] = useState<'natural' | 'prominent' | 'subtle'>('natural');
  const [lightingMatch, setLightingMatch] = useState<'yes' | 'no'>('yes');

  return (
    <BaseToolComponent
      tool={tool}
      multipleImages={true}
      maxImages={2}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="placement-style" className="text-sm">Placement Style</Label>
              <Select value={placementStyle} onValueChange={(v: any) => setPlacementStyle(v)}>
                <SelectTrigger id="placement-style" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="prominent">Prominent</SelectItem>
                  <SelectItem value="subtle">Subtle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lighting-match" className="text-sm">Match Scene Lighting</Label>
              <Select value={lightingMatch} onValueChange={(v: any) => setLightingMatch(v)}>
                <SelectTrigger id="lighting-match" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
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
            <li>Upload interior scene and product image</li>
            <li>Configure placement style</li>
            <li>Place product seamlessly into scene</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
