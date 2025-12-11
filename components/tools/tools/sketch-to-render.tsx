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
  const [style, setStyle] = useState<'preserve-original' | 'enhance-realism' | 'concept' | 'render-sketch-outline'>('enhance-realism');
  const [lighting, setLighting] = useState<'none' | 'early-morning' | 'midday' | 'sunset' | 'indoor-dramatic' | 'studio' | 'indoor-soft' | 'overcast'>('none');
  const [focalLength, setFocalLength] = useState<'wide-shot' | 'detail-shot' | 'mid-shot'>('wide-shot');
  const [cameraAngle, setCameraAngle] = useState<'eye-level' | 'aerial' | 'low-angle' | 'close-up'>('eye-level');
  const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
  const [styleReferenceName, setStyleReferenceName] = useState<string | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    // Style configurations
    const styleConfigs = {
      'preserve-original': {
        role: 'expert architectural visualizer specializing in sketch-to-render conversion while preserving artistic style',
        task: 'Transform this architectural sketch into a photorealistic render while carefully preserving the original sketch style, line quality, and artistic character',
        approach: 'Maintain the sketchy, hand-drawn aesthetic while adding realistic materials, lighting, and depth. Preserve visible sketch lines, hatching, and artistic marks as design elements integrated into the photorealistic render',
        focus: 'artistic preservation, style integration, maintaining sketch character in photorealistic context',
        description: 'preserve original sketch style while adding realistic elements'
      },
      'enhance-realism': {
        role: 'expert architectural visualizer specializing in enhancing sketches with realistic details',
        task: 'Transform this architectural sketch into a photorealistic render that enhances the original design with realistic materials, lighting, and environmental context while maintaining design intent',
        approach: 'Interpret the sketch lines and forms, then enhance with photorealistic materials, proper lighting, shadows, and environmental context. Maintain the original proportions and design intent while adding realistic architectural details',
        focus: 'realistic enhancement, design intent preservation, photorealistic material application',
        description: 'enhance realism while maintaining design intent'
      },
      'concept': {
        role: 'expert architectural visualizer specializing in conceptual sketch visualization',
        task: 'Transform this architectural sketch into a conceptual architectural visualization that highlights design intent and key elements',
        approach: 'Create a conceptual visualization that emphasizes design intent, key architectural elements, and spatial relationships while maintaining the sketch\'s conceptual character',
        focus: 'conceptual visualization, design intent emphasis, key element highlighting',
        description: 'conceptual visualization emphasizing design intent'
      },
      'render-sketch-outline': {
        role: 'expert architectural visualizer specializing in hybrid sketch-render visualization',
        task: 'Transform this architectural sketch into a photorealistic render while maintaining visible sketch outline and line work over the realistic rendering',
        approach: 'Create a photorealistic architectural render with realistic materials, lighting, and details, while preserving and overlaying the original sketch outline and line work as visible design elements',
        focus: 'hybrid visualization, sketch outline preservation, realistic rendering with visible sketch lines',
        description: 'photorealistic render with visible sketch outline overlay'
      }
    };

    const lightingConfigs: Record<string, { description: string; characteristics: string; mood: string }> = {
      'none': {
        description: 'neutral lighting that best showcases the architectural design',
        characteristics: 'neutral illumination, balanced exposure, focus on architectural form',
        mood: 'clean, professional, architectural focus'
      },
      'early-morning': {
        description: 'early morning lighting with soft, warm golden hour tones',
        characteristics: 'soft warm light, golden hour tones, gentle shadows, morning ambiance, warm color temperature',
        mood: 'peaceful, serene, morning architectural atmosphere'
      },
      'midday': {
        description: 'midday lighting with bright, direct sunlight and clear shadows',
        characteristics: 'bright direct sunlight, clear sharp shadows, high contrast, midday sun position, natural daylight',
        mood: 'bright, clear, vibrant architectural presentation'
      },
      'sunset': {
        description: 'sunset lighting with warm golden and orange tones, dramatic atmosphere',
        characteristics: 'warm golden and orange tones, dramatic color temperature, long shadows, sunset ambiance, atmospheric glow',
        mood: 'dramatic, warm, cinematic architectural visualization'
      },
      'indoor-dramatic': {
        description: 'indoor dramatic lighting with strong contrasts and highlighted elements',
        characteristics: 'strong directional light, deep shadows, high contrast, dramatic highlights, cinematic indoor quality',
        mood: 'dramatic, impactful, visually striking indoor architectural visualization'
      },
      'studio': {
        description: 'professional studio lighting with controlled illumination and balanced exposure',
        characteristics: 'controlled light sources, balanced exposure, professional lighting setup, even illumination, product photography quality',
        mood: 'professional, clean, polished architectural presentation'
      },
      'indoor-soft': {
        description: 'indoor soft lighting with gentle, diffused illumination',
        characteristics: 'soft diffused light, gentle shadows, even illumination, comfortable indoor ambiance, warm atmosphere',
        mood: 'gentle, welcoming, comfortable indoor architectural atmosphere'
      },
      'overcast': {
        description: 'overcast lighting with soft, diffused natural light',
        characteristics: 'diffused natural light, soft even shadows, muted sky, cool color temperature, overcast conditions',
        mood: 'calm, soft, diffused architectural presentation'
      }
    };

    const cameraConfigs = {
      'eye-level': {
        description: 'eye-level perspective at human height (approximately 1.6-1.8m)',
        perspective: 'human-scale perspective, natural viewing angle, relatable scale',
        composition: 'natural human perspective, engaging composition, relatable scale'
      },
      'aerial': {
        description: 'aerial or bird\'s-eye view from above showing overall form and context',
        perspective: 'elevated viewpoint, overall form visibility, context relationship',
        composition: 'comprehensive view, form and context, site relationship'
      },
      'low-angle': {
        description: 'low-angle perspective looking up, emphasizing height and monumentality',
        perspective: 'upward-looking angle, height emphasis, monumental quality',
        composition: 'dramatic height, powerful presence, monumental composition'
      },
      'close-up': {
        description: 'close-up view focusing on architectural details and material qualities',
        perspective: 'intimate detail view, material focus, texture emphasis',
        composition: 'detail-focused, material quality, texture and craftsmanship'
      }
    };

    const focalLengthConfigs = {
      'wide-shot': {
        description: 'wide shot camera perspective showing the full architectural form',
        perspective: 'wide field of view, full form visibility, comprehensive coverage'
      },
      'detail-shot': {
        description: 'detail shot camera perspective focusing on specific architectural elements',
        perspective: 'narrow field of view, detail focus, intimate framing, close-up perspective'
      },
      'mid-shot': {
        description: 'mid shot camera perspective with balanced framing',
        perspective: 'medium field of view, balanced framing, moderate coverage'
      }
    };

    const styleConfig = styleConfigs[style];
    const lightingConfig = lightingConfigs[lighting] || lightingConfigs['none'];
    const cameraConfig = cameraConfigs[cameraAngle] || cameraConfigs['eye-level'];
    const focalConfig = focalLengthConfigs[focalLength] || focalLengthConfigs['wide-shot'];

    // Style reference instruction
    const styleReferenceInstruction = styleReferenceImage || styleReferenceName
      ? ' IMPORTANT: A style reference image has been provided showing the desired rendering style. Match the lighting quality, color grading, material rendering, post-processing style, overall visual aesthetic, and rendering approach from the style reference image. The style reference shows the exact rendering style you want - replicate its visual characteristics, lighting mood, color palette, material quality, and overall rendering aesthetic while maintaining design intent.'
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an ${styleConfig.role}.
</role>

<task>
${styleConfig.task}. Use ${focalConfig.description} (${focalConfig.perspective}) for camera perspective and ${cameraConfig.description} (${cameraConfig.perspective}) for viewing angle. Apply ${lightingConfig.description} (${lightingConfig.characteristics}) for lighting conditions. The input may show any architectural sketch: hand-drawn sketches, digital sketches, conceptual drawings, design studies, or technical sketches. Create a render that accurately represents the architectural design shown in the sketch with ${styleConfig.description}.
</task>

<constraints>
1. Output format: Generate a single architectural render image
2. Style: ${style} - ${styleConfig.description}
3. Style approach: ${styleConfig.approach}
4. Focal length: ${focalLength} - ${focalConfig.description} with ${focalConfig.perspective}
5. Camera angle: ${cameraAngle} - ${cameraConfig.description} with ${cameraConfig.perspective}
6. Lighting: ${lighting} - ${lightingConfig.description} with ${lightingConfig.characteristics} creating ${lightingConfig.mood}
7. Design preservation: Maintain the original sketch proportions, spatial relationships, and design intent
8. Material realism: Apply realistic architectural materials (concrete, glass, metal, wood, etc.) appropriate to the design
9. Architectural accuracy: Ensure all architectural elements are properly represented with correct proportions and relationships
10. Focus: ${styleConfig.focus}${styleReferenceInstruction}
11. Do not: Distort proportions, add elements not present in the sketch, or create unrealistic architectural elements
</constraints>

<output_requirements>
- Render type: Architectural render
- Style: ${style} - ${styleConfig.description}
- Focal length: ${focalLength} - ${focalConfig.description}
- Camera angle: ${cameraAngle} - ${cameraConfig.description}
- Lighting: ${lighting} - ${lightingConfig.description} - ${lightingConfig.mood}
- Material quality: Realistic architectural materials with proper textures, reflections, and surface properties
- Professional quality: Suitable for client presentations, design development, and architectural visualization
- Design accuracy: Maintain original sketch proportions and spatial relationships
</output_requirements>

<context>
Transform the architectural sketch into an architectural render following ${styleConfig.approach}. Work with any architectural sketch style, from quick conceptual drawings to detailed technical sketches. Use ${focalConfig.description} (${focalConfig.perspective}) for the focal length perspective and ${cameraConfig.description} (${cameraConfig.perspective}) for the camera viewing angle. Apply ${lightingConfig.description} with ${lightingConfig.characteristics} to create ${lightingConfig.mood}. The render must accurately represent the design while ${style === 'preserve-original' ? 'preserving the artistic sketch character' : style === 'enhance-realism' ? 'enhancing with realistic details' : style === 'concept' ? 'emphasizing design intent and key elements' : 'maintaining visible sketch outline over realistic rendering'} to create a convincing architectural visualization.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('style', style);
    formData.append('lighting', lighting);
    formData.append('focalLength', focalLength);
    formData.append('cameraAngle', cameraAngle);
    
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
          <div className="space-y-4">
            {/* Row 1: Style Preservation | Environment */}
            <div className="grid grid-cols-2 gap-4">
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
                  <SelectTrigger id="detail-level" className="h-10 w-full">
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
                  <SelectTrigger id="environment" className="h-10 w-full">
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

