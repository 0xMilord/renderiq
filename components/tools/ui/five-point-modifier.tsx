'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface FivePointModifierProps {
  label: string;
  value: number; // 1-5
  onValueChange: (value: number[]) => void;
  tooltip?: string;
  labels?: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
}

const defaultLabels = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High',
};

export function FivePointModifier({
  label,
  value,
  onValueChange,
  tooltip,
  labels = defaultLabels,
}: FivePointModifierProps) {
  const currentLabel = labels[value as keyof typeof labels] || labels[3];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm">{label}</Label>
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
        <span className="text-sm text-muted-foreground font-medium">
          {value}/5 - {currentLabel}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={onValueChange}
        min={1}
        max={5}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{labels[1]}</span>
        <span>{labels[2]}</span>
        <span>{labels[3]}</span>
        <span>{labels[4]}</span>
        <span>{labels[5]}</span>
      </div>
    </div>
  );
}

