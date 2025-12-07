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

interface FloorplanTechnicalDiagramsProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function FloorplanTechnicalDiagrams({ tool, projectId, onHintChange, hintMessage }: FloorplanTechnicalDiagramsProps) {
  const [annotationStyle, setAnnotationStyle] = useState<'minimal' | 'standard' | 'detailed'>('standard');
  const [includeDimensions, setIncludeDimensions] = useState<'yes' | 'no'>('yes');

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

    const annotationConfig = annotationConfigs[annotationStyle];
    const includeDims = includeDimensions === 'yes';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural draftsman specializing in technical floor plan diagrams with professional annotations and architectural standards.
</role>

<task>
Convert this floor plan into a professional technical architectural diagram with ${annotationConfig.description}${includeDims ? ' and dimensional information' : ''}. Include proper annotations, ${includeDims ? 'dimensions, ' : ''}room labels, and architectural standards suitable for ${annotationConfig.use}.
</task>

<constraints>
1. Output format: Generate a single technical architectural floor plan diagram image
2. Drawing style: Technical CAD linework with precise measurements, architectural annotations, and standard CAD conventions
3. Annotation style: ${annotationStyle} - ${annotationConfig.description}
4. Annotation elements: ${annotationConfig.elements}
5. Dimensions: ${includeDims ? 'Include dimensional information with dimension lines, measurements, and proper dimensioning standards' : 'DO NOT include dimensions. Use only room labels and architectural symbols.'}
6. Room labels: Include appropriate room labels following ${annotationStyle} annotation style
7. Architectural symbols: Use standard architectural floor plan symbols for doors, windows, fixtures, and architectural elements
8. Technical accuracy: Maintain accurate floor plan proportions, proper scale, and architectural drawing standards
9. Professional quality: Suitable for ${annotationConfig.use}
10. Do not: Distort proportions, add incorrect annotations, or violate architectural drawing standards
</constraints>

<output_requirements>
- Diagram type: Technical architectural floor plan diagram
- Annotation style: ${annotationStyle} - ${annotationConfig.description}
- Annotation elements: ${annotationConfig.elements}
- Dimensions: ${includeDims ? 'Include dimensional information with proper dimensioning standards' : 'No dimensions - room labels and symbols only'}
- Drawing style: Technical CAD linework with standard architectural conventions
- Professional quality: Suitable for ${annotationConfig.use}
- Technical accuracy: Maintain accurate proportions and architectural drawing standards
</output_requirements>

<context>
Convert this floor plan into a professional technical architectural diagram with ${annotationConfig.description}${includeDims ? ' and dimensional information' : ''}. Include ${annotationConfig.elements}${includeDims ? '. Add dimensional information with dimension lines, measurements, and proper dimensioning standards following architectural practice' : '. Do not include dimensions - use only room labels and architectural symbols'}. Maintain accurate floor plan proportions, proper scale, and architectural drawing standards. Create a clear, readable, and professionally rendered technical diagram suitable for ${annotationConfig.use}.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('annotationStyle', annotationStyle);
    formData.append('includeDimensions', includeDimensions);
    
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
          <div className="space-y-3">
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
                <SelectTrigger id="annotation-style" className="h-10">
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
                <SelectTrigger id="dimensions" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
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
            <li>Upload your floor plan</li>
            <li>Choose annotation style and dimensions</li>
            <li>Generate professional technical diagram</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
