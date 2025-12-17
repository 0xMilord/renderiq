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
import { FivePointModifier } from '../ui/five-point-modifier';
import { LabeledToggle } from '../ui/labeled-toggle';

interface FloorplanTechnicalDiagramsProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function FloorplanTechnicalDiagrams({ tool, projectId, onHintChange, hintMessage }: FloorplanTechnicalDiagramsProps) {
  const [annotationStyle, setAnnotationStyle] = useState<'minimal' | 'standard' | 'detailed'>('standard');
  const [includeDimensions, setIncludeDimensions] = useState<'yes' | 'no'>('yes');
  const [lineWeight, setLineWeight] = useState<number>(3); // 1-5 scale
  const [wallFill, setWallFill] = useState<'hatch' | 'empty' | 'solid'>('hatch');
  const [bathroomKitchenFixtures, setBathroomKitchenFixtures] = useState<boolean>(true);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const annotationConfigs = {
      'minimal': {
        description: 'minimal annotations with essential room labels and basic information only',
        elements: 'essential room labels, basic door/window indicators, minimal text, clean presentation',
        use: 'clean, uncluttered diagrams for quick reference and overview'
      },
      'standard': {
        description: 'standard annotations with room labels, door/window indicators, and standard architectural notation',
        elements: 'room labels, door and window indicators, standard architectural symbols, clear notation, professional presentation',
        use: 'professional technical diagrams for design development and documentation'
      },
      'detailed': {
        description: 'detailed annotations with comprehensive room labels, door/window details, fixtures, and extensive architectural notation',
        elements: 'comprehensive room labels, detailed door and window indicators, fixture labels, extensive architectural symbols, detailed notation, complete documentation',
        use: 'comprehensive technical diagrams for construction documentation and detailed design review'
      }
    };

    const lineWeightConfigs = {
      1: { description: 'very thin line weight', thickness: 'very thin lines, delicate linework' },
      2: { description: 'thin line weight', thickness: 'thin lines, light linework' },
      3: { description: 'medium line weight', thickness: 'medium lines, standard linework' },
      4: { description: 'thick line weight', thickness: 'thick lines, bold linework' },
      5: { description: 'very thick line weight', thickness: 'very thick lines, heavy linework' }
    };

    const wallFillConfigs = {
      'hatch': {
        description: 'hatched wall fill with pattern lines',
        characteristics: 'hatched pattern, cross-hatching, pattern lines, textured fill'
      },
      'empty': {
        description: 'empty wall fill with outline only',
        characteristics: 'outline only, no fill, transparent walls, line-only representation'
      },
      'solid': {
        description: 'solid wall fill with filled shapes',
        characteristics: 'solid fill, filled shapes, opaque walls, solid representation'
      }
    };

    const annotationConfig = annotationConfigs[annotationStyle];
    const includeDims = includeDimensions === 'yes';
    const lineWeightConfig = lineWeightConfigs[lineWeight as keyof typeof lineWeightConfigs];
    const wallFillConfig = wallFillConfigs[wallFill];

    const fixturesText = bathroomKitchenFixtures
      ? 'Include bathroom and kitchen fixtures (sinks, toilets, bathtubs, showers, appliances, etc.)'
      : 'Do not include bathroom and kitchen fixtures - show only structural elements';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural draftsman specializing in technical floor plan diagrams with professional annotations and architectural standards.
</role>

<task>
Convert this floor plan into a professional technical architectural diagram with ${annotationConfig.description}${includeDims ? ' and dimensional information' : ''}. Use ${lineWeightConfig.description} (${lineWeightConfig.thickness}) for linework. Apply ${wallFillConfig.description} (${wallFillConfig.characteristics}) for wall representation. ${fixturesText}. Include proper annotations, ${includeDims ? 'dimensions, ' : ''}room labels, and architectural standards suitable for ${annotationConfig.use}.
</task>

<constraints>
1. Output format: Generate a single technical architectural floor plan diagram image
2. Drawing style: Technical CAD linework with precise measurements, architectural annotations, and standard CAD conventions
3. Line weight: Level ${lineWeight}/5 - ${lineWeightConfig.description} (${lineWeightConfig.thickness})
4. Wall fill: ${wallFill} - ${wallFillConfig.description} (${wallFillConfig.characteristics})
5. Annotation style: ${annotationStyle} - ${annotationConfig.description}
6. Annotation elements: ${annotationConfig.elements}
7. Dimensions: ${includeDims ? 'Include dimensional information with dimension lines, measurements, and proper dimensioning standards' : 'DO NOT include dimensions. Use only room labels and architectural symbols.'}
8. Bathroom & kitchen fixtures: ${bathroomKitchenFixtures ? 'Include fixtures (sinks, toilets, bathtubs, showers, appliances)' : 'Exclude fixtures - structural elements only'}
9. Room labels: Include appropriate room labels following ${annotationStyle} annotation style
10. Architectural symbols: Use standard architectural floor plan symbols for doors, windows, fixtures, and architectural elements
11. Technical accuracy: Maintain accurate floor plan proportions, proper scale, and architectural drawing standards
12. Professional quality: Suitable for ${annotationConfig.use}
13. Do not: Distort proportions, add incorrect annotations, or violate architectural drawing standards
</constraints>

<output_requirements>
- Diagram type: Technical architectural floor plan diagram
- Line weight: Level ${lineWeight}/5 - ${lineWeightConfig.description}
- Wall fill: ${wallFill} - ${wallFillConfig.description}
- Annotation style: ${annotationStyle} - ${annotationConfig.description}
- Annotation elements: ${annotationConfig.elements}
- Dimensions: ${includeDims ? 'Include dimensional information with proper dimensioning standards' : 'No dimensions - room labels and symbols only'}
- Fixtures: ${bathroomKitchenFixtures ? 'Included' : 'Excluded'}
- Drawing style: Technical CAD linework with ${lineWeightConfig.thickness} and ${wallFillConfig.characteristics}
- Professional quality: Suitable for ${annotationConfig.use}
- Technical accuracy: Maintain accurate proportions and architectural drawing standards
</output_requirements>

<context>
Convert this floor plan into a professional technical architectural diagram with ${annotationConfig.description}${includeDims ? ' and dimensional information' : ''}. Use ${lineWeightConfig.description} (${lineWeightConfig.thickness}) for all linework. Apply ${wallFillConfig.description} (${wallFillConfig.characteristics}) for wall representation. ${fixturesText}. Include ${annotationConfig.elements}${includeDims ? '. Add dimensional information with dimension lines, measurements, and proper dimensioning standards following architectural practice' : '. Do not include dimensions - use only room labels and architectural symbols'}. Maintain accurate floor plan proportions, proper scale, and architectural drawing standards. Create a clear, readable, and professionally rendered technical diagram suitable for ${annotationConfig.use} with ${lineWeightConfig.thickness} and ${wallFillConfig.characteristics}.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('annotationStyle', annotationStyle);
    formData.append('includeDimensions', includeDimensions);
    formData.append('lineWeight', lineWeight.toString());
    formData.append('wallFill', wallFill);
    formData.append('bathroomKitchenFixtures', bathroomKitchenFixtures.toString());
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate technical diagram');
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
            {/* Row 1: Annotation Style | Wall Fill */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="annotation-style" className="text-sm">Annotation Style</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose annotation detail level. Minimal: essential labels only. Standard: room labels and symbols. Detailed: comprehensive annotations.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={annotationStyle} onValueChange={(v: any) => setAnnotationStyle(v)}>
                  <SelectTrigger id="annotation-style" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="wall-fill" className="text-sm">Wall Fill</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose how walls are filled. Hatch: pattern lines. Empty: outline only. Solid: filled shapes.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={wallFill} onValueChange={(v: any) => setWallFill(v)}>
                  <SelectTrigger id="wall-fill" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hatch">Hatch</SelectItem>
                    <SelectItem value="empty">Empty</SelectItem>
                    <SelectItem value="solid">Solid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Include Dimensions (full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="dimensions" className="text-sm">Include Dimensions</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">When enabled, dimension lines and measurements are included. When disabled, only room labels and symbols are shown.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={includeDimensions} onValueChange={(v: any) => setIncludeDimensions(v)}>
                <SelectTrigger id="dimensions" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 3: Line Weight (full width) */}
            <FivePointModifier
              label="Line Weight"
              value={lineWeight}
              onValueChange={(values) => setLineWeight(values[0])}
              tooltip="Control the thickness of lines in the technical diagram. 1: Very thin. 3: Medium. 5: Very thick."
              labels={{
                1: 'Very Thin',
                2: 'Thin',
                3: 'Medium',
                4: 'Thick',
                5: 'Very Thick',
              }}
            />

            {/* Row 4: Bathroom & Kitchen Fixtures toggle (full width) */}
            <LabeledToggle
              id="bathroom-kitchen-fixtures"
              label="Bathroom & Kitchen Fixtures"
              checked={bathroomKitchenFixtures}
              onCheckedChange={setBathroomKitchenFixtures}
              tooltip="Include bathroom and kitchen fixtures like sinks, toilets, bathtubs, showers, and appliances in the diagram"
            />
          </div>
        </>
      }
    >
    </BaseToolComponent>
  );
}
