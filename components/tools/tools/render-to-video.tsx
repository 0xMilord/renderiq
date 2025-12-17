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

interface RenderToVideoProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function RenderToVideo({ tool, projectId, onHintChange, hintMessage }: RenderToVideoProps) {
  const [cameraPathStyle, setCameraPathStyle] = useState<'zoom' | 'pan' | 'orbit' | 'fly-through' | 'arc'>('pan');
  const [focalLength, setFocalLength] = useState<'as-per-render' | 'long' | 'mid' | 'short'>('as-per-render');
  const [sceneType, setSceneType] = useState<'interior' | 'exterior'>('interior');
  const [lightingReferenceImage, setLightingReferenceImage] = useState<File | null>(null);
  const [lightingReferencePreview, setLightingReferencePreview] = useState<string | null>(null);
  const [lightingReferenceName, setLightingReferenceName] = useState<string | null>(null);
  const [lightingDialogOpen, setLightingDialogOpen] = useState(false);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const cameraPathConfigs = {
      'zoom': {
        description: 'zoom camera movement with smooth zoom in or out',
        characteristics: 'smooth zoom motion, progressive framing change, focus transition, zoom effect'
      },
      'pan': {
        description: 'pan camera movement with horizontal or vertical panning',
        characteristics: 'smooth panning motion, lateral movement, scanning effect, directional pan'
      },
      'orbit': {
        description: 'orbit camera movement circling around the subject',
        characteristics: 'circular motion around subject, 360-degree view, rotational movement, orbiting path'
      },
      'fly-through': {
        description: 'fly-through camera movement moving through the space',
        characteristics: 'forward movement through space, immersive navigation, path traversal, spatial journey'
      },
      'arc': {
        description: 'arc camera movement with curved path',
        characteristics: 'curved motion path, elegant trajectory, smooth arc movement, graceful transition'
      }
    };

    const focalLengthConfigs = {
      'as-per-render': {
        description: 'maintain focal length as per the original render',
        perspective: 'preserve original render perspective, maintain render focal length'
      },
      'long': {
        description: 'long focal length with compressed perspective',
        perspective: 'compressed perspective, narrow field of view, telephoto effect, flattened depth'
      },
      'mid': {
        description: 'mid focal length with balanced perspective',
        perspective: 'balanced perspective, moderate field of view, natural framing, standard focal length'
      },
      'short': {
        description: 'short focal length with wide perspective',
        perspective: 'wide perspective, expanded field of view, wide-angle effect, enhanced depth perception'
      }
    };

    const sceneTypeConfigs = {
      'interior': {
        description: 'interior scene characteristics with indoor environment',
        characteristics: 'indoor lighting, interior space context, room environment, indoor atmosphere'
      },
      'exterior': {
        description: 'exterior scene characteristics with outdoor environment',
        characteristics: 'outdoor lighting, exterior space context, outdoor environment, exterior atmosphere'
      }
    };

    const cameraPathConfig = cameraPathConfigs[cameraPathStyle];
    const focalConfig = focalLengthConfigs[focalLength];
    const sceneConfig = sceneTypeConfigs[sceneType];

    // Lighting reference instruction
    const lightingReferenceInstruction = lightingReferenceImage || lightingReferenceName
      ? ' IMPORTANT: A lighting and mood reference image has been provided. Match the lighting quality, color temperature, ambiance, mood, and lighting atmosphere from the reference image. The reference shows the exact lighting and mood you want - replicate its visual characteristics, lighting mood, color palette, and overall atmosphere for the video animation.'
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural video animator specializing in creating smooth, cinematic video animations from architectural renders.
</role>

<task>
Animate this architectural render with ${cameraPathConfig.description} camera movement, using ${focalLength === 'as-per-render' ? 'focal length as per the original render' : focalConfig.description} (${focalConfig.perspective}), applying ${sceneType} scene characteristics (${sceneConfig.description} with ${sceneConfig.characteristics})${lightingReferenceInstruction ? `, and matching lighting and mood from the reference image` : ''}, to create a professional walkthrough video.
</task>

<constraints>
1. Output format: Generate a smooth, cinematic video animation
2. Camera path style: ${cameraPathStyle} - ${cameraPathConfig.description}
3. Camera movement: ${cameraPathConfig.characteristics}
4. Focal length: ${focalLength} - ${focalConfig.description} with ${focalConfig.perspective}
5. Scene type: ${sceneType} - ${sceneConfig.description} with ${sceneConfig.characteristics}
6. Video quality: Smooth motion, consistent frame rate, professional cinematic quality
7. Lighting consistency: Maintain consistent lighting throughout the animation${lightingReferenceInstruction}
8. Motion smoothness: Create fluid, natural camera movement without jarring transitions
9. Spatial accuracy: Maintain architectural proportions and spatial relationships throughout the animation
10. Professional quality: Suitable for client presentations, marketing videos, and architectural visualization
11. Do not: Create unrealistic movements, break spatial continuity, or create jarring transitions
</constraints>

<output_requirements>
- Camera path: ${cameraPathStyle} - ${cameraPathConfig.description}
- Focal length: ${focalLength} - ${focalConfig.description}
- Scene type: ${sceneType} - ${sceneConfig.description}
- Lighting reference: ${lightingReferenceImage ? 'Match from reference image' : 'Not used'}
- Video quality: Smooth, cinematic, professional
- Motion: Fluid, natural camera movement
- Professional quality: Suitable for presentations and marketing
</output_requirements>

<context>
Animate this architectural render with ${cameraPathConfig.description} camera movement showing ${cameraPathConfig.characteristics}. Use ${focalLength === 'as-per-render' ? 'focal length as per the original render' : focalConfig.description} (${focalConfig.perspective}) for the camera perspective. Apply ${sceneType} scene characteristics with ${sceneConfig.description} showing ${sceneConfig.characteristics}${lightingReferenceInstruction}. Create smooth, fluid camera movement throughout the animation. Maintain consistent lighting and spatial relationships. Ensure professional cinematic quality with natural motion and seamless transitions. Create a professional architectural walkthrough video suitable for client presentations, marketing videos, and architectural visualization.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    formData.set('prompt', buildSystemPrompt());
    formData.append('cameraPathStyle', cameraPathStyle);
    formData.append('focalLength', focalLength);
    formData.append('sceneType', sceneType);
    
    // Add lighting reference if provided
    if (lightingReferenceImage) {
      formData.append('lightingReference', 'custom');
      const lightingImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(lightingReferenceImage);
      });
      formData.append('lightingReferenceImageData', lightingImageBase64);
      formData.append('lightingReferenceImageType', lightingReferenceImage.type);
    } else if (lightingReferenceName) {
      formData.append('lightingReference', 'library');
      formData.append('lightingReferenceName', lightingReferenceName);
    }
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate video');
    }
    
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
      multipleImages={false}
      maxImages={1}
      customSettings={
        <>
          <div className="space-y-4">
            {/* Row 1: Camera Path Style | Scene Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="camera-path-style" className="text-sm">Camera Path Style</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose the camera movement style. Zoom: zoom in/out. Pan: horizontal/vertical movement. Orbit: circular around subject. Fly-through: moving through space. Arc: curved path.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={cameraPathStyle} onValueChange={(v: any) => setCameraPathStyle(v)}>
                  <SelectTrigger id="camera-path-style" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="pan">Pan</SelectItem>
                    <SelectItem value="orbit">Orbit</SelectItem>
                    <SelectItem value="fly-through">Fly-through</SelectItem>
                    <SelectItem value="arc">Arc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="scene-type" className="text-sm">Interior/Exterior</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Select the scene type. Interior: indoor environment. Exterior: outdoor environment.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={sceneType} onValueChange={(v: any) => setSceneType(v)}>
                  <SelectTrigger id="scene-type" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interior">Interior</SelectItem>
                    <SelectItem value="exterior">Exterior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Focal Length (select, full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="focal-length" className="text-sm">Focal Length</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the focal length perspective. As per render: maintain original. Long: compressed perspective. Mid: balanced. Short: wide perspective.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={focalLength} onValueChange={(v: any) => setFocalLength(v)}>
                <SelectTrigger id="focal-length" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="as-per-render">As per Render</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 3: Lighting & Mood Reference Upload (full width) */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Lighting & Mood Reference Upload</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Upload a reference image to match the lighting quality, color temperature, ambiance, and mood for the video animation.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className="relative w-full h-[132px] border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center group"
                onClick={() => setLightingDialogOpen(true)}
                style={{
                  borderColor: lightingReferencePreview ? 'transparent' : undefined,
                }}
              >
                {lightingReferencePreview ? (
                  <>
                    <img
                      src={lightingReferencePreview}
                      alt="Lighting reference"
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
              {lightingReferenceName && (
                <div>
                  <p className="text-xs text-muted-foreground truncate">{lightingReferenceName}</p>
                </div>
              )}
            </div>
          </div>
        </>
      }
    >
      <StyleReferenceDialog
        open={lightingDialogOpen}
        onOpenChange={setLightingDialogOpen}
        onSelect={(file, styleName) => {
          setLightingReferenceImage(file);
          setLightingReferenceName(styleName || null);
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setLightingReferencePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
          } else {
            setLightingReferencePreview(null);
          }
        }}
        toolId={tool.id}
        currentImage={lightingReferenceImage}
        currentPreview={lightingReferencePreview}
      />
    </BaseToolComponent>
  );
}


