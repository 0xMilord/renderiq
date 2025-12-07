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

interface ExplodedDiagramProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function ExplodedDiagram({ tool, projectId, onHintChange, hintMessage }: ExplodedDiagramProps) {
  const [spacing, setSpacing] = useState<'tight' | 'medium' | 'wide'>('medium');
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal' | 'diagonal'>('vertical');

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const spacingConfigs = {
      'tight': {
        description: 'tight spacing with components close together, showing minimal separation',
        characteristics: 'components close together, minimal gaps, compact presentation, clear component relationships',
        use: 'compact diagrams showing component relationships with minimal space'
      },
      'medium': {
        description: 'medium spacing with balanced separation between components',
        characteristics: 'balanced component separation, clear individual component visibility, readable spacing, professional presentation',
        use: 'balanced diagrams with clear component visibility and professional presentation'
      },
      'wide': {
        description: 'wide spacing with generous separation between components for maximum clarity',
        characteristics: 'generous component separation, maximum individual component clarity, spacious presentation, easy component identification',
        use: 'spacious diagrams with maximum component clarity and easy identification'
      }
    };

    const orientationConfigs = {
      'vertical': {
        description: 'vertical explosion with components separated along vertical axis',
        characteristics: 'vertical component separation, top-to-bottom or bottom-to-top arrangement, vertical axis emphasis',
        use: 'vertical component arrangement showing vertical relationships and stacking'
      },
      'horizontal': {
        description: 'horizontal explosion with components separated along horizontal axis',
        characteristics: 'horizontal component separation, left-to-right or right-to-left arrangement, horizontal axis emphasis',
        use: 'horizontal component arrangement showing horizontal relationships and side-by-side components'
      },
      'diagonal': {
        description: 'diagonal explosion with components separated along diagonal axis',
        characteristics: 'diagonal component separation, diagonal arrangement, dynamic presentation, multi-axis emphasis',
        use: 'dynamic diagonal arrangement showing multi-axis relationships and spatial distribution'
      }
    };

    const spacingConfig = spacingConfigs[spacing];
    const orientationConfig = orientationConfigs[orientation];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural draftsman specializing in exploded axonometric diagrams showing component relationships and assembly.
</role>

<task>
Create an exploded axonometric diagram from this architectural design, showing all components separated with ${spacingConfig.description} in ${orientationConfig.description}, maintaining architectural accuracy and technical drawing standards.
</task>

<constraints>
1. Output format: Generate a single exploded axonometric diagram image
2. Diagram type: Exploded axonometric diagram showing separated components
3. Component spacing: ${spacing} - ${spacingConfig.description}
4. Spacing characteristics: ${spacingConfig.characteristics}
5. Explosion orientation: ${orientation} - ${orientationConfig.description}
6. Orientation characteristics: ${orientationConfig.characteristics}
7. Drawing style: Technical axonometric drawing with clear linework, proper perspective, and architectural accuracy
8. Component separation: Show all architectural components separated with ${spacingConfig.description} along ${orientationConfig.description}
9. Component visibility: Ensure all components are clearly visible and identifiable with ${spacingConfig.characteristics}
10. Architectural accuracy: Maintain accurate component proportions, spatial relationships, and architectural drawing standards
11. Technical quality: Professional technical drawing quality suitable for ${spacingConfig.use} and ${orientationConfig.use}
12. Do not: Distort component proportions, create incorrect spacing, or violate architectural drawing standards
</constraints>

<output_requirements>
- Diagram type: Exploded axonometric diagram
- Component spacing: ${spacing} - ${spacingConfig.description}
- Explosion orientation: ${orientation} - ${orientationConfig.description}
- Drawing style: Technical axonometric with clear linework and proper perspective
- Component separation: ${spacingConfig.characteristics} along ${orientationConfig.characteristics}
- Professional quality: Suitable for design development, technical documentation, and assembly visualization
- Technical accuracy: Maintain accurate component proportions and architectural drawing standards
</output_requirements>

<context>
Create an exploded axonometric diagram from this architectural design. Separate all components with ${spacingConfig.description} (${spacingConfig.characteristics}) in ${orientationConfig.description} (${orientationConfig.characteristics}). Show all architectural components clearly separated and identifiable, maintaining accurate proportions and spatial relationships. Use technical axonometric drawing style with clear linework and proper perspective. Create a professional exploded diagram suitable for ${spacingConfig.use} and ${orientationConfig.use} that clearly shows component relationships and assembly structure.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('spacing', spacing);
    formData.append('orientation', orientation);
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate exploded diagram');
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
                <Label htmlFor="spacing" className="text-sm">Component Spacing</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Control the distance between separated components. Tight: close together. Medium: balanced. Wide: generous separation.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={spacing} onValueChange={(v: any) => setSpacing(v)}>
                <SelectTrigger id="spacing" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="orientation" className="text-sm">Explosion Orientation</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the direction of component separation. Vertical: up/down. Horizontal: left/right. Diagonal: dynamic multi-axis.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={orientation} onValueChange={(v: any) => setOrientation(v)}>
                <SelectTrigger id="orientation" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
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
            <li>Upload your architectural design</li>
            <li>Configure spacing and orientation</li>
            <li>Generate exploded axonometric diagram</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
