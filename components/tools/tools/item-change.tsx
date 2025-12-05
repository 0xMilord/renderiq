'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';

interface ItemChangeProps {
  tool: ToolConfig;
}

export function ItemChange({ tool }: ItemChangeProps) {
  const [replacementType, setReplacementType] = useState<'furniture' | 'decor' | 'fixtures'>('furniture');
  const [preserveScale, setPreserveScale] = useState<'yes' | 'no'>('yes');

  return (
    <BaseToolComponent
      tool={tool}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <Label htmlFor="replacement-type" className="text-sm">Replacement Type</Label>
              <Select value={replacementType} onValueChange={(v: any) => setReplacementType(v)}>
                <SelectTrigger id="replacement-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="decor">Decor</SelectItem>
                  <SelectItem value="fixtures">Fixtures</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="preserve-scale" className="text-sm">Preserve Scale</Label>
              <Select value={preserveScale} onValueChange={(v: any) => setPreserveScale(v)}>
                <SelectTrigger id="preserve-scale" className="h-10">
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
            <li>Select replacement type</li>
            <li>Replace items with AI precision</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
