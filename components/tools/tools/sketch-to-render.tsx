'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Image as ImageIcon } from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';
import { TOOL_CONTENT } from '@/lib/tools/tool-content';
import { StyleReferenceDialog } from '@/components/ui/style-reference-dialog';

interface SketchToRenderProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function SketchToRender({ tool, projectId, onHintChange, hintMessage }: SketchToRenderProps) {
  const [detailLevel, setDetailLevel] = useState<'preserve' | 'enhance' | 'transform'>('enhance');
  const [environment, setEnvironment] = useState<string>('none');
  const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
  const [styleReferenceName, setStyleReferenceName] = useState<string | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    // Style preservation configurations
    const styleConfigs = {
      'preserve': {
        role: 'expert architectural visualizer specializing in sketch-to-render conversion while preserving artistic style',
        task: 'Transform this architectural sketch into a photorealistic render while carefully preserving the original sketch style, line quality, and artistic character',
        approach: 'Maintain the sketchy, hand-drawn aesthetic while adding realistic materials, lighting, and depth. Preserve visible sketch lines, hatching, and artistic marks as design elements integrated into the photorealistic render',
        focus: 'artistic preservation, style integration, maintaining sketch character in photorealistic context'
      },
      'enhance': {
        role: 'expert architectural visualizer specializing in enhancing sketches with realistic details',
        task: 'Transform this architectural sketch into a photorealistic render that enhances the original design with realistic materials, lighting, and environmental context while maintaining design intent',
        approach: 'Interpret the sketch lines and forms, then enhance with photorealistic materials, proper lighting, shadows, and environmental context. Maintain the original proportions and design intent while adding realistic architectural details',
        focus: 'realistic enhancement, design intent preservation, photorealistic material application'
      },
      'transform': {
        role: 'expert architectural visualizer specializing in complete sketch-to-photorealistic transformation',
        task: 'Transform this architectural sketch into a fully photorealistic architectural render with complete material realism, lighting, and environmental integration',
        approach: 'Fully interpret and transform the sketch into a photorealistic architectural render. Add complete material realism, proper architectural lighting, environmental context, and all photorealistic details while maintaining the original design proportions and spatial relationships',
        focus: 'complete photorealistic transformation, full material realism, architectural accuracy'
      }
    };

    const styleConfig = styleConfigs[detailLevel];

    // Style reference instruction
    const styleReferenceInstruction = styleReferenceImage || styleReferenceName
      ? ' IMPORTANT: A style reference image has been provided showing the desired rendering style. Match the lighting quality, color grading, material rendering, post-processing style, overall visual aesthetic, and rendering approach from the style reference image. The style reference shows the exact rendering style you want - replicate its visual characteristics, lighting mood, color palette, material quality, and overall rendering aesthetic while maintaining design intent.'
      : '';

    // Environment configurations
    const environmentConfigs: Record<string, { lighting: string; atmosphere: string; details: string }> = {
      'none': {
        lighting: 'neutral architectural lighting that best showcases the design',
        atmosphere: 'clean, professional architectural presentation atmosphere',
        details: 'focus on the architecture without specific environmental context'
      },
      'sunny': {
        lighting: 'bright, natural daylight with strong directional sunlight creating clear shadows and highlights',
        atmosphere: 'clear, sunny day with blue sky and natural outdoor lighting',
        details: 'sunlight patterns, cast shadows, bright highlights, clear sky, natural outdoor ambiance'
      },
      'overcast': {
        lighting: 'soft, diffused natural light with even illumination and gentle shadows',
        atmosphere: 'overcast day with soft, even lighting and muted sky',
        details: 'soft shadows, even illumination, muted sky tones, diffused natural light'
      },
      'sunset': {
        lighting: 'warm, golden hour lighting with dramatic color temperature and long shadows',
        atmosphere: 'sunset atmosphere with warm golden and orange tones, dramatic sky',
        details: 'warm color temperature, golden highlights, long dramatic shadows, sunset sky colors, atmospheric glow'
      },
      'night': {
        lighting: 'artificial and ambient lighting with dramatic contrast and illuminated elements',
        atmosphere: 'nighttime atmosphere with artificial lighting, dark sky, and illuminated architecture',
        details: 'artificial lighting, illuminated windows, dramatic contrast, dark sky, nighttime ambiance, light spill'
      }
    };

    const envConfig = environmentConfigs[environment] || environmentConfigs['none'];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an ${styleConfig.role}.
</role>

<task>
${styleConfig.task}. The input may show any architectural sketch: hand-drawn sketches, digital sketches, conceptual drawings, design studies, or technical sketches. Create a photorealistic render that accurately represents the architectural design shown in the sketch.
</task>

<constraints>
1. Output format: Generate a single photorealistic architectural render image
2. Style approach: ${styleConfig.approach}
3. Environment: ${envConfig.atmosphere}
4. Lighting: ${envConfig.lighting}
5. Environmental details: ${envConfig.details}
6. Design preservation: Maintain the original sketch proportions, spatial relationships, and design intent
7. Material realism: Apply realistic architectural materials (concrete, glass, metal, wood, etc.) appropriate to the design
8. Architectural accuracy: Ensure all architectural elements are properly represented with correct proportions and relationships
9. Focus: ${styleConfig.focus}${styleReferenceInstruction}
10. Do not: Distort proportions, add elements not present in the sketch, or create unrealistic architectural elements
</constraints>

<output_requirements>
- Render type: Photorealistic architectural render
- Style: ${detailLevel === 'preserve' ? 'Preserve sketch style while adding realism' : detailLevel === 'enhance' ? 'Enhanced realism maintaining design intent' : 'Complete photorealistic transformation'}
- Environment: ${envConfig.atmosphere}
- Lighting: ${envConfig.lighting}
- Material quality: Realistic architectural materials with proper textures, reflections, and surface properties
- Professional quality: Suitable for client presentations, design development, and architectural visualization
- Design accuracy: Maintain original sketch proportions and spatial relationships
</output_requirements>

<context>
Transform the architectural sketch into a photorealistic render following ${styleConfig.approach}. Work with any architectural sketch style, from quick conceptual drawings to detailed technical sketches. The render must accurately represent the design while ${detailLevel === 'preserve' ? 'preserving the artistic sketch character' : detailLevel === 'enhance' ? 'enhancing with realistic details' : 'fully transforming into photorealistic quality'}.

Environment setting: ${envConfig.atmosphere}. Lighting: ${envConfig.lighting}. Include ${envConfig.details} to create a convincing architectural visualization.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('detailLevel', detailLevel);
    formData.append('environment', environment);
    
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
      throw new Error(result.error || 'Failed to generate render');
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
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="detail-level" className="text-sm">Style Preservation</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Preserve: Keep sketch style visible. Enhance: Add realism while maintaining design. Transform: Complete photorealistic conversion.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={detailLevel} onValueChange={(v: 'preserve' | 'enhance' | 'transform') => setDetailLevel(v)}>
                <SelectTrigger id="detail-level" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preserve">Preserve Original Style</SelectItem>
                  <SelectItem value="enhance">Enhance with Realism</SelectItem>
                  <SelectItem value="transform">Full Transformation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="environment" className="text-sm">Environment</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the environmental lighting and atmosphere for your render. None uses neutral architectural lighting.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger id="environment" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Neutral)</SelectItem>
                  <SelectItem value="sunny">Sunny Day</SelectItem>
                  <SelectItem value="overcast">Overcast</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Style Reference */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Style Reference</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Upload a rendering style reference image or choose from Renderiq's style library to match the exact lighting, color grading, material rendering, and visual aesthetic.</p>
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
            <li>Upload your architectural sketch</li>
            <li>Choose style preservation level</li>
            <li>Select environment (optional)</li>
            <li>Generate photorealistic render</li>
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

