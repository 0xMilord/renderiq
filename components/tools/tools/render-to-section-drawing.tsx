'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolConfig } from '@/lib/tools/registry';
import { BaseToolComponent } from '../base-tool-component';
import { createRenderAction } from '@/lib/actions/render.actions';
import { TOOL_CONTENT } from '@/lib/tools/tool-content';

interface RenderToSectionDrawingProps {
  tool: ToolConfig;
}

export function RenderToSectionDrawing({ tool }: RenderToSectionDrawingProps) {
  const [sectionType, setSectionType] = useState<'technical-cad' | '3d-cross' | 'illustrated-2d'>('technical-cad');
  const [lod, setLod] = useState<'LOD100' | 'LOD200' | 'LOD300' | 'LOD400'>('LOD300');

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const sectionTypeMap = {
      'technical-cad': {
        type: 'precise technical CAD-style section drawing',
        style: 'technical linework with precise measurements, architectural annotations, and standard CAD conventions',
        elements: 'structural elements (beams, columns, walls), materials (concrete, steel, wood), dimensions, annotations, and technical specifications'
      },
      '3d-cross': {
        type: '3D cross-section view',
        style: 'three-dimensional perspective showing depth, volume, and spatial relationships',
        elements: 'structural elements in 3D perspective, material textures, depth cues, and dimensional relationships'
      },
      'illustrated-2d': {
        type: 'illustrated 2D section drawing',
        style: 'stylized architectural illustration with artistic rendering while maintaining technical accuracy',
        elements: 'structural elements with visual styling, material representations, annotations, and clear spatial hierarchy'
      }
    };

    const lodMap: Record<string, { level: string; detail: string; include: string; exclude: string }> = {
      'LOD100': {
        level: 'conceptual',
        detail: 'basic shapes and volumes only',
        include: 'overall building form, major spatial divisions, basic structural elements',
        exclude: 'specific materials, detailed dimensions, annotations, or technical specifications'
      },
      'LOD200': {
        level: 'approximate',
        detail: 'generic elements with approximate sizes',
        include: 'generic structural elements, approximate dimensions, basic material indications, simple annotations',
        exclude: 'specific product details, exact measurements, or fabrication-level information'
      },
      'LOD300': {
        level: 'precise',
        detail: 'specific elements with exact dimensions',
        include: 'specific structural elements, precise dimensions, material specifications, detailed annotations, technical notes',
        exclude: 'fabrication details, assembly instructions, or manufacturing specifications'
      },
      'LOD400': {
        level: 'fabrication',
        detail: 'complete specifications ready for construction',
        include: 'all structural elements with exact specifications, complete dimensions, material details, annotations, technical notes, assembly details, and fabrication-ready information',
        exclude: ''
      }
    };

    const sectionConfig = sectionTypeMap[sectionType];
    const lodConfig = lodMap[lod];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural draftsman specializing in creating professional section drawings from architectural renders.
</role>

<task>
Transform the provided architectural render image into ${sectionConfig.type} with ${lodConfig.level} level of detail (${lodConfig.detail}).
</task>

<constraints>
1. Output format: Generate a single architectural section drawing image
2. Style: ${sectionConfig.style}
3. Level of detail: ${lodConfig.level} - ${lodConfig.detail}
4. Include: ${lodConfig.include}
5. Exclude: ${lodConfig.exclude}
6. Maintain: Architectural drafting standards, proper scale, accurate proportions, and professional presentation quality
7. Ensure: All ${sectionConfig.elements} are clearly visible, properly annotated, and professionally rendered
8. Do not: Add elements not present in the original render, distort proportions, or include photorealistic rendering elements
</constraints>

<output_requirements>
- Drawing type: ${sectionConfig.type}
- Detail level: LOD ${lod.replace('LOD', '')} (${lodConfig.level})
- Visual style: ${sectionConfig.style}
- Technical accuracy: Must follow architectural drafting standards
- Clarity: All elements must be clearly distinguishable and properly labeled
- Professional quality: Suitable for construction documentation and design presentations
</output_requirements>

<context>
The input is an architectural render. Your task is to convert it into a technical section drawing that architects and engineers can use for documentation, construction, and design communication. The drawing must be accurate, clear, and follow standard architectural drafting conventions.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('sectionType', sectionType);
    formData.append('lod', lod);
    
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
      onGenerate={handleGenerate}
      customSettings={
        <>
          <div className="space-y-3">
            {/* Section Type Tabs and LOD Dropdown in same row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <Label className="text-xs mb-2 block">Section Type</Label>
                    <Tabs value={sectionType} onValueChange={(v: 'technical-cad' | '3d-cross' | 'illustrated-2d') => setSectionType(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-9">
                    <TabsTrigger 
                      value="technical-cad" 
                      className="text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:text-primary"
                    >
                      Technical CAD
                    </TabsTrigger>
                    <TabsTrigger 
                      value="3d-cross" 
                      className="text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:text-primary"
                    >
                      3D Cross Section
                    </TabsTrigger>
                    <TabsTrigger 
                      value="illustrated-2d" 
                      className="text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:text-primary"
                    >
                      Illustrated 2D
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="lod" className="text-xs mb-2 block">LOD</Label>
                    <Select value={lod} onValueChange={(v: 'LOD100' | 'LOD200' | 'LOD300' | 'LOD400') => setLod(v)}>
                  <SelectTrigger id="lod" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOD100">LOD 100</SelectItem>
                    <SelectItem value="LOD200">LOD 200</SelectItem>
                    <SelectItem value="LOD300">LOD 300</SelectItem>
                    <SelectItem value="LOD400">LOD 400</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            {(TOOL_CONTENT['render-section-drawing']?.howItWorks.steps || []).map((item, idx) => (
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
      additionalSections={
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Row 2: Key Features (1/4) + FAQ (3/4) */}
          <div className="md:col-span-1">
            <Card className="h-full border-2 hover:border-primary/50 transition-colors bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Key Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {(TOOL_CONTENT['render-section-drawing']?.keyFeatures || []).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mt-0.5">
                        ✓
                      </span>
                      <span className="flex-1 pt-0.5 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3">
            <Card className="h-full border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {(TOOL_CONTENT['render-section-drawing']?.faq || []).map((faq, idx) => (
                  <div key={idx} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                    <h3 className="font-semibold text-sm text-foreground leading-snug">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Use Cases (3/4) + Empty/Spacer (1/4) */}
          <div className="md:col-span-3">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Use Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(TOOL_CONTENT['render-section-drawing']?.useCases || []).map((useCase, idx) => (
                    <div key={idx} className="space-y-2 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <h4 className="font-semibold text-sm text-foreground">{useCase.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{useCase.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    </BaseToolComponent>
  );
}
