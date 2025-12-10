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

interface ItemChangeProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function ItemChange({ tool, projectId, onHintChange, hintMessage }: ItemChangeProps) {
  const [replacementType, setReplacementType] = useState<'furniture' | 'decor' | 'fixtures' | 'artwork'>('furniture');
  const [preserveScale, setPreserveScale] = useState<boolean>(true);
  const [styleMatch, setStyleMatch] = useState<'match' | 'contrast' | 'neutral'>('match');

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const replacementConfigs = {
      'furniture': {
        description: 'furniture items such as sofas, chairs, tables, and seating',
        approach: 'Replace existing furniture items with alternative furniture options',
        considerations: 'furniture scale, furniture style, furniture placement, furniture proportions'
      },
      'decor': {
        description: 'decorative items such as vases, plants, accessories, and decorative objects',
        approach: 'Replace existing decorative items with alternative decor options',
        considerations: 'decor scale, decor style, decor placement, decorative proportions'
      },
      'fixtures': {
        description: 'fixtures such as lighting, hardware, and built-in elements',
        approach: 'Replace existing fixtures with alternative fixture options',
        considerations: 'fixture scale, fixture style, fixture placement, fixture proportions'
      },
      'artwork': {
        description: 'artwork such as paintings, prints, and wall art',
        approach: 'Replace existing artwork with alternative artwork options',
        considerations: 'artwork scale, artwork style, artwork placement, artwork proportions'
      }
    };

    const styleConfigs = {
      'match': {
        description: 'match the existing interior style and aesthetic',
        approach: 'select replacement items that match the existing interior style, color palette, and aesthetic'
      },
      'contrast': {
        description: 'create contrast with the existing interior style',
        approach: 'select replacement items that create intentional contrast with the existing interior style while maintaining harmony'
      },
      'neutral': {
        description: 'use neutral items that work with any style',
        approach: 'select replacement items with neutral style that work harmoniously with the existing interior'
      }
    };

    const replacementConfig = replacementConfigs[replacementType];
    const styleConfig = styleConfigs[styleMatch];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert interior designer specializing in item replacement and interior design modification.
</role>

<task>
Replace the specified ${replacementType} items in this interior space with alternative options, ${styleConfig.approach}, while ${preserveScale ? 'maintaining' : 'adjusting'} scale, lighting, shadows, and spatial relationships.
</task>

<constraints>
1. Output format: Generate a single photorealistic interior render image with replaced items
2. Replacement type: ${replacementType} - ${replacementConfig.description}
3. Replacement approach: ${replacementConfig.approach}
4. Replacement considerations: ${replacementConfig.considerations}
5. Style matching: ${styleMatch} - ${styleConfig.description}
6. Style approach: ${styleConfig.approach}
7. Scale preservation: ${preserveScale ? 'Maintain the original scale of replaced items relative to the space' : 'Adjust scale to better fit the space and improve proportions'}
8. Lighting preservation: Maintain the original lighting conditions, shadows, and highlights
9. Shadow integration: Ensure replaced items cast realistic shadows that match the scene's light sources
10. Spatial relationships: Maintain all spatial relationships, proportions, and interior layout exactly as in the original
11. Professional quality: Suitable for interior design visualization, design iteration, and client presentations
12. Do not: Distort proportions, alter spatial layout, or create unrealistic item placements
</constraints>

<output_requirements>
- Replacement type: ${replacementType} - ${replacementConfig.description}
- Style matching: ${styleMatch} - ${styleConfig.description}
- Scale: ${preserveScale ? 'Preserve original scale' : 'Adjust for better fit'}
- Lighting: Preserve original lighting conditions
- Professional quality: Suitable for interior design visualization
- Integration: Seamless item replacement with realistic integration
</output_requirements>

<context>
Replace the specified ${replacementType} items in this interior space. ${replacementConfig.approach} considering ${replacementConfig.considerations}. ${styleConfig.approach} to achieve ${styleConfig.description}. ${preserveScale ? 'Maintain the original scale of replaced items relative to the space' : 'Adjust scale to better fit the space and improve proportions'}. Maintain the original lighting conditions, shadows, and highlights. Ensure replaced items cast realistic shadows that match the scene's light sources. Maintain all spatial relationships, proportions, and interior layout exactly as in the original. Create a photorealistic interior render with seamlessly replaced items suitable for interior design visualization and design iteration.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    formData.set('prompt', buildSystemPrompt());
    formData.append('replacementType', replacementType);
    formData.append('preserveScale', preserveScale.toString());
    formData.append('styleMatch', styleMatch);
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to replace items');
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
            {/* Row 1: Replacement Type | Style Matching */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="replacement-type" className="text-sm">Replacement Type</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select the type of items to replace. The AI will identify and replace items of this type in the scene.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={replacementType} onValueChange={(v: any) => setReplacementType(v)}>
                  <SelectTrigger id="replacement-type" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="decor">Decor</SelectItem>
                  <SelectItem value="fixtures">Fixtures</SelectItem>
                  <SelectItem value="artwork">Artwork</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="style-match" className="text-sm">Style Matching</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose how replacement items match the scene. Match: same style. Contrast: intentional contrast. Neutral: works with any style.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={styleMatch} onValueChange={(v: any) => setStyleMatch(v)}>
                  <SelectTrigger id="style-match" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Match Style</SelectItem>
                  <SelectItem value="contrast">Create Contrast</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>

            {/* Row 2: Preserve Scale (full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="preserve-scale" className="text-sm">Preserve Scale</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">When enabled, original item scale is maintained. When disabled, scale adjusts to better fit the space.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={preserveScale ? 'yes' : 'no'} onValueChange={(v) => setPreserveScale(v === 'yes')}>
                <SelectTrigger id="preserve-scale" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes (Preserve)</SelectItem>
                  <SelectItem value="no">No (Adjust)</SelectItem>
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
            <li>Upload your interior render</li>
            <li>Select replacement type and style matching</li>
            <li>Choose scale preservation option</li>
            <li>Replace items with AI precision</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
