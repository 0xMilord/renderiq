'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface FloorplanTechnicalDiagramsProps {
  tool: ToolConfig;
}

export function FloorplanTechnicalDiagrams({ tool }: FloorplanTechnicalDiagramsProps) {
  const [annotationStyle, setAnnotationStyle] = useState<'minimal' | 'standard' | 'detailed'>('standard');
  const [includeDimensions, setIncludeDimensions] = useState<'yes' | 'no'>('yes');

  return (
    <BaseToolComponent
      tool={tool}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="annotation-style" className="text-sm">Annotation Style</Label>
              <Select value={annotationStyle} onValueChange={(v: any) => setAnnotationStyle(v)}>
                <SelectTrigger id="annotation-style" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dimensions" className="text-sm">Include Dimensions</Label>
              <Select value={includeDimensions} onValueChange={(v: any) => setIncludeDimensions(v)}>
                <SelectTrigger id="dimensions" className="h-10">
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
            <li>Upload your floor plan</li>
            <li>Choose annotation style and dimensions</li>
            <li>Generate professional technical diagram</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
