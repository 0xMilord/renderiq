'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface RenderEffectsProps {
  tool: ToolConfig;
}

export function RenderEffects({ tool }: RenderEffectsProps) {
  const [effectType, setEffectType] = useState<'sketch' | 'illustration' | 'wireframe' | 'watercolor' | 'pencil'>('sketch');
  const [intensity, setIntensity] = useState<'subtle' | 'medium' | 'strong'>('medium');

  return (
    <BaseToolComponent
      tool={tool}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="effect-type" className="text-sm">Effect Type</Label>
              <Select value={effectType} onValueChange={(v: any) => setEffectType(v)}>
                <SelectTrigger id="effect-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sketch">Sketch Style</SelectItem>
                  <SelectItem value="illustration">Illustration</SelectItem>
                  <SelectItem value="wireframe">Wireframe</SelectItem>
                  <SelectItem value="watercolor">Watercolor</SelectItem>
                  <SelectItem value="pencil">Pencil Drawing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="intensity" className="text-sm">Effect Intensity</Label>
              <Select value={intensity} onValueChange={(v: any) => setIntensity(v)}>
                <SelectTrigger id="intensity" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subtle">Subtle</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="strong">Strong</SelectItem>
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
            <li>Upload your architectural render</li>
            <li>Choose effect type and intensity</li>
            <li>Apply creative effects with AI</li>
            <li>Download your stylized render</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
