'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface PresentationSequenceCreatorProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
}

export function PresentationSequenceCreator({ tool, projectId, onHintChange }: PresentationSequenceCreatorProps) {
  const [sequenceType, setSequenceType] = useState<'linear' | 'comparison' | 'progressive'>('linear');
  const [annotationStyle, setAnnotationStyle] = useState<'minimal' | 'detailed' | 'none'>('minimal');

  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      onHintChange={onHintChange}
      multipleImages={true}
      maxImages={8}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="sequence-type" className="text-sm">Sequence Type</Label>
              <Select value={sequenceType} onValueChange={(v: any) => setSequenceType(v)}>
                <SelectTrigger id="sequence-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear Story</SelectItem>
                  <SelectItem value="comparison">Before/After</SelectItem>
                  <SelectItem value="progressive">Progressive Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="annotation-style" className="text-sm">Annotation Style</Label>
              <Select value={annotationStyle} onValueChange={(v: any) => setAnnotationStyle(v)}>
                <SelectTrigger id="annotation-style" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="none">None</SelectItem>
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
            <li>Upload multiple architectural images</li>
            <li>Choose sequence type and annotation style</li>
            <li>Create sequential presentation layout</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
