'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface ExplodedDiagramProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
}

export function ExplodedDiagram({ tool, projectId, onHintChange }: ExplodedDiagramProps) {
  const [spacing, setSpacing] = useState<'tight' | 'medium' | 'wide'>('medium');
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal' | 'diagonal'>('vertical');

  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      onHintChange={onHintChange}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="spacing" className="text-sm">Component Spacing</Label>
              <Select value={spacing} onValueChange={(v: any) => setSpacing(v)}>
                <SelectTrigger id="spacing" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="orientation" className="text-sm">Explosion Orientation</Label>
              <Select value={orientation} onValueChange={(v: any) => setOrientation(v)}>
                <SelectTrigger id="orientation" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
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
            <li>Upload your architectural design</li>
            <li>Configure spacing and orientation</li>
            <li>Generate exploded axonometric diagram</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
