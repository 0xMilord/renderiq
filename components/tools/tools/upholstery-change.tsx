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

interface UpholsteryChangeProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function UpholsteryChange({ tool, projectId, onHintChange, hintMessage }: UpholsteryChangeProps) {
  const [fabricType, setFabricType] = useState<'leather' | 'fabric' | 'velvet' | 'linen' | 'suede' | 'canvas'>('fabric');
  const [pattern, setPattern] = useState<'solid' | 'striped' | 'geometric' | 'floral' | 'abstract'>('solid');
  const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
  const [styleReferenceName, setStyleReferenceName] = useState<string | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const fabricConfigs = {
      'leather': {
        description: 'leather upholstery with natural leather texture, grain, and leather characteristics',
        properties: 'natural leather grain, leather texture, leather color variations, realistic leather surface, leather finish',
        characteristics: 'smooth or textured leather, natural leather variations, authentic leather appearance'
      },
      'fabric': {
        description: 'fabric upholstery with textile texture, weave patterns, and fabric characteristics',
        properties: 'fabric weave patterns, textile texture, fabric color variations, realistic fabric surface, textile properties',
        characteristics: 'natural fabric texture, fabric weave, authentic textile appearance'
      },
      'velvet': {
        description: 'velvet upholstery with plush texture, nap, and luxurious velvet characteristics',
        properties: 'plush velvet texture, velvet nap, velvet color variations, realistic velvet surface, luxurious finish',
        characteristics: 'soft plush texture, velvet nap direction, luxurious velvet appearance'
      },
      'linen': {
        description: 'linen upholstery with natural linen texture, weave, and linen characteristics',
        properties: 'natural linen texture, linen weave patterns, linen color variations, realistic linen surface, natural finish',
        characteristics: 'natural linen texture, linen weave, authentic linen appearance'
      },
      'suede': {
        description: 'suede upholstery with soft suede texture, nap, and suede characteristics',
        properties: 'soft suede texture, suede nap, suede color variations, realistic suede surface, soft finish',
        characteristics: 'soft suede texture, suede nap, authentic suede appearance'
      },
      'canvas': {
        description: 'canvas upholstery with durable canvas texture, weave, and canvas characteristics',
        properties: 'canvas weave patterns, durable canvas texture, canvas color variations, realistic canvas surface, durable finish',
        characteristics: 'durable canvas texture, canvas weave, authentic canvas appearance'
      }
    };

    const patternConfigs = {
      'solid': {
        description: 'solid color with no pattern, showing pure fabric texture',
        application: 'apply solid color upholstery showing pure fabric texture without patterns'
      },
      'striped': {
        description: 'striped pattern with alternating color stripes',
        application: 'apply striped pattern with alternating color stripes, maintaining fabric texture'
      },
      'geometric': {
        description: 'geometric pattern with shapes, lines, and geometric designs',
        application: 'apply geometric pattern with shapes, lines, and geometric designs, maintaining fabric texture'
      },
      'floral': {
        description: 'floral pattern with flowers, leaves, and botanical designs',
        application: 'apply floral pattern with flowers, leaves, and botanical designs, maintaining fabric texture'
      },
      'abstract': {
        description: 'abstract pattern with artistic, non-representational designs',
        application: 'apply abstract pattern with artistic, non-representational designs, maintaining fabric texture'
      }
    };

    const fabricConfig = fabricConfigs[fabricType];
    const patternConfig = patternConfigs[pattern];

    // Style reference instruction
    const styleReferenceInstruction = styleReferenceImage || styleReferenceName
      ? ' IMPORTANT: A style reference image has been provided showing the desired fabric/upholstery. Match the fabric texture, pattern, color, weave characteristics, and overall upholstery appearance from the style reference image. The style reference shows the exact fabric/upholstery you want - replicate its visual characteristics, pattern details, fabric texture, and material appearance while maintaining furniture form.'
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert interior designer specializing in furniture upholstery transformation and fabric replacement.
</role>

<task>
Change the upholstery patterns and materials on furniture in this interior render, applying ${fabricType} (${fabricConfig.description}) with ${pattern} pattern (${patternConfig.description}) while maintaining furniture form, lighting, and spatial relationships.
</task>

<constraints>
1. Output format: Generate a single photorealistic interior render image with transformed furniture upholstery
2. Fabric type: ${fabricType} - ${fabricConfig.description}
3. Fabric properties: Apply ${fabricConfig.properties}
4. Fabric characteristics: Show ${fabricConfig.characteristics}
5. Pattern: ${pattern} - ${patternConfig.description}
6. Pattern application: ${patternConfig.application}
7. Furniture preservation: Maintain all furniture forms, shapes, and structural elements exactly as in the original
8. Lighting preservation: Maintain the original lighting conditions, shadows, and highlights on furniture
9. Spatial relationships: Maintain all spatial relationships, proportions, and interior elements exactly as in the original
10. Upholstery accuracy: Apply photorealistic ${fabricType} upholstery with ${pattern} pattern, showing proper fabric texture, pattern alignment, and material characteristics${styleReferenceInstruction}
11. Professional quality: Suitable for interior design visualization, furniture selection, and client presentations
12. Do not: Distort furniture forms, alter furniture structure, or create unrealistic upholstery applications
</constraints>

<output_requirements>
- Fabric type: ${fabricType} - ${fabricConfig.description}
- Fabric properties: ${fabricConfig.properties}
- Pattern: ${pattern} - ${patternConfig.description}
- Furniture preservation: Maintain all furniture forms and structure
- Lighting: Preserve original lighting conditions
- Professional quality: Suitable for interior design visualization
- Upholstery realism: Photorealistic ${fabricType} with ${pattern} pattern
</output_requirements>

<context>
Change the upholstery patterns and materials on furniture in this interior render. Apply ${fabricType} (${fabricConfig.description}) showing ${fabricConfig.properties} and ${fabricConfig.characteristics}. ${patternConfig.application} to create ${patternConfig.description}. Maintain all furniture forms, shapes, and structural elements exactly as in the original. Preserve the original lighting conditions, shadows, and highlights on furniture. Maintain all spatial relationships, proportions, and interior elements. Create a photorealistic interior render with transformed furniture upholstery showing ${fabricType} with ${pattern} pattern, suitable for interior design visualization and furniture selection.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    formData.set('prompt', buildSystemPrompt());
    formData.append('fabricType', fabricType);
    formData.append('pattern', pattern);
    
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
      throw new Error(result.error || 'Failed to change upholstery');
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
      customSettings={
        <>
          <div className="space-y-4">
            {/* Row 1: Fabric Type | Pattern */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="fabric-type" className="text-sm">Fabric Type</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select the fabric material for furniture upholstery. The AI will replace existing upholstery while maintaining furniture form and structure.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={fabricType} onValueChange={(v: any) => setFabricType(v)}>
                  <SelectTrigger id="fabric-type" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leather">Leather</SelectItem>
                  <SelectItem value="fabric">Fabric</SelectItem>
                  <SelectItem value="velvet">Velvet</SelectItem>
                  <SelectItem value="linen">Linen</SelectItem>
                  <SelectItem value="suede">Suede</SelectItem>
                  <SelectItem value="canvas">Canvas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="pattern" className="text-sm">Pattern</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the pattern for the upholstery. Solid: no pattern. Striped: alternating stripes. Geometric: shapes and lines. Floral: botanical designs. Abstract: artistic patterns.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={pattern} onValueChange={(v: any) => setPattern(v)}>
                  <SelectTrigger id="pattern" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="striped">Striped</SelectItem>
                  <SelectItem value="geometric">Geometric</SelectItem>
                  <SelectItem value="floral">Floral</SelectItem>
                  <SelectItem value="abstract">Abstract</SelectItem>
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
                    <p className="max-w-xs">Upload a fabric/upholstery reference image or choose from Renderiq's style library to match the exact fabric texture, pattern, and appearance.</p>
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
            <li>Upload your interior render with furniture</li>
            <li>Select fabric type and pattern</li>
            <li>Transform furniture upholstery</li>
            <li>Download your result</li>
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
