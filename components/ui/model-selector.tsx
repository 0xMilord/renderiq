'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Sparkles, Zap, Image as ImageIcon, Video, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
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
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[80px] sm:max-w-[120px]">
              {selectedModel?.alias || selectedModel?.name}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] p-0",
            "max-h-[80vh] sm:max-h-[500px]"
          )} 
          align="start"
          side="top"
          sideOffset={4}
        >
          <Command className="rounded-lg">
            <CommandInput 
              placeholder="Search models..." 
              className="h-9 text-sm"
            />
            <CommandList className="max-h-[calc(80vh-3rem)] sm:max-h-[400px]">
              <CommandEmpty className="py-6 text-center text-sm">
                No models found.
              </CommandEmpty>
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
                        "flex items-start gap-2 sm:gap-3",
                        "p-2 sm:p-3",
                        "cursor-pointer"
                      )}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                          )}
                          <span className="font-medium text-xs sm:text-sm truncate">
                            {model.name}
                          </span>
                          {model.alias && (
                            <Badge 
                              variant="secondary" 
                              className="text-[9px] sm:text-xs px-1 sm:px-1.5 py-0 shrink-0"
                            >
                              {model.alias}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {model.description}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-1.5">
                          {showCredits && (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] sm:text-xs px-1.5 py-0 h-5"
                            >
                              {modelCredits} credits
                            </Badge>
                          )}
                          {model.capabilities.speed && (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] sm:text-xs px-1.5 py-0 h-5"
                            >
                              {model.capabilities.speed}
                            </Badge>
                          )}
                          {model.capabilities.maxResolution && (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] sm:text-xs px-1.5 py-0 h-5 hidden sm:inline-flex"
                            >
                              {model.capabilities.maxResolution}
                            </Badge>
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
                <ImageIcon className="h-4 w-4 shrink-0" />
              ) : (
                <Video className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate text-left">
                {selectedModel?.alias || selectedModel?.name}
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
            "w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] p-0",
            "max-h-[80vh] sm:max-h-[500px]"
          )} 
          align="start"
        >
          <Command className="rounded-lg">
            <CommandInput 
              placeholder="Search models..." 
              className="h-9 text-sm"
            />
            <CommandList className="max-h-[calc(80vh-3rem)] sm:max-h-[400px]">
              <CommandEmpty className="py-6 text-center text-sm">
                No models found.
              </CommandEmpty>
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
                        "flex items-start gap-2 sm:gap-3",
                        "p-2 sm:p-3",
                        "cursor-pointer"
                      )}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                          )}
                          <span className="font-medium text-xs sm:text-sm truncate">
                            {model.name}
                          </span>
                          {model.alias && (
                            <Badge 
                              variant="secondary" 
                              className="text-[9px] sm:text-xs px-1 sm:px-1.5 py-0 shrink-0"
                            >
                              {model.alias}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {model.description}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-1.5">
                          {showCredits && (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] sm:text-xs px-1.5 py-0 h-5"
                            >
                              {modelCredits} credits
                            </Badge>
                          )}
                          {model.capabilities.speed && (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] sm:text-xs px-1.5 py-0 h-5"
                            >
                              {model.capabilities.speed}
                            </Badge>
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
                <ImageIcon className="h-4 w-4 shrink-0" />
              ) : (
                <Video className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate text-left">
                {selectedModel?.alias || selectedModel?.name}
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
            "w-[calc(100vw-2rem)] sm:w-[450px] max-w-[450px] p-0",
            "max-h-[80vh] sm:max-h-[600px]"
          )} 
          align="start"
        >
          <Command className="rounded-lg">
            <CommandInput 
              placeholder="Search models..." 
              className="h-9 text-sm"
            />
            <CommandList className="max-h-[calc(80vh-3rem)] sm:max-h-[500px]">
              <CommandEmpty className="py-6 text-center text-sm">
                No models found.
              </CommandEmpty>
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
                        "flex items-start gap-2 sm:gap-3",
                        "p-3 sm:p-4",
                        "cursor-pointer"
                      )}
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                          <span className="font-medium text-sm sm:text-base">
                            {model.name}
                          </span>
                          {model.alias && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {model.alias}
                            </Badge>
                          )}
                          {isDefault && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {model.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {showCredits && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-help">
                                  <Zap className="h-3 w-3 mr-1" />
                                  {modelCredits} credits
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cost: {modelCredits} credits</p>
                                {type === 'video' && duration && (
                                  <p className="text-xs mt-1">
                                    {modelCredits / duration} credits/second
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {model.capabilities.speed && (
                            <Badge variant="outline" className="text-xs">
                              {model.capabilities.speed}
                            </Badge>
                          )}
                          {model.capabilities.maxResolution && (
                            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                              {model.capabilities.maxResolution}
                            </Badge>
                          )}
                          {model.capabilities.supportsTextRendering && (
                            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                              Text rendering
                            </Badge>
                          )}
                          {model.capabilities.supportsAudio && (
                            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                              Audio
                            </Badge>
                          )}
                        </div>
                        {model.recommendedFor && model.recommendedFor.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1.5">Recommended for:</p>
                            <div className="flex flex-wrap gap-1">
                              {model.recommendedFor.slice(0, 3).map((useCase) => (
                                <Badge key={useCase} variant="secondary" className="text-xs">
                                  {useCase}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedModel && (
        <div className="text-xs text-muted-foreground line-clamp-2">
          {selectedModel.description}
        </div>
      )}
    </div>
  );
}
