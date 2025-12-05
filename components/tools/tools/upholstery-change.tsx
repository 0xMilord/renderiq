'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface UpholsteryChangeProps {
  tool: ToolConfig;
}

export function UpholsteryChange({ tool }: UpholsteryChangeProps) {
  const [fabricType, setFabricType] = useState<'leather' | 'fabric' | 'velvet' | 'linen' | 'suede'>('fabric');
  const [pattern, setPattern] = useState<'solid' | 'striped' | 'geometric' | 'floral'>('solid');

  return (
    <BaseToolComponent
      tool={tool}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="fabric-type" className="text-sm">Fabric Type</Label>
              <Select value={fabricType} onValueChange={(v: any) => setFabricType(v)}>
                <SelectTrigger id="fabric-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leather">Leather</SelectItem>
                  <SelectItem value="fabric">Fabric</SelectItem>
                  <SelectItem value="velvet">Velvet</SelectItem>
                  <SelectItem value="linen">Linen</SelectItem>
                  <SelectItem value="suede">Suede</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pattern" className="text-sm">Pattern</Label>
              <Select value={pattern} onValueChange={(v: any) => setPattern(v)}>
                <SelectTrigger id="pattern" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="striped">Striped</SelectItem>
                  <SelectItem value="geometric">Geometric</SelectItem>
                  <SelectItem value="floral">Floral</SelectItem>
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
            <li>Upload your interior render with furniture</li>
            <li>Select fabric type and pattern</li>
            <li>Transform furniture upholstery</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
