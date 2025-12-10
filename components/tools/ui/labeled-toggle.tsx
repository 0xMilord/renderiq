'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface LabeledToggleProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  tooltip?: string;
  id?: string;
}

export function LabeledToggle({
  label,
  checked,
  onCheckedChange,
  tooltip,
  id,
}: LabeledToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className="text-sm cursor-pointer">
          {label}
        </Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

