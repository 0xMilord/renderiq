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
import { LabeledToggle } from '../ui/labeled-toggle';

interface FloorplanToFurnishedProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function FloorplanToFurnished({ tool, projectId, onHintChange, hintMessage }: FloorplanToFurnishedProps) {
  const [furnitureStyle, setFurnitureStyle] = useState<'modern' | 'traditional' | 'minimalist' | 'luxury'>('modern');
  const [roomType, setRoomType] = useState<string>('living-room');
  const [presentationStyle, setPresentationStyle] = useState<'sketched-outline' | 'solid-draft' | 'solid-colours' | 'realistic-plan'>('solid-draft');
  const [decorativeDetails, setDecorativeDetails] = useState<boolean>(true);
  const [lod, setLod] = useState<'low' | 'medium' | 'high'>('medium');
  const [shadows, setShadows] = useState<boolean>(true);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    // Furniture style configurations
    const styleConfigs = {
      'modern': {
        description: 'contemporary, clean-lined furniture with minimalist aesthetics, neutral colors, and functional design',
        furniture: 'sofas with clean lines, modern coffee tables, minimalist shelving, contemporary lighting fixtures, sleek dining sets',
        materials: 'glass, metal, engineered wood, neutral fabrics, polished surfaces'
      },
      'traditional': {
        description: 'classic, ornate furniture with rich details, warm colors, and timeless design elements',
        furniture: 'upholstered sofas, ornate coffee tables, classic bookshelves, traditional lighting, formal dining sets',
        materials: 'solid wood, rich fabrics, brass accents, warm tones, detailed craftsmanship'
      },
      'minimalist': {
        description: 'ultra-clean, sparse furniture arrangement with essential pieces only, neutral palette, and open space emphasis',
        furniture: 'minimal seating, simple tables, hidden storage, integrated lighting, essential pieces only',
        materials: 'natural materials, neutral colors, simple forms, uncluttered spaces'
      },
      'luxury': {
        description: 'high-end, premium furniture with sophisticated design, rich materials, and elegant details',
        furniture: 'luxury sofas, designer coffee tables, premium shelving, statement lighting, high-end dining sets',
        materials: 'premium leather, exotic woods, marble, high-end fabrics, luxury finishes'
      }
    };

    const styleConfig = styleConfigs[furnitureStyle];

    // Room type configurations
    const roomConfigs: Record<string, { furniture: string; layout: string; elements: string }> = {
      'living-room': {
        furniture: 'sofa, coffee table, armchairs, TV stand or media console, side tables, lighting fixtures',
        layout: 'conversation area with seating arranged around focal point, clear circulation paths, functional zones',
        elements: 'seating groups, entertainment area, reading nook, display areas'
      },
      'bedroom': {
        furniture: 'bed, nightstands, dresser, wardrobe or closet, seating area, lighting',
        layout: 'bed as focal point, clear pathways, storage solutions, functional zones',
        elements: 'sleeping area, storage, dressing area, relaxation space'
      },
      'kitchen': {
        furniture: 'dining table, chairs, kitchen island or peninsula seating, storage solutions, lighting',
        layout: 'functional kitchen layout with dining area, clear work triangles, efficient circulation',
        elements: 'cooking area, dining space, storage, preparation zones'
      },
      'office': {
        furniture: 'desk, office chair, storage cabinets, bookshelves, seating area, lighting',
        layout: 'functional workspace with clear work area, storage solutions, meeting space',
        elements: 'workstation, storage, meeting area, display space'
      },
      'reception-lobby': {
        furniture: 'reception desk, seating area, waiting chairs, display cases, information boards, lighting fixtures',
        layout: 'welcoming entrance area with clear circulation, reception focal point, waiting zones',
        elements: 'reception area, waiting space, display areas, information zones'
      },
      'factory': {
        furniture: 'workstations, machinery placement areas, storage racks, safety equipment zones, break areas',
        layout: 'efficient production flow, clear safety zones, storage areas, circulation paths',
        elements: 'production zones, storage areas, safety zones, break areas'
      },
      'gym': {
        furniture: 'exercise equipment zones, free weights area, cardio machines, stretching area, storage lockers',
        layout: 'functional exercise zones with clear circulation, equipment placement, safety spacing',
        elements: 'cardio zone, strength training zone, stretching area, storage'
      },
      'verandah': {
        furniture: 'outdoor seating, tables, planters, decorative elements, lighting fixtures',
        layout: 'outdoor living space with seating arrangements, circulation paths, decorative zones',
        elements: 'seating area, dining space, plant areas, decorative features'
      },
      'mixed': {
        furniture: 'appropriate furniture mix for multiple room types, flexible arrangements, multi-functional pieces',
        layout: 'zones for different functions, flexible circulation, adaptable spaces',
        elements: 'multiple functional zones, flexible furniture arrangements, adaptable layouts'
      }
    };

    const presentationStyleConfigs = {
      'sketched-outline': {
        description: 'sketched outline style with hand-drawn linework and sketchy character',
        characteristics: 'hand-drawn lines, sketchy outlines, artistic linework, loose drawing style'
      },
      'solid-draft': {
        description: 'solid draft style with clean technical linework and filled shapes',
        characteristics: 'clean technical lines, solid filled shapes, professional draft quality, clear linework'
      },
      'solid-colours': {
        description: 'solid colours style with filled shapes and color representation',
        characteristics: 'solid color fills, clear shape definition, color-coded elements, vibrant presentation'
      },
      'realistic-plan': {
        description: 'realistic plan style with detailed rendering and photorealistic quality',
        characteristics: 'detailed rendering, realistic textures, photorealistic quality, comprehensive detail'
      }
    };

    const lodConfigs = {
      'low': { description: 'low level of detail with simplified furniture representations', detail: 'simplified furniture shapes, basic outlines, minimal detail' },
      'medium': { description: 'medium level of detail with standard furniture representations', detail: 'standard furniture detail, clear shapes, moderate detail' },
      'high': { description: 'high level of detail with comprehensive furniture representations', detail: 'detailed furniture, comprehensive elements, maximum detail' }
    };

    const presentationStyleConfig = presentationStyleConfigs[presentationStyle];
    const lodConfig = lodConfigs[lod];

    const roomConfig = roomConfigs[roomType] || roomConfigs['living-room'];

    const decorativeDetailsText = decorativeDetails 
      ? 'Include decorative details: plants, rugs, lamps, table décor, and decorative accessories appropriate for the space'
      : 'Do not include decorative details - focus on essential furniture and functional elements only';

    const shadowsText = shadows
      ? 'Include shadows cast by furniture and elements to show depth and spatial relationships'
      : 'Do not include shadows - use flat representation without shadow effects';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural draftsman specializing in CAD-style floor plan furniture placement and interior design visualization.
</role>

<task>
Add appropriate furniture and interior elements to this empty floor plan in ${presentationStyleConfig.description} style. The furniture should match the ${furnitureStyle} style (${styleConfig.description}) and be appropriate for a ${roomType.replace('-', ' ')}. Use ${lodConfig.description} (${lodConfig.detail}). ${decorativeDetailsText}. ${shadowsText}. Maintain accurate scale, proportions, and CAD drawing conventions.
</task>

<constraints>
1. Output format: Generate a single furnished floor plan image
2. Presentation style: ${presentationStyle} - ${presentationStyleConfig.description}
3. Presentation characteristics: ${presentationStyleConfig.characteristics}
4. Drawing style: ${presentationStyleConfig.description} with ${presentationStyleConfig.characteristics}
5. Furniture style: ${furnitureStyle} - ${styleConfig.description}
6. Room type: ${roomType.replace('-', ' ')} - ${roomConfig.layout}
7. Level of detail: ${lod} - ${lodConfig.description} (${lodConfig.detail})
8. Furniture to include: ${roomConfig.furniture}
9. Materials and finishes: ${styleConfig.materials}
10. Decorative details: ${decorativeDetails ? 'Include plants, rugs, lamps, table décor, and decorative accessories' : 'Exclude decorative details - essential furniture only'}
11. Shadows: ${shadows ? 'Include shadows for depth and spatial relationships' : 'No shadows - flat representation'}
12. Scale and proportions: Maintain accurate architectural scale, proper furniture sizes relative to room dimensions, and realistic spatial relationships
13. CAD conventions: Use standard architectural floor plan symbols, line weights, and notation for furniture and fixtures
14. Layout principles: ${roomConfig.layout}
15. Functional elements: Include ${roomConfig.elements}
16. Do not: Distort scale, add furniture that doesn't fit the space, or violate architectural drawing standards
</constraints>

<output_requirements>
- Drawing type: Furnished floor plan in ${presentationStyleConfig.description} style
- Visual style: ${presentationStyleConfig.description} with ${presentationStyleConfig.characteristics}
- Furniture style: ${furnitureStyle} - ${styleConfig.description}
- Room type: ${roomType.replace('-', ' ')}
- Level of detail: ${lod} - ${lodConfig.description}
- Furniture elements: ${roomConfig.furniture}
- Decorative details: ${decorativeDetails ? 'Included' : 'Excluded'}
- Shadows: ${shadows ? 'Included' : 'Excluded'}
- Scale accuracy: Maintain proper architectural scale and realistic furniture proportions
- Professional quality: Suitable for design development, client presentations, and construction documentation
- Drawing standards: Follow appropriate architectural floor plan conventions and symbols for ${presentationStyle} style
</output_requirements>

<context>
Populate this empty floor plan with ${furnitureStyle} style furniture appropriate for a ${roomType.replace('-', ' ')}. Use ${presentationStyleConfig.description} (${presentationStyleConfig.characteristics}) for the presentation style. Apply ${lodConfig.description} - ${lodConfig.detail}. ${decorativeDetailsText}. ${shadowsText}. The furniture should be drawn with proper scale, proportions, and standard architectural symbols. Include ${roomConfig.furniture} arranged according to ${roomConfig.layout} principles. Use ${styleConfig.materials} to represent the furniture style. Maintain the ${presentationStyleConfig.description} quality while showing a complete, functional, and well-designed interior layout.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('furnitureStyle', furnitureStyle);
    formData.append('roomType', roomType);
    formData.append('presentationStyle', presentationStyle);
    formData.append('decorativeDetails', decorativeDetails.toString());
    formData.append('lod', lod);
    formData.append('shadows', shadows.toString());
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate furnished floor plan');
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
            {/* Row 1: Furniture Style | Presentation Style */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="furniture-style" className="text-sm">Furniture Style</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose the furniture style to populate the floor plan. Modern: clean and contemporary. Traditional: classic and ornate. Minimalist: sparse and essential. Luxury: high-end and premium.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={furnitureStyle} onValueChange={(v: any) => setFurnitureStyle(v)}>
                  <SelectTrigger id="furniture-style" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="traditional">Traditional</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="presentation-style" className="text-sm">Furniture Graphics</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose how furniture is presented. Sketched outline: hand-drawn style. Solid draft: clean technical lines. Solid colours: filled shapes. Realistic plan: detailed rendering.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={presentationStyle} onValueChange={(v: any) => setPresentationStyle(v)}>
                  <SelectTrigger id="presentation-style" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sketched-outline">Sketched Outline</SelectItem>
                    <SelectItem value="solid-draft">Solid Draft</SelectItem>
                    <SelectItem value="solid-colours">Solid Colours</SelectItem>
                    <SelectItem value="realistic-plan">Realistic Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Room Type | LOD */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="room-type" className="text-sm">Room Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Select the room type to determine appropriate furniture and layout. Mixed Use allows for flexible multi-functional spaces.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger id="room-type" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="living-room">Living Room</SelectItem>
                    <SelectItem value="bedroom">Bedroom</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="reception-lobby">Reception Lobby</SelectItem>
                    <SelectItem value="factory">Factory</SelectItem>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="verandah">Verandah</SelectItem>
                    <SelectItem value="mixed">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="lod" className="text-sm">Level of Detail (LOD)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Control the level of detail in furniture representation. Low: simplified shapes. Medium: standard detail. High: comprehensive detail.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={lod} onValueChange={(v: any) => setLod(v)}>
                  <SelectTrigger id="lod" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Decorative Details | Shadows */}
            <div className="grid grid-cols-2 gap-4">
              <LabeledToggle
                id="decorative-details"
                label="Decorative Details"
                checked={decorativeDetails}
                onCheckedChange={setDecorativeDetails}
                tooltip="Include decorative elements like plants, rugs, lamps, and table décor in the floor plan"
              />

              <LabeledToggle
                id="shadows"
                label="Shadows"
                checked={shadows}
                onCheckedChange={setShadows}
                tooltip="Include shadows cast by furniture and elements to show depth and spatial relationships"
              />
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
            <li>Upload your empty floor plan</li>
            <li>Choose furniture style and room type</li>
            <li>Generate furnished floor plan</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
