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

interface FloorplanTo3DProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function FloorplanTo3D({ tool, projectId, onHintChange, hintMessage }: FloorplanTo3DProps) {
  const [perspective, setPerspective] = useState<'isometric' | 'axonometric' | 'oblique'>('axonometric');
  const [height, setHeight] = useState<'low' | 'medium' | 'high'>('medium');

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const perspectiveConfigs = {
      'isometric': {
        description: 'isometric projection with equal angles (30 degrees) on all three axes, showing equal foreshortening',
        characteristics: '30-degree angles, equal foreshortening, parallel lines, technical isometric projection, geometric accuracy',
        use: 'technical visualization, equal emphasis on all dimensions'
      },
      'axonometric': {
        description: 'axonometric projection showing three-dimensional form with parallel lines and accurate proportions',
        characteristics: 'parallel projection lines, accurate proportions, three-dimensional form, architectural axonometric, technical accuracy',
        use: 'architectural visualization, showing spatial relationships and volumes'
      },
      'oblique': {
        description: 'oblique projection with front face shown true to scale and depth at an angle',
        characteristics: 'front face true to scale, depth at angle, simple perspective, easy to read, technical drawing quality',
        use: 'clear communication, easy-to-read technical diagrams'
      }
    };

    const heightConfigs = {
      'low': {
        value: '2.4 meters (8 feet)',
        description: 'low ceiling height typical of residential spaces',
        characteristics: 'intimate scale, residential proportions, standard residential ceiling height'
      },
      'medium': {
        value: '3.0 meters (10 feet)',
        description: 'medium ceiling height typical of commercial and larger residential spaces',
        characteristics: 'comfortable scale, commercial proportions, standard commercial ceiling height'
      },
      'high': {
        value: '3.6 meters (12 feet)',
        description: 'high ceiling height typical of public and large commercial spaces',
        characteristics: 'spacious scale, public space proportions, generous ceiling height'
      }
    };

    const perspectiveConfig = perspectiveConfigs[perspective];
    const heightConfig = heightConfigs[height];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural draftsman specializing in 3D axonometric and isometric diagram generation from 2D floor plans.
</role>

<task>
Transform this 2D floor plan into a professional 3D ${perspective} diagram showing spatial relationships, volumes, and architectural elements with proper perspective and technical accuracy. Use ${heightConfig.value} (${heightConfig.description}) for wall heights.
</task>

<constraints>
1. Output format: Generate a single 3D ${perspective} diagram image
2. Perspective type: ${perspective} - ${perspectiveConfig.description}
3. Perspective characteristics: ${perspectiveConfig.characteristics}
4. Wall height: ${heightConfig.value} - ${heightConfig.description}
5. Height characteristics: ${heightConfig.characteristics}
6. Drawing style: Technical architectural diagram with clear linework, proper perspective, and architectural accuracy
7. Spatial representation: Show three-dimensional volumes, spatial relationships, and architectural elements accurately
8. Technical accuracy: Maintain accurate floor plan proportions, proper perspective projection, and architectural drawing standards
9. Visual clarity: Clear linework, proper depth representation, and readable diagram quality
10. Do not: Distort floor plan proportions, create incorrect perspective, or violate architectural drawing standards
</constraints>

<output_requirements>
- Diagram type: 3D ${perspective} diagram
- Perspective: ${perspectiveConfig.description} - ${perspectiveConfig.use}
- Wall height: ${heightConfig.value} - ${heightConfig.description}
- Drawing style: Technical architectural diagram with clear linework
- Spatial representation: Accurate three-dimensional volumes and relationships
- Professional quality: Suitable for design development, client presentations, and technical documentation
- Technical accuracy: Proper perspective projection and architectural drawing standards
</output_requirements>

<context>
Transform this 2D floor plan into a 3D ${perspective} diagram. Use ${perspectiveConfig.description} with ${perspectiveConfig.characteristics} for ${perspectiveConfig.use}. Set wall heights to ${heightConfig.value} (${heightConfig.description}) creating ${heightConfig.characteristics}. Show three-dimensional volumes, spatial relationships, and architectural elements with proper perspective and technical accuracy. Maintain accurate floor plan proportions while creating a clear, readable, and professionally rendered 3D diagram.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('perspective', perspective);
    formData.append('height', height);
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate 3D diagram');
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
                <Label htmlFor="perspective" className="text-sm">Perspective Type</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the 3D projection type. Isometric: equal angles. Axonometric: parallel projection. Oblique: front face true to scale.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={perspective} onValueChange={(v: any) => setPerspective(v)}>
                <SelectTrigger id="perspective" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isometric">Isometric</SelectItem>
                  <SelectItem value="axonometric">Axonometric</SelectItem>
                  <SelectItem value="oblique">Oblique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="height" className="text-sm">Wall Height</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Set the ceiling height for the 3D diagram. Low: residential (2.4m). Medium: commercial (3.0m). High: public spaces (3.6m).</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={height} onValueChange={(v: any) => setHeight(v)}>
                <SelectTrigger id="height" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (2.4m)</SelectItem>
                  <SelectItem value="medium">Medium (3.0m)</SelectItem>
                  <SelectItem value="high">High (3.6m)</SelectItem>
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
            <li>Upload your 2D floor plan</li>
            <li>Choose perspective type and wall height</li>
            <li>Generate 3D axonometric diagram</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
