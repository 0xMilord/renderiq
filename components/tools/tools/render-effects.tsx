'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Image as ImageIcon } from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';
import { StyleReferenceDialog } from '@/components/ui/style-reference-dialog';

interface RenderEffectsProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function RenderEffects({ tool, projectId, onHintChange, hintMessage }: RenderEffectsProps) {
  const [effectType, setEffectType] = useState<'sketch' | 'illustration' | 'wireframe' | 'watercolor' | 'pencil'>('sketch');
  const [intensity, setIntensity] = useState<'subtle' | 'medium' | 'strong'>('medium');
  const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
  const [styleReferenceName, setStyleReferenceName] = useState<string | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const effectConfigs = {
      'sketch': {
        description: 'hand-drawn architectural sketch style with visible linework, hatching, and sketchy character',
        characteristics: 'visible sketch lines, hatching, cross-hatching, loose linework, hand-drawn aesthetic, architectural sketch quality',
        style: 'architectural sketch with visible linework, hatching, and hand-drawn character'
      },
      'illustration': {
        description: 'architectural illustration style with stylized rendering, artistic interpretation, and visual appeal',
        characteristics: 'stylized rendering, artistic interpretation, enhanced visual appeal, illustration quality, graphic design aesthetic',
        style: 'architectural illustration with stylized rendering and artistic interpretation'
      },
      'wireframe': {
        description: 'wireframe style showing structural lines, edges, and geometric framework',
        characteristics: 'structural lines, edges, geometric framework, transparent surfaces, line-based visualization, technical wireframe aesthetic',
        style: 'wireframe visualization showing structural lines and geometric framework'
      },
      'watercolor': {
        description: 'watercolor painting style with soft color washes, blending, and artistic watercolor techniques',
        characteristics: 'soft color washes, color blending, watercolor techniques, artistic painting aesthetic, soft edges, color bleeding',
        style: 'watercolor painting with soft color washes and artistic techniques'
      },
      'pencil': {
        description: 'pencil drawing style with graphite shading, linework, and traditional pencil drawing techniques',
        characteristics: 'graphite shading, pencil linework, traditional drawing techniques, pencil drawing aesthetic, tonal shading, line quality',
        style: 'pencil drawing with graphite shading and traditional drawing techniques'
      }
    };

    const intensityConfigs = {
      'subtle': {
        description: 'subtle application maintaining photorealistic quality with light artistic overlay',
        application: 'lightly apply the effect while maintaining photorealistic architectural quality and detail'
      },
      'medium': {
        description: 'balanced application with clear artistic style while preserving architectural elements',
        application: 'apply the effect with balanced intensity, clearly showing the artistic style while preserving architectural elements and proportions'
      },
      'strong': {
        description: 'strong application with full artistic transformation while maintaining architectural accuracy',
        application: 'apply the effect with strong intensity, fully transforming to the artistic style while maintaining architectural accuracy and proportions'
      }
    };

    const effectConfig = effectConfigs[effectType];
    const intensityConfig = intensityConfigs[intensity];

    // Style reference instruction
    const styleReferenceInstruction = styleReferenceImage || styleReferenceName
      ? ' IMPORTANT: A style reference image has been provided. Match the artistic style, technique, line quality, color palette, rendering approach, and overall aesthetic of the style reference image. The style reference shows the desired artistic effect style - replicate its visual characteristics, technique application, and artistic quality while maintaining architectural accuracy.'
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural visualizer specializing in applying creative artistic effects to architectural renders while maintaining architectural accuracy.
</role>

<task>
Apply ${effectConfig.description} to this architectural render with ${intensityConfig.description}. ${intensityConfig.application} while maintaining architectural accuracy and design intent.
</task>

<constraints>
1. Output format: Generate a single stylized architectural render image
2. Effect type: ${effectType} - ${effectConfig.description}
3. Effect characteristics: ${effectConfig.characteristics}
4. Intensity: ${intensity} - ${intensityConfig.description}
5. Application: ${intensityConfig.application}
6. Architectural accuracy: Maintain all architectural proportions, spatial relationships, and design elements
7. Style application: Apply ${effectConfig.style} with ${intensity} intensity${styleReferenceInstruction}
8. Quality: Achieve professional artistic quality suitable for presentations and design communication
9. Design preservation: Preserve the original architectural design intent and key elements
10. Do not: Distort proportions, alter the architectural design, or create unrealistic elements
</constraints>

<output_requirements>
- Render type: Stylized architectural render with ${effectType} effect
- Effect style: ${effectConfig.style}
- Intensity: ${intensity} - ${intensityConfig.description}
- Characteristics: ${effectConfig.characteristics}
- Architectural accuracy: Maintain all original architectural elements and proportions
- Professional quality: Suitable for presentations, design communication, and artistic visualization
- Style quality: Achieve authentic ${effectType} aesthetic with proper technique application
</output_requirements>

<context>
Apply ${effectConfig.description} to this architectural render with ${intensityConfig.description}. ${intensityConfig.application}. The result should show ${effectConfig.characteristics} while maintaining all architectural accuracy, proportions, and design elements. Create a professional ${effectType} style architectural visualization that preserves the design intent while achieving the artistic effect.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('effectType', effectType);
    formData.append('intensity', intensity);
    
    // Add style reference if provided
    if (styleReferenceImage) {
      formData.append('styleReference', 'custom');
      const styleImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(styleReferenceImage);
      });
      formData.append('styleReferenceImageData', styleImageBase64);
      formData.append('styleReferenceImageType', styleReferenceImage.type);
    } else if (styleReferenceName) {
      formData.append('styleReference', 'library');
      formData.append('styleReferenceName', styleReferenceName);
    }
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to apply effect');
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
      customSettings={
        <>
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column: Effect Type and Intensity (stacked vertically) */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="effect-type" className="text-sm">Effect Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose the artistic effect to apply. Sketch: hand-drawn lines. Illustration: stylized rendering. Wireframe: structural lines. Watercolor: painting style. Pencil: graphite drawing.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={effectType} onValueChange={(v: any) => setEffectType(v)}>
                  <SelectTrigger id="effect-type" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sketch">Sketch Style</SelectItem>
                    <SelectItem value="illustration">Illustration</SelectItem>
                    <SelectItem value="wireframe">Wireframe</SelectItem>
                    <SelectItem value="watercolor">Watercolor</SelectItem>
                    <SelectItem value="pencil">Pencil Drawing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="intensity" className="text-sm">Effect Intensity</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Control how strongly the effect is applied. Subtle: light overlay. Medium: balanced. Strong: full transformation.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={intensity} onValueChange={(v: any) => setIntensity(v)}>
                  <SelectTrigger id="intensity" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subtle">Subtle</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column: Style Reference */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Style Reference</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Upload your own artistic style reference or choose from Renderiq's style library to match the visual style, technique, and aesthetic.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className="relative w-full h-[132px] border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center group"
                onClick={() => setStyleDialogOpen(true)}
                style={{
                  borderColor: styleReferencePreview ? 'transparent' : undefined,
                }}
              >
                {styleReferencePreview ? (
                  <>
                    <img
                      src={styleReferencePreview}
                      alt="Style reference"
                      className="w-full h-full rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ImageIcon className="h-4 w-4 text-white" />
                    </div>
                  </>
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              {styleReferenceName && (
                <div>
                  <p className="text-xs text-muted-foreground truncate">{styleReferenceName}</p>
                </div>
              )}
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
            <li>Upload your architectural render</li>
            <li>Choose effect type and intensity</li>
            <li>Apply creative effects with AI</li>
            <li>Download your stylized render</li>
          </ol>
        </CardContent>
      </Card>
      
      <StyleReferenceDialog
        open={styleDialogOpen}
        onOpenChange={setStyleDialogOpen}
        onSelect={(file, styleName) => {
          setStyleReferenceImage(file);
          setStyleReferenceName(styleName || null);
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setStyleReferencePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
          } else {
            setStyleReferencePreview(null);
          }
        }}
        toolId={tool.id}
        currentImage={styleReferenceImage}
        currentPreview={styleReferencePreview}
      />
    </BaseToolComponent>
  );
}
