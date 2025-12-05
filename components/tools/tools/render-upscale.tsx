'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface RenderUpscaleProps {
  tool: ToolConfig;
  projectId?: string | null;
}

export function RenderUpscale({ tool, projectId }: RenderUpscaleProps) {
  const [upscaleFactor, setUpscaleFactor] = useState<'2x' | '4x' | '8x'>('2x');

  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="upscale-factor" className="text-sm">Upscale Factor</Label>
              <Select value={upscaleFactor} onValueChange={(v: any) => setUpscaleFactor(v)}>
                <SelectTrigger id="upscale-factor" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2x">2x (Double Resolution)</SelectItem>
                  <SelectItem value="4x">4x (Quadruple Resolution)</SelectItem>
                  <SelectItem value="8x">8x (8x Resolution)</SelectItem>
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
            <li>Upload your render</li>
            <li>Choose upscale factor (2x, 4x, or 8x)</li>
            <li>Generate upscaled render</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
