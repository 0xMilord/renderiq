'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface FloorplanTo3DProps {
  tool: ToolConfig;
}

export function FloorplanTo3D({ tool }: FloorplanTo3DProps) {
  const [perspective, setPerspective] = useState<'isometric' | 'axonometric' | 'oblique'>('axonometric');
  const [height, setHeight] = useState<'low' | 'medium' | 'high'>('medium');

  return (
    <BaseToolComponent
      tool={tool}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="perspective" className="text-sm">Perspective Type</Label>
              <Select value={perspective} onValueChange={(v: any) => setPerspective(v)}>
                <SelectTrigger id="perspective" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isometric">Isometric</SelectItem>
                  <SelectItem value="axonometric">Axonometric</SelectItem>
                  <SelectItem value="oblique">Oblique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="height" className="text-sm">Wall Height</Label>
              <Select value={height} onValueChange={(v: any) => setHeight(v)}>
                <SelectTrigger id="height" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (2.4m)</SelectItem>
                  <SelectItem value="medium">Medium (3.0m)</SelectItem>
                  <SelectItem value="high">High (3.6m)</SelectItem>
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
            <li>Upload your 2D floor plan</li>
            <li>Choose perspective type and wall height</li>
            <li>Generate 3D axonometric diagram</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
