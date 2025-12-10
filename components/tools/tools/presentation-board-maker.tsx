'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';

interface PresentationBoardMakerProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function PresentationBoardMaker({ tool, projectId, onHintChange, hintMessage }: PresentationBoardMakerProps) {
  const [boardSize, setBoardSize] = useState<'A3' | 'A2' | 'A1' | 'A0'>('A2');
  const [layoutStyle, setLayoutStyle] = useState<'grid' | 'masonry' | 'linear' | 'asymmetric' | 'magazine'>('grid');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'neutral' | 'custom'>('light');
  const [includeAnnotations, setIncludeAnnotations] = useState<boolean>(true);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const sizeConfigs = {
      'A3': {
        dimensions: '297 × 420 mm (11.7 × 16.5 inches)',
        description: 'A3 size presentation board',
        use: 'small presentations, portfolio pages, design studies'
      },
      'A2': {
        dimensions: '420 × 594 mm (16.5 × 23.4 inches)',
        description: 'A2 size presentation board',
        use: 'standard presentations, client meetings, design reviews'
      },
      'A1': {
        dimensions: '594 × 841 mm (23.4 × 33.1 inches)',
        description: 'A1 size presentation board',
        use: 'large presentations, exhibitions, detailed design reviews'
      },
      'A0': {
        dimensions: '841 × 1189 mm (33.1 × 46.8 inches)',
        description: 'A0 size presentation board',
        use: 'poster presentations, exhibitions, large format displays'
      }
    };

    const layoutConfigs = {
      'grid': {
        description: 'grid layout with uniform image sizes and organized structure',
        characteristics: 'uniform grid structure, organized arrangement, balanced composition, clear structure',
        use: 'organized presentation, clear structure, balanced composition'
      },
      'masonry': {
        description: 'masonry layout with varied image sizes and dynamic arrangement',
        characteristics: 'varied image sizes, dynamic arrangement, visual interest, organic flow',
        use: 'dynamic presentation, visual interest, creative composition'
      },
      'linear': {
        description: 'linear layout with sequential arrangement and clear flow',
        characteristics: 'sequential arrangement, clear flow, linear progression, narrative structure',
        use: 'sequential presentation, narrative flow, story-telling composition'
      },
      'asymmetric': {
        description: 'asymmetric layout with dynamic balance and creative arrangement',
        characteristics: 'dynamic balance, creative arrangement, visual hierarchy, artistic composition',
        use: 'creative presentation, artistic composition, dynamic visual hierarchy'
      },
      'magazine': {
        description: 'magazine-style layout with editorial design and sophisticated composition',
        characteristics: 'editorial design, sophisticated composition, typography integration, professional layout',
        use: 'editorial presentation, sophisticated design, professional portfolio'
      }
    };

    const colorConfigs = {
      'light': {
        description: 'light color scheme with bright backgrounds and high contrast',
        characteristics: 'bright backgrounds, high contrast, clean appearance, professional light theme'
      },
      'dark': {
        description: 'dark color scheme with dark backgrounds and dramatic contrast',
        characteristics: 'dark backgrounds, dramatic contrast, sophisticated appearance, professional dark theme'
      },
      'neutral': {
        description: 'neutral color scheme with balanced tones and professional appearance',
        characteristics: 'balanced tones, neutral backgrounds, professional appearance, versatile theme'
      },
      'custom': {
        description: 'custom color scheme derived from image colors',
        characteristics: 'image-derived colors, harmonious palette, cohesive appearance, custom theme'
      }
    };

    const sizeConfig = sizeConfigs[boardSize];
    const layoutConfig = layoutConfigs[layoutStyle];
    const colorConfig = colorConfigs[colorScheme];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural presentation designer specializing in creating professional presentation boards with proper visual hierarchy, layout, and design elements.
</role>

<task>
Create a professional architectural presentation board layout with these images, arranging them with proper visual hierarchy, spacing, annotations, and design elements suitable for client presentations or portfolio display. Use ${sizeConfig.description} (${sizeConfig.dimensions}) with ${layoutStyle} layout (${layoutConfig.description}) and ${colorScheme} color scheme (${colorConfig.description}).
</task>

<constraints>
1. Output format: Generate a single presentation board image
2. Board size: ${boardSize} - ${sizeConfig.dimensions} for ${sizeConfig.use}
3. Layout style: ${layoutStyle} - ${layoutConfig.description}
4. Layout characteristics: ${layoutConfig.characteristics} for ${layoutConfig.use}
5. Color scheme: ${colorScheme} - ${colorConfig.description} with ${colorConfig.characteristics}
6. Visual hierarchy: Create clear visual hierarchy with primary and secondary focal points, proper image sizing, and strategic placement
7. Spacing: Use professional spacing between images, consistent margins, and balanced composition
8. Annotations: ${includeAnnotations ? 'Include appropriate annotations, labels, titles, and text elements following architectural presentation standards' : 'Do not include annotations or text - use only visual layout and design elements'}
9. Typography: ${includeAnnotations ? 'Use professional typography for titles, labels, and annotations with proper hierarchy and readability' : 'Focus on visual composition without typography'}
10. Image arrangement: Arrange images using ${layoutConfig.characteristics} to create ${layoutConfig.use}
11. Professional quality: Suitable for ${sizeConfig.use} with print-ready quality
12. Design elements: Include appropriate design elements, borders, backgrounds, and visual enhancements
13. Do not: Create cluttered layouts, ignore visual hierarchy, or violate presentation design principles
</constraints>

<output_requirements>
- Board size: ${boardSize} - ${sizeConfig.dimensions}
- Layout: ${layoutStyle} - ${layoutConfig.description}
- Color scheme: ${colorScheme} - ${colorConfig.description}
- Visual hierarchy: Clear primary and secondary focal points
- Annotations: ${includeAnnotations ? 'Include professional annotations and labels' : 'Visual layout only, no annotations'}
- Professional quality: Print-ready quality suitable for ${sizeConfig.use}
- Design: Professional presentation board with proper visual hierarchy and composition
</output_requirements>

<context>
Create a professional architectural presentation board with these images. Use ${sizeConfig.description} (${sizeConfig.dimensions}) suitable for ${sizeConfig.use}. Arrange images using ${layoutStyle} layout with ${layoutConfig.description} showing ${layoutConfig.characteristics} for ${layoutConfig.use}. Apply ${colorScheme} color scheme with ${colorConfig.description} showing ${colorConfig.characteristics}. Create clear visual hierarchy with primary and secondary focal points, proper image sizing, and strategic placement. Use professional spacing between images, consistent margins, and balanced composition. ${includeAnnotations ? 'Include appropriate annotations, labels, titles, and text elements following architectural presentation standards with professional typography for proper hierarchy and readability' : 'Focus on visual composition without annotations or typography'}. Include appropriate design elements, borders, backgrounds, and visual enhancements. Create a professional, print-ready presentation board suitable for ${sizeConfig.use}.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    formData.set('prompt', buildSystemPrompt());
    formData.append('boardSize', boardSize);
    formData.append('layoutStyle', layoutStyle);
    formData.append('colorScheme', colorScheme);
    formData.append('includeAnnotations', includeAnnotations.toString());
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create presentation board');
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
      multipleImages={true}
      maxImages={10}
      customSettings={
        <>
          <div className="space-y-4">
            {/* Row 1: Board Size | Layout Style */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="board-size" className="text-sm">Board Size</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select the presentation board size. A3: small presentations. A2: standard. A1: large. A0: poster size.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={boardSize} onValueChange={(v: any) => setBoardSize(v)}>
                  <SelectTrigger id="board-size" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
                  <SelectItem value="A2">A2 (420 × 594 mm)</SelectItem>
                  <SelectItem value="A1">A1 (594 × 841 mm)</SelectItem>
                  <SelectItem value="A0">A0 (841 × 1189 mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="layout-style" className="text-sm">Layout Style</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the layout arrangement. Grid: uniform organized. Masonry: varied dynamic. Linear: sequential flow. Asymmetric: creative balance. Magazine: editorial style.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={layoutStyle} onValueChange={(v: any) => setLayoutStyle(v)}>
                  <SelectTrigger id="layout-style" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid Layout</SelectItem>
                  <SelectItem value="masonry">Masonry Layout</SelectItem>
                  <SelectItem value="linear">Linear Layout</SelectItem>
                  <SelectItem value="asymmetric">Asymmetric Layout</SelectItem>
                  <SelectItem value="magazine">Magazine Style</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>

            {/* Row 2: Color Scheme | Include Annotations */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="color-scheme" className="text-sm">Color Scheme</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select the color scheme for the board background and design elements. Custom derives colors from your images.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={colorScheme} onValueChange={(v: any) => setColorScheme(v)}>
                  <SelectTrigger id="color-scheme" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="custom">Custom (From Images)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="include-annotations" className="text-sm">Include Annotations</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">When enabled, adds labels, titles, and annotations. When disabled, creates visual-only layout without text.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={includeAnnotations ? 'yes' : 'no'} onValueChange={(v) => setIncludeAnnotations(v === 'yes')}>
                  <SelectTrigger id="include-annotations" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes (Include)</SelectItem>
                  <SelectItem value="no">No (Visual Only)</SelectItem>
                </SelectContent>
              </Select>
              </div>
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
            <li>Upload multiple render images (up to 10)</li>
            <li>Choose board size, layout style, and color scheme</li>
            <li>Select annotation preferences</li>
            <li>Generate professional presentation board</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
