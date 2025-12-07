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

type DrawingType = 'floor-plan' | 'elevation' | 'section';
type ElevationSide = 'front' | 'back' | 'left' | 'right';

export function RenderToCAD({ tool, projectId, onHintChange, hintMessage }: RenderToCADProps) {
  const [selectedDrawings, setSelectedDrawings] = useState<Set<DrawingType>>(new Set(['floor-plan']));
  const [selectedElevationSides, setSelectedElevationSides] = useState<Set<ElevationSide>>(new Set(['front']));
  const [includeText, setIncludeText] = useState<boolean>(true);
  const [style, setStyle] = useState<string>('technical');
  const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
  const [styleReferenceName, setStyleReferenceName] = useState<string | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  // Calculate total number of drawings to generate
  const calculateTotalDrawings = (): number => {
    return Array.from(selectedDrawings).reduce((count, type) => {
      return count + (type === 'elevation' ? selectedElevationSides.size : 1);
    }, 0);
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

  // Build system prompt for a specific drawing type and elevation side
  const buildSystemPrompt = (
    drawingType: DrawingType, 
    elevationSide?: ElevationSide,
    styleRefImage?: File | null,
    styleRefName?: string | null,
    includeTextParam?: boolean
  ): string => {
    // Use passed parameter or fallback to state
    const shouldIncludeText = includeTextParam !== undefined ? includeTextParam : includeText;
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

    // Text inclusion settings - use the resolved value
    const textInstruction = shouldIncludeText 
      ? 'Include text labels, room names, dimensions, annotations, and technical notes as appropriate for the drawing type.'
      : 'CRITICAL: DO NOT include ANY text labels, text annotations, written text, dimension text, dimension numbers, dimension values, or ANY readable text characters. Use ONLY graphical annotation symbols, dimension lines (without text), leader lines (without text), and graphical symbols. NO text of any kind. Users will add clean, proper, editable text in post-processing using CAD software.';

    // Style reference instruction - use passed parameters or fallback to state
    const hasStyleRef = styleRefImage || styleRefName || styleReferenceImage || styleReferenceName;
    const styleReferenceInstruction = hasStyleRef
      ? ' IMPORTANT: A style reference image has been provided. Match the visual style, line weights, annotation style, hatching patterns, dimensioning style, and overall aesthetic of the style reference image. The style reference shows the desired CAD drawing style - replicate its line quality, annotation approach, and presentation style while maintaining technical accuracy.'
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an ${config.role}.
</role>

<task>
${config.task}.${elevationSideDescription} The input may show any architectural content: whole buildings (any type or style), building components, interior spaces, exterior views, or detail views. Create an appropriate ${config.type} that accurately represents the architectural content shown.

CRITICAL: Generate ONLY ONE single ${config.type} drawing. Do NOT create multiple drawings, compositions, or combined views. Output must be a single, standalone ${config.type} image.
</task>

<constraints>
1. Output format: Generate EXACTLY ONE single architectural ${config.type} image - NOT multiple drawings, NOT a composition, NOT a set of drawings. Only ONE drawing per request.
2. Drawing type: ${config.description}
3. Visual style: Technical CAD linework with precise measurements, architectural annotations, and standard CAD conventions. Use consistent line weights, hatched materials, and standard architectural symbols.${styleReferenceInstruction}
4. Text and annotations: ${textInstruction}
${!shouldIncludeText ? 'CRITICAL: Do NOT include dimension numbers, dimension text, or any readable text on dimension lines. Dimension lines should be graphical lines only, without any text labels or numbers.' : ''}
5. Scale handling: Adapt to input scale - whole buildings show overall layout and relationships; components show detailed information; interiors show spatial relationships; details show element-specific information
6. Element recognition: Identify and represent visible architectural elements: ${config.elements}
7. Drawing conventions: Follow ${config.conventions}
8. Maintain: Architectural drafting standards, proper scale, accurate proportions, and professional presentation quality suitable for construction documentation and design presentations
9. Focus: ${config.focus}
10. Do not: Add elements not present in the original render, distort proportions, include photorealistic rendering elements, create fabrication-level details when working with whole building renders, or create multiple drawings or compositions
11. SINGLE OUTPUT REQUIREMENT: The output image must contain ONLY the requested ${config.type}. Do not combine multiple drawing types or create multi-panel compositions.
</constraints>

<output_requirements>
- Drawing type: ${config.type}
- Visual style: Technical CAD linework with precise measurements and standard architectural conventions
- Elements: ${config.elements}
- Technical accuracy: Must follow architectural drafting standards and CAD conventions
- Professional quality: Suitable for construction documentation, permit applications, shop drawings, and design presentations
- Scale appropriateness: Adapt to input scale - whole buildings show overall relationships; components show detailed information; interiors show spatial relationships
- Text handling: ${shouldIncludeText ? 'Include appropriate text labels, dimensions, and annotations following standard architectural practice' : 'CRITICAL: Use ONLY graphical symbols, dimension lines (without text), leader lines (without text), and annotation symbols. NO text labels, NO written annotations, NO dimension numbers, NO dimension text, NO readable text of any kind.'}
- Consistency: If generating multiple views (all elevations, comprehensive set), maintain consistent scale, line weights, and notation across all drawings
</output_requirements>

<context>
Convert the architectural render into a ${config.type} following technical CAD conventions. Work with any architectural content, building type, or style. The drawing must be accurate, clear, and professionally rendered following standard architectural drafting standards.${elevationSideDescription} ${shouldIncludeText ? 'Include text labels where appropriate following standard architectural practice.' : 'CRITICAL: Use ONLY graphical symbols with NO text. Do NOT include any dimension numbers, dimension text, labels, or readable text. Users will add text in post-processing using CAD software.'}

Maintain the tool's general-purpose nature: it must work effectively with any architectural content, from small components to entire buildings, from any architectural style or building type.
</context>`;
  };

  // Build all requests for batch API
  // CRITICAL: Each request gets its OWN isolated, specific prompt - no sharing or combining
  const buildBatchRequests = (formData: FormData) => {
    const requests: Array<{ key: string; prompt: string; drawingType: string; elevationSide?: string }> = [];
    
    // Build requests for each selected drawing type
    // Each call to buildSystemPrompt generates a UNIQUE prompt for that specific drawing type/elevation side
    // Pass style reference info so it can be included in the prompt
    selectedDrawings.forEach((drawingType) => {
      if (drawingType === 'elevation') {
        // For elevations, create a SEPARATE request for EACH selected side
        // Each elevation side gets its OWN unique prompt
        selectedElevationSides.forEach((side) => {
          // Build prompt specifically for this elevation side - isolated and unique
          const prompt = buildSystemPrompt('elevation', side, styleReferenceImage, styleReferenceName, includeText);
          requests.push({
            key: `elevation-${side}`,
            prompt, // This prompt is ONLY for this specific elevation side
            drawingType: 'elevation',
            elevationSide: side
          });
        });
      } else {
        // For floor-plan and section, create a SINGLE request with its OWN unique prompt
        // Each drawing type gets its OWN isolated prompt - no mixing
        const prompt = buildSystemPrompt(drawingType, undefined, styleReferenceImage, styleReferenceName, includeText);
        requests.push({
          key: drawingType,
          prompt, // This prompt is ONLY for this specific drawing type (floor-plan OR section)
          drawingType
        });
      }
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
      
      formData.set('prompt', buildSystemPrompt(drawingType, elevationSide, styleReferenceImage, styleReferenceName, includeText));
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
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate CAD drawing');
    }
    
    // Check if batch results (array) or single result
    if (totalRequests > 1 && Array.isArray(result.data)) {
      // For batch processing, return render IDs immediately so we can poll for updates
      // The result.data contains render IDs that we can poll
      const renderIds = result.data.map((item: any) => 
        ('renderId' in item ? item.renderId : ('id' in item ? String(item.id) : '')) as string
      );
      
      // Return render IDs with labels for polling
      return {
        success: true,
        data: renderIds.map((renderId: string, idx: number) => {
          // Map render IDs back to drawing types based on batch order
          let drawingType: DrawingType = 'floor-plan';
          let elevationSide: ElevationSide | undefined;
          
          // Reconstruct which drawing type this render ID corresponds to
          let currentIdx = 0;
          for (const type of Array.from(selectedDrawings)) {
            if (type === 'elevation') {
              for (const side of Array.from(selectedElevationSides)) {
                if (currentIdx === idx) {
                  drawingType = 'elevation';
                  elevationSide = side;
                  break;
                }
                currentIdx++;
              }
              if (elevationSide) break;
            } else {
              if (currentIdx === idx) {
                drawingType = type;
                break;
              }
              currentIdx++;
            }
          }
          
          return {
            renderId,
            outputUrl: '', // Will be populated by polling
            label: drawingType === 'elevation' && elevationSide
              ? `${drawingType.charAt(0).toUpperCase() + drawingType.slice(1)} - ${elevationSide.charAt(0).toUpperCase() + elevationSide.slice(1)}`
              : drawingType === 'floor-plan' ? 'Floor Plan' 
              : drawingType === 'section' ? 'Section'
              : 'Elevation',
            isPolling: true // Flag to indicate this needs polling
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
      customCreditsCost={calculateCreditsCost}
      expectedOutputCount={calculateTotalDrawings} // Pass function to calculate expected outputs
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
