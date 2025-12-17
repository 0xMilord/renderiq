'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Image as ImageIcon } from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';
import { LabeledSlider } from '../ui/labeled-slider';
import { StyleReferenceDialog } from '@/components/ui/style-reference-dialog';

interface PortfolioLayoutGeneratorProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function PortfolioLayoutGenerator({ tool, projectId, onHintChange, hintMessage }: PortfolioLayoutGeneratorProps) {
  const [layoutStyle, setLayoutStyle] = useState<'grid' | 'masonry' | 'linear' | 'magazine' | 'editorial' | 'hero-grid' | 'freeform'>('grid');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | 'neutral' | 'minimal'>('light');
  const [typographyStyle, setTypographyStyle] = useState<'minimal' | 'elegant' | 'bold' | 'none'>('minimal');
  const [imageEmphasis, setImageEmphasis] = useState<'balanced' | 'large' | 'small'>('balanced');
  const [spacing, setSpacing] = useState<number>(1);
  const [pageSize, setPageSize] = useState<'A4' | 'A3' | 'Letter' | 'Tabloid' | 'Custom'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [colorReferenceImage, setColorReferenceImage] = useState<File | null>(null);
  const [colorReferencePreview, setColorReferencePreview] = useState<string | null>(null);
  const [colorReferenceName, setColorReferenceName] = useState<string | null>(null);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const layoutConfigs = {
      'grid': {
        description: 'grid layout with uniform structure and organized presentation',
        characteristics: 'uniform grid structure, organized arrangement, balanced composition, clear structure, professional grid',
        use: 'organized portfolio, clear structure, balanced presentation'
      },
      'masonry': {
        description: 'masonry layout with varied image sizes and dynamic arrangement',
        characteristics: 'varied image sizes, dynamic arrangement, visual interest, organic flow, creative composition',
        use: 'dynamic portfolio, visual interest, creative presentation'
      },
      'linear': {
        description: 'linear layout with sequential arrangement and clear narrative flow',
        characteristics: 'sequential arrangement, clear flow, linear progression, narrative structure, story-telling',
        use: 'sequential portfolio, narrative flow, story-telling presentation'
      },
      'magazine': {
        description: 'magazine-style layout with editorial design and sophisticated composition',
        characteristics: 'editorial design, sophisticated composition, typography integration, professional layout, magazine aesthetic',
        use: 'editorial portfolio, sophisticated design, professional presentation'
      },
      'editorial': {
        description: 'editorial layout with high-end design and artistic composition',
        characteristics: 'high-end design, artistic composition, sophisticated typography, creative layout, editorial aesthetic',
        use: 'high-end portfolio, artistic presentation, sophisticated design'
      },
      'hero-grid': {
        description: 'hero + grid layout with prominent primary image and supporting grid',
        characteristics: 'prominent hero image, supporting grid arrangement, visual hierarchy, primary focus element',
        use: 'portfolio with focal point, hero image emphasis, structured supporting content'
      },
      'freeform': {
        description: 'freeform layout with creative, organic arrangement',
        characteristics: 'creative arrangement, organic flow, artistic composition, flexible placement',
        use: 'artistic portfolio, creative composition, flexible design'
      }
    };

    const pageSizeConfigs = {
      'A4': {
        dimensions: '210 × 297 mm (8.27 × 11.69 inches)',
        description: 'A4 size portfolio page',
        use: 'standard portfolio pages, digital portfolios, print portfolios'
      },
      'A3': {
        dimensions: '297 × 420 mm (11.69 × 16.54 inches)',
        description: 'A3 size portfolio page',
        use: 'large portfolio pages, print portfolios, presentations'
      },
      'Letter': {
        dimensions: '8.5 × 11 inches (216 × 279 mm)',
        description: 'Letter size portfolio page',
        use: 'US standard portfolio pages, print portfolios'
      },
      'Tabloid': {
        dimensions: '11 × 17 inches (279 × 432 mm)',
        description: 'Tabloid size portfolio page',
        use: 'large format portfolio pages, print portfolios'
      },
      'Custom': {
        dimensions: 'Custom dimensions based on content',
        description: 'Custom size portfolio page',
        use: 'flexible portfolio pages, custom dimensions'
      }
    };

    const colorConfigs = {
      'light': {
        description: 'light color scheme with bright backgrounds and clean appearance',
        characteristics: 'bright backgrounds, clean appearance, high contrast, professional light theme, fresh aesthetic'
      },
      'dark': {
        description: 'dark color scheme with sophisticated dark backgrounds',
        characteristics: 'dark backgrounds, sophisticated appearance, dramatic contrast, professional dark theme, elegant aesthetic'
      },
      'neutral': {
        description: 'neutral color scheme with balanced tones and versatile appearance',
        characteristics: 'balanced tones, neutral backgrounds, versatile appearance, professional neutral theme, timeless aesthetic'
      },
      'minimal': {
        description: 'minimal color scheme with white/light backgrounds and maximum focus on images',
        characteristics: 'white/light backgrounds, maximum image focus, minimal design, clean aesthetic, image-centric'
      }
    };

    const typographyConfigs = {
      'minimal': {
        description: 'minimal typography with subtle text and clean presentation',
        approach: 'use minimal, subtle typography with clean presentation and understated text elements'
      },
      'elegant': {
        description: 'elegant typography with sophisticated fonts and refined presentation',
        approach: 'use elegant, sophisticated typography with refined fonts and polished text presentation'
      },
      'bold': {
        description: 'bold typography with strong fonts and impactful presentation',
        approach: 'use bold, impactful typography with strong fonts and dynamic text presentation'
      },
      'none': {
        description: 'no typography, focusing purely on visual layout',
        approach: 'do not include typography - focus purely on visual layout and image composition'
      }
    };

    const emphasisConfigs = {
      'balanced': {
        description: 'balanced image sizes with equal emphasis on all images',
        approach: 'use balanced image sizes with equal emphasis, creating harmonious composition'
      },
      'large': {
        description: 'large image emphasis with prominent primary images',
        approach: 'emphasize large images with prominent primary images and supporting secondary images'
      },
      'small': {
        description: 'smaller image sizes with more images visible and compact presentation',
        approach: 'use smaller image sizes to show more images in compact, comprehensive presentation'
      }
    };

    const layoutConfig = layoutConfigs[layoutStyle];
    const colorConfig = colorConfigs[colorScheme];
    const typographyConfig = typographyConfigs[typographyStyle];
    const emphasisConfig = emphasisConfigs[imageEmphasis];
    const pageSizeConfig = pageSizeConfigs[pageSize];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert portfolio designer specializing in creating professional architectural portfolio layouts with proper typography, spacing, visual hierarchy, and design elements.
</role>

<task>
Generate a professional architectural portfolio layout that showcases these project images with proper typography, ${spacing}pt spacing, visual hierarchy, and design elements suitable for online or print portfolios. Use ${pageSize} size (${pageSizeConfig.dimensions}) in ${orientation} orientation with ${layoutStyle} layout (${layoutConfig.description})${colorReferenceImage ? ', extract color palette from the color reference image and apply it to the portfolio design' : ''}, ${colorScheme} color scheme (${colorConfig.description}), and ${typographyStyle} typography (${typographyConfig.description}).
</task>

<constraints>
1. Output format: Generate a single portfolio layout image
2. Layout style: ${layoutStyle} - ${layoutConfig.description}
3. Layout characteristics: ${layoutConfig.characteristics} for ${layoutConfig.use}
4. Color scheme: ${colorScheme} - ${colorConfig.description} with ${colorConfig.characteristics}
5. Typography: ${typographyStyle} - ${typographyConfig.description}
6. Typography approach: ${typographyConfig.approach}
7. Image emphasis: ${imageEmphasis} - ${emphasisConfig.description}
8. Emphasis approach: ${emphasisConfig.approach}
9. Page size: ${pageSize} - ${pageSizeConfig.dimensions} for ${pageSizeConfig.use}
10. Orientation: ${orientation} orientation with appropriate aspect ratio
11. Spacing: Use ${spacing}pt spacing between images, consistent margins, balanced composition, and proper white space
12. Color reference: ${colorReferenceImage ? 'Extract color palette from the color reference image and apply it to the portfolio design, background, borders, and design elements' : ''}
13. Visual hierarchy: Create clear visual hierarchy with primary and secondary focal points, proper image sizing, and strategic placement
14. Typography integration: ${typographyStyle !== 'none' ? 'Integrate typography professionally with proper hierarchy, readability, and design integration' : 'Focus on visual layout without typography'}
15. Professional quality: Suitable for online portfolios, print portfolios, and professional presentation
16. Design elements: Include appropriate design elements, borders, backgrounds, and visual enhancements
17. Portfolio standards: Follow professional portfolio design standards and best practices
18. Do not: Create cluttered layouts, ignore visual hierarchy, or violate portfolio design principles
</constraints>

<output_requirements>
- Page size: ${pageSize} - ${pageSizeConfig.dimensions}
- Orientation: ${orientation}
- Layout: ${layoutStyle} - ${layoutConfig.description}
- Color scheme: ${colorScheme} - ${colorConfig.description}
- Color reference: ${colorReferenceImage ? 'Extracted from reference image' : 'Not used'}
- Spacing: ${spacing}pt between images
- Typography: ${typographyStyle} - ${typographyConfig.description}
- Image emphasis: ${imageEmphasis} - ${emphasisConfig.description}
- Visual hierarchy: Clear primary and secondary focal points
- Professional quality: Suitable for online and print portfolios
- Design: Professional portfolio layout with proper visual hierarchy and composition
</output_requirements>

<context>
Generate a professional architectural portfolio layout showcasing these project images. Use ${pageSize} size (${pageSizeConfig.dimensions}) in ${orientation} orientation suitable for ${pageSizeConfig.use}. Use ${layoutStyle} layout with ${layoutConfig.description} showing ${layoutConfig.characteristics} for ${layoutConfig.use}. Apply ${colorScheme} color scheme with ${colorConfig.description} showing ${colorConfig.characteristics}${colorReferenceImage ? '. Extract color palette from the color reference image and apply it to the portfolio design, background, borders, and design elements' : ''}. ${typographyConfig.approach} for ${typographyConfig.description}. ${emphasisConfig.approach} to achieve ${emphasisConfig.description}. Create clear visual hierarchy with primary and secondary focal points, proper image sizing, and strategic placement. Use ${spacing}pt spacing between images, consistent margins, balanced composition, and proper white space. ${typographyStyle !== 'none' ? 'Integrate typography professionally with proper hierarchy, readability, and design integration' : 'Focus on visual layout without typography'}. Include appropriate design elements, borders, backgrounds, and visual enhancements. Follow professional portfolio design standards and best practices. Create a professional portfolio layout suitable for online portfolios, print portfolios, and professional presentation.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    formData.set('prompt', buildSystemPrompt());
    formData.append('layoutStyle', layoutStyle);
    formData.append('colorScheme', colorScheme);
    formData.append('typographyStyle', typographyStyle);
    formData.append('imageEmphasis', imageEmphasis);
    formData.append('spacing', spacing.toString());
    formData.append('pageSize', pageSize);
    formData.append('orientation', orientation);
    
    // Add color reference if provided
    if (colorReferenceImage) {
      formData.append('colorReference', 'custom');
      const colorImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(colorReferenceImage);
      });
      formData.append('colorReferenceImageData', colorImageBase64);
      formData.append('colorReferenceImageType', colorReferenceImage.type);
    } else if (colorReferenceName) {
      formData.append('colorReference', 'library');
      formData.append('colorReferenceName', colorReferenceName);
    }
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate portfolio layout');
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
            {/* Row 1: Layout Style | Color Scheme */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="layout-style" className="text-sm">Layout Style</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the portfolio layout. Grid: organized. Masonry: dynamic. Linear: sequential. Magazine: editorial. Editorial: high-end artistic. Hero + Grid: prominent focal image. Freeform: creative arrangement.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={layoutStyle} onValueChange={(v: any) => setLayoutStyle(v)}>
                  <SelectTrigger id="layout-style" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="magazine">Magazine</SelectItem>
                  <SelectItem value="editorial">Editorial</SelectItem>
                  <SelectItem value="hero-grid">Hero + Grid</SelectItem>
                  <SelectItem value="freeform">Freeform</SelectItem>
                </SelectContent>
              </Select>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="color-scheme" className="text-sm">Color Scheme</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select the color scheme. Light: bright. Dark: sophisticated. Neutral: balanced. Minimal: white/light with maximum image focus.</p>
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
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>

            {/* Row 2: Typography Style | Image Emphasis */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="typography-style" className="text-sm">Typography Style</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose typography style. Minimal: subtle. Elegant: sophisticated. Bold: impactful. None: visual-only layout.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={typographyStyle} onValueChange={(v: any) => setTypographyStyle(v)}>
                  <SelectTrigger id="typography-style" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="elegant">Elegant</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="none">None (Visual Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="image-emphasis" className="text-sm">Image Emphasis</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Control image sizing. Balanced: equal emphasis. Large: prominent primary images. Small: more images visible.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={imageEmphasis} onValueChange={(v: any) => setImageEmphasis(v)}>
                  <SelectTrigger id="image-emphasis" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="large">Large Emphasis</SelectItem>
                  <SelectItem value="small">Small (More Images)</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
          </div>
        </>
      }
    >
    </BaseToolComponent>
  );
}
