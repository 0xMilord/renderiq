'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpCircle } from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';
import { TOOL_CONTENT } from '@/lib/tools/tool-content';

interface RenderToCADProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

type DrawingType = 'floor-plan' | 'elevation' | 'section';
type ElevationSide = 'front' | 'back' | 'left' | 'right';

export function RenderToCAD({ tool, projectId, onHintChange, hintMessage }: RenderToCADProps) {
  const [selectedDrawings, setSelectedDrawings] = useState<Set<DrawingType>>(new Set(['floor-plan']));
  const [selectedElevationSides, setSelectedElevationSides] = useState<Set<ElevationSide>>(new Set(['front']));
  const [includeText, setIncludeText] = useState<boolean>(true);

  // Build system prompt for a specific drawing type and elevation side
  const buildSystemPrompt = (drawingType: DrawingType, elevationSide?: ElevationSide): string => {
    // Drawing type configurations
    const drawingTypeConfigs = {
      'floor-plan': {
        type: 'floor plan',
        role: 'expert architectural draftsman specializing in technical floor plan drawings',
        task: 'Transform the architectural render into a precise technical floor plan drawing showing spatial layout, room divisions, openings, and architectural elements',
        description: 'A top-down orthographic view showing the layout of spaces, rooms, walls, doors, windows, and other architectural elements as if viewed from above',
        elements: 'room boundaries, walls, doors, windows, openings, stairs, columns, structural elements, spatial relationships, and circulation paths',
        conventions: 'standard architectural floor plan conventions including wall thickness, door swings, window symbols, and room labels',
        focus: 'spatial accuracy, clear room definitions, and proper architectural notation'
      },
      'elevation': {
        type: `elevation drawing (${elevationSide || 'front'} elevation)`,
        role: 'expert architectural draftsman specializing in technical elevation drawings',
        task: `Transform the architectural render into a precise technical ${elevationSide || 'front'} elevation drawing showing the building facade, openings, and vertical elements`,
        description: `A vertical orthographic projection showing the ${elevationSide || 'front'} face of the building as if viewed perpendicular to that face`,
        elements: 'building facade, windows, doors, openings, vertical elements, roof lines, material changes, architectural details, and vertical dimensions',
        conventions: 'standard architectural elevation conventions including line weights for different elements, material representation, and vertical dimensioning',
        focus: 'vertical accuracy, facade details, and proper architectural elevation notation'
      },
      'section': {
        type: 'section drawing',
        role: 'expert architectural draftsman specializing in technical section drawings',
        task: 'Transform the architectural render into a precise technical section drawing showing the building cut through vertically to reveal interior structure',
        description: 'A vertical cut through the building showing interior structure, floor levels, ceiling heights, and spatial relationships',
        elements: 'structural elements, floor levels, ceiling heights, interior spaces, vertical circulation, building envelope, and dimensional relationships',
        conventions: 'standard architectural section conventions including cut lines, material hatching, and section notation',
        focus: 'structural accuracy, spatial relationships, and proper section drawing conventions'
      }
    };

    const config = drawingTypeConfigs[drawingType];
    
    // Elevation side description
    const elevationSideDescription = drawingType === 'elevation' && elevationSide
      ? ` Focus specifically on the ${elevationSide} elevation. If the input shows multiple sides, extract and create the ${elevationSide} elevation view.`
      : '';

    // Text inclusion settings
    const textInstruction = includeText 
      ? 'Include text labels, room names, dimensions, annotations, and technical notes as appropriate for the drawing type.'
      : 'DO NOT include any text labels, text annotations, or written text. Use ONLY annotation symbols, dimension lines, leader lines, and graphical symbols. Users will add clean, proper, editable text in post-processing.';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an ${config.role}.
</role>

<task>
${config.task}.${elevationSideDescription} The input may show any architectural content: whole buildings (any type or style), building components, interior spaces, exterior views, or detail views. Create an appropriate ${config.type} that accurately represents the architectural content shown.
</task>

<constraints>
1. Output format: Generate a single architectural ${config.type} image
2. Drawing type: ${config.description}
3. Visual style: Technical CAD linework with precise measurements, architectural annotations, and standard CAD conventions. Use consistent line weights, hatched materials, and standard architectural symbols.
4. Text and annotations: ${textInstruction}
5. Scale handling: Adapt to input scale - whole buildings show overall layout and relationships; components show detailed information; interiors show spatial relationships; details show element-specific information
6. Element recognition: Identify and represent visible architectural elements: ${config.elements}
7. Drawing conventions: Follow ${config.conventions}
8. Maintain: Architectural drafting standards, proper scale, accurate proportions, and professional presentation quality suitable for construction documentation and design presentations
9. Focus: ${config.focus}
10. Do not: Add elements not present in the original render, distort proportions, include photorealistic rendering elements, or create fabrication-level details when working with whole building renders
</constraints>

<output_requirements>
- Drawing type: ${config.type}
- Visual style: Technical CAD linework with precise measurements and standard architectural conventions
- Elements: ${config.elements}
- Technical accuracy: Must follow architectural drafting standards and CAD conventions
- Professional quality: Suitable for construction documentation, permit applications, shop drawings, and design presentations
- Scale appropriateness: Adapt to input scale - whole buildings show overall relationships; components show detailed information; interiors show spatial relationships
- Text handling: ${includeText ? 'Include appropriate text labels, dimensions, and annotations following standard architectural practice' : 'Use ONLY graphical symbols, dimension lines, leader lines, and annotation symbols. NO text labels or written annotations.'}
- Consistency: If generating multiple views (all elevations, comprehensive set), maintain consistent scale, line weights, and notation across all drawings
</output_requirements>

<context>
Convert the architectural render into a ${config.type} following technical CAD conventions. Work with any architectural content, building type, or style. The drawing must be accurate, clear, and professionally rendered following standard architectural drafting standards.${elevationSideDescription} ${includeText ? 'Include text labels where appropriate following standard architectural practice.' : 'Use only graphical symbols - users will add text in post-processing using CAD software.'}

Maintain the tool's general-purpose nature: it must work effectively with any architectural content, from small components to entire buildings, from any architectural style or building type.
</context>`;
  };

  // Build all requests for batch API
  const buildBatchRequests = (formData: FormData) => {
    const requests: Array<{ key: string; prompt: string; drawingType: string; elevationSide?: string }> = [];
    const uploadedImageData = formData.get('uploadedImageData') as string;
    const uploadedImageType = formData.get('uploadedImageType') as string;
    
    // Build requests for each selected drawing type
    selectedDrawings.forEach((drawingType) => {
      if (drawingType === 'elevation') {
        // For elevations, create a request for each selected side
        selectedElevationSides.forEach((side) => {
          const prompt = buildSystemPrompt('elevation', side);
          requests.push({
            key: `elevation-${side}`,
            prompt,
            drawingType: 'elevation',
            elevationSide: side
          });
        });
      } else {
        // For floor-plan and section, create single request
        const prompt = buildSystemPrompt(drawingType);
        requests.push({
          key: drawingType,
          prompt,
          drawingType
        });
      }
    });
    
    return requests;
  };

  const handleGenerate = async (formData: FormData) => {
    // Ensure at least one drawing type is selected
    if (selectedDrawings.size === 0) {
      throw new Error('Please select at least one drawing type');
    }
    
    // Check if we need batch API (multiple selections)
    const totalRequests = Array.from(selectedDrawings).reduce((count, type) => {
      return count + (type === 'elevation' ? selectedElevationSides.size : 1);
    }, 0);
    
    if (totalRequests > 1) {
      // Use batch API for multiple requests
      formData.append('useBatchAPI', 'true');
      formData.append('batchRequests', JSON.stringify(buildBatchRequests(formData)));
      formData.append('selectedDrawings', JSON.stringify(Array.from(selectedDrawings)));
      formData.append('selectedElevationSides', JSON.stringify(Array.from(selectedElevationSides)));
      // Set a default prompt for batch processing (will be overridden by batch requests)
      formData.set('prompt', 'Batch CAD generation');
    } else {
      // Single request - use regular API
      const drawingType = Array.from(selectedDrawings)[0];
      const elevationSide = drawingType === 'elevation' && selectedElevationSides.size > 0 
        ? Array.from(selectedElevationSides)[0] 
        : undefined;
      
      formData.set('prompt', buildSystemPrompt(drawingType, elevationSide));
    }
    
    formData.append('includeText', includeText.toString());
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate CAD drawing');
    }
    
    // Check if batch results (array) or single result
    if (totalRequests > 1 && Array.isArray(result.data)) {
      // Return array of results for batch processing
      return {
        success: true,
        data: result.data.map((item: any, idx: number) => {
          const drawingType = Array.from(selectedDrawings)[idx] || 'floor-plan';
          const elevationSide = drawingType === 'elevation' && idx < selectedElevationSides.size 
            ? Array.from(selectedElevationSides)[idx] 
            : undefined;
          
          return {
            renderId: ('renderId' in item ? item.renderId : ('id' in item ? String(item.id) : '')) as string,
            outputUrl: (item.outputUrl || '') as string,
            label: drawingType === 'elevation' && elevationSide
              ? `${drawingType.charAt(0).toUpperCase() + drawingType.slice(1)} - ${elevationSide.charAt(0).toUpperCase() + elevationSide.slice(1)}`
              : drawingType === 'floor-plan' ? 'Floor Plan' 
              : drawingType === 'section' ? 'Section'
              : 'Elevation'
          };
        }),
      };
    }
    
    // Return single result for base component to handle
    const drawingType = Array.from(selectedDrawings)[0];
    const elevationSide = drawingType === 'elevation' && selectedElevationSides.size > 0 
      ? Array.from(selectedElevationSides)[0] 
      : undefined;
    
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
          {/* Drawing Types and Text Labels - Same Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Drawing Types</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select one or more CAD drawing types. Multiple selections will generate all selected drawings using batch processing.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="include-text-cad" className="text-sm">Include Text Labels</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">When enabled, text labels and annotations are included. When disabled, only graphical symbols are used for post-processing text addition.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {(['floor-plan', 'elevation', 'section'] as DrawingType[]).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`drawing-${type}`}
                    checked={selectedDrawings.has(type)}
                    onCheckedChange={(checked) => {
                      const newSet = new Set(selectedDrawings);
                      if (checked) {
                        newSet.add(type);
                      } else {
                        newSet.delete(type);
                      }
                      setSelectedDrawings(newSet);
                    }}
                  />
                  <Label
                    htmlFor={`drawing-${type}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {type === 'floor-plan' ? 'Floor Plan' : type === 'elevation' ? 'Elevation' : 'Section'}
                  </Label>
                </div>
              ))}
              
              {/* Include Text Labels Switch - Right aligned */}
              <div className="ml-auto">
                <Switch
                  id="include-text-cad"
                  checked={includeText}
                  onCheckedChange={setIncludeText}
                />
              </div>
            </div>
          </div>

          {/* Elevation Sides - Show only when Elevation is selected */}
          {selectedDrawings.has('elevation') && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Elevation Sides</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select which building facades to generate. Front is typically the main entrance, Back is opposite, Left/Right are side elevations.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-4">
                {(['front', 'back', 'left', 'right'] as ElevationSide[]).map((side) => (
                  <div key={side} className="flex items-center space-x-2">
                    <Checkbox
                      id={`elevation-${side}`}
                      checked={selectedElevationSides.has(side)}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(selectedElevationSides);
                        if (checked) {
                          newSet.add(side);
                        } else {
                          newSet.delete(side);
                        }
                        // Ensure at least one side is selected
                        if (newSet.size === 0) {
                          newSet.add('front');
                        }
                        setSelectedElevationSides(newSet);
                      }}
                    />
                    <Label
                      htmlFor={`elevation-${side}`}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {side}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      }
    >
      <Card className="h-full border-2 hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2.5">
            {(TOOL_CONTENT['render-to-cad']?.howItWorks.steps || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 pt-0.5">
                  <span className="font-medium text-foreground">{item.step}:</span>
                  <span className="text-muted-foreground ml-1">{item.detail}</span>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
