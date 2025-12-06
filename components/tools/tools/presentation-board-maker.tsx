'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface PresentationBoardMakerProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
}

export function PresentationBoardMaker({ tool, projectId, onHintChange }: PresentationBoardMakerProps) {
  const [boardSize, setBoardSize] = useState<'A3' | 'A2' | 'A1' | 'custom'>('A2');
  const [layoutStyle, setLayoutStyle] = useState<'grid' | 'masonry' | 'linear' | 'asymmetric'>('grid');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'neutral'>('light');

  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      multipleImages={true}
      maxImages={10}
      onHintChange={onHintChange}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="board-size" className="text-sm">Board Size</Label>
              <Select value={boardSize} onValueChange={(v: any) => setBoardSize(v)}>
                <SelectTrigger id="board-size" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
                  <SelectItem value="A2">A2 (420 × 594 mm)</SelectItem>
                  <SelectItem value="A1">A1 (594 × 841 mm)</SelectItem>
                  <SelectItem value="custom">Custom Size</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="layout-style" className="text-sm">Layout Style</Label>
              <Select value={layoutStyle} onValueChange={(v: any) => setLayoutStyle(v)}>
                <SelectTrigger id="layout-style" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid Layout</SelectItem>
                  <SelectItem value="masonry">Masonry Layout</SelectItem>
                  <SelectItem value="linear">Linear Layout</SelectItem>
                  <SelectItem value="asymmetric">Asymmetric Layout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color-scheme" className="text-sm">Color Scheme</Label>
              <Select value={colorScheme} onValueChange={(v: any) => setColorScheme(v)}>
                <SelectTrigger id="color-scheme" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
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
            <li>Upload multiple render images</li>
            <li>Choose board size and layout style</li>
            <li>Select color scheme</li>
            <li>Generate professional presentation board</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
