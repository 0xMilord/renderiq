'use client';

import { useState, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export type StyleReferenceType = 'preset' | 'custom' | 'none';

interface StyleReferenceProps {
  value: StyleReferenceType;
  presetStyle?: string;
  customImage?: File | null;
  customImagePreview?: string | null;
  onTypeChange: (type: StyleReferenceType) => void;
  onPresetStyleChange: (style: string) => void;
  onCustomImageChange: (file: File | null) => void;
  className?: string;
}

const PRESET_STYLES = [
  { value: 'modern', label: 'Modern' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'scandinavian', label: 'Scandinavian' },
  { value: 'contemporary', label: 'Contemporary' },
  { value: 'rustic', label: 'Rustic' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'bohemian', label: 'Bohemian' },
  { value: 'art-deco', label: 'Art Deco' },
  { value: 'mid-century', label: 'Mid-Century Modern' },
  { value: 'japanese', label: 'Japanese' },
];

export function StyleReference({
  value,
  presetStyle = 'modern',
  customImage,
  customImagePreview,
  onTypeChange,
  onPresetStyleChange,
  onCustomImageChange,
  className,
}: StyleReferenceProps) {
  const [preview, setPreview] = useState<string | null>(customImagePreview || null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onCustomImageChange(file);
        
        // Generate preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onCustomImageChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
    disabled: value !== 'custom',
  });

  const handleRemoveCustomImage = () => {
    onCustomImageChange(null);
    setPreview(null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-1.5">
        <Label className="text-sm">Style Reference</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">Choose a preset style or upload your own image as a style reference to guide the generation.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Type Selector */}
      <Select value={value} onValueChange={(v: StyleReferenceType) => onTypeChange(v)}>
        <SelectTrigger className="h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Style Reference</SelectItem>
          <SelectItem value="preset">Preset Style</SelectItem>
          <SelectItem value="custom">Custom Image</SelectItem>
        </SelectContent>
      </Select>

      {/* Preset Style Selector */}
      {value === 'preset' && (
        <Select value={presetStyle} onValueChange={onPresetStyleChange}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select a style" />
          </SelectTrigger>
          <SelectContent>
            {PRESET_STYLES.map((style) => (
              <SelectItem key={style.value} value={style.value}>
                {style.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Custom Image Upload */}
      {value === 'custom' && (
        <div className="space-y-2">
          {preview ? (
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted group">
              <img
                src={preview}
                alt="Style reference"
                className="w-full h-full object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveCustomImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 aspect-video flex flex-col items-center justify-center gap-2 p-4',
                isDragActive
                  ? 'border-primary bg-primary/10 scale-[1.02]'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">Style reference image (PNG, JPG, WebP)</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

