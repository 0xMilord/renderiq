'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { HelpCircle, Image as ImageIcon, X } from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';
import { TOOL_CONTENT } from '@/lib/tools/tool-content';
import { StyleReferenceDialog } from '@/components/ui/style-reference-dialog';

interface RenderToSectionDrawingProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function RenderToSectionDrawing({ tool, projectId, onHintChange, hintMessage }: RenderToSectionDrawingProps) {
  const [sectionType, setSectionType] = useState<'technical-cad' | '3d-cross' | 'illustrated-2d'>('technical-cad');
  const [sectionCutDirection, setSectionCutDirection] = useState<'longitudinal' | 'latitudinal' | 'diagonal'>('longitudinal');
  const [sectionViewType, setSectionViewType] = useState<'orthographic' | 'isometric' | 'perspective'>('orthographic');
  const [includeText, setIncludeText] = useState<boolean>(true);
  const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
  const [styleReferenceName, setStyleReferenceName] = useState<string | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    // Style-specific configurations
    const stylePrompts = {
      'technical-cad': {
        type: 'precise technical CAD-style section drawing',
        role: 'expert architectural draftsman specializing in technical CAD section drawings',
        task: 'Transform the architectural render into a precise technical CAD-style section drawing with technical linework, precise measurements, and standard CAD conventions',
        style: 'Technical linework with precise measurements, architectural annotations, and standard CAD conventions. Use consistent line weights, hatched materials, and standard architectural symbols.',
        elements: 'structural elements (beams, columns, walls), materials (concrete, steel, wood), dimensions, annotations, and technical specifications',
        focus: 'precision, technical accuracy, and construction documentation standards'
      },
      '3d-cross': {
        type: '3D cross-section view',
        role: 'expert architectural visualizer specializing in 3D cross-section views',
        task: 'Transform the architectural render into a 3D cross-section view showing depth, volume, and spatial relationships',
        style: 'Three-dimensional perspective showing depth, volume, and spatial relationships. Use perspective techniques, depth cues, material textures, and dimensional relationships to show the section in 3D space.',
        elements: 'structural elements in 3D perspective, material textures, depth cues, shadows, and dimensional relationships',
        focus: 'spatial visualization, depth perception, and design communication'
      },
      'illustrated-2d': {
        type: 'illustrated 2D section drawing',
        role: 'expert architectural illustrator specializing in stylized section drawings',
        task: 'Transform the architectural render into an illustrated 2D section drawing with artistic rendering while maintaining technical accuracy',
        style: 'Stylized architectural illustration with artistic rendering while maintaining technical accuracy. Use visual styling, material representations, clear spatial hierarchy, and presentation-quality graphics.',
        elements: 'structural elements with visual styling, material representations, annotations, and clear spatial hierarchy',
        focus: 'visual appeal, presentation quality, and design communication'
      }
    };

    const styleConfig = stylePrompts[sectionType];
    
    // Section cut direction descriptions
    const cutDirectionDescriptions = {
      'longitudinal': 'longitudinal (along the length of the building, typically front-to-back or side-to-side)',
      'latitudinal': 'latitudinal (across the width of the building, perpendicular to the longitudinal axis)',
      'diagonal': 'diagonal (at an angle, cutting through the building at a diagonal orientation)'
    };

    // Section view type descriptions
    const viewTypeDescriptions = {
      'orthographic': 'orthographic projection (parallel projection with no perspective distortion, showing true dimensions and relationships)',
      'isometric': 'isometric projection (3D representation with equal angles, showing three faces of the building simultaneously)',
      'perspective': 'perspective projection (realistic 3D view with vanishing points, showing depth and spatial relationships as seen by the human eye)'
    };
    
    // Text inclusion settings
    const textInstruction = includeText 
      ? 'Include text labels, annotations, dimensions, and technical notes as appropriate for the section drawing type.'
      : 'DO NOT include any text labels, text annotations, or written text. Use ONLY annotation symbols, dimension lines, leader lines, and graphical symbols. Users will add clean, proper, editable text in post-processing.';

    // Style reference instruction
    const styleReferenceInstruction = (styleReferenceImage || styleReferenceName)
      ? ' IMPORTANT: A style reference image has been provided. Match the visual style, linework characteristics, presentation approach, and overall aesthetic from the style reference image.'
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an ${styleConfig.role}.
</role>

<task>
${styleConfig.task}. Create a ${cutDirectionDescriptions[sectionCutDirection]} section cut displayed using ${viewTypeDescriptions[sectionViewType]}.${styleReferenceInstruction}
</task>

<constraints>
1. Output format: Generate a single architectural section drawing image
2. Visual style: ${styleConfig.style}
3. Section cut and view type: As specified in task
4. Text and annotations: ${textInstruction}
5. Scale handling: Adapt to input scale appropriately
6. Element recognition: Identify and represent visible architectural elements (structural systems, building envelope, interior elements, spatial relationships)
7. Maintain: Architectural drafting standards, proper scale, accurate proportions, professional presentation quality
8. Focus: ${styleConfig.focus}
9. Do not: Add elements not present in the original render, distort proportions, or include photorealistic rendering elements
</constraints>

<output_requirements>
- Drawing type: ${styleConfig.type || sectionType}
- Visual style: ${styleConfig.style}
- Elements: ${styleConfig.elements}
- Technical accuracy: Must follow architectural drafting standards
- Professional quality: Suitable for construction documentation, shop drawings, and design presentations
- Text handling: ${includeText ? 'Include appropriate text labels and annotations' : 'Use ONLY graphical symbols. NO text labels.'}
</output_requirements>

<context>
Convert the architectural render into a ${styleConfig.type || sectionType} following ${styleConfig.style}. The drawing must be accurate, clear, and professionally rendered.${styleReferenceInstruction}
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('sectionType', sectionType);
    formData.append('sectionCutDirection', sectionCutDirection);
    formData.append('sectionViewType', sectionViewType);
    formData.append('includeText', includeText.toString());
    
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
      throw new Error(result.error || 'Failed to generate section drawing');
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
          {/* Section Type and Style Reference - Same Row */}
          <div className="flex items-stretch gap-4">
            {/* Section Type Dropdown */}
            <div className="flex-1 flex flex-col min-w-0 h-full justify-between">
              {/* Section Type - Pinned to Top */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="section-type" className="text-sm">Section Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Choose the drawing style: Technical CAD for precise linework, 3D Cross Section for spatial depth, or Illustrated 2D for stylized presentation.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={sectionType} onValueChange={(v: 'technical-cad' | '3d-cross' | 'illustrated-2d') => setSectionType(v)}>
                  <SelectTrigger id="section-type" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical-cad">Technical CAD</SelectItem>
                    <SelectItem value="3d-cross">3D Cross Section</SelectItem>
                    <SelectItem value="illustrated-2d">Illustrated 2D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Horizontal Separator */}
              <div className="h-px bg-border my-3"></div>
              
              {/* Include Text Labels - Pinned to Bottom */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="include-text" className="text-sm">Include Text Labels</Label>
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
                    id="include-text"
                    checked={includeText}
                    onCheckedChange={setIncludeText}
                  />
                </div>
              </div>
            </div>

            {/* Style Reference - Right Aligned */}
            <div className="flex-1 flex flex-col space-y-2 min-w-0">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Style Reference</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Upload your own image or choose from Renderiq's style library to guide the generation.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              {/* Upload Area - Fills whole available column width */}
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
              {/* Style Name - Below upload area */}
              {styleReferenceName && (
                <div>
                  <p className="text-xs text-muted-foreground truncate">{styleReferenceName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section Cut Direction and Section View Type - New Row */}
          <div className="flex items-stretch gap-4">
            {/* Section Cut Direction */}
            <div className="flex-1 flex flex-col space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="section-cut-direction" className="text-sm">Section Cut Direction</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the direction of the section cut: Longitudinal (along length), Latitudinal (across width), or Diagonal (at an angle).</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={sectionCutDirection} onValueChange={(v: 'longitudinal' | 'latitudinal' | 'diagonal') => setSectionCutDirection(v)}>
                <SelectTrigger id="section-cut-direction" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="longitudinal">Longitudinal</SelectItem>
                  <SelectItem value="latitudinal">Latitudinal</SelectItem>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Section View Type */}
            <div className="flex-1 flex flex-col space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="section-view-type" className="text-sm">Section View Type</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the projection type: Orthographic (parallel, true dimensions), Isometric (3D equal angles), or Perspective (realistic depth).</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={sectionViewType} onValueChange={(v: 'orthographic' | 'isometric' | 'perspective') => setSectionViewType(v)}>
                <SelectTrigger id="section-view-type" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orthographic">Orthographic</SelectItem>
                  <SelectItem value="isometric">Isometric</SelectItem>
                  <SelectItem value="perspective">Perspective</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      }
    >
      {/* Tool-specific content sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Section Types */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Section Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg border bg-card">
                <h4 className="font-semibold text-sm mb-1.5">Technical CAD</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Precise linework with architectural annotations and standard CAD conventions. Perfect for construction documents and permit applications.
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <h4 className="font-semibold text-sm mb-1.5">3D Cross Section</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Three-dimensional perspective showing depth, volume, and spatial relationships. Ideal for design visualization and client presentations.
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <h4 className="font-semibold text-sm mb-1.5">Illustrated 2D</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Stylized architectural illustration with artistic rendering while maintaining technical accuracy. Great for presentations and marketing materials.
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
                  Text labels, dimensions, and annotations will be included in the section drawing. Perfect when you want complete documentation with readable text labels.
                </p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-primary">Text OFF</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Only annotation symbols, dimension lines, and graphical symbols will be used. No text labels included. Add clean, proper, editable text in post-processing using CAD or design software. Ideal for professional workflows where you need precise control over typography and text placement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        {TOOL_CONTENT['render-section-drawing']?.useCases && (
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Use Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TOOL_CONTENT['render-section-drawing'].useCases.map((useCase, idx) => (
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
