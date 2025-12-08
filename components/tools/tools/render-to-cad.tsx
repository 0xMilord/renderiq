'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle, Image as ImageIcon } from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';
import { TOOL_CONTENT } from '@/lib/tools/tool-content';
import { StyleReferenceDialog } from '@/components/ui/style-reference-dialog';

interface RenderToCADProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

type FloorPlanType = 'normal-floor-plan' | 'reflected-ceiling-plan';
type ElevationSide = 'front' | 'back' | 'left' | 'right';
type SectionCutDirection = 'latitudinal' | 'longitudinal';

export function RenderToCAD({ tool, projectId, onHintChange, hintMessage }: RenderToCADProps) {
  const [selectedFloorPlans, setSelectedFloorPlans] = useState<Set<FloorPlanType>>(new Set(['normal-floor-plan']));
  const [selectedElevationSides, setSelectedElevationSides] = useState<Set<ElevationSide>>(new Set(['front']));
  const [selectedSectionCuts, setSelectedSectionCuts] = useState<Set<SectionCutDirection>>(new Set(['longitudinal']));
  const [includeText, setIncludeText] = useState<boolean>(true);
  const [style, setStyle] = useState<string>('technical');
  const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
  const [styleReferenceName, setStyleReferenceName] = useState<string | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  // Calculate total number of drawings to generate
  // Supports up to 8+ drawings: 2 floor plans + 4 elevations + 2 sections = 8 total
  // Infrastructure supports unlimited batch size via async processing
  const calculateTotalDrawings = (): number => {
    return selectedFloorPlans.size + selectedElevationSides.size + selectedSectionCuts.size;
  };

  // Calculate credits cost: total drawings × quality multiplier
  // Base: 5 credits per drawing
  // Quality multipliers: standard (1x), high (2x), ultra (3x)
  // This function is passed to BaseToolComponent and called with the current quality setting
  const calculateCreditsCost = (quality: 'standard' | 'high' | 'ultra'): number => {
    const totalDrawings = calculateTotalDrawings();
    const baseCreditsPerDrawing = 5;
    const qualityMultiplier = quality === 'high' ? 2 : quality === 'ultra' ? 3 : 1;
    return totalDrawings * baseCreditsPerDrawing * qualityMultiplier;
  };

  // Build system prompt for a specific drawing type
  const buildSystemPrompt = (
    drawingType: 'floor-plan' | 'elevation' | 'section',
    floorPlanType?: FloorPlanType,
    elevationSide?: ElevationSide,
    sectionCutDirection?: SectionCutDirection,
    styleRefImage?: File | null,
    styleRefName?: string | null,
    includeTextParam?: boolean
  ): string => {
    // Use passed parameter or fallback to state
    const shouldIncludeText = includeTextParam !== undefined ? includeTextParam : includeText;
    
    // Drawing type configurations - notation references are conditional based on text inclusion
    const drawingTypeConfigs = {
      'floor-plan': {
        'normal-floor-plan': {
          type: 'normal floor plan',
          role: 'expert architectural draftsman specializing in technical floor plan drawings',
          task: 'Transform the architectural render into a precise technical normal floor plan drawing showing spatial layout, room divisions, openings, and architectural elements as viewed from above',
          description: 'A top-down orthographic view showing the layout of spaces, rooms, walls, doors, windows, and other architectural elements as if viewed from above',
          elements: 'room boundaries, walls, doors, windows, openings, stairs, columns, structural elements, spatial relationships, and circulation paths',
          conventions: shouldIncludeText 
            ? 'standard architectural floor plan conventions including wall thickness, door swings, window symbols, and room labels'
            : 'standard architectural floor plan conventions including wall thickness, door swings, window symbols, and graphical symbols (NO text labels)',
          focus: shouldIncludeText
            ? 'spatial accuracy, clear room definitions, and proper architectural notation'
            : 'spatial accuracy, clear room definitions, and graphical symbols only (NO text)'
        },
        'reflected-ceiling-plan': {
          type: 'reflected ceiling plan',
          role: 'expert architectural draftsman specializing in technical reflected ceiling plan drawings',
          task: 'Transform the architectural render into a precise technical reflected ceiling plan drawing showing ceiling layout, lighting fixtures, HVAC elements, and overhead architectural features',
          description: 'A top-down orthographic view showing the ceiling as if reflected in a mirror on the floor, displaying ceiling layout, lighting, HVAC, and overhead elements',
          elements: 'ceiling boundaries, lighting fixtures, HVAC diffusers, ceiling materials, overhead architectural features, and ceiling-mounted elements',
          conventions: shouldIncludeText
            ? 'standard architectural reflected ceiling plan conventions including lighting symbols, HVAC symbols, and ceiling material representation'
            : 'standard architectural reflected ceiling plan conventions including lighting symbols, HVAC symbols, and ceiling material representation (NO text labels)',
          focus: shouldIncludeText
            ? 'ceiling layout accuracy, lighting placement, and proper RCP notation'
            : 'ceiling layout accuracy, lighting placement, and graphical symbols only (NO text)'
        }
      },
      'elevation': {
        type: `elevation drawing (${elevationSide || 'front'} elevation)`,
        role: 'expert architectural draftsman specializing in technical elevation drawings',
        task: `Transform the architectural render into a precise technical ${elevationSide || 'front'} elevation drawing showing the building facade, openings, and vertical elements`,
        description: `A vertical orthographic projection showing the ${elevationSide || 'front'} face of the building as if viewed perpendicular to that face`,
        elements: 'building facade, windows, doors, openings, vertical elements, roof lines, material changes, architectural details, and vertical dimensions',
        conventions: shouldIncludeText
          ? 'standard architectural elevation conventions including line weights for different elements, material representation, and vertical dimensioning'
          : 'standard architectural elevation conventions including line weights for different elements, material representation, and graphical dimension lines (NO dimension text or numbers)',
        focus: shouldIncludeText
          ? 'vertical accuracy, facade details, and proper architectural elevation notation'
          : 'vertical accuracy, facade details, and graphical symbols only (NO text)'
      },
      'section': {
        type: `section drawing (${sectionCutDirection || 'longitudinal'} cut)`,
        role: 'expert architectural draftsman specializing in technical section drawings',
        task: `Transform the architectural render into a precise technical section drawing showing the building cut through ${sectionCutDirection === 'latitudinal' ? 'latitudinally (across the width)' : 'longitudinally (along the length)'} to reveal interior structure`,
        description: `A vertical cut through the building ${sectionCutDirection === 'latitudinal' ? 'across the width (latitudinal)' : 'along the length (longitudinal)'} showing interior structure, floor levels, ceiling heights, and spatial relationships`,
        elements: 'structural elements, floor levels, ceiling heights, interior spaces, vertical circulation, building envelope, and dimensional relationships',
        conventions: shouldIncludeText
          ? 'standard architectural section conventions including cut lines, material hatching, and section notation'
          : 'standard architectural section conventions including cut lines, material hatching, and graphical symbols (NO text)',
        focus: shouldIncludeText
          ? 'structural accuracy, spatial relationships, and proper section drawing conventions'
          : 'structural accuracy, spatial relationships, and graphical symbols only (NO text)'
      }
    };

    let config: any;
    if (drawingType === 'floor-plan' && floorPlanType) {
      config = drawingTypeConfigs['floor-plan'][floorPlanType];
    } else if (drawingType === 'elevation') {
      config = drawingTypeConfigs['elevation'];
    } else if (drawingType === 'section') {
      config = drawingTypeConfigs['section'];
    } else {
      // Fallback
      config = drawingTypeConfigs['floor-plan']['normal-floor-plan'];
    }
    
    // Elevation side description
    const elevationSideDescription = drawingType === 'elevation' && elevationSide
      ? ` Focus specifically on the ${elevationSide} elevation. If the input shows multiple sides, extract and create the ${elevationSide} elevation view.`
      : '';

    // Section cut direction description
    const sectionCutDescription = drawingType === 'section' && sectionCutDirection
      ? ` Create a ${sectionCutDirection === 'latitudinal' ? 'latitudinal (across the width)' : 'longitudinal (along the length)'} section cut.`
      : '';

    // Text inclusion settings - use the resolved value
    const textInstruction = shouldIncludeText 
      ? 'Include text labels, room names, dimensions, annotations, and technical notes as appropriate for the drawing type.'
      : 'CRITICAL: DO NOT include ANY text labels, text annotations, written text, dimension text, dimension numbers, dimension values, or ANY readable text characters. Use ONLY graphical annotation symbols, dimension lines (without text), leader lines (without text), and graphical symbols. NO text of any kind. Users will add clean, proper, editable text in post-processing using CAD software.';

    // Style reference instruction - use passed parameters or fallback to state
    // Respect text inclusion toggle - don't mention text/annotation style if text is excluded
    const hasStyleRef = styleRefImage || styleRefName || styleReferenceImage || styleReferenceName;
    const styleReferenceInstruction = hasStyleRef
      ? shouldIncludeText
        ? ' IMPORTANT: A style reference image has been provided. Match the visual style, line weights, annotation style, hatching patterns, dimensioning style, and overall aesthetic of the style reference image. The style reference shows the desired CAD drawing style - replicate its line quality, annotation approach, and presentation style while maintaining technical accuracy.'
        : ' IMPORTANT: A style reference image has been provided. Match the visual style, line weights, hatching patterns, and overall aesthetic of the style reference image. The style reference shows the desired CAD drawing style - replicate its line quality and presentation style while maintaining technical accuracy. Do NOT include text from the style reference - use only graphical symbols.'
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an ${config.role}.
</role>

<task>
${config.task}.${elevationSideDescription}${sectionCutDescription} Create a complete, full "as-is" ${config.type} that accurately represents ALL architectural content shown in the input render.

CRITICAL: Generate ONLY ONE single ${config.type} drawing. Do NOT create multiple drawings, compositions, or combined views. Output must be a single, standalone ${config.type} image.
</task>

<constraints>
1. Output format: Generate EXACTLY ONE single architectural ${config.type} image - NOT multiple drawings, NOT a composition, NOT a set of drawings. Only ONE drawing per request.
2. Drawing type: ${config.description}
3. Projection type: CRITICAL - Use ONLY orthographic projection. NO perspective, NO isometric, NO 3D views. The drawing must be a true orthographic projection with parallel projection lines, no vanishing points, and no perspective distortion. All dimensions must be shown at true scale.
4. Visual style: Technical CAD linework with precise measurements${shouldIncludeText ? ', architectural annotations' : ' and graphical symbols (NO text)'}, and standard CAD conventions. Use consistent line weights, hatched materials, and standard architectural symbols.${styleReferenceInstruction}
5. Text and annotations: ${textInstruction}
${!shouldIncludeText ? 'CRITICAL: Do NOT include dimension numbers, dimension text, or any readable text on dimension lines. Dimension lines should be graphical lines only, without any text labels or numbers.' : ''}
6. Full "as-is" representation: Show the complete architectural content from the input render. Include all visible elements, structures, and details. Do not omit or simplify elements that are clearly visible in the input.
7. Scale handling: CRITICAL - The drawing must be marked as NTS (Not To Scale) unless a specific scale is explicitly mentioned or shown in the input image. If the input image contains scale information (e.g., "1:100", "1/4\" = 1'-0\"", scale bar, or dimensioned elements), use that scale. Otherwise, the drawing must be clearly marked as NTS. Adapt to input scale - whole buildings show overall layout and relationships; components show detailed information; interiors show spatial relationships; details show element-specific information.
8. Element recognition: Identify and represent visible architectural elements: ${config.elements}
9. Drawing conventions: Follow ${config.conventions}
10. Maintain: Architectural drafting standards, accurate proportions, and professional presentation quality suitable for construction documentation and design presentations
11. Focus: ${config.focus}
12. Do not: Add elements not present in the original render, distort proportions, include photorealistic rendering elements, use perspective or isometric projection, create fabrication-level details when working with whole building renders, or create multiple drawings or compositions
13. SINGLE OUTPUT REQUIREMENT: The output image must contain ONLY the requested ${config.type}. Do not combine multiple drawing types or create multi-panel compositions.
14. ORTHOGRAPHIC ENFORCEMENT: The drawing MUST be orthographic. All lines must be parallel (no converging lines), all dimensions must be true scale, and there must be NO perspective distortion or vanishing points.
</constraints>

<output_requirements>
- Drawing type: ${config.type}
- Projection: ORTHOGRAPHIC ONLY - parallel projection lines, no perspective, no vanishing points, true scale dimensions
- Visual style: Technical CAD linework with precise measurements${shouldIncludeText ? ', architectural annotations' : ' and graphical symbols (NO text)'}, and standard architectural conventions
- Elements: ${config.elements}
- Technical accuracy: Must follow architectural drafting standards and CAD conventions
- Professional quality: Suitable for construction documentation, permit applications, shop drawings, and design presentations
- Scale: CRITICAL - Drawing must be marked as NTS (Not To Scale) unless a specific scale is explicitly mentioned or shown in the input image. If scale information exists in the input (e.g., "1:100", "1/4\" = 1'-0\"", scale bar, dimensioned elements), use that scale. Otherwise, mark as NTS. Adapt to input scale - whole buildings show overall relationships; components show detailed information; interiors show spatial relationships
- Text handling: ${shouldIncludeText ? 'Include appropriate text labels, dimensions, and annotations following standard architectural practice' : 'CRITICAL: Use ONLY graphical symbols, dimension lines (without text), leader lines (without text), and annotation symbols. NO text labels, NO written annotations, NO dimension numbers, NO dimension text, NO readable text of any kind.'}
- Consistency: If generating multiple views (all elevations, comprehensive set), maintain consistent scale (all NTS unless specified), line weights, and ${shouldIncludeText ? 'notation' : 'graphical conventions'} across all drawings
- Full representation: Show complete "as-is" architectural content from input - include all visible elements and structures
</output_requirements>

<context>
Convert the architectural render into a ${config.type} following technical CAD conventions using ORTHOGRAPHIC projection only. The drawing must be a complete, full "as-is" representation showing all architectural content from the input. Work with any architectural content, building type, or style. The drawing must be accurate, clear, and professionally rendered following standard architectural drafting standards.${elevationSideDescription}${sectionCutDescription} ${shouldIncludeText ? 'Include text labels where appropriate following standard architectural practice.' : 'CRITICAL: Use ONLY graphical symbols with NO text. Do NOT include any dimension numbers, dimension text, labels, or readable text. Users will add text in post-processing using CAD software.'}

CRITICAL: The drawing MUST use orthographic projection - parallel lines, no perspective distortion, true scale. NO perspective, NO isometric, NO 3D views. Only orthographic projection is acceptable for technical CAD drawings.

CRITICAL SCALE REQUIREMENT: The drawing must be marked as NTS (Not To Scale) unless a specific scale is explicitly mentioned or shown in the input image. If the input contains scale information (e.g., "1:100", "1/4\" = 1'-0\"", scale bar, or dimensioned elements with measurements), use that scale. Otherwise, the drawing must be clearly marked as NTS.
</context>`;
  };

  // Build all requests for batch API
  // CRITICAL: Each request gets its OWN isolated, specific prompt - no sharing or combining
  const buildBatchRequests = (formData: FormData) => {
    const requests: Array<{ key: string; prompt: string; drawingType: string; elevationSide?: string; floorPlanType?: string; sectionCutDirection?: string }> = [];
    
    // Build requests for floor plans
    selectedFloorPlans.forEach((floorPlanType) => {
      const prompt = buildSystemPrompt('floor-plan', floorPlanType, undefined, undefined, styleReferenceImage, styleReferenceName, includeText);
      requests.push({
        key: floorPlanType,
        prompt,
        drawingType: 'floor-plan',
        floorPlanType
      });
    });
    
    // Build requests for elevations
    selectedElevationSides.forEach((side) => {
      const prompt = buildSystemPrompt('elevation', undefined, side, undefined, styleReferenceImage, styleReferenceName, includeText);
      requests.push({
        key: `elevation-${side}`,
        prompt,
        drawingType: 'elevation',
        elevationSide: side
      });
    });
    
    // Build requests for sections
    selectedSectionCuts.forEach((cutDirection) => {
      const prompt = buildSystemPrompt('section', undefined, undefined, cutDirection, styleReferenceImage, styleReferenceName, includeText);
      requests.push({
        key: `section-${cutDirection}`,
        prompt,
        drawingType: 'section',
        sectionCutDirection: cutDirection
      });
    });
    
    // Verify each request has its own unique prompt
    console.log('📋 Built batch requests:', requests.map(r => ({
      key: r.key,
      drawingType: r.drawingType,
      elevationSide: r.elevationSide,
      promptLength: r.prompt.length,
      promptStartsWith: r.prompt.substring(0, 80)
    })));
    
    return requests;
  };

  const handleGenerate = async (formData: FormData) => {
    // Ensure at least one drawing is selected
    const totalDrawings = calculateTotalDrawings();
    if (totalDrawings === 0) {
      throw new Error('Please select at least one drawing type');
    }
    
    if (totalDrawings > 1) {
      // Use batch API for multiple requests
      formData.append('useBatchAPI', 'true');
      formData.append('batchRequests', JSON.stringify(buildBatchRequests(formData)));
      formData.append('selectedFloorPlans', JSON.stringify(Array.from(selectedFloorPlans)));
      formData.append('selectedElevationSides', JSON.stringify(Array.from(selectedElevationSides)));
      formData.append('selectedSectionCuts', JSON.stringify(Array.from(selectedSectionCuts)));
      // Set a default prompt for batch processing (will be overridden by batch requests)
      formData.set('prompt', 'Batch CAD generation');
    } else {
      // Single request - use regular API
      if (selectedFloorPlans.size > 0) {
        const floorPlanType = Array.from(selectedFloorPlans)[0];
        formData.set('prompt', buildSystemPrompt('floor-plan', floorPlanType, undefined, undefined, styleReferenceImage, styleReferenceName, includeText));
      } else if (selectedElevationSides.size > 0) {
        const elevationSide = Array.from(selectedElevationSides)[0];
        formData.set('prompt', buildSystemPrompt('elevation', undefined, elevationSide, undefined, styleReferenceImage, styleReferenceName, includeText));
      } else if (selectedSectionCuts.size > 0) {
        const sectionCut = Array.from(selectedSectionCuts)[0];
        formData.set('prompt', buildSystemPrompt('section', undefined, undefined, sectionCut, styleReferenceImage, styleReferenceName, includeText));
      }
    }
    
    formData.append('includeText', includeText.toString());
    
    // Add style (required parameter)
    formData.append('style', style);
    
    // Add style reference if provided
    if (styleReferenceImage) {
      formData.append('styleReference', 'custom');
      const styleImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(styleReferenceImage);
      });
      formData.append('styleReferenceImageData', styleImageBase64);
      formData.append('styleReferenceImageType', styleReferenceImage.type);
    } else if (styleReferenceName) {
      formData.append('styleReference', 'library');
      formData.append('styleReferenceName', styleReferenceName);
    }
    
    const result = await createRenderAction(formData);
    
    if (!result.success) {
      throw new Error(('error' in result ? result.error : 'Failed to generate CAD drawing') || 'Failed to generate CAD drawing');
    }
    
    if (!result.data) {
      throw new Error('Failed to generate CAD drawing - no data returned');
    }
    
    // Check if batch results (array) or single result
    if (totalDrawings > 1 && Array.isArray(result.data)) {
      // For batch processing, return render IDs immediately so we can poll for updates
      const renderIds = result.data.map((item: any) => 
        ('renderId' in item ? item.renderId : ('id' in item ? String(item.id) : '')) as string
      );
      
      // Build labels based on selection order
      const labels: string[] = [];
      selectedFloorPlans.forEach((fp) => {
        labels.push(fp === 'normal-floor-plan' ? 'Normal Floor Plan' : 'Reflected Ceiling Plan');
      });
      selectedElevationSides.forEach((side) => {
        labels.push(`${side.charAt(0).toUpperCase() + side.slice(1)} Elevation`);
      });
      selectedSectionCuts.forEach((cut) => {
        labels.push(`${cut.charAt(0).toUpperCase() + cut.slice(1)} Section`);
      });
      
      // Return render IDs with labels for polling
      return {
        success: true,
        data: renderIds.map((renderId: string, idx: number) => ({
          renderId,
          outputUrl: '', // Will be populated by polling
          label: labels[idx] || `Drawing ${idx + 1}`,
          isPolling: true // Flag to indicate this needs polling
        })),
      };
    }
    
    // Return single result for base component to handle
    let label = 'CAD Drawing';
    if (selectedFloorPlans.size > 0) {
      const fp = Array.from(selectedFloorPlans)[0];
      label = fp === 'normal-floor-plan' ? 'Normal Floor Plan' : 'Reflected Ceiling Plan';
    } else if (selectedElevationSides.size > 0) {
      const side = Array.from(selectedElevationSides)[0];
      label = `${side.charAt(0).toUpperCase() + side.slice(1)} Elevation`;
    } else if (selectedSectionCuts.size > 0) {
      const cut = Array.from(selectedSectionCuts)[0];
      label = `${cut.charAt(0).toUpperCase() + cut.slice(1)} Section`;
    }
    
    // Handle single result
    const singleResult = Array.isArray(result.data) ? result.data[0] : result.data;
    return {
      success: true,
      data: {
        renderId: ('renderId' in singleResult ? singleResult.renderId : ('id' in singleResult ? String(singleResult.id) : '')) as string,
        outputUrl: ('outputUrl' in singleResult ? (singleResult.outputUrl || '') : '') as string,
        label
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
      customCreditsCost={calculateCreditsCost}
      expectedOutputCount={calculateTotalDrawings} // Pass function to calculate expected outputs
      customSettings={
        <>
          {/* Drawing Types - 3 Column Layout */}
          <div className="space-y-4">
            {/* 3 Column Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Column 1: Floor Plans */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Floor Plans</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="floor-plan-normal"
                      checked={selectedFloorPlans.has('normal-floor-plan')}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(selectedFloorPlans);
                        if (checked) {
                          newSet.add('normal-floor-plan');
                        } else {
                          newSet.delete('normal-floor-plan');
                        }
                        setSelectedFloorPlans(newSet);
                      }}
                    />
                    <Label
                      htmlFor="floor-plan-normal"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Normal Floor Plan
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="floor-plan-reflected"
                      checked={selectedFloorPlans.has('reflected-ceiling-plan')}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(selectedFloorPlans);
                        if (checked) {
                          newSet.add('reflected-ceiling-plan');
                        } else {
                          newSet.delete('reflected-ceiling-plan');
                        }
                        setSelectedFloorPlans(newSet);
                      }}
                    />
                    <Label
                      htmlFor="floor-plan-reflected"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Reflected Ceiling Plan
                    </Label>
                  </div>
                </div>
              </div>

              {/* Column 2: Elevations */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Elevations</Label>
                <div className="space-y-2">
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

              {/* Column 3: Sections */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Sections</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="section-latitudinal"
                      checked={selectedSectionCuts.has('latitudinal')}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(selectedSectionCuts);
                        if (checked) {
                          newSet.add('latitudinal');
                        } else {
                          newSet.delete('latitudinal');
                        }
                        setSelectedSectionCuts(newSet);
                      }}
                    />
                    <Label
                      htmlFor="section-latitudinal"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Latitudinal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="section-longitudinal"
                      checked={selectedSectionCuts.has('longitudinal')}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(selectedSectionCuts);
                        if (checked) {
                          newSet.add('longitudinal');
                        } else {
                          newSet.delete('longitudinal');
                        }
                        setSelectedSectionCuts(newSet);
                      }}
                    />
                    <Label
                      htmlFor="section-longitudinal"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Longitudinal
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Style and Style Reference - Two Column Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Style Dropdown */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="style" className="text-sm">Style</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the rendering style for your CAD drawings. Style reference will override this if provided.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger id="style" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="sketch">Sketch</SelectItem>
                  <SelectItem value="wireframe">Wireframe</SelectItem>
                  <SelectItem value="illustration">Illustration</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Include Text Labels - Below Style Dropdown */}
              <div className="flex flex-col space-y-2 pt-2">
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
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card h-10">
                  <p className="text-xs text-muted-foreground">
                    {includeText 
                      ? 'Text labels included'
                      : 'Symbols only'}
                  </p>
                  <Switch
                    id="include-text-cad"
                    checked={includeText}
                    onCheckedChange={setIncludeText}
                  />
                </div>
              </div>
            </div>

            {/* Style Reference */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Style Reference</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Upload your own CAD drawing style reference or choose from Renderiq's style library to match line weights, annotations, and presentation style.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className="relative w-full h-[132px] border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center group"
                onClick={() => setStyleDialogOpen(true)}
                style={{
                  borderColor: styleReferencePreview ? 'transparent' : undefined,
                }}
              >
                {styleReferencePreview ? (
                  <>
                    <img
                      src={styleReferencePreview}
                      alt="Style reference"
                      className="w-full h-full rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ImageIcon className="h-4 w-4 text-white" />
                    </div>
                  </>
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              {styleReferenceName && (
                <div>
                  <p className="text-xs text-muted-foreground truncate">{styleReferenceName}</p>
                </div>
              )}
            </div>
          </div>
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
      
      {/* Tool-specific content sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Drawing Types */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Drawing Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg border bg-card">
                <h4 className="font-semibold text-sm mb-1.5">Floor Plan</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Top-down orthographic view showing spatial layout, room divisions, walls, doors, windows, and architectural elements. Perfect for space planning and layout documentation.
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <h4 className="font-semibold text-sm mb-1.5">Elevation</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Vertical orthographic projection showing building facades, openings, and vertical elements. Generate front, back, left, or right elevations to document all building faces.
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <h4 className="font-semibold text-sm mb-1.5">Section</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Vertical cut through the building showing interior structure, floor levels, ceiling heights, and spatial relationships. Essential for construction documentation and design development.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Text Labels Control */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Text Labels Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-primary">Text ON</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Text labels, dimensions, and annotations will be included in the CAD drawings. Perfect when you want complete documentation with readable text labels for room names, dimensions, and notes.
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-primary">Text OFF</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Only annotation symbols, dimension lines, and graphical symbols will be used. No text labels included. Add clean, proper, editable text in post-processing using CAD software. Ideal for professional workflows where you need precise control over typography and text placement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        {TOOL_CONTENT['render-to-cad']?.useCases && (
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Use Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TOOL_CONTENT['render-to-cad'].useCases.map((useCase, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <h4 className="font-semibold text-sm text-foreground mb-1.5">{useCase.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{useCase.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Software Compatibility */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Software Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">3D Modeling</p>
                <div className="flex flex-wrap gap-2">
                  {['Revit', 'SketchUp', 'Rhino', 'Archicad', 'Vectorworks'].map((software) => (
                    <span key={software} className="text-xs px-2.5 py-1 rounded-md bg-muted text-foreground">
                      {software}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Rendering</p>
                <div className="flex flex-wrap gap-2">
                  {['Lumion', 'Enscape', 'V-Ray', 'Twinmotion', 'Unreal Engine'].map((software) => (
                    <span key={software} className="text-xs px-2.5 py-1 rounded-md bg-muted text-foreground">
                      {software}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">CAD Integration</p>
                <div className="flex flex-wrap gap-2">
                  {['AutoCAD', 'Revit', 'Archicad', 'Vectorworks'].map((software) => (
                    <span key={software} className="text-xs px-2.5 py-1 rounded-md bg-muted text-foreground">
                      {software}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Works with any architectural render regardless of source software. Simply export your render as JPG, PNG, or WebP and upload.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <StyleReferenceDialog
        open={styleDialogOpen}
        onOpenChange={setStyleDialogOpen}
        onSelect={(file, styleName) => {
          setStyleReferenceImage(file);
          setStyleReferenceName(styleName || null);
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setStyleReferencePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
          } else {
            setStyleReferencePreview(null);
          }
        }}
        toolId={tool.id}
        currentImage={styleReferenceImage}
        currentPreview={styleReferencePreview}
      />
    </BaseToolComponent>
  );
}
