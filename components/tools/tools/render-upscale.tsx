'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';

interface RenderUpscaleProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function RenderUpscale({ tool, projectId, onHintChange, hintMessage }: RenderUpscaleProps) {
  // Slider value: 1 = 1K, 2 = 2K, 3 = 4K
  const [sliderValue, setSliderValue] = useState<number[]>([1]);
  
  // Map slider value to imageSize
  const getImageSize = (value: number): '1K' | '2K' | '4K' => {
    if (value === 1) return '1K';
    if (value === 2) return '2K';
    return '4K';
  };
  
  const imageSize = getImageSize(sliderValue[0]);
  
  // Get display label for current value
  const getDisplayLabel = (value: number): string => {
    if (value === 1) return '1K (1024px)';
    if (value === 2) return '2K (2048px)';
    return '4K (4096px)';
  };

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const sizeConfigs = {
      '1K': {
        resolution: '1K resolution (1024x1024 equivalent)',
        detail: 'enhance fine details, improve edge sharpness, and refine textures while maintaining the original image quality and character',
        quality: 'high-quality upscaling with attention to architectural details, material textures, and line sharpness'
      },
      '2K': {
        resolution: '2K resolution (2048x2048 equivalent)',
        detail: 'significantly enhance fine details, dramatically improve edge sharpness, refine textures, and add subtle detail where appropriate while maintaining architectural accuracy',
        quality: 'ultra-high-quality upscaling with exceptional attention to architectural details, material textures, line sharpness, and overall image clarity'
      },
      '4K': {
        resolution: '4K resolution (4096x4096 equivalent)',
        detail: 'maximally enhance fine details, achieve maximum edge sharpness, refine all textures to the highest level, and intelligently add appropriate detail while strictly maintaining architectural accuracy and original image character',
        quality: 'maximum-quality upscaling with exceptional attention to every architectural detail, material texture, line sharpness, and overall image clarity suitable for large-format printing'
      }
    };

    const sizeConfig = sizeConfigs[imageSize];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert AI image enhancement specialist specializing in architectural render upscaling and quality enhancement.
</role>

<task>
Upscale and enhance this architectural render to ${sizeConfig.resolution} while maintaining quality, detail, and architectural accuracy. ${sizeConfig.detail}.
</task>

<constraints>
1. Output format: Generate a single upscaled architectural render image at ${sizeConfig.resolution}
2. Resolution: ${sizeConfig.resolution}
3. Enhancement approach: ${sizeConfig.detail}
4. Quality standard: ${sizeConfig.quality}
5. Architectural accuracy: Maintain all architectural proportions, spatial relationships, and design elements exactly as in the original
6. Material preservation: Preserve all material textures, colors, and surface properties while enhancing their clarity and detail
7. Lighting preservation: Maintain the original lighting conditions, shadows, and highlights while enhancing their clarity
8. Edge enhancement: Sharpen architectural edges, lines, and boundaries without creating artifacts or halos
9. Detail enhancement: Enhance fine details in materials, textures, and architectural elements without adding unrealistic elements
10. Color accuracy: Maintain original color palette and color relationships while improving color clarity and saturation
11. Do not: Distort proportions, add elements not in the original, create artifacts, or alter the architectural design
</constraints>

<output_requirements>
- Resolution: ${sizeConfig.resolution}
- Quality: ${sizeConfig.quality}
- Detail level: Enhanced fine details, sharp edges, refined textures
- Architectural accuracy: Maintain all original architectural elements and proportions
- Material quality: Enhanced material textures and surface properties
- Professional quality: Suitable for high-resolution printing, large-format displays, and professional presentations
- Artifact-free: Clean upscaling without compression artifacts, halos, or distortion
</output_requirements>

<context>
Upscale this architectural render to ${sizeConfig.resolution} while ${sizeConfig.detail}. The upscaled image must maintain all architectural accuracy, proportions, and design elements from the original while achieving ${sizeConfig.quality}. Focus on enhancing architectural details, material textures, edge sharpness, and overall image clarity without introducing artifacts or altering the original design intent.
</context>`;
  };

  // Calculate custom credits cost based on resolution only
  // Base: 5 credits, multiplied by resolution (1K=1x, 2K=2x, 4K=4x)
  // Quality is not used for upscaling - resolution slider controls everything
  const calculateCreditsCost = (_quality: 'standard' | 'high' | 'ultra'): number => {
    const baseCredits = 5;
    const resolutionMultiplier = imageSize === '4K' ? 4 : imageSize === '2K' ? 2 : 1;
    return baseCredits * resolutionMultiplier;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Force quality to 'standard' since resolution is controlled by imageSize slider
    // This prevents quality dropdown from interfering with resolution-based upscaling
    formData.set('quality', 'standard');
    
    // Add imageSize parameter for Gemini API (1K, 2K, 4K)
    formData.append('imageSize', imageSize);
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to upscale render');
    }
    
    // Return result for base component to handle
    return {
      success: true,
      data: {
        renderId: ('renderId' in result.data ? result.data.renderId : ('id' in result.data ? String(result.data.id) : '')) as string,
        outputUrl: (result.data.outputUrl || '') as string,
      },
    };
  };

  return (
    <BaseToolComponent
      tool={tool}
      projectId={projectId}
      onGenerate={handleGenerate}
      onHintChange={onHintChange}
      hintMessage={hintMessage}
      customCreditsCost={calculateCreditsCost}
      customSettings={
        <>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="upscale-factor" className="text-sm">Resolution</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose the output resolution. 1K (1024px), 2K (2048px), or 4K (4096px). Higher resolutions provide more detail but consume more credits and take longer to process.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-medium text-foreground">{getDisplayLabel(sliderValue[0])}</span>
              </div>
              <Slider
                id="upscale-factor"
                min={1}
                max={3}
                step={1}
                value={sliderValue}
                onValueChange={setSliderValue}
                className="w-full"
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>1K</span>
                <span>2K</span>
                <span>4K</span>
              </div>
            </div>
          </div>
        </>
      }
    >
    </BaseToolComponent>
  );
}
