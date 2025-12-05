'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface SketchToRenderProps {
  tool: ToolConfig;
}

export function SketchToRender({ tool }: SketchToRenderProps) {
  const [detailLevel, setDetailLevel] = useState<'preserve' | 'enhance' | 'transform'>('enhance');
  const [environment, setEnvironment] = useState<string>('none');

  return (
    <BaseToolComponent
      tool={tool}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="detail-level" className="text-sm">Style Preservation</Label>
              <Select value={detailLevel} onValueChange={(v: 'preserve' | 'enhance' | 'transform') => setDetailLevel(v)}>
                <SelectTrigger id="detail-level" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preserve">Preserve Original Style</SelectItem>
                  <SelectItem value="enhance">Enhance with Realism</SelectItem>
                  <SelectItem value="transform">Full Transformation</SelectItem>
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
                  <SelectItem value="sunny">Sunny Day</SelectItem>
                  <SelectItem value="overcast">Overcast</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
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
            <li>Upload your architectural sketch</li>
            <li>Choose style preservation level</li>
            <li>Select environment (optional)</li>
            <li>Generate photorealistic render</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}

