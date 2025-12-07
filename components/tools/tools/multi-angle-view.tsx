'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';

interface MultiAngleViewProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function MultiAngleView({ tool, projectId, onHintChange, hintMessage }: MultiAngleViewProps) {
  const [viewCount, setViewCount] = useState<'2' | '4' | '6'>('4');
  const [viewType, setViewType] = useState<'aerial' | 'eye-level' | 'mixed'>('mixed');

  // Build system prompt for a specific view angle
  const buildSystemPrompt = (viewIndex: number, totalViews: number): string => {
    const viewCountNum = parseInt(viewCount);
    const viewTypeConfigs = {
      'aerial': {
        description: 'aerial or bird\'s-eye view from above',
        angles: ['northeast aerial', 'southeast aerial', 'southwest aerial', 'northwest aerial', 'direct overhead', 'angled overhead'],
        characteristics: 'elevated viewpoint, overall form visibility, context relationship, comprehensive view'
      },
      'eye-level': {
        description: 'eye-level perspective at human height',
        angles: ['front eye-level', 'side eye-level', 'back eye-level', 'corner eye-level', 'diagonal eye-level', 'oblique eye-level'],
        characteristics: 'human-scale perspective, natural viewing angle, relatable scale, engaging composition'
      },
      'mixed': {
        description: 'mixed angles including aerial, eye-level, and close-up perspectives',
        angles: ['aerial view', 'eye-level front', 'eye-level side', 'close-up detail', 'low angle', 'high angle'],
        characteristics: 'varied perspectives, comprehensive coverage, multiple viewing angles, diverse composition'
      }
    };

    const viewTypeConfig = viewTypeConfigs[viewType];
    const viewAngle = viewTypeConfig.angles[viewIndex % viewTypeConfig.angles.length];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural visualizer specializing in generating multiple camera angle views of architectural designs.
</role>

<task>
Generate ${viewAngle} (view ${viewIndex + 1} of ${totalViews}) of this architectural design, showing ${viewTypeConfig.description} with consistent lighting and materials. This is part of a set of ${viewCountNum} views showing different perspectives of the same design.
</task>

<constraints>
1. Output format: Generate a single architectural render image from ${viewAngle}
2. View type: ${viewType} - ${viewTypeConfig.description}
3. View angle: ${viewAngle} (view ${viewIndex + 1} of ${totalViews})
4. View characteristics: ${viewTypeConfig.characteristics}
5. Consistency: Maintain consistent lighting, materials, and architectural design across all ${viewCountNum} views
6. Camera perspective: Use ${viewAngle} perspective with proper camera positioning and composition
7. Lighting consistency: Use consistent lighting conditions across all views to show the same design from different angles
8. Material consistency: Maintain identical materials, textures, and finishes across all views
9. Architectural accuracy: Maintain accurate architectural proportions and design elements from all viewing angles
10. Professional quality: Suitable for design presentations, client reviews, and architectural visualization
11. Do not: Distort proportions, alter the design, or create inconsistent lighting/materials across views
</constraints>

<output_requirements>
- View type: ${viewType} - ${viewAngle} (view ${viewIndex + 1} of ${totalViews})
- View characteristics: ${viewTypeConfig.characteristics}
- Consistency: Maintain consistent lighting, materials, and design with other views
- Camera perspective: ${viewAngle} with proper composition
- Professional quality: Suitable for design presentations and architectural visualization
- Design accuracy: Maintain accurate architectural proportions from this viewing angle
</output_requirements>

<context>
Generate ${viewAngle} (view ${viewIndex + 1} of ${totalViews}) of this architectural design. This is part of a set of ${viewCountNum} ${viewType} views showing the same design from different perspectives. Use ${viewTypeConfig.description} with ${viewTypeConfig.characteristics}. Maintain consistent lighting, materials, and architectural design elements across all views. Show the design from ${viewAngle} perspective with proper camera positioning and composition. Ensure this view is consistent with the other views in the set while showing a unique and valuable perspective of the architectural design.
</context>`;
  };

  // Build batch requests for multiple views
  const buildBatchRequests = (formData: FormData) => {
    const requests: Array<{ key: string; prompt: string; viewIndex: number }> = [];
    const viewCountNum = parseInt(viewCount);
    
    for (let i = 0; i < viewCountNum; i++) {
      const prompt = buildSystemPrompt(i, viewCountNum);
      requests.push({
        key: `view-${i + 1}`,
        prompt,
        viewIndex: i
      });
    }
    
    return requests;
  };

  const handleGenerate = async (formData: FormData) => {
    const viewCountNum = parseInt(viewCount);
    
    // Always use batch API for multiple views
    if (viewCountNum > 1) {
      formData.append('useBatchAPI', 'true');
      formData.append('batchRequests', JSON.stringify(buildBatchRequests(formData)));
      formData.append('viewCount', viewCount);
      formData.append('viewType', viewType);
      // Set a default prompt for batch processing (will be overridden by batch requests)
      formData.set('prompt', `Multi-angle view generation: ${viewCountNum} ${viewType} views`);
    } else {
      // Single view (shouldn't happen with current UI, but handle it)
      formData.set('prompt', buildSystemPrompt(0, 1));
    }
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate multi-angle views');
    }
    
    // Check if batch results (array) or single result
    if (viewCountNum > 1 && Array.isArray(result.data)) {
      // Return array of results for batch processing
      return {
        success: true,
        data: result.data.map((item: any, idx: number) => ({
          renderId: ('renderId' in item ? item.renderId : ('id' in item ? String(item.id) : '')) as string,
          outputUrl: (item.outputUrl || '') as string,
          label: `View ${idx + 1} of ${viewCountNum}`
        })),
      };
    }
    
    // Return single result for base component to handle
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
                <Label htmlFor="view-count" className="text-sm">Number of Views</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select how many different camera angles to generate. Multiple views will be generated with consistent lighting and materials.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={viewCount} onValueChange={(v: any) => setViewCount(v)}>
                <SelectTrigger id="view-count" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Views</SelectItem>
                  <SelectItem value="4">4 Views</SelectItem>
                  <SelectItem value="6">6 Views</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="view-type" className="text-sm">View Type</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the type of camera angles. Aerial: from above. Eye Level: human-scale. Mixed: combination of different perspectives.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={viewType} onValueChange={(v: any) => setViewType(v)}>
                <SelectTrigger id="view-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aerial">Aerial Views</SelectItem>
                  <SelectItem value="eye-level">Eye Level</SelectItem>
                  <SelectItem value="mixed">Mixed Angles</SelectItem>
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
            <li>Upload your architectural design</li>
            <li>Choose number of views and view type</li>
            <li>Generate multiple camera angles</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
