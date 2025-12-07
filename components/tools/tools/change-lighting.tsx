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

interface ChangeLightingProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function ChangeLighting({ tool, projectId, onHintChange, hintMessage }: ChangeLightingProps) {
  const [lightingType, setLightingType] = useState<'natural' | 'warm' | 'cool' | 'dramatic' | 'soft' | 'studio'>('natural');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night' | 'dawn' | 'golden-hour'>('day');

  // Build system prompt based on settings - Following Gemini 3 best practices
  const buildSystemPrompt = (): string => {
    const lightingConfigs = {
      'natural': {
        description: 'natural lighting with realistic daylight conditions and authentic light behavior',
        characteristics: 'realistic daylight, natural light direction, authentic shadows, natural color temperature, realistic light behavior',
        mood: 'authentic, realistic, natural interior atmosphere'
      },
      'warm': {
        description: 'warm lighting with warm color temperature and cozy atmosphere',
        characteristics: 'warm color temperature, golden tones, cozy atmosphere, warm highlights, inviting ambiance',
        mood: 'warm, inviting, cozy interior atmosphere'
      },
      'cool': {
        description: 'cool lighting with cool color temperature and crisp atmosphere',
        characteristics: 'cool color temperature, blue-white tones, crisp atmosphere, cool highlights, modern ambiance',
        mood: 'cool, crisp, modern interior atmosphere'
      },
      'dramatic': {
        description: 'dramatic lighting with strong contrasts, deep shadows, and highlighted focal points',
        characteristics: 'strong contrasts, deep shadows, dramatic highlights, high contrast, cinematic quality, focused illumination',
        mood: 'dramatic, impactful, visually striking interior atmosphere'
      },
      'soft': {
        description: 'soft lighting with diffused illumination and gentle shadows',
        characteristics: 'diffused light, soft shadows, even illumination, gentle highlights, low contrast, ambient lighting',
        mood: 'gentle, welcoming, comfortable interior atmosphere'
      },
      'studio': {
        description: 'professional studio lighting with controlled illumination and balanced exposure',
        characteristics: 'controlled light sources, balanced exposure, professional lighting setup, even illumination, product photography quality',
        mood: 'professional, clean, polished interior atmosphere'
      }
    };

    const timeConfigs = {
      'day': {
        description: 'daytime lighting with bright natural daylight',
        characteristics: 'bright daylight, natural sun position, clear shadows, natural outdoor light, daytime ambiance',
        atmosphere: 'bright, clear, daytime interior atmosphere'
      },
      'sunset': {
        description: 'sunset lighting with warm golden hour tones',
        characteristics: 'warm golden tones, low sun angle, long shadows, golden hour color temperature, sunset ambiance',
        atmosphere: 'warm, golden, sunset interior atmosphere'
      },
      'night': {
        description: 'nighttime lighting with artificial and ambient illumination',
        characteristics: 'artificial lighting, ambient illumination, dark exterior, illuminated interior, nighttime ambiance, light spill',
        atmosphere: 'intimate, illuminated, nighttime interior atmosphere'
      },
      'dawn': {
        description: 'dawn lighting with soft morning light and cool tones',
        characteristics: 'soft morning light, cool tones, gentle illumination, dawn color temperature, morning ambiance',
        atmosphere: 'soft, fresh, dawn interior atmosphere'
      },
      'golden-hour': {
        description: 'golden hour lighting with warm, dramatic golden tones',
        characteristics: 'warm golden tones, dramatic lighting, long shadows, golden hour color temperature, dramatic ambiance',
        atmosphere: 'warm, dramatic, golden hour interior atmosphere'
      }
    };

    const lightingConfig = lightingConfigs[lightingType];
    const timeConfig = timeConfigs[timeOfDay];

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural visualizer specializing in interior lighting transformation and ambiance creation.
</role>

<task>
Modify the lighting conditions in this interior space, transforming to ${lightingConfig.description} with ${timeConfig.description} to create ${lightingConfig.mood} and ${timeConfig.atmosphere}. Adjust natural and artificial light sources while maintaining material accuracy and spatial relationships.
</task>

<constraints>
1. Output format: Generate a single photorealistic interior render image with transformed lighting
2. Lighting type: ${lightingType} - ${lightingConfig.description}
3. Lighting characteristics: ${lightingConfig.characteristics}
4. Time of day: ${timeOfDay} - ${timeConfig.description}
5. Time characteristics: ${timeConfig.characteristics}
6. Mood creation: Create ${lightingConfig.mood} and ${timeConfig.atmosphere}
7. Material preservation: Maintain all material textures, colors, and surface properties exactly as in the original
8. Spatial relationships: Maintain all spatial relationships, proportions, and architectural elements exactly as in the original
9. Light-material interaction: Ensure realistic light-material interactions, proper shadows, highlights, and reflections based on the new lighting
10. Professional quality: Suitable for design visualization, lighting design, and client presentations
11. Do not: Distort proportions, alter materials, or create unrealistic lighting conditions
</constraints>

<output_requirements>
- Lighting type: ${lightingType} - ${lightingConfig.description}
- Lighting characteristics: ${lightingConfig.characteristics}
- Time of day: ${timeOfDay} - ${timeConfig.description}
- Time characteristics: ${timeConfig.characteristics}
- Mood: ${lightingConfig.mood} and ${timeConfig.atmosphere}
- Material preservation: Maintain all original material properties
- Professional quality: Suitable for design visualization and lighting design
- Light accuracy: Realistic lighting with proper shadows, highlights, and reflections
</output_requirements>

<context>
Modify the lighting conditions in this interior space, transforming to ${lightingConfig.description} with ${lightingConfig.characteristics} combined with ${timeConfig.description} showing ${timeConfig.characteristics}. Create ${lightingConfig.mood} and ${timeConfig.atmosphere}. Adjust natural and artificial light sources to achieve the desired lighting while maintaining all material textures, colors, and surface properties exactly as in the original. Ensure realistic light-material interactions, proper shadows, highlights, and reflections based on the new lighting conditions. Maintain all spatial relationships, proportions, and architectural elements exactly as in the original. Create a photorealistic interior render with transformed lighting suitable for design visualization and lighting design.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('lightingType', lightingType);
    formData.append('timeOfDay', timeOfDay);
    
    const result = await createRenderAction(formData);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to change lighting');
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
                <Label htmlFor="lighting-type" className="text-sm">Lighting Type</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Choose the lighting style. Natural: realistic daylight. Warm: cozy golden tones. Cool: crisp modern. Dramatic: high contrast. Soft: diffused. Studio: professional controlled.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={lightingType} onValueChange={(v: any) => setLightingType(v)}>
                <SelectTrigger id="lighting-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cool">Cool</SelectItem>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="time-of-day" className="text-sm">Time of Day</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Select the time of day for lighting. Day: bright daylight. Sunset: warm golden hour. Night: artificial lighting. Dawn: soft morning light. Golden Hour: dramatic golden tones.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={timeOfDay} onValueChange={(v: any) => setTimeOfDay(v)}>
                <SelectTrigger id="time-of-day" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="dawn">Dawn</SelectItem>
                  <SelectItem value="golden-hour">Golden Hour</SelectItem>
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
            <li>Upload your interior render</li>
            <li>Choose lighting type and time of day</li>
            <li>Transform lighting conditions</li>
            <li>Download your result</li>
          </ol>
        </CardContent>
      </Card>
    </BaseToolComponent>
  );
}
