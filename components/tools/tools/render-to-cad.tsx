'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface RenderToCADProps {
  tool: ToolConfig;
}

export function RenderToCAD({ tool }: RenderToCADProps) {
  const [lineStyle, setLineStyle] = useState<'technical' | 'architectural' | 'minimal'>('technical');
  const [detailLevel, setDetailLevel] = useState<'basic' | 'detailed' | 'comprehensive'>('detailed');

  return (
    <BaseToolComponent
      tool={tool}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="line-style" className="text-sm">Line Style</Label>
              <Select value={lineStyle} onValueChange={(v: any) => setLineStyle(v)}>
                <SelectTrigger id="line-style" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical (Precise)</SelectItem>
                  <SelectItem value="architectural">Architectural (Standard)</SelectItem>
                  <SelectItem value="minimal">Minimal (Clean)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="detail-level" className="text-sm">Detail Level</Label>
              <Select value={detailLevel} onValueChange={(v: any) => setDetailLevel(v)}>
                <SelectTrigger id="detail-level" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
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
            <li>Upload your photorealistic render</li>
            <li>Choose line style and detail level</li>
            <li>Generate clean 2D CAD-style technical drawing</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
