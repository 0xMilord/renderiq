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

interface PresentationSequenceCreatorProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function PresentationSequenceCreator({ tool, projectId, onHintChange, hintMessage }: PresentationSequenceCreatorProps) {
  const [sequenceType, setSequenceType] = useState<'linear' | 'comparison' | 'progressive' | 'narrative'>('linear');
  const [annotationStyle, setAnnotationStyle] = useState<'minimal' | 'detailed' | 'none'>('minimal');
  const [flowDirection, setFlowDirection] = useState<'horizontal' | 'vertical' | 'diagonal'>('horizontal');
  const [transitionStyle, setTransitionStyle] = useState<'smooth' | 'clear' | 'dramatic'>('smooth');

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const sequenceConfigs = {
      'linear': {
        description: 'linear story sequence with sequential progression and clear narrative flow',
        characteristics: 'sequential progression, clear narrative flow, step-by-step presentation, logical sequence, story-telling structure',
        use: 'sequential presentation, step-by-step story, logical progression'
      },
      'comparison': {
        description: 'comparison sequence with before/after or side-by-side comparisons',
        characteristics: 'before/after comparisons, side-by-side views, comparative presentation, contrast emphasis, comparison structure',
        use: 'comparative presentation, before/after views, design comparisons'
      },
      'progressive': {
        description: 'progressive development sequence showing evolution or development over time',
        characteristics: 'progressive development, evolution over time, development stages, growth sequence, progressive structure',
        use: 'development presentation, evolution story, progressive stages'
      },
      'narrative': {
        description: 'narrative sequence with story-telling structure and visual narrative flow',
        characteristics: 'story-telling structure, visual narrative flow, narrative progression, story elements, narrative composition',
        use: 'narrative presentation, story-telling, visual narrative'
      }
    };

    const annotationConfigs = {
      'minimal': {
        description: 'minimal annotations with essential labels and subtle text',
        approach: 'include minimal, essential annotations with subtle text and clean presentation'
      },
      'detailed': {
        description: 'detailed annotations with comprehensive labels, descriptions, and text elements',
        approach: 'include detailed annotations with comprehensive labels, descriptions, and informative text elements'
      },
      'none': {
        description: 'no annotations, focusing purely on visual sequence',
        approach: 'do not include annotations - focus purely on visual sequence and image composition'
      }
    };

    const flowConfigs = {
      'horizontal': {
        description: 'horizontal flow with left-to-right or right-to-left progression',
        characteristics: 'left-to-right or right-to-left progression, horizontal arrangement, horizontal reading flow'
      },
      'vertical': {
        description: 'vertical flow with top-to-bottom progression',
        characteristics: 'top-to-bottom progression, vertical arrangement, vertical reading flow'
      },
      'diagonal': {
        description: 'diagonal flow with dynamic diagonal progression',
        characteristics: 'diagonal progression, dynamic arrangement, diagonal reading flow, dynamic composition'
      }
    };

    const transitionConfigs = {
      'smooth': {
        description: 'smooth transitions with gradual progression and seamless flow',
        approach: 'create smooth transitions with gradual progression and seamless visual flow between images'
      },
      'clear': {
        description: 'clear transitions with distinct separation and clear progression',
        approach: 'create clear transitions with distinct separation and clear visual progression between images'
      },
      'dramatic': {
        description: 'dramatic transitions with strong visual breaks and impactful progression',
        approach: 'create dramatic transitions with strong visual breaks and impactful progression between images'
      }
    };

    const sequenceConfig = sequenceConfigs[sequenceType];
    const annotationConfig = annotationConfigs[annotationStyle];
    const flowConfig = flowConfigs[flowDirection];
    const transitionConfig = transitionConfigs[transitionStyle];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert presentation designer specializing in creating sequential presentation layouts with visual narrative flow and professional composition.
</role>

<task>
Create a sequential presentation layout that tells a visual story with these architectural images, arranging them in a logical flow with proper transitions, annotations, and narrative structure for client presentations. Use ${sequenceType} sequence (${sequenceConfig.description}) with ${flowDirection} flow (${flowConfig.description}) and ${transitionStyle} transitions (${transitionConfig.description}).
</task>

<constraints>
1. Output format: Generate a single sequential presentation layout image
2. Sequence type: ${sequenceType} - ${sequenceConfig.description}
3. Sequence characteristics: ${sequenceConfig.characteristics} for ${sequenceConfig.use}
4. Flow direction: ${flowDirection} - ${flowConfig.description} with ${flowConfig.characteristics}
5. Transition style: ${transitionStyle} - ${transitionConfig.description}
6. Transition approach: ${transitionConfig.approach}
7. Visual narrative: Create a clear visual narrative that tells a story with these images, showing logical progression and narrative flow
8. Image arrangement: Arrange images using ${flowConfig.characteristics} to create ${sequenceConfig.use}
9. Annotations: ${annotationStyle} - ${annotationConfig.description}
10. Annotation approach: ${annotationConfig.approach}
11. Visual hierarchy: Create clear visual hierarchy with primary and secondary focal points, proper image sizing, and strategic placement
12. Spacing: Use professional spacing between images, consistent margins, and balanced composition
13. Professional quality: Suitable for client presentations, design reviews, and professional meetings
14. Design elements: Include appropriate design elements, transitions, backgrounds, and visual enhancements
15. Do not: Create confusing sequences, ignore narrative flow, or violate presentation design principles
</constraints>

<output_requirements>
- Sequence type: ${sequenceType} - ${sequenceConfig.description}
- Flow direction: ${flowDirection} - ${flowConfig.description}
- Transition style: ${transitionStyle} - ${transitionConfig.description}
- Annotations: ${annotationStyle} - ${annotationConfig.description}
- Visual narrative: Clear story-telling structure
- Professional quality: Suitable for client presentations and design reviews
- Design: Professional sequential layout with proper narrative flow
</output_requirements>

<context>
Create a sequential presentation layout that tells a visual story with these architectural images. Use ${sequenceType} sequence with ${sequenceConfig.description} showing ${sequenceConfig.characteristics} for ${sequenceConfig.use}. Arrange images using ${flowDirection} flow with ${flowConfig.description} showing ${flowConfig.characteristics}. ${transitionConfig.approach} to achieve ${transitionConfig.description}. Create a clear visual narrative that tells a story with these images, showing logical progression and narrative flow. ${annotationConfig.approach} for ${annotationConfig.description}. Create clear visual hierarchy with primary and secondary focal points, proper image sizing, and strategic placement. Use professional spacing between images, consistent margins, and balanced composition. Include appropriate design elements, transitions, backgrounds, and visual enhancements. Create a professional sequential presentation layout suitable for client presentations, design reviews, and professional meetings.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    formData.set('prompt', buildSystemPrompt());
    formData.append('sequenceType', sequenceType);
    formData.append('annotationStyle', annotationStyle);
    formData.append('flowDirection', flowDirection);
    formData.append('transitionStyle', transitionStyle);
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create presentation sequence');
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
      maxImages={8}
      customSettings={
        <>
          <div className="space-y-4">
            {/* Row 1: Sequence Type | Flow Direction */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="sequence-type" className="text-sm">Sequence Type</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the sequence structure. Linear: step-by-step. Comparison: before/after. Progressive: development stages. Narrative: story-telling.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={sequenceType} onValueChange={(v: any) => setSequenceType(v)}>
                  <SelectTrigger id="sequence-type" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear Story</SelectItem>
                  <SelectItem value="comparison">Before/After</SelectItem>
                  <SelectItem value="progressive">Progressive Development</SelectItem>
                  <SelectItem value="narrative">Narrative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="flow-direction" className="text-sm">Flow Direction</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the reading flow direction. Horizontal: left-to-right. Vertical: top-to-bottom. Diagonal: dynamic diagonal.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={flowDirection} onValueChange={(v: any) => setFlowDirection(v)}>
                  <SelectTrigger id="flow-direction" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>

            {/* Row 2: Transition Style | Annotation Style */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="transition-style" className="text-sm">Transition Style</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Control transitions between images. Smooth: gradual flow. Clear: distinct separation. Dramatic: strong visual breaks.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={transitionStyle} onValueChange={(v: any) => setTransitionStyle(v)}>
                  <SelectTrigger id="transition-style" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smooth">Smooth</SelectItem>
                  <SelectItem value="clear">Clear</SelectItem>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="annotation-style" className="text-sm">Annotation Style</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose annotation detail. Minimal: essential labels. Detailed: comprehensive text. None: visual-only sequence.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={annotationStyle} onValueChange={(v: any) => setAnnotationStyle(v)}>
                  <SelectTrigger id="annotation-style" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="none">None (Visual Only)</SelectItem>
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
