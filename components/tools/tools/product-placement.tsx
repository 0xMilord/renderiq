'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';
import { RotationSlider } from '../ui/rotation-slider';

interface ProductPlacementProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function ProductPlacement({ tool, projectId, onHintChange, hintMessage }: ProductPlacementProps) {
  const [placementStyle, setPlacementStyle] = useState<'natural' | 'prominent' | 'subtle'>('natural');
  const [lightingMatch, setLightingMatch] = useState<boolean>(true);
  const [scaleAdjustment, setScaleAdjustment] = useState<'auto' | 'preserve' | 'fit'>('auto');
  const [rotation, setRotation] = useState<number>(0);
  const [quantity, setQuantity] = useState<'single' | 'multiple'>('single');

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const placementConfigs = {
      'natural': {
        description: 'natural placement that integrates seamlessly into the scene',
        characteristics: 'seamless integration, natural positioning, realistic placement, organic integration, contextually appropriate',
        approach: 'place the product naturally within the scene, making it appear as if it belongs there organically'
      },
      'prominent': {
        description: 'prominent placement that highlights the product as a focal point',
        characteristics: 'focal point positioning, prominent visibility, highlighted placement, attention-drawing, center-stage',
        approach: 'place the product prominently to make it a focal point, ensuring it draws attention while maintaining realism'
      },
      'subtle': {
        description: 'subtle placement that blends into the scene without dominating',
        characteristics: 'subtle integration, background presence, understated placement, harmonious blending, non-dominant',
        approach: 'place the product subtly within the scene, allowing it to blend harmoniously without dominating the composition'
      }
    };

    const scaleConfigs = {
      'auto': {
        description: 'automatically adjust scale to match scene context and perspective',
        approach: 'automatically determine appropriate scale based on scene context, perspective, and spatial relationships'
      },
      'preserve': {
        description: 'preserve original product scale from the product image',
        approach: 'maintain the original product scale from the product image, adjusting only for perspective'
      },
      'fit': {
        description: 'fit product scale to match similar items in the scene',
        approach: 'adjust product scale to match the scale of similar items or furniture in the scene'
      }
    };

    const placementConfig = placementConfigs[placementStyle];
    const scaleConfig = scaleConfigs[scaleAdjustment];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert product visualization specialist specializing in seamlessly placing products into interior scenes with photorealistic integration.
</role>

<task>
Place the specified product into this interior scene ${quantity === 'multiple' ? '(multiple instances)' : '(single instance)'} with proper scale, ${rotation !== 0 ? `rotated ${rotation}° from original orientation, ` : ''}${lightingMatch ? 'matching scene lighting' : 'maintaining product lighting'}, shadows, and perspective, making it appear naturally integrated into the space with ${placementConfig.description}.
</task>

<constraints>
1. Output format: Generate a single photorealistic interior render image with product placement
2. Placement style: ${placementStyle} - ${placementConfig.description}
3. Placement characteristics: ${placementConfig.characteristics}
4. Placement approach: ${placementConfig.approach}
5. Rotation: ${rotation !== 0 ? `Rotate product ${rotation}° from original orientation` : 'No rotation (0° - original orientation)'}
6. Quantity: ${quantity === 'multiple' ? 'Place multiple instances of the product throughout the scene' : 'Place single product instance'}
7. Scale adjustment: ${scaleAdjustment} - ${scaleConfig.description}
8. Scale approach: ${scaleConfig.approach}
9. Lighting integration: ${lightingMatch ? 'Match the product lighting to the scene lighting conditions, shadows, highlights, and light direction exactly' : 'Maintain the product\'s original lighting while ensuring it appears integrated into the scene'}
8. Shadow integration: Create realistic shadows cast by the product that match the scene's light sources and surface properties
9. Perspective matching: Ensure the product matches the scene's perspective, camera angle, and spatial relationships
10. Material integration: Ensure the product materials interact realistically with the scene lighting and environment
11. Professional quality: Suitable for product visualization, e-commerce, and marketing materials
12. Do not: Distort product proportions, create unrealistic shadows, or break perspective consistency
</constraints>

<output_requirements>
- Placement style: ${placementStyle} - ${placementConfig.description}
- Rotation: ${rotation}°
- Quantity: ${quantity === 'multiple' ? 'Multiple instances' : 'Single instance'}
- Scale: ${scaleAdjustment} - ${scaleConfig.description}
- Lighting: ${lightingMatch ? 'Match scene lighting' : 'Maintain product lighting'}
- Shadow integration: Realistic shadows matching scene light sources
- Perspective: Match scene perspective and camera angle
- Professional quality: Suitable for product visualization and marketing
- Integration: Seamless, photorealistic product integration
</output_requirements>

<context>
Place the specified product into this interior scene ${quantity === 'multiple' ? '- place multiple instances of the product throughout the scene' : '- place a single product instance'}. ${placementConfig.approach} to achieve ${placementConfig.description} with ${placementConfig.characteristics}. ${rotation !== 0 ? `Rotate the product ${rotation}° from its original orientation to achieve the desired placement angle. ` : ''}${scaleConfig.approach} for ${scaleConfig.description}. ${lightingMatch ? 'Match the product lighting to the scene lighting conditions, ensuring shadows, highlights, and light direction match exactly' : 'Maintain the product\'s original lighting while ensuring it appears naturally integrated'}. Create realistic shadows cast by the product that match the scene's light sources and surface properties. Ensure the product matches the scene's perspective, camera angle, and spatial relationships. Make the product materials interact realistically with the scene lighting and environment. Create a photorealistic interior render with seamlessly integrated product placement suitable for product visualization and marketing.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // For product placement, we need to handle multiple images
    // First image is the scene, second image is the product
    formData.set('prompt', buildSystemPrompt());
    formData.append('placementStyle', placementStyle);
    formData.append('lightingMatch', lightingMatch.toString());
    formData.append('scaleAdjustment', scaleAdjustment);
    formData.append('rotation', rotation.toString());
    formData.append('quantity', quantity);
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to place product');
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
      multipleImages={true}
      maxImages={2}
      customSettings={
        <>
          <div className="space-y-4">
            {/* Row 1: Placement Style | Scale Adjustment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="placement-style" className="text-sm">Placement Style</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose how the product is placed. Natural: seamless integration. Prominent: focal point. Subtle: background presence.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={placementStyle} onValueChange={(v: any) => setPlacementStyle(v)}>
                  <SelectTrigger id="placement-style" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="prominent">Prominent</SelectItem>
                    <SelectItem value="subtle">Subtle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="scale-adjustment" className="text-sm">Scale Adjustment</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Control product scale. Auto: match scene context. Preserve: keep original size. Fit: match similar items.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={scaleAdjustment} onValueChange={(v: any) => setScaleAdjustment(v)}>
                  <SelectTrigger id="scale-adjustment" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Match Context)</SelectItem>
                    <SelectItem value="preserve">Preserve Original</SelectItem>
                    <SelectItem value="fit">Fit to Scene</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Rotation (slider, full width) */}
            <div>
              <RotationSlider
                label="Rotation/Orientation"
                value={rotation}
                onValueChange={(values) => setRotation(values[0])}
                tooltip="Rotate the product to the desired orientation. Use this to adjust the product's angle for better placement."
              />
            </div>

            {/* Row 3: Quantity (select, full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="quantity" className="text-sm">Quantity</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose whether to place a single product or multiple instances of the product throughout the scene.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={quantity} onValueChange={(v: any) => setQuantity(v)}>
                <SelectTrigger id="quantity" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="multiple">Multiple</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 4: Match Scene Lighting (full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="lighting-match" className="text-sm">Match Scene Lighting</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">When enabled, product lighting matches the scene. When disabled, product maintains its original lighting.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={lightingMatch ? 'yes' : 'no'} onValueChange={(v) => setLightingMatch(v === 'yes')}>
                <SelectTrigger id="lighting-match" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes (Match Scene)</SelectItem>
                  <SelectItem value="no">No (Preserve Product)</SelectItem>
                </SelectContent>
              </Select>
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
            <li>Upload interior scene (first image) and product image (second image)</li>
            <li>Configure placement style and scale adjustment</li>
            <li>Choose lighting matching option</li>
            <li>Place product seamlessly into scene</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
