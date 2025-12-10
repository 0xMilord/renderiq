'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Image as ImageIcon } from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';
import { StyleReferenceDialog } from '@/components/ui/style-reference-dialog';

interface MoodboardToRenderProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function MoodboardToRender({ tool, projectId, onHintChange, hintMessage }: MoodboardToRenderProps) {
  const [style, setStyle] = useState<'cohesive' | 'eclectic' | 'minimalist' | 'maximalist'>('cohesive');
  const [roomType, setRoomType] = useState<'living' | 'bedroom' | 'kitchen' | 'office' | 'dining' | 'bathroom'>('living');
  const [detailLevel, setDetailLevel] = useState<'concept' | 'detailed' | 'complete'>('detailed');
  const [styleReferenceImage, setStyleReferenceImage] = useState<File | null>(null);
  const [styleReferencePreview, setStyleReferencePreview] = useState<string | null>(null);
  const [styleReferenceName, setStyleReferenceName] = useState<string | null>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const styleConfigs = {
      'cohesive': {
        description: 'cohesive style with unified aesthetic, consistent elements, and harmonious design',
        approach: 'create a cohesive interior that unifies all moodboard elements into a harmonious, consistent design',
        characteristics: 'unified aesthetic, consistent color palette, harmonious elements, cohesive design language'
      },
      'eclectic': {
        description: 'eclectic style with diverse elements, mixed aesthetics, and creative combinations',
        approach: 'create an eclectic interior that combines diverse moodboard elements in creative, interesting ways',
        characteristics: 'diverse elements, mixed aesthetics, creative combinations, eclectic design language'
      },
      'minimalist': {
        description: 'minimalist style with essential elements, clean lines, and uncluttered spaces',
        approach: 'create a minimalist interior that distills moodboard elements into essential, clean design',
        characteristics: 'essential elements, clean lines, uncluttered spaces, minimalist design language'
      },
      'maximalist': {
        description: 'maximalist style with rich layers, abundant elements, and bold design',
        approach: 'create a maximalist interior that layers moodboard elements into rich, abundant design',
        characteristics: 'rich layers, abundant elements, bold design, maximalist design language'
      }
    };

    const roomConfigs = {
      'living': {
        description: 'living room with seating, entertainment, and social spaces',
        elements: 'seating areas, entertainment center, coffee tables, lighting, decorative elements, social spaces'
      },
      'bedroom': {
        description: 'bedroom with sleeping, storage, and personal spaces',
        elements: 'bed, nightstands, storage, seating, lighting, personal spaces, restful atmosphere'
      },
      'kitchen': {
        description: 'kitchen with cooking, dining, and food preparation spaces',
        elements: 'cooking areas, dining space, storage, appliances, lighting, functional spaces'
      },
      'office': {
        description: 'office with workspace, storage, and professional environment',
        elements: 'desk, storage, seating, lighting, professional environment, work-focused spaces'
      },
      'dining': {
        description: 'dining room with dining table, seating, and meal spaces',
        elements: 'dining table, chairs, lighting, storage, decorative elements, meal-focused spaces'
      },
      'bathroom': {
        description: 'bathroom with fixtures, storage, and personal care spaces',
        elements: 'fixtures, storage, lighting, personal care spaces, functional elements'
      }
    };

    const detailConfigs = {
      'concept': {
        description: 'conceptual level with key elements and overall atmosphere',
        approach: 'create a conceptual interior showing key moodboard elements and overall atmosphere'
      },
      'detailed': {
        description: 'detailed level with comprehensive elements and complete design',
        approach: 'create a detailed interior with comprehensive moodboard elements and complete design'
      },
      'complete': {
        description: 'complete level with all elements, accessories, and finished design',
        approach: 'create a complete interior with all moodboard elements, accessories, and finished design'
      }
    };

    const styleConfig = styleConfigs[style];
    const roomConfig = roomConfigs[roomType];
    const detailConfig = detailConfigs[detailLevel];

    // Style reference instruction
    const styleReferenceInstruction = styleReferenceImage || styleReferenceName
      ? ' IMPORTANT: A style reference image has been provided showing the desired rendering style. Match the lighting quality, color grading, material rendering, post-processing style, overall visual aesthetic, and rendering approach from the style reference image. The style reference shows the exact rendering style you want - replicate its visual characteristics, lighting mood, color palette, material quality, and overall rendering aesthetic while maintaining the moodboard interpretation.'
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert interior designer specializing in transforming moodboards into photorealistic interior renders.
</role>

<task>
Transform this moodboard into a photorealistic ${roomConfig.description} render that captures the mood, color palette, materials, and aesthetic of the moodboard while creating a ${styleConfig.description} space with ${detailConfig.description}.
</task>

<constraints>
1. Output format: Generate a single photorealistic interior render image
2. Room type: ${roomType} - ${roomConfig.description}
3. Room elements: Include ${roomConfig.elements}
4. Style approach: ${style} - ${styleConfig.description}
5. Style characteristics: ${styleConfig.characteristics}
6. Style application: ${styleConfig.approach}
7. Detail level: ${detailLevel} - ${detailConfig.description}
8. Detail approach: ${detailConfig.approach}
9. Moodboard interpretation: Extract and interpret color palette, materials, textures, furniture styles, lighting mood, and overall aesthetic from the moodboard
10. Cohesive design: Create a ${styleConfig.description} interior that ${styleConfig.approach}
11. Photorealistic quality: Achieve professional photorealistic rendering with realistic materials, lighting, and spatial relationships${styleReferenceInstruction}
12. Professional quality: Suitable for design visualization, client presentations, and design development
13. Do not: Create unrealistic spaces, ignore moodboard elements, or create spaces that don't match the moodboard aesthetic
</constraints>

<output_requirements>
- Room type: ${roomType} - ${roomConfig.description}
- Style: ${style} - ${styleConfig.description}
- Detail level: ${detailLevel} - ${detailConfig.description}
- Moodboard interpretation: Extract color palette, materials, textures, and aesthetic
- Professional quality: Suitable for design visualization and client presentations
- Photorealistic rendering: Realistic materials, lighting, and spatial relationships
</output_requirements>

<context>
Transform this moodboard into a photorealistic ${roomConfig.description} render. Extract and interpret the moodboard's color palette, materials, textures, furniture styles, lighting mood, and overall aesthetic. Create a ${styleConfig.description} interior that ${styleConfig.approach} with ${styleConfig.characteristics}. ${detailConfig.approach} to achieve ${detailConfig.description}. Include ${roomConfig.elements} appropriate for a ${roomConfig.description}. Create a cohesive, realistic space that captures the moodboard's essence while achieving professional photorealistic quality suitable for design visualization and client presentations.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    formData.set('prompt', buildSystemPrompt());
    formData.append('style', style);
    formData.append('roomType', roomType);
    formData.append('detailLevel', detailLevel);
    
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
      throw new Error(result.error || 'Failed to generate render from moodboard');
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
      customSettings={
        <>
          <div className="space-y-4">
            {/* Row 1: Style Approach | Room Type */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="style" className="text-sm">Style Approach</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose how to interpret the moodboard. Cohesive: unified design. Eclectic: mixed elements. Minimalist: essential only. Maximalist: rich layers.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={style} onValueChange={(v: any) => setStyle(v)}>
                  <SelectTrigger id="style" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cohesive">Cohesive</SelectItem>
                  <SelectItem value="eclectic">Eclectic</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="maximalist">Maximalist</SelectItem>
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
                    <p className="max-w-xs">Select the room type to generate. The AI will create an appropriate interior space based on the moodboard.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={roomType} onValueChange={(v: any) => setRoomType(v)}>
                  <SelectTrigger id="room-type" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="living">Living Room</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="dining">Dining Room</SelectItem>
                  <SelectItem value="bathroom">Bathroom</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>

            {/* Row 2: Detail Level (full width) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="detail-level" className="text-sm">Detail Level</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Control the level of detail. Concept: key elements only. Detailed: comprehensive design. Complete: all elements and accessories.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={detailLevel} onValueChange={(v: any) => setDetailLevel(v)}>
                <SelectTrigger id="detail-level" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concept">Concept</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
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
                    <p className="max-w-xs">Upload a rendering style reference image or choose from Renderiq's style library to match the exact lighting, color grading, material rendering, and visual aesthetic.</p>
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
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
            <li>Upload your moodboard image</li>
            <li>Choose style approach, room type, and detail level</li>
            <li>Transform into photorealistic render</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
      
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
