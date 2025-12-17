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

interface FloorplanTo3DProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function FloorplanTo3D({ tool, projectId, onHintChange, hintMessage }: FloorplanTo3DProps) {
  const [perspective, setPerspective] = useState<'isometric' | 'axonometric' | 'oblique'>('axonometric');
  const [height, setHeight] = useState<'low' | 'medium' | 'high'>('medium');
  const [furnitureEnabled, setFurnitureEnabled] = useState<boolean>(true);
  const [decorationEnabled, setDecorationEnabled] = useState<boolean>(true);
  const [furnitureDecorStyle, setFurnitureDecorStyle] = useState<'contemporary' | 'classical' | 'mid-century-modern'>('contemporary');
  const [renderStyle, setRenderStyle] = useState<'line-drawing' | 'solid-colours' | 'realistic'>('realistic');

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

    const furnitureDecorStyleConfigs = {
      'contemporary': {
        description: 'contemporary furniture and decor with modern, clean lines and current design trends',
        characteristics: 'modern furniture, contemporary decor, clean lines, current design trends, sleek aesthetics'
      },
      'classical': {
        description: 'classical furniture and decor with traditional, ornate details and timeless design',
        characteristics: 'traditional furniture, classical decor, ornate details, timeless design, elegant aesthetics'
      },
      'mid-century-modern': {
        description: 'mid-century modern furniture and decor with retro styling and iconic design elements',
        characteristics: 'mid-century furniture, retro decor, iconic design elements, vintage styling, distinctive aesthetics'
      }
    };

    const renderStyleConfigs = {
      'line-drawing': {
        description: 'line drawing style with clear linework and minimal fills',
        characteristics: 'clear linework, minimal fills, technical drawing style, line-based representation'
      },
      'solid-colours': {
        description: 'solid colours style with filled shapes and color representation',
        characteristics: 'filled shapes, color representation, solid fills, clear color definition'
      },
      'realistic': {
        description: 'realistic style with detailed rendering and photorealistic quality',
        characteristics: 'detailed rendering, photorealistic quality, comprehensive detail, realistic representation'
      }
    };

    const perspectiveConfig = perspectiveConfigs[perspective];
    const heightConfig = heightConfigs[height];
    const furnitureDecorStyleConfig = furnitureDecorStyleConfigs[furnitureDecorStyle];
    const renderStyleConfig = renderStyleConfigs[renderStyle];

    const furnitureText = furnitureEnabled 
      ? `Include furniture in ${furnitureDecorStyleConfig.description} style (${furnitureDecorStyleConfig.characteristics})`
      : 'Do not include furniture - show empty spaces only';

    const decorationText = decorationEnabled
      ? 'Include decorative elements: plants, paintings, rugs, lamps, and lights appropriate for the space'
      : 'Do not include decorative elements - focus on architectural structure and furniture only';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural draftsman specializing in 3D axonometric and isometric diagram generation from 2D floor plans.
</role>

<task>
Transform this 2D floor plan into a professional 3D ${perspective} diagram in ${renderStyleConfig.description} style showing spatial relationships, volumes, and architectural elements with proper perspective and technical accuracy. Use ${heightConfig.value} (${heightConfig.description}) for wall heights. ${furnitureText}. ${decorationText}.
</task>

<constraints>
1. Output format: Generate a single 3D ${perspective} diagram image
2. Perspective type: ${perspective} - ${perspectiveConfig.description}
3. Perspective characteristics: ${perspectiveConfig.characteristics}
4. Wall height: ${heightConfig.value} - ${heightConfig.description}
5. Height characteristics: ${heightConfig.characteristics}
6. Render style: ${renderStyle} - ${renderStyleConfig.description}
7. Render style characteristics: ${renderStyleConfig.characteristics}
8. Furniture: ${furnitureEnabled ? `Included in ${furnitureDecorStyle} style - ${furnitureDecorStyleConfig.description}` : 'Not included - empty spaces only'}
9. Furniture & decor style: ${furnitureEnabled ? `${furnitureDecorStyle} - ${furnitureDecorStyleConfig.characteristics}` : 'N/A'}
10. Decoration: ${decorationEnabled ? 'Included - plants, paintings, rugs, lamps, lights' : 'Not included'}
11. Drawing style: ${renderStyleConfig.description} with ${renderStyleConfig.characteristics}, proper perspective, and architectural accuracy
12. Spatial representation: Show three-dimensional volumes, spatial relationships, and architectural elements accurately
13. Technical accuracy: Maintain accurate floor plan proportions, proper perspective projection, and architectural drawing standards
14. Visual clarity: Clear representation according to ${renderStyleConfig.description}, proper depth representation, and readable diagram quality
15. Do not: Distort floor plan proportions, create incorrect perspective, or violate architectural drawing standards
</constraints>

<output_requirements>
- Diagram type: 3D ${perspective} diagram
- Perspective: ${perspectiveConfig.description} - ${perspectiveConfig.use}
- Wall height: ${heightConfig.value} - ${heightConfig.description}
- Render style: ${renderStyle} - ${renderStyleConfig.description}
- Furniture: ${furnitureEnabled ? `Included (${furnitureDecorStyle} style)` : 'Excluded'}
- Decoration: ${decorationEnabled ? 'Included' : 'Excluded'}
- Drawing style: ${renderStyleConfig.description} with ${renderStyleConfig.characteristics}
- Spatial representation: Accurate three-dimensional volumes and relationships
- Professional quality: Suitable for design development, client presentations, and technical documentation
- Technical accuracy: Proper perspective projection and architectural drawing standards
</output_requirements>

<context>
Transform this 2D floor plan into a 3D ${perspective} diagram in ${renderStyleConfig.description} style. Use ${perspectiveConfig.description} with ${perspectiveConfig.characteristics} for ${perspectiveConfig.use}. Set wall heights to ${heightConfig.value} (${heightConfig.description}) creating ${heightConfig.characteristics}. ${furnitureText}. ${decorationText}. Show three-dimensional volumes, spatial relationships, and architectural elements with proper perspective and technical accuracy using ${renderStyleConfig.description} (${renderStyleConfig.characteristics}). Maintain accurate floor plan proportions while creating a clear, readable, and professionally rendered 3D diagram.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('perspective', perspective);
    formData.append('height', height);
    formData.append('furnitureEnabled', furnitureEnabled.toString());
    formData.append('decorationEnabled', decorationEnabled.toString());
    formData.append('furnitureDecorStyle', furnitureDecorStyle);
    formData.append('renderStyle', renderStyle);
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate 3D diagram');
    }
    
    // Return result for base component to handle
    const data = Array.isArray(result.data) ? result.data[0] : result.data;
    return {
      success: true,
      data: {
        renderId: ('renderId' in data ? data.renderId : ('id' in data ? String(data.id) : '')) as string,
        outputUrl: (data.outputUrl || '') as string,
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
            {/* Row 1: Perspective Type | Render Style */}
            <div className="grid grid-cols-2 gap-4">
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
                  <SelectTrigger id="perspective" className="h-10 w-full">
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
                  <Label htmlFor="render-style" className="text-sm">Render Style</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose the rendering style. Line drawing: clear linework. Solid colours: filled shapes. Realistic: detailed rendering.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={renderStyle} onValueChange={(v: any) => setRenderStyle(v)}>
                  <SelectTrigger id="render-style" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line-drawing">Line Drawing</SelectItem>
                    <SelectItem value="solid-colours">Solid Colours</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Wall Height | Furniture & Decor Style */}
            <div className="grid grid-cols-2 gap-4">
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
                  <SelectTrigger id="height" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (2.4m)</SelectItem>
                    <SelectItem value="medium">Medium (3.0m)</SelectItem>
                    <SelectItem value="high">High (3.6m)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {furnitureEnabled && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Label htmlFor="furniture-decor-style" className="text-sm">Furniture & Decor Style</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Choose the style of furniture and decor. Contemporary: modern and clean. Classical: traditional and ornate. Mid-century modern: retro styling.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={furnitureDecorStyle} onValueChange={(v: any) => setFurnitureDecorStyle(v)}>
                    <SelectTrigger id="furniture-decor-style" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contemporary">Contemporary</SelectItem>
                      <SelectItem value="classical">Classical</SelectItem>
                      <SelectItem value="mid-century-modern">Mid-century Modern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Row 3: Furniture toggle | Decoration toggle */}
            <div className="grid grid-cols-2 gap-4">
              <LabeledToggle
                id="furniture"
                label="Furniture"
                checked={furnitureEnabled}
                onCheckedChange={setFurnitureEnabled}
                tooltip="Include furniture in the 3D diagram. When disabled, shows empty spaces only."
              />

              <LabeledToggle
                id="decoration"
                label="Decorations"
                checked={decorationEnabled}
                onCheckedChange={setDecorationEnabled}
                tooltip="Include decorative elements like plants, paintings, rugs, lamps, and lights in the 3D diagram"
              />
            </div>
          </div>
        </>
      }
    >
    </BaseToolComponent>
  );
}
