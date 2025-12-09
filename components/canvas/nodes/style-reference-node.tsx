'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, Palette, Sparkles } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { StyleReferenceNodeData, StyleNodeData } from '@/lib/types/canvas';
import { BaseNode, useNodeColors } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';
import { cn } from '@/lib/utils';

// Default style preset
const DEFAULT_STYLE: StyleNodeData = {
  camera: { focalLength: 35, fStop: 5.6, position: 'eye-level', angle: 'three-quarter' },
  environment: { scene: 'exterior', weather: 'sunny', timeOfDay: 'afternoon', season: 'summer' },
  lighting: { intensity: 70, direction: 'side', color: 'warm', shadows: 'soft' },
  atmosphere: { mood: 'professional', contrast: 50, saturation: 50 },
};

export function StyleReferenceNode(props: any) {
  const { data, id } = props;
  const nodeColors = useNodeColors();
  const [localData, setLocalData] = useState<StyleReferenceNodeData>(data || {
    imageUrl: null,
    imageData: null,
    imageType: null,
    imageName: null,
    styleExtraction: {
      extractCamera: true,
      extractLighting: true,
      extractAtmosphere: true,
      extractEnvironment: true,
      extractColors: true,
      extractComposition: true,
    },
    extractedStyle: undefined,
  });
  const [isExtracting, setIsExtracting] = useState(false);

  // Update local data when prop data changes
  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const handleChange = useCallback((updates: Partial<StyleReferenceNodeData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    
    // Dispatch update event
    const event = new CustomEvent('nodeDataUpdate', {
      detail: { nodeId: id, data: newData },
    });
    window.dispatchEvent(event);
  }, [localData, id]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1]; // Remove data:image/...;base64, prefix
        
        handleChange({
          imageUrl: result,
          imageData: base64Data,
          imageType: file.type,
          imageName: file.name,
        });
      };
      
      reader.readAsDataURL(file);
    }
  }, [handleChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
  });

  const handleRemove = useCallback(() => {
    handleChange({
      imageUrl: null,
      imageData: null,
      imageType: null,
      imageName: null,
      extractedStyle: undefined,
    });
  }, [handleChange]);

  const handleExtractStyle = useCallback(async () => {
    if (!localData.imageData) return;

    setIsExtracting(true);
    try {
      // Call API to extract style from image
      const response = await fetch('/api/ai/extract-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: localData.imageData,
          imageType: localData.imageType,
          extractionOptions: localData.styleExtraction,
        }),
      });

      if (!response.ok) {
        throw new Error('Style extraction failed');
      }

      const result = await response.json();
      if (result.success && result.data) {
        handleChange({ extractedStyle: result.data });
      }
    } catch (error) {
      console.error('Failed to extract style:', error);
      // For now, use default style as fallback
      handleChange({ extractedStyle: DEFAULT_STYLE });
    } finally {
      setIsExtracting(false);
    }
  }, [localData.imageData, localData.imageType, localData.styleExtraction, handleChange]);

  const updateExtractionOption = useCallback((key: keyof StyleReferenceNodeData['styleExtraction'], value: boolean) => {
    handleChange({
      styleExtraction: {
        ...localData.styleExtraction,
        [key]: value,
      },
    });
  }, [localData.styleExtraction, handleChange]);

  const status = (data as any)?.status || NodeExecutionStatus.IDLE;
  const hasImage = !!localData.imageUrl;
  const hasExtractedStyle = !!localData.extractedStyle;

  return (
    <BaseNode
      title="Style Reference"
      icon={Palette}
      nodeType="style-reference"
      nodeId={String(id)}
      className="w-80"
      status={status}
      outputs={[{ id: 'style', position: Position.Right, type: 'style', label: 'Style' }]}
    >
      <div className="space-y-3">
        {/* Image Upload */}
        {!hasImage ? (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors nodrag nopan',
              isDragActive
                ? ''
                : 'border-border'
            )}
            style={{
              borderColor: isDragActive ? nodeColors.color : undefined,
              backgroundColor: isDragActive ? `${nodeColors.color}10` : undefined,
            }}
            onMouseEnter={(e) => {
              if (!isDragActive) {
                e.currentTarget.style.borderColor = `${nodeColors.color}80`;
                e.currentTarget.style.backgroundColor = `${nodeColors.color}08`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragActive) {
                e.currentTarget.style.borderColor = undefined;
                e.currentTarget.style.backgroundColor = undefined;
              }
            }}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <Label className="text-xs text-muted-foreground cursor-pointer">
              {isDragActive ? 'Drop image here' : 'Click or drag to upload'}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WEBP up to 10MB
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img
                src={localData.imageUrl!}
                alt={localData.imageName || 'Style reference'}
                className="w-full h-auto max-h-48 object-contain"
              />
              <Button
                onClick={handleRemove}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 nodrag nopan"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {localData.imageName && (
              <p className="text-xs text-muted-foreground truncate">
                {localData.imageName}
              </p>
            )}
          </div>
        )}

        {/* Style Extraction Options */}
        {hasImage && (
          <div className="space-y-2 border-t border-border pt-3">
            <Label className="text-xs font-medium">Extract Style Elements</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extract-camera"
                  checked={localData.styleExtraction.extractCamera}
                  onCheckedChange={(checked) => updateExtractionOption('extractCamera', checked as boolean)}
                  className="nodrag nopan"
                />
                <Label htmlFor="extract-camera" className="text-xs cursor-pointer nodrag nopan">
                  Camera
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extract-lighting"
                  checked={localData.styleExtraction.extractLighting}
                  onCheckedChange={(checked) => updateExtractionOption('extractLighting', checked as boolean)}
                  className="nodrag nopan"
                />
                <Label htmlFor="extract-lighting" className="text-xs cursor-pointer nodrag nopan">
                  Lighting
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extract-atmosphere"
                  checked={localData.styleExtraction.extractAtmosphere}
                  onCheckedChange={(checked) => updateExtractionOption('extractAtmosphere', checked as boolean)}
                  className="nodrag nopan"
                />
                <Label htmlFor="extract-atmosphere" className="text-xs cursor-pointer nodrag nopan">
                  Atmosphere
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extract-environment"
                  checked={localData.styleExtraction.extractEnvironment}
                  onCheckedChange={(checked) => updateExtractionOption('extractEnvironment', checked as boolean)}
                  className="nodrag nopan"
                />
                <Label htmlFor="extract-environment" className="text-xs cursor-pointer nodrag nopan">
                  Environment
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extract-colors"
                  checked={localData.styleExtraction.extractColors}
                  onCheckedChange={(checked) => updateExtractionOption('extractColors', checked as boolean)}
                  className="nodrag nopan"
                />
                <Label htmlFor="extract-colors" className="text-xs cursor-pointer nodrag nopan">
                  Colors
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extract-composition"
                  checked={localData.styleExtraction.extractComposition}
                  onCheckedChange={(checked) => updateExtractionOption('extractComposition', checked as boolean)}
                  className="nodrag nopan"
                />
                <Label htmlFor="extract-composition" className="text-xs cursor-pointer nodrag nopan">
                  Composition
                </Label>
              </div>
            </div>

            <Button
              onClick={handleExtractStyle}
              disabled={isExtracting}
              className="w-full h-7 text-xs nodrag nopan"
              variant="outline"
            >
              {isExtracting ? (
                <>
                  <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Extract Style
                </>
              )}
            </Button>
          </div>
        )}

        {/* Extracted Style Summary */}
        {hasExtractedStyle && localData.extractedStyle && (
          <div className="space-y-2 border-t border-border pt-3">
            <Label className="text-xs font-medium">Extracted Style</Label>
            <div className="text-xs text-muted-foreground space-y-1 bg-accent/50 rounded p-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Camera:</span> {localData.extractedStyle.camera.focalLength}mm, f/{localData.extractedStyle.camera.fStop}
                </div>
                <div>
                  <span className="font-medium">Mood:</span> {localData.extractedStyle.atmosphere.mood}
                </div>
                <div>
                  <span className="font-medium">Scene:</span> {localData.extractedStyle.environment.scene}
                </div>
                <div>
                  <span className="font-medium">Lighting:</span> {localData.extractedStyle.lighting.intensity}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
