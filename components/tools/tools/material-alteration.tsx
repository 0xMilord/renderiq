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

interface MaterialAlterationProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function MaterialAlteration({ tool, projectId, onHintChange, hintMessage }: MaterialAlterationProps) {
  const [facadeMaterial, setFacadeMaterial] = useState<'brick' | 'glass' | 'concrete' | 'metal' | 'wood' | 'stone' | 'composite'>('glass');
  const [finish, setFinish] = useState<'matte' | 'glossy' | 'textured' | 'satin'>('matte');
  const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
  const [styleReferenceName, setStyleReferenceName] = useState<string | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const materialConfigs = {
      'brick': {
        description: 'brick facade with brick patterns, mortar joints, and natural brick characteristics',
        properties: 'brick patterns, mortar joints, brick color variations, natural brick texture, realistic brick surface',
        application: 'Replace building facade materials with brick, maintaining structural elements and architectural details'
      },
      'glass': {
        description: 'glass facade with transparency, reflections, and glass surface characteristics',
        properties: 'glass transparency, reflections, glass surface properties, realistic glass texture, glazing effects',
        application: 'Replace building facade materials with glass, maintaining structural elements and architectural details'
      },
      'concrete': {
        description: 'concrete facade with concrete texture, formwork patterns, and concrete surface characteristics',
        properties: 'concrete texture, formwork patterns, concrete color variations, realistic concrete surface, concrete finish',
        application: 'Replace building facade materials with concrete, maintaining structural elements and architectural details'
      },
      'metal': {
        description: 'metal facade with metallic properties, panel patterns, and metal surface characteristics',
        properties: 'metallic reflections, metal panel patterns, metal color variations, realistic metal texture, metallic finish',
        application: 'Replace building facade materials with metal, maintaining structural elements and architectural details'
      },
      'wood': {
        description: 'wood facade with wood grain patterns, natural wood characteristics, and wood surface properties',
        properties: 'wood grain patterns, natural wood texture, wood color variations, realistic wood surface, natural wood finish',
        application: 'Replace building facade materials with wood, maintaining structural elements and architectural details'
      },
      'stone': {
        description: 'stone facade with natural stone patterns, stone texture, and natural stone characteristics',
        properties: 'stone patterns, natural stone texture, stone color variations, realistic stone surface, natural stone finish',
        application: 'Replace building facade materials with natural stone, maintaining structural elements and architectural details'
      },
      'composite': {
        description: 'composite facade with modern composite panel systems and contemporary material characteristics',
        properties: 'composite panel patterns, modern material texture, composite color variations, realistic composite surface, contemporary finish',
        application: 'Replace building facade materials with composite panels, maintaining structural elements and architectural details'
      }
    };

    const finishConfigs = {
      'matte': {
        description: 'matte finish with non-reflective surface and subdued appearance',
        properties: 'non-reflective surface, subdued appearance, matte texture, low sheen, flat finish'
      },
      'glossy': {
        description: 'glossy finish with reflective surface and high sheen',
        properties: 'reflective surface, high sheen, glossy texture, mirror-like finish, polished appearance'
      },
      'textured': {
        description: 'textured finish with surface texture and tactile appearance',
        properties: 'surface texture, tactile appearance, textured finish, dimensional surface, textured pattern'
      },
      'satin': {
        description: 'satin finish with semi-reflective surface and balanced sheen',
        properties: 'semi-reflective surface, balanced sheen, satin texture, moderate gloss, smooth finish'
      }
    };

    const materialConfig = materialConfigs[facadeMaterial];
    const finishConfig = finishConfigs[finish];

    // Style reference instruction
    const styleReferenceInstruction = styleReferenceImage || styleReferenceName
      ? ' IMPORTANT: A style reference image has been provided showing the desired facade material. Match the material texture, surface properties, color, finish characteristics, and overall material appearance from the style reference image. The style reference shows the exact facade material you want - replicate its visual characteristics, texture quality, finish properties, and material appearance while maintaining structural integrity.'
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural visualizer specializing in building facade material replacement while maintaining structural integrity and architectural proportions.
</role>

<task>
Alter the building materials and facade finishes in this architectural render, replacing specified materials with ${facadeMaterial} (${materialConfig.description}) with ${finish} finish (${finishConfig.description}) while maintaining structural integrity, lighting, and architectural proportions.
</task>

<constraints>
1. Output format: Generate a single photorealistic architectural render image with altered facade materials
2. Material replacement: Replace building facade materials with ${facadeMaterial} - ${materialConfig.description}
3. Material properties: Apply ${materialConfig.properties}
4. Surface finish: ${finish} - ${finishConfig.description} with ${finishConfig.properties}
5. Application: ${materialConfig.application}
6. Structural integrity: Maintain all structural elements, building form, and architectural details exactly as in the original
7. Lighting interaction: Adjust lighting to properly interact with the new material properties, ensuring realistic light-material interactions and reflections
8. Architectural proportions: Maintain all architectural proportions, building scale, and spatial relationships exactly as in the original
9. Material accuracy: Apply photorealistic ${facadeMaterial} with ${finish} finish, showing proper surface properties, reflections, and material characteristics${styleReferenceInstruction}
10. Professional quality: Suitable for design visualization, material testing, and client presentations
11. Do not: Distort building proportions, alter structural elements, or create unrealistic material applications
</constraints>

<output_requirements>
- Material type: ${facadeMaterial} - ${materialConfig.description}
- Material properties: ${materialConfig.properties}
- Surface finish: ${finish} - ${finishConfig.description} with ${finishConfig.properties}
- Structural integrity: Maintain all structural elements and architectural details
- Lighting: Adjust lighting for realistic material interaction
- Professional quality: Suitable for design visualization and material testing
- Material realism: Photorealistic ${facadeMaterial} with ${finish} finish
</output_requirements>

<context>
Alter the building materials and facade finishes in this architectural render. Replace existing facade materials with ${facadeMaterial} (${materialConfig.description}) with ${finish} finish (${finishConfig.description}). Apply ${materialConfig.properties} with ${finishConfig.properties}. ${materialConfig.application}. Maintain all structural elements, building form, and architectural details exactly as in the original. Adjust lighting to properly interact with the new material, ensuring realistic light-material interactions, proper reflections, and material characteristics. Maintain all architectural proportions, building scale, and spatial relationships. Create a photorealistic architectural render with the new ${facadeMaterial} facade material with ${finish} finish, suitable for design visualization and material testing.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('facadeMaterial', facadeMaterial);
    formData.append('finish', finish);
    
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
      throw new Error(result.error || 'Failed to alter materials');
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
            {/* Row 1: Facade Material | Surface Finish */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="facade-material" className="text-sm">Facade Material</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select the facade material to replace existing building materials. The AI will maintain structural integrity and architectural proportions.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={facadeMaterial} onValueChange={(v: any) => setFacadeMaterial(v)}>
                  <SelectTrigger id="facade-material" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brick">Brick</SelectItem>
                  <SelectItem value="glass">Glass</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="wood">Wood</SelectItem>
                  <SelectItem value="stone">Stone</SelectItem>
                  <SelectItem value="composite">Composite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="finish" className="text-sm">Surface Finish</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the surface finish for the material. Matte: non-reflective. Glossy: reflective. Textured: dimensional. Satin: semi-reflective.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={finish} onValueChange={(v: any) => setFinish(v)}>
                  <SelectTrigger id="finish" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matte">Matte</SelectItem>
                  <SelectItem value="glossy">Glossy</SelectItem>
                  <SelectItem value="textured">Textured</SelectItem>
                  <SelectItem value="satin">Satin</SelectItem>
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
                    <p className="max-w-xs">Upload a facade material reference image or choose from Renderiq's style library to match the exact material texture, finish, and appearance.</p>
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
