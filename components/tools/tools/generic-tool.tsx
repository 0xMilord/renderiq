'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface GenericToolProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function GenericTool({ tool, projectId, onHintChange, hintMessage }: GenericToolProps) {
  return (
    <BaseToolComponent tool={tool} projectId={projectId} onHintChange={onHintChange} hintMessage={hintMessage}>
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
            <li>Upload your image</li>
            <li>Adjust settings (optional)</li>
            <li>Click Generate</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}

