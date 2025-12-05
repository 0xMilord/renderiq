'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface PortfolioLayoutGeneratorProps {
  tool: ToolConfig;
}

export function PortfolioLayoutGenerator({ tool }: PortfolioLayoutGeneratorProps) {
  const [layoutStyle, setLayoutStyle] = useState<'grid' | 'masonry' | 'linear' | 'magazine'>('grid');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'neutral'>('light');

  return (
    <BaseToolComponent
      tool={tool}
      multipleImages={true}
      maxImages={10}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="layout-style" className="text-sm">Layout Style</Label>
              <Select value={layoutStyle} onValueChange={(v: any) => setLayoutStyle(v)}>
                <SelectTrigger id="layout-style" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="magazine">Magazine</SelectItem>
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
            <li>Upload multiple project images</li>
            <li>Choose layout style and color scheme</li>
            <li>Generate professional portfolio layout</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
