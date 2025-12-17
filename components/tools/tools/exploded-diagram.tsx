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
import { LabeledToggle } from '../ui/labeled-toggle';

interface ExplodedDiagramProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function ExplodedDiagram({ tool, projectId, onHintChange, hintMessage }: ExplodedDiagramProps) {
  const [spacing, setSpacing] = useState<'tight' | 'medium' | 'wide'>('medium');
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal' | 'diagonal' | 'custom'>('vertical');
  const [renderingStyle, setRenderingStyle] = useState<'linework' | 'solid-colours' | 'physical-model' | 'shaded'>('linework');
  const [annotation, setAnnotation] = useState<boolean>(true);
  const [customAxis, setCustomAxis] = useState<{ x: boolean; y: boolean; z: boolean }>({ x: false, y: true, z: false });

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
      },
      'custom': {
        description: 'custom explosion with components separated along specified axes',
        characteristics: 'custom axis separation, user-defined arrangement, flexible presentation, multi-axis control',
        use: 'custom arrangement showing user-specified axis relationships and spatial distribution'
      }
    };

    const renderingStyleConfigs = {
      'linework': {
        description: 'linework style with clear linework and minimal fills',
        characteristics: 'clear linework, minimal fills, technical drawing style, line-based representation'
      },
      'solid-colours': {
        description: 'solid colours style with filled shapes and color representation',
        characteristics: 'filled shapes, color representation, solid fills, clear color definition'
      },
      'physical-model': {
        description: 'physical model style with realistic material representation',
        characteristics: 'realistic materials, physical model appearance, material textures, model-like quality'
      },
      'shaded': {
        description: 'shaded style with depth shading and three-dimensional appearance',
        characteristics: 'depth shading, three-dimensional appearance, shadow effects, volumetric representation'
      }
    };

    const spacingConfig = spacingConfigs[spacing];
    const orientationConfig = orientation === 'custom' 
      ? {
          description: `custom explosion with components separated along ${Object.entries(customAxis).filter(([_, v]) => v).map(([k]) => k.toUpperCase()).join(', ')} axes`,
          characteristics: `custom axis separation along ${Object.entries(customAxis).filter(([_, v]) => v).map(([k]) => k.toUpperCase()).join(', ')} axes, user-defined arrangement`,
          use: 'custom arrangement with user-specified axis separation'
        }
      : orientationConfigs[orientation];
    const renderingStyleConfig = renderingStyleConfigs[renderingStyle];

    const customAxisText = orientation === 'custom'
      ? ` along ${Object.entries(customAxis).filter(([_, v]) => v).map(([k]) => k.toUpperCase()).join(', ')} axes`
      : '';

    const annotationText = annotation
      ? 'Include annotations, labels, and component identification text'
      : 'Do not include annotations - show visual representation only';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural draftsman specializing in exploded axonometric diagrams showing component relationships and assembly.
</role>

<task>
Create an exploded axonometric diagram from this architectural design in ${renderingStyleConfig.description} style, showing all components separated with ${spacingConfig.description} in ${orientationConfig.description}${customAxisText}. ${annotationText}. Maintain architectural accuracy and technical drawing standards.
</task>

<constraints>
1. Output format: Generate a single exploded axonometric diagram image
2. Diagram type: Exploded axonometric diagram showing separated components
3. Rendering style: ${renderingStyle} - ${renderingStyleConfig.description}
4. Rendering characteristics: ${renderingStyleConfig.characteristics}
5. Component spacing: ${spacing} - ${spacingConfig.description}
6. Spacing characteristics: ${spacingConfig.characteristics}
7. Explosion orientation: ${orientation} - ${orientationConfig.description}${customAxisText}
8. Orientation characteristics: ${orientationConfig.characteristics}
9. Annotations: ${annotation ? 'Include annotations, labels, and component identification' : 'Exclude annotations - visual representation only'}
10. Drawing style: ${renderingStyleConfig.description} with ${renderingStyleConfig.characteristics}, proper perspective, and architectural accuracy
11. Component separation: Show all architectural components separated with ${spacingConfig.description} along ${orientationConfig.description}${customAxisText}
12. Component visibility: Ensure all components are clearly visible and identifiable with ${spacingConfig.characteristics}
13. Architectural accuracy: Maintain accurate component proportions, spatial relationships, and architectural drawing standards
14. Technical quality: Professional technical drawing quality suitable for ${spacingConfig.use} and ${orientationConfig.use}
15. Do not: Distort component proportions, create incorrect spacing, or violate architectural drawing standards
</constraints>

<output_requirements>
- Diagram type: Exploded axonometric diagram
- Rendering style: ${renderingStyle} - ${renderingStyleConfig.description}
- Component spacing: ${spacing} - ${spacingConfig.description}
- Explosion orientation: ${orientation} - ${orientationConfig.description}${customAxisText}
- Annotations: ${annotation ? 'Included' : 'Excluded'}
- Drawing style: ${renderingStyleConfig.description} with ${renderingStyleConfig.characteristics}
- Component separation: ${spacingConfig.characteristics} along ${orientationConfig.characteristics}
- Professional quality: Suitable for design development, technical documentation, and assembly visualization
- Technical accuracy: Maintain accurate component proportions and architectural drawing standards
</output_requirements>

<context>
Create an exploded axonometric diagram from this architectural design in ${renderingStyleConfig.description} style (${renderingStyleConfig.characteristics}). Separate all components with ${spacingConfig.description} (${spacingConfig.characteristics}) in ${orientationConfig.description} (${orientationConfig.characteristics})${customAxisText}. ${annotationText}. Show all architectural components clearly separated and identifiable, maintaining accurate proportions and spatial relationships. Use ${renderingStyleConfig.description} with ${renderingStyleConfig.characteristics} and proper perspective. Create a professional exploded diagram suitable for ${spacingConfig.use} and ${orientationConfig.use} that clearly shows component relationships and assembly structure.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('spacing', spacing);
    formData.append('orientation', orientation);
    formData.append('renderingStyle', renderingStyle);
    formData.append('annotation', annotation.toString());
    if (orientation === 'custom') {
      formData.append('customAxis', JSON.stringify(customAxis));
    }
    
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
          <div className="space-y-4">
            {/* Row 1: Rendering Style | Component Spacing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="rendering-style" className="text-sm">Rendering Style</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose the rendering style. Linework: clear lines. Solid colours: filled shapes. Physical model: realistic materials. Shaded: depth shading.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={renderingStyle} onValueChange={(v: any) => setRenderingStyle(v)}>
                  <SelectTrigger id="rendering-style" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linework">Linework</SelectItem>
                    <SelectItem value="solid-colours">Solid Colours</SelectItem>
                    <SelectItem value="physical-model">Physical Model</SelectItem>
                    <SelectItem value="shaded">Shaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  <SelectTrigger id="spacing" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>

            {/* Row 2: Explosion Orientation (full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="orientation" className="text-sm">Explosion Orientation</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the direction of component separation. Vertical: up/down. Horizontal: left/right. Diagonal: dynamic multi-axis. Custom: specify axes.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={orientation} onValueChange={(v: any) => setOrientation(v)}>
                <SelectTrigger id="orientation" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 3: Custom Axis Selection (conditional, full width) */}
            {orientation === 'custom' && (
              <div className="space-y-2 p-3 border rounded-md bg-muted/50">
                <Label className="text-sm mb-2 block">Custom Axis Selection</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="axis-x"
                      checked={customAxis.x}
                      onChange={(e) => setCustomAxis({ ...customAxis, x: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="axis-x" className="text-sm font-normal cursor-pointer">X-axis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="axis-y"
                      checked={customAxis.y}
                      onChange={(e) => setCustomAxis({ ...customAxis, y: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="axis-y" className="text-sm font-normal cursor-pointer">Y-axis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="axis-z"
                      checked={customAxis.z}
                      onChange={(e) => setCustomAxis({ ...customAxis, z: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="axis-z" className="text-sm font-normal cursor-pointer">Z-axis</Label>
                  </div>
                </div>
              </div>
            )}

            {/* Row 4: Annotation toggle (full width) */}
            <LabeledToggle
              id="annotation"
              label="Annotation"
              checked={annotation}
              onCheckedChange={setAnnotation}
              tooltip="Include annotations, labels, and component identification text in the exploded diagram"
            />
          </div>
        </>
      }
    >
    </BaseToolComponent>
  );
}
