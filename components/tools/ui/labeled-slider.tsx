'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface LabeledSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
}

export function LabeledSlider({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  tooltip,
  showValue = true,
  valueFormatter,
}: LabeledSliderProps) {
  const displayValue = valueFormatter ? valueFormatter(value) : value.toString();

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
        {showValue && (
          <span className="text-sm text-muted-foreground font-medium">{displayValue}</span>
        )}
      </div>
      <Slider
        value={[value]}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}

