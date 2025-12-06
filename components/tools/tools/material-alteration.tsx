'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface MaterialAlterationProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
}

export function MaterialAlteration({ tool, projectId, onHintChange }: MaterialAlterationProps) {
  const [facadeMaterial, setFacadeMaterial] = useState<'brick' | 'glass' | 'concrete' | 'metal' | 'wood'>('glass');
  const [finish, setFinish] = useState<'matte' | 'glossy' | 'textured'>('matte');

  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      onHintChange={onHintChange}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="facade-material" className="text-sm">Facade Material</Label>
              <Select value={facadeMaterial} onValueChange={(v: any) => setFacadeMaterial(v)}>
                <SelectTrigger id="facade-material" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brick">Brick</SelectItem>
                  <SelectItem value="glass">Glass</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="wood">Wood</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="finish" className="text-sm">Surface Finish</Label>
              <Select value={finish} onValueChange={(v: any) => setFinish(v)}>
                <SelectTrigger id="finish" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matte">Matte</SelectItem>
                  <SelectItem value="glossy">Glossy</SelectItem>
                  <SelectItem value="textured">Textured</SelectItem>
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
            <li>Select facade material and finish</li>
            <li>Transform building materials</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
