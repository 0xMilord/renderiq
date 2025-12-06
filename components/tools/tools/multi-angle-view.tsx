'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface MultiAngleViewProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
}

export function MultiAngleView({ tool, projectId, onHintChange }: MultiAngleViewProps) {
  const [viewCount, setViewCount] = useState<'2' | '4' | '6'>('4');
  const [viewType, setViewType] = useState<'aerial' | 'eye-level' | 'mixed'>('mixed');

  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      onHintChange={onHintChange}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="view-count" className="text-sm">Number of Views</Label>
              <Select value={viewCount} onValueChange={(v: any) => setViewCount(v)}>
                <SelectTrigger id="view-count" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Views</SelectItem>
                  <SelectItem value="4">4 Views</SelectItem>
                  <SelectItem value="6">6 Views</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="view-type" className="text-sm">View Type</Label>
              <Select value={viewType} onValueChange={(v: any) => setViewType(v)}>
                <SelectTrigger id="view-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aerial">Aerial Views</SelectItem>
                  <SelectItem value="eye-level">Eye Level</SelectItem>
                  <SelectItem value="mixed">Mixed Angles</SelectItem>
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
            <li>Choose number of views and view type</li>
            <li>Generate multiple camera angles</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
