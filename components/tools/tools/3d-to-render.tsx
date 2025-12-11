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
import { StyleReferenceDialog } from '@/components/ui/style-reference-dialog';
import { LabeledToggle } from '../ui/labeled-toggle';

interface ThreeDToRenderProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function ThreeDToRender({ tool, projectId, onHintChange, hintMessage }: ThreeDToRenderProps) {
  const [lighting, setLighting] = useState<'none' | 'early-morning' | 'midday' | 'sunset' | 'indoor-dramatic' | 'studio' | 'indoor-soft' | 'overcast'>('none');
  const [environment, setEnvironment] = useState<'indoor' | 'outdoor-urban' | 'outdoor-natural' | 'white-studio'>('indoor');
  const [cameraAngle, setCameraAngle] = useState<string>('eye-level');
  const [focalLength, setFocalLength] = useState<'wide-shot' | 'detail-shot' | 'mid-shot'>('wide-shot');
  const [depthOfField, setDepthOfField] = useState<boolean>(false);
  const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
  const [styleReferenceName, setStyleReferenceName] = useState<string | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const lightingConfigs: Record<string, { description: string; characteristics: string; mood: string }> = {
      'natural': {
        description: 'natural daylight with realistic sun position, soft shadows, and ambient light',
        characteristics: 'realistic sun position, natural shadow direction, soft ambient fill light, realistic color temperature',
        mood: 'authentic, realistic, natural architectural presentation'
      },
      'dramatic': {
        description: 'dramatic lighting with strong contrasts, deep shadows, and highlighted focal points',
        characteristics: 'strong directional light, deep shadows, high contrast, dramatic highlights, cinematic quality',
        mood: 'dramatic, impactful, visually striking architectural visualization'
      },
      'soft': {
        description: 'soft, diffused lighting with gentle shadows and even illumination',
        characteristics: 'diffused light sources, soft shadows, even illumination, gentle highlights, low contrast',
        mood: 'gentle, welcoming, comfortable architectural atmosphere'
      },
      'studio': {
        description: 'professional studio lighting with controlled illumination and balanced exposure',
        characteristics: 'controlled light sources, balanced exposure, professional lighting setup, even illumination, product photography quality',
        mood: 'professional, clean, polished architectural presentation'
      }
    };

    const environmentConfigs: Record<string, { description: string; elements: string; atmosphere: string }> = {
      'none': {
        description: 'neutral environment focusing on the architecture',
        elements: 'minimal environmental context, focus on architectural form',
        atmosphere: 'clean, professional, architectural focus'
      },
      'urban': {
        description: 'urban environment with city context, streets, and urban elements',
        elements: 'city streets, urban context, surrounding buildings, urban landscape, city atmosphere',
        atmosphere: 'urban, contemporary, city context'
      },
      'natural': {
        description: 'natural environment with landscape, vegetation, and natural elements',
        elements: 'landscape, vegetation, trees, natural terrain, natural surroundings',
        atmosphere: 'natural, organic, landscape integration'
      },
      'minimal': {
        description: 'minimal environment with clean surroundings and simple context',
        elements: 'clean surroundings, simple context, minimal distractions, architectural focus',
        atmosphere: 'minimal, clean, architectural emphasis'
      }
    };

    const cameraConfigs: Record<string, { description: string; perspective: string; composition: string }> = {
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

    const lightingConfig = lightingConfigs[lighting] || lightingConfigs['none'];
    const envConfig = environmentConfigs[environment] || environmentConfigs['indoor'];
    const cameraConfig = cameraConfigs[cameraAngle] || cameraConfigs['eye-level'];
    const focalConfig = focalLengthConfigs[focalLength] || focalLengthConfigs['wide-shot'];

    // Style reference instruction
    const styleReferenceInstruction = styleReferenceImage || styleReferenceName
      ? ' IMPORTANT: A style reference image has been provided showing the desired rendering style. Match the lighting quality, color grading, material rendering, post-processing style, overall visual aesthetic, and rendering approach from the style reference image. The style reference shows the exact rendering style you want - replicate its visual characteristics, lighting mood, color palette, material quality, and overall rendering aesthetic while maintaining architectural accuracy.'
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural visualizer specializing in transforming 3D model screenshots into photorealistic architectural renders.
</role>

<task>
Transform this 3D model screenshot into a photorealistic architectural render with realistic materials, ${lightingConfig.description}, ${envConfig.description}, ${focalConfig.description} (${focalConfig.perspective}), and ${cameraConfig.description}${depthOfField ? ' with cinematic depth of field and selective focus' : ' with sharp focus throughout'}, suitable for professional presentation.
</task>

<constraints>
1. Output format: Generate a single photorealistic architectural render image
2. Lighting: ${lightingConfig.description} - ${lightingConfig.characteristics}
3. Environment: ${envConfig.description} - ${envConfig.elements}
4. Focal length: ${focalLength} - ${focalConfig.description} with ${focalConfig.perspective}
5. Camera angle: ${cameraConfig.description} - ${cameraConfig.perspective}
6. Depth of field: ${depthOfField ? 'Apply cinematic depth of field with selective focus and background blur' : 'Use sharp focus throughout the entire image'}
7. Material realism: Apply realistic architectural materials (concrete, glass, metal, wood, etc.) with proper textures, reflections, and surface properties
8. Lighting quality: ${lightingConfig.characteristics} creating ${lightingConfig.mood}
9. Environmental integration: ${envConfig.elements} creating ${envConfig.atmosphere}
10. Composition: ${cameraConfig.composition}
11. Architectural accuracy: Maintain all 3D model proportions, spatial relationships, and design elements
12. Photorealistic quality: Achieve professional architectural visualization quality suitable for client presentations and marketing materials${styleReferenceInstruction}
11. Do not: Distort proportions, alter the architectural design, or create unrealistic elements
</constraints>

<output_requirements>
- Render type: Photorealistic architectural render
- Lighting: ${lightingConfig.description} - ${lightingConfig.mood}
- Environment: ${envConfig.description} - ${envConfig.atmosphere}
- Focal length: ${focalLength} - ${focalConfig.description}
- Camera: ${cameraConfig.description} - ${cameraConfig.composition}
- Depth of field: ${depthOfField ? 'Cinematic selective focus' : 'Sharp throughout'}
- Material quality: Realistic architectural materials with proper textures and surface properties
- Professional quality: Suitable for client presentations, design development, and architectural visualization
- Design accuracy: Maintain all original 3D model proportions and spatial relationships
</output_requirements>

<context>
Transform this 3D model screenshot into a photorealistic architectural render. Apply ${lightingConfig.description} with ${lightingConfig.characteristics} to create ${lightingConfig.mood}. Integrate ${envConfig.description} with ${envConfig.elements} to create ${envConfig.atmosphere}. Use ${focalConfig.description} (${focalConfig.perspective}) for the focal length perspective. Use ${cameraConfig.description} with ${cameraConfig.perspective} for ${cameraConfig.composition}. ${depthOfField ? 'Apply cinematic depth of field with selective focus, creating background blur while keeping the architectural subject sharp' : 'Use sharp focus throughout the entire image for maximum detail and clarity'}. Apply realistic architectural materials with proper textures, reflections, and surface properties. Maintain all architectural proportions and design elements from the 3D model while achieving professional photorealistic quality.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('lighting', lighting);
    formData.append('environment', environment);
    formData.append('cameraAngle', cameraAngle);
    formData.append('focalLength', focalLength);
    formData.append('depthOfField', depthOfField.toString());
    
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
            {/* Row 1: Lighting Style | Environment */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="lighting-style" className="text-sm">Lighting Style</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the lighting style. None: neutral. Early Morning/Midday/Sunset: natural. Indoor Dramatic/Soft: indoor lighting. Studio: professional. Overcast: diffused natural.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={lighting} onValueChange={(v: any) => setLighting(v)}>
                  <SelectTrigger id="lighting-style" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="early-morning">Early Morning</SelectItem>
                  <SelectItem value="midday">Midday</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="indoor-dramatic">Indoor Dramatic</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="indoor-soft">Indoor Soft</SelectItem>
                  <SelectItem value="overcast">Overcast</SelectItem>
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
                    <p className="max-w-xs">Select the environmental context. Indoor: interior space. Outdoor - Urban: city context. Outdoor Natural: landscape. White Studio: clean studio backdrop.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger id="environment" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor-urban">Outdoor - Urban</SelectItem>
                  <SelectItem value="outdoor-natural">Outdoor Natural</SelectItem>
                  <SelectItem value="white-studio">White Studio</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>

            {/* Row 2: Focal Length | Depth of Field (toggle) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="focal-length" className="text-sm">Focal Length</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose the camera perspective. Wide shot: full form. Detail shot: focused elements. Mid shot: balanced framing.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={focalLength} onValueChange={(v: any) => setFocalLength(v)}>
                  <SelectTrigger id="focal-length" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wide-shot">Wide Shot</SelectItem>
                    <SelectItem value="detail-shot">Detail Shot</SelectItem>
                    <SelectItem value="mid-shot">Mid Shot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <LabeledToggle
                  label="Depth of Field"
                  checked={depthOfField}
                  onCheckedChange={setDepthOfField}
                  tooltip="When enabled, applies cinematic depth of field with selective focus and background blur. When disabled, uses sharp focus throughout."
                  id="depth-of-field"
                />
              </div>
            </div>

            {/* Row 3: Camera Angle (full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="camera-angle" className="text-sm">Camera Angle</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the viewing perspective. Eye Level: human-scale. Aerial: from above. Low Angle: looking up. Close-up: detail focus.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={cameraAngle} onValueChange={setCameraAngle}>
                <SelectTrigger id="camera-angle" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eye-level">Eye Level</SelectItem>
                  <SelectItem value="aerial">Aerial</SelectItem>
                  <SelectItem value="low-angle">Low Angle</SelectItem>
                  <SelectItem value="close-up">Close Up</SelectItem>
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
            <li>Upload 3D model screenshot</li>
            <li>Configure lighting and environment</li>
            <li>Choose camera angle</li>
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
