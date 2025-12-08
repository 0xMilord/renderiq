'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Zap, Video, ChevronDown } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ModelId, ModelType, getModelsByType, getModelConfig, getDefaultModel } from '@/lib/config/models';

interface ModelSelectorProps {
  type: ModelType;
  value?: ModelId;
  onValueChange: (modelId: ModelId) => void;
  quality?: 'standard' | 'high' | 'ultra';
  duration?: number;
  imageSize?: '1K' | '2K' | '4K';
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  showCredits?: boolean;
  disabled?: boolean;
}

export function ModelSelector({
  type,
  value,
  onValueChange,
  quality = 'standard',
  duration = 5,
  imageSize,
  className,
  variant = 'default',
  showCredits = true,
  disabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  
  const models = getModelsByType(type);
  const selectedModel = value ? getModelConfig(value) : getDefaultModel(type);
  const defaultModel = getDefaultModel(type);
  
  // Calculate credits for selected model
  const credits = selectedModel?.calculateCredits({
    quality,
    duration,
    imageSize: imageSize || (quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K'),
  }) || 0;

  const handleSelect = (modelId: ModelId) => {
    onValueChange(modelId);
    setOpen(false);
  };

  // Minimal variant - optimized for small spaces (like chat header)
  if (variant === 'minimal') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 sm:h-8 px-1.5 sm:px-2 gap-1",
              "text-[10px] sm:text-xs",
              "min-w-0 max-w-full",
              className
            )}
            disabled={disabled}
          >
            <SiGoogle className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[80px] sm:max-w-[120px]">
              {selectedModel?.name}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-auto p-0",
            "max-h-[80vh] sm:max-h-[500px]"
          )} 
          align="start"
          side="top"
          sideOffset={4}
        >
          <Command className="rounded-lg">
            <CommandList className="max-h-[calc(80vh-3rem)] sm:max-h-[400px]">
              <CommandGroup>
                {models.map((model) => {
                  const modelCredits = model.calculateCredits({
                    quality,
                    duration,
                    imageSize: imageSize || (quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K'),
                  });
                  const isSelected = value === model.id;
                  
                  return (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      onSelect={() => handleSelect(model.id)}
                      className={cn(
                        "flex items-start gap-2 sm:gap-3 group",
                        "p-2 sm:p-3",
                        "cursor-pointer"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <SiGoogle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 group-data-[highlighted]:text-white dark:group-data-[highlighted]:text-foreground" />
                          <span className="font-medium text-xs sm:text-sm truncate group-data-[highlighted]:text-white dark:group-data-[highlighted]:text-foreground">
                            {model.name}
                          </span>
                          {model.capabilities.speed && (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] sm:text-xs px-1.5 py-0 h-5 group-data-[highlighted]:text-white group-data-[highlighted]:border-white dark:group-data-[highlighted]:text-foreground dark:group-data-[highlighted]:border-foreground"
                            >
                              {model.capabilities.speed}
                            </Badge>
                          )}
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0 group-data-[highlighted]:text-white dark:group-data-[highlighted]:text-foreground" />
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Compact variant - for forms and settings
  if (variant === 'compact') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              "h-9 sm:h-10",
              "text-sm",
              className
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {type === 'image' ? (
                <SiGoogle className="h-4 w-4 shrink-0" />
              ) : (
                <Video className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate text-left">
                {selectedModel?.name}
              </span>
              {showCredits && (
                <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                  {credits} credits
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-auto p-0",
            "max-h-[80vh] sm:max-h-[500px]"
          )} 
          align="start"
        >
          <Command className="rounded-lg">
            <CommandList className="max-h-[calc(80vh-3rem)] sm:max-h-[400px]">
              <CommandGroup>
                {models.map((model) => {
                  const modelCredits = model.calculateCredits({
                    quality,
                    duration,
                    imageSize: imageSize || (quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K'),
                  });
                  const isSelected = value === model.id;
                  
                  return (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      onSelect={() => handleSelect(model.id)}
                      className={cn(
                        "flex items-start gap-2 sm:gap-3 group",
                        "p-2 sm:p-3",
                        "cursor-pointer"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <SiGoogle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 group-data-[highlighted]:text-white dark:group-data-[highlighted]:text-foreground" />
                          <span className="font-medium text-xs sm:text-sm truncate group-data-[highlighted]:text-white dark:group-data-[highlighted]:text-foreground">
                            {model.name}
                          </span>
                          {model.capabilities.speed && (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] sm:text-xs px-1.5 py-0 h-5 group-data-[highlighted]:text-white group-data-[highlighted]:border-white dark:group-data-[highlighted]:text-foreground dark:group-data-[highlighted]:border-foreground"
                            >
                              {model.capabilities.speed}
                            </Badge>
                          )}
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0 group-data-[highlighted]:text-white dark:group-data-[highlighted]:text-foreground" />
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Default variant - full featured
  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              "h-9 sm:h-10",
              "text-sm",
              className
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {type === 'image' ? (
                <SiGoogle className="h-4 w-4 shrink-0" />
              ) : (
                <Video className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate text-left">
                {selectedModel?.name}
              </span>
              {showCredits && (
                <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                  {credits} credits
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-auto p-0",
            "max-h-[80vh] sm:max-h-[600px]"
          )} 
          align="start"
        >
          <Command className="rounded-lg">
            <CommandList className="max-h-[calc(80vh-3rem)] sm:max-h-[500px]">
              <CommandGroup>
                {models.map((model) => {
                  const modelCredits = model.calculateCredits({
                    quality,
                    duration,
                    imageSize: imageSize || (quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K'),
                  });
                  const isSelected = value === model.id;
                  const isDefault = model.id === defaultModel.id;
                  
                  return (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      onSelect={() => handleSelect(model.id)}
                      className={cn(
                        "flex items-start gap-2 sm:gap-3 group",
                        "p-3 sm:p-4",
                        "cursor-pointer"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <SiGoogle className="h-4 w-4 shrink-0 group-data-[highlighted]:text-white dark:group-data-[highlighted]:text-foreground" />
                          <span className="font-medium text-sm sm:text-base group-data-[highlighted]:text-white dark:group-data-[highlighted]:text-foreground">
                            {model.name}
                          </span>
                          {model.capabilities.speed && (
                            <Badge variant="outline" className="text-xs shrink-0 group-data-[highlighted]:text-white group-data-[highlighted]:border-white dark:group-data-[highlighted]:text-foreground dark:group-data-[highlighted]:border-foreground">
                              {model.capabilities.speed}
                            </Badge>
                          )}
                          {isDefault && (
                            <Badge variant="outline" className="text-xs shrink-0 group-data-[highlighted]:text-white group-data-[highlighted]:border-white dark:group-data-[highlighted]:text-foreground dark:group-data-[highlighted]:border-foreground">
                              Default
                            </Badge>
                          )}
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary shrink-0 group-data-[highlighted]:text-white dark:group-data-[highlighted]:text-foreground" />
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
