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
import { LabeledSlider } from '../ui/labeled-slider';
import { Input } from '@/components/ui/input';

interface ChangeTextureProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function ChangeTexture({ tool, projectId, onHintChange, hintMessage }: ChangeTextureProps) {
  const [materialType, setMaterialType] = useState<'wood' | 'stone' | 'metal' | 'fabric' | 'concrete' | 'marble' | 'tile' | 'plaster'>('wood');
  const [preserveLighting, setPreserveLighting] = useState<boolean>(true);
  const [textureIntensity, setTextureIntensity] = useState<'subtle' | 'medium' | 'strong'>('medium');
  const [textureScale, setTextureScale] = useState<number>(50); // 0-100 slider
  const [finishSpecification, setFinishSpecification] = useState<string>('');
  const [surface, setSurface] = useState<'floor' | 'wall' | 'ceiling' | 'countertop' | 'furniture'>('wall');
  const [glossLevel, setGlossLevel] = useState<'matte' | 'semi' | 'glossy'>('semi');
  const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
  const [styleReferenceName, setStyleReferenceName] = useState<string | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const materialConfigs = {
      'wood': {
        description: 'natural wood texture with grain patterns, knots, and natural wood characteristics',
        properties: 'wood grain patterns, natural knots, wood color variations, natural wood texture, realistic wood surface',
        types: 'hardwood, softwood, oak, walnut, pine, or other natural wood varieties'
      },
      'stone': {
        description: 'natural stone texture with stone patterns, variations, and natural stone characteristics',
        properties: 'stone patterns, natural variations, stone color variations, realistic stone texture, natural stone surface',
        types: 'granite, marble, limestone, slate, or other natural stone varieties'
      },
      'metal': {
        description: 'metal texture with metallic properties, reflections, and metal surface characteristics',
        properties: 'metallic reflections, metal surface properties, metal color variations, realistic metal texture, metallic finish',
        types: 'steel, aluminum, brass, copper, or other metal varieties'
      },
      'fabric': {
        description: 'fabric texture with textile patterns, weave, and fabric surface characteristics',
        properties: 'fabric weave patterns, textile texture, fabric color variations, realistic fabric surface, textile properties',
        types: 'cotton, linen, silk, wool, or other fabric varieties'
      },
      'concrete': {
        description: 'concrete texture with concrete patterns, aggregate, and concrete surface characteristics',
        properties: 'concrete aggregate patterns, concrete texture variations, realistic concrete surface, concrete finish',
        types: 'smooth concrete, exposed aggregate, textured concrete, or other concrete finishes'
      },
      'marble': {
        description: 'marble texture with marble veining, patterns, and natural marble characteristics',
        properties: 'marble veining patterns, natural marble variations, marble color variations, realistic marble texture, polished marble surface',
        types: 'carrara, calacatta, travertine, or other marble varieties'
      },
      'tile': {
        description: 'tile texture with tile patterns, grout lines, and tile surface characteristics',
        properties: 'tile patterns, grout lines, tile texture variations, realistic tile surface, tile finish',
        types: 'ceramic, porcelain, natural stone tile, or other tile varieties'
      },
      'plaster': {
        description: 'plaster texture with smooth or textured plaster surface characteristics',
        properties: 'plaster surface texture, smooth or textured finish, plaster color variations, realistic plaster surface',
        types: 'smooth plaster, textured plaster, venetian plaster, or other plaster finishes'
      }
    };

    const intensityConfigs = {
      'subtle': {
        description: 'subtle texture application maintaining original material feel with light texture overlay',
        application: 'lightly apply the texture while maintaining the original material characteristics and feel'
      },
      'medium': {
        description: 'balanced texture application with clear material change while preserving spatial relationships',
        application: 'apply the texture with balanced intensity, clearly showing the new material while preserving spatial relationships'
      },
      'strong': {
        description: 'strong texture application with full material transformation and prominent texture details',
        application: 'apply the texture with strong intensity, fully transforming to the new material with prominent texture details'
      }
    };

    const surfaceConfigs = {
      'floor': { description: 'floor surfaces', target: 'floor surfaces, flooring materials' },
      'wall': { description: 'wall surfaces', target: 'wall surfaces, wall materials' },
      'ceiling': { description: 'ceiling surfaces', target: 'ceiling surfaces, ceiling materials' },
      'countertop': { description: 'countertop surfaces', target: 'countertop surfaces, counter materials' },
      'furniture': { description: 'furniture surfaces', target: 'furniture surfaces, furniture materials' }
    };

    const glossLevelConfigs = {
      'matte': { description: 'matte finish with no shine', characteristics: 'no reflection, matte surface, non-reflective finish' },
      'semi': { description: 'semi-gloss finish with moderate shine', characteristics: 'moderate reflection, semi-gloss surface, subtle shine' },
      'glossy': { description: 'glossy finish with high shine', characteristics: 'high reflection, glossy surface, reflective finish' }
    };

    const textureScaleConfigs = {
      low: { description: 'small texture scale with fine detail', scale: 'fine texture detail, small pattern scale' },
      medium: { description: 'medium texture scale with balanced detail', scale: 'balanced texture detail, medium pattern scale' },
      high: { description: 'large texture scale with prominent detail', scale: 'prominent texture detail, large pattern scale' }
    };

    const materialConfig = materialConfigs[materialType];
    const intensityConfig = intensityConfigs[textureIntensity];
    const preserveLight = preserveLighting;
    const surfaceConfig = surfaceConfigs[surface];
    const glossLevelConfig = glossLevelConfigs[glossLevel];
    const textureScaleLevel = textureScale < 33 ? 'low' : textureScale < 67 ? 'medium' : 'high';
    const textureScaleConfig = textureScaleConfigs[textureScaleLevel];

    const finishSpecText = finishSpecification.trim()
      ? ` Focus specifically on: ${finishSpecification.trim()}.`
      : '';

    // Style reference instruction
    const styleReferenceInstruction = styleReferenceImage || styleReferenceName
      ? ' IMPORTANT: A style reference image has been provided showing the desired texture/material. Match the texture pattern, surface properties, color, grain/pattern characteristics, and overall material appearance from the style reference image. The style reference shows the exact texture/material you want - replicate its visual characteristics, texture quality, and material properties while maintaining spatial relationships.'
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural visualizer specializing in material and texture replacement in interior spaces while maintaining spatial accuracy.
</role>

<task>
Modify the textures and materials in this interior space, replacing existing ${surfaceConfig.target} with ${materialType} (${materialConfig.description}) while ${preserveLight ? 'maintaining' : 'adjusting'} lighting, proportions, and spatial relationships. Apply ${textureScaleConfig.description} (${textureScaleConfig.scale}) with ${glossLevelConfig.description} (${glossLevelConfig.characteristics}). ${intensityConfig.application} with photorealistic accuracy.${finishSpecText}
</task>

<constraints>
1. Output format: Generate a single photorealistic interior render image with modified textures
2. Surface target: ${surface} - ${surfaceConfig.description}
3. Material replacement: Replace existing ${surfaceConfig.target} with ${materialType} - ${materialConfig.description}
4. Material properties: Apply ${materialConfig.properties}
5. Material types: Use ${materialConfig.types} as appropriate
6. Texture scale: ${textureScale}% - ${textureScaleConfig.description} (${textureScaleConfig.scale})
7. Gloss level: ${glossLevel} - ${glossLevelConfig.description} (${glossLevelConfig.characteristics})
8. Texture intensity: ${textureIntensity} - ${intensityConfig.description}
9. Application: ${intensityConfig.application}
10. Finish specification: ${finishSpecification.trim() || 'Apply to all appropriate surfaces'}
11. Lighting preservation: ${preserveLight ? 'Maintain the original lighting conditions, shadows, highlights, and light interactions exactly as in the original render' : 'Adjust lighting to properly interact with the new material properties, ensuring realistic light-material interactions'}
12. Spatial relationships: Maintain all spatial relationships, proportions, and architectural elements exactly as in the original
13. Material accuracy: Apply photorealistic ${materialType} texture with ${glossLevelConfig.description} and proper surface properties, reflections, and material characteristics${styleReferenceInstruction}
14. Professional quality: Suitable for design visualization, material testing, and client presentations
15. Do not: Distort proportions, alter spatial relationships, or create unrealistic material applications
</constraints>

<output_requirements>
- Surface target: ${surface} - ${surfaceConfig.description}
- Material type: ${materialType} - ${materialConfig.description}
- Material properties: ${materialConfig.properties}
- Texture scale: ${textureScale}% - ${textureScaleConfig.description}
- Gloss level: ${glossLevel} - ${glossLevelConfig.description}
- Texture intensity: ${textureIntensity} - ${intensityConfig.description}
- Finish specification: ${finishSpecification.trim() || 'All appropriate surfaces'}
- Lighting: ${preserveLight ? 'Preserve original lighting conditions' : 'Adjust lighting for realistic material interaction'}
- Spatial accuracy: Maintain all original spatial relationships and proportions
- Professional quality: Suitable for design visualization and material testing
- Material realism: Photorealistic ${materialType} texture with ${glossLevelConfig.description} and proper surface properties
</output_requirements>

<context>
Modify the textures and materials in this interior space, replacing existing ${surfaceConfig.target} with ${materialType} (${materialConfig.description}). Apply ${textureScaleConfig.description} (${textureScaleConfig.scale}) with ${glossLevelConfig.description} (${glossLevelConfig.characteristics}). ${intensityConfig.application} to show ${materialConfig.properties}. Use ${materialConfig.types} as appropriate.${finishSpecText} ${preserveLight ? 'Maintain the original lighting conditions, shadows, and highlights exactly as shown in the original render' : 'Adjust lighting to properly interact with the new material, ensuring realistic light-material interactions and proper reflections'}. Maintain all spatial relationships, proportions, and architectural elements exactly as in the original. Create a photorealistic interior render with the new ${materialType} material applied to ${surfaceConfig.description} with ${textureScaleConfig.description}, ${glossLevelConfig.description}, and ${textureIntensity} intensity, suitable for design visualization and material testing.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('materialType', materialType);
    formData.append('preserveLighting', preserveLighting.toString());
    formData.append('textureIntensity', textureIntensity);
    formData.append('textureScale', textureScale.toString());
    formData.append('finishSpecification', finishSpecification);
    formData.append('surface', surface);
    formData.append('glossLevel', glossLevel);
    
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
      throw new Error(result.error || 'Failed to change texture');
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
            {/* Row 1: Material Type | Surface */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="material-type" className="text-sm">Material Type</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select the material texture to apply. The AI will replace existing materials with your chosen texture while maintaining spatial relationships.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={materialType} onValueChange={(v: any) => setMaterialType(v)}>
                  <SelectTrigger id="material-type" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wood">Wood</SelectItem>
                  <SelectItem value="stone">Stone</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="fabric">Fabric</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                  <SelectItem value="marble">Marble</SelectItem>
                  <SelectItem value="tile">Tile</SelectItem>
                  <SelectItem value="plaster">Plaster</SelectItem>
                </SelectContent>
              </Select>
            </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="surface" className="text-sm">Surface</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Select which surface type to modify. The texture will be applied to the selected surface type.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={surface} onValueChange={(v: any) => setSurface(v)}>
                  <SelectTrigger id="surface" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="floor">Floor</SelectItem>
                    <SelectItem value="wall">Wall</SelectItem>
                    <SelectItem value="ceiling">Ceiling</SelectItem>
                    <SelectItem value="countertop">Countertop</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Gloss Level | Texture Intensity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="gloss-level" className="text-sm">Gloss Level</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Control the surface finish shine. Matte: no shine. Semi: moderate shine. Glossy: high shine.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={glossLevel} onValueChange={(v: any) => setGlossLevel(v)}>
                  <SelectTrigger id="gloss-level" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matte">Matte</SelectItem>
                    <SelectItem value="semi">Semi</SelectItem>
                    <SelectItem value="glossy">Glossy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="texture-intensity" className="text-sm">Texture Intensity</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Control how prominently the texture is applied. Subtle: light overlay. Medium: balanced. Strong: full transformation.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={textureIntensity} onValueChange={(v: any) => setTextureIntensity(v)}>
                  <SelectTrigger id="texture-intensity" className="h-10 w-full">
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

            {/* Row 3: Finish Specification (full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="finish-specification" className="text-sm">Finish Specification (Optional)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Specify which particular finish or area should be changed. Leave empty to apply to all appropriate surfaces.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="finish-specification"
                placeholder="e.g., kitchen backsplash, bathroom tiles"
                value={finishSpecification}
                onChange={(e) => setFinishSpecification(e.target.value)}
                className="h-10 w-full"
              />
            </div>

            {/* Row 4: Texture Scale slider (full width) */}
            <LabeledSlider
              label="Texture Scale"
              value={textureScale}
              onValueChange={(values) => setTextureScale(values[0])}
              min={0}
              max={100}
              step={1}
              tooltip="Control the scale of the texture pattern. Lower values create finer detail. Higher values create larger patterns."
              valueFormatter={(v) => `${v}%`}
            />

            {/* Row 5: Preserve Original Lighting (full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="preserve-lighting" className="text-sm">Preserve Original Lighting</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">When enabled, original lighting is maintained. When disabled, lighting adjusts to properly interact with the new material.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={preserveLighting ? 'yes' : 'no'} onValueChange={(v) => setPreserveLighting(v === 'yes')}>
                <SelectTrigger id="preserve-lighting" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes (Preserve)</SelectItem>
                  <SelectItem value="no">No (Adjust)</SelectItem>
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
                    <p className="max-w-xs">Upload a texture/material reference image or choose from Renderiq's style library to match the exact texture pattern, surface properties, and material appearance.</p>
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
