'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface ChangeTextureProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
}

export function ChangeTexture({ tool, projectId, onHintChange }: ChangeTextureProps) {
  const [materialType, setMaterialType] = useState<'wood' | 'stone' | 'metal' | 'fabric' | 'concrete'>('wood');
  const [preserveLighting, setPreserveLighting] = useState<'yes' | 'no'>('yes');

  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      onHintChange={onHintChange}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="material-type" className="text-sm">Material Type</Label>
              <Select value={materialType} onValueChange={(v: any) => setMaterialType(v)}>
                <SelectTrigger id="material-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wood">Wood</SelectItem>
                  <SelectItem value="stone">Stone</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="fabric">Fabric</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="preserve-lighting" className="text-sm">Preserve Lighting</Label>
              <Select value={preserveLighting} onValueChange={(v: any) => setPreserveLighting(v)}>
                <SelectTrigger id="preserve-lighting" className="h-10">
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
            <li>Upload your interior render</li>
            <li>Select material type to apply</li>
            <li>Choose lighting preservation</li>
            <li>Generate with new textures</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
