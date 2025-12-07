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

interface FloorplanToFurnishedProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function FloorplanToFurnished({ tool, projectId, onHintChange, hintMessage }: FloorplanToFurnishedProps) {
  const [furnitureStyle, setFurnitureStyle] = useState<'modern' | 'traditional' | 'minimalist' | 'luxury'>('modern');
  const [roomType, setRoomType] = useState<string>('living-room');

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
      'mixed': {
        furniture: 'appropriate furniture mix for multiple room types, flexible arrangements, multi-functional pieces',
        layout: 'zones for different functions, flexible circulation, adaptable spaces',
        elements: 'multiple functional zones, flexible furniture arrangements, adaptable layouts'
      }
    };

    const roomConfig = roomConfigs[roomType] || roomConfigs['living-room'];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural draftsman specializing in CAD-style floor plan furniture placement and interior design visualization.
</role>

<task>
Add appropriate furniture and interior elements to this empty floor plan in CAD architectural style. The furniture should match the ${furnitureStyle} style (${styleConfig.description}) and be appropriate for a ${roomType.replace('-', ' ')}. Maintain accurate scale, proportions, and CAD drawing conventions.
</task>

<constraints>
1. Output format: Generate a single CAD-style furnished floor plan image
2. Drawing style: Technical CAD linework with precise measurements, architectural annotations, and standard CAD conventions
3. Furniture style: ${furnitureStyle} - ${styleConfig.description}
4. Room type: ${roomType.replace('-', ' ')} - ${roomConfig.layout}
5. Furniture to include: ${roomConfig.furniture}
6. Materials and finishes: ${styleConfig.materials}
7. Scale and proportions: Maintain accurate architectural scale, proper furniture sizes relative to room dimensions, and realistic spatial relationships
8. CAD conventions: Use standard architectural floor plan symbols, line weights, and notation for furniture and fixtures
9. Layout principles: ${roomConfig.layout}
10. Functional elements: Include ${roomConfig.elements}
11. Do not: Distort scale, add furniture that doesn't fit the space, or violate architectural drawing standards
</constraints>

<output_requirements>
- Drawing type: CAD-style furnished floor plan
- Visual style: Technical CAD linework with standard architectural conventions
- Furniture style: ${furnitureStyle} - ${styleConfig.description}
- Room type: ${roomType.replace('-', ' ')}
- Furniture elements: ${roomConfig.furniture}
- Scale accuracy: Maintain proper architectural scale and realistic furniture proportions
- Professional quality: Suitable for design development, client presentations, and construction documentation
- CAD standards: Follow standard architectural floor plan conventions and symbols
</output_requirements>

<context>
Populate this empty floor plan with ${furnitureStyle} style furniture appropriate for a ${roomType.replace('-', ' ')}. The furniture should be drawn in CAD architectural style with proper scale, proportions, and standard architectural symbols. Include ${roomConfig.furniture} arranged according to ${roomConfig.layout} principles. Use ${styleConfig.materials} to represent the furniture style. Maintain the technical CAD drawing quality while showing a complete, functional, and well-designed interior layout.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('furnitureStyle', furnitureStyle);
    formData.append('roomType', roomType);
    
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
          <div className="space-y-3">
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
                <SelectTrigger id="furniture-style" className="h-10">
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
                <SelectTrigger id="room-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="living-room">Living Room</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="mixed">Mixed Use</SelectItem>
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
