'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface CheckboxOption {
  value: string;
  label: string;
}

interface LabeledCheckboxGroupProps {
  label: string;
  options: CheckboxOption[];
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
  tooltip?: string;
  id?: string;
}

export function LabeledCheckboxGroup({
  label,
  options,
  selectedValues,
  onValueChange,
  tooltip,
  id,
}: LabeledCheckboxGroupProps) {
  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onValueChange([...selectedValues, optionValue]);
    } else {
      onValueChange(selectedValues.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className="space-y-3">
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
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${id}-${option.value}`}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={(checked) => handleCheckboxChange(option.value, checked as boolean)}
            />
            <Label
              htmlFor={`${id}-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

