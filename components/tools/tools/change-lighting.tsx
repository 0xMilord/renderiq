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
import { LabeledCheckboxGroup } from '../ui/labeled-checkbox-group';
import { LabeledSlider } from '../ui/labeled-slider';

interface ChangeLightingProps {
  tool: ToolConfig;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  hintMessage?: string | null;
}

export function ChangeLighting({ tool, projectId, onHintChange, hintMessage }: ChangeLightingProps) {
  const [lightingTypes, setLightingTypes] = useState<string[]>(['natural']); // Can select both natural and artificial
  const [timeOfDay, setTimeOfDay] = useState<'early-morning' | 'midday' | 'golden-hour' | 'dawn' | 'night-artificial'>('midday');
  const [lightingTemp, setLightingTemp] = useState<'natural' | 'soft' | 'warm' | 'cool' | 'neutral'>('natural');
  const [sunlightDirection, setSunlightDirection] = useState<number>(180); // 0-360 degrees

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
      'early-morning': {
        description: 'early morning lighting with soft, fresh daylight',
        characteristics: 'soft morning light, fresh daylight, gentle illumination, early morning color temperature, morning ambiance',
        atmosphere: 'soft, fresh, early morning interior atmosphere'
      },
      'midday': {
        description: 'midday lighting with bright, clear daylight',
        characteristics: 'bright daylight, natural sun position, clear shadows, natural outdoor light, midday ambiance',
        atmosphere: 'bright, clear, midday interior atmosphere'
      },
      'golden-hour': {
        description: 'golden hour lighting with warm, dramatic golden tones',
        characteristics: 'warm golden tones, dramatic lighting, long shadows, golden hour color temperature, dramatic ambiance',
        atmosphere: 'warm, dramatic, golden hour interior atmosphere'
      },
      'dawn': {
        description: 'dawn lighting with soft morning light and cool tones',
        characteristics: 'soft morning light, cool tones, gentle illumination, dawn color temperature, morning ambiance',
        atmosphere: 'soft, fresh, dawn interior atmosphere'
      },
      'night-artificial': {
        description: 'nighttime lighting with artificial illumination',
        characteristics: 'artificial lighting, ambient illumination, dark exterior, illuminated interior, nighttime ambiance, light spill',
        atmosphere: 'intimate, illuminated, nighttime interior atmosphere with artificial lighting'
      }
    };

    const lightingTempConfigs = {
      'natural': {
        description: 'natural color temperature with authentic daylight tones',
        characteristics: 'natural color temperature, authentic daylight, realistic tones'
      },
      'soft': {
        description: 'soft color temperature with gentle, warm tones',
        characteristics: 'soft color temperature, gentle tones, warm and inviting'
      },
      'warm': {
        description: 'warm color temperature with golden, cozy tones',
        characteristics: 'warm color temperature, golden tones, cozy and inviting'
      },
      'cool': {
        description: 'cool color temperature with crisp, modern tones',
        characteristics: 'cool color temperature, crisp tones, modern and fresh'
      },
      'neutral': {
        description: 'neutral color temperature with balanced tones',
        characteristics: 'neutral color temperature, balanced tones, even and consistent'
      }
    };

    const hasNatural = lightingTypes.includes('natural');
    const hasArtificial = lightingTypes.includes('artificial');
    const lightingTypeText = hasNatural && hasArtificial
      ? 'natural and artificial lighting'
      : hasNatural
        ? 'natural lighting'
        : hasArtificial
          ? 'artificial lighting'
          : 'natural lighting'; // Default fallback

    const lightingTypeDescription = hasNatural && hasArtificial
      ? 'combination of natural daylight and artificial illumination'
      : hasNatural
        ? 'natural daylight illumination'
        : hasArtificial
          ? 'artificial illumination'
          : 'natural daylight illumination';

    const timeConfig = timeConfigs[timeOfDay];
    const lightingTempConfig = lightingTempConfigs[lightingTemp];

    const sunlightDirectionText = hasNatural
      ? ` Sunlight direction: ${sunlightDirection}° (${sunlightDirection < 90 ? 'east' : sunlightDirection < 180 ? 'south' : sunlightDirection < 270 ? 'west' : 'north'} facing).`
      : '';

    // Following Gemini 3 best practices: structured, precise, with clear constraints
    return `<role>
You are an expert architectural visualizer specializing in interior lighting transformation and ambiance creation.
</role>

<task>
Modify the lighting conditions in this interior space, transforming to ${lightingTypeDescription} with ${timeConfig.description} (${timeConfig.characteristics}) and ${lightingTempConfig.description} color temperature (${lightingTempConfig.characteristics}) to create ${timeConfig.atmosphere}.${sunlightDirectionText} Adjust ${lightingTypeText} sources while maintaining material accuracy and spatial relationships.
</task>

<constraints>
1. Output format: Generate a single photorealistic interior render image with transformed lighting
2. Lighting type: ${lightingTypeText} - ${lightingTypeDescription}
3. Natural lighting: ${hasNatural ? 'Include natural daylight illumination' : 'Exclude natural lighting - artificial only'}
4. Artificial lighting: ${hasArtificial ? 'Include artificial illumination' : 'Exclude artificial lighting - natural only'}
5. Time of day: ${timeOfDay} - ${timeConfig.description}
6. Time characteristics: ${timeConfig.characteristics}
7. Lighting temperature: ${lightingTemp} - ${lightingTempConfig.description} (${lightingTempConfig.characteristics})
8. Sunlight direction: ${hasNatural ? `${sunlightDirection}° (${sunlightDirection < 90 ? 'east' : sunlightDirection < 180 ? 'south' : sunlightDirection < 270 ? 'west' : 'north'} facing)` : 'N/A - artificial lighting only'}
9. Mood creation: Create ${timeConfig.atmosphere}
10. Material preservation: Maintain all material textures, colors, and surface properties exactly as in the original
11. Spatial relationships: Maintain all spatial relationships, proportions, and architectural elements exactly as in the original
12. Light-material interaction: Ensure realistic light-material interactions, proper shadows, highlights, and reflections based on the new lighting
13. Professional quality: Suitable for design visualization, lighting design, and client presentations
14. Do not: Distort proportions, alter materials, or create unrealistic lighting conditions
</constraints>

<output_requirements>
- Lighting type: ${lightingTypeText} - ${lightingTypeDescription}
- Natural lighting: ${hasNatural ? 'Included' : 'Excluded'}
- Artificial lighting: ${hasArtificial ? 'Included' : 'Excluded'}
- Time of day: ${timeOfDay} - ${timeConfig.description}
- Time characteristics: ${timeConfig.characteristics}
- Lighting temperature: ${lightingTemp} - ${lightingTempConfig.description}
- Sunlight direction: ${hasNatural ? `${sunlightDirection}°` : 'N/A'}
- Mood: ${timeConfig.atmosphere}
- Material preservation: Maintain all original material properties
- Professional quality: Suitable for design visualization and lighting design
- Light accuracy: Realistic lighting with proper shadows, highlights, and reflections
</output_requirements>

<context>
Modify the lighting conditions in this interior space, transforming to ${lightingTypeDescription} with ${timeConfig.description} showing ${timeConfig.characteristics} and ${lightingTempConfig.description} color temperature (${lightingTempConfig.characteristics}).${sunlightDirectionText} Use ${lightingTypeText} sources to achieve the desired lighting. Create ${timeConfig.atmosphere}. Adjust ${lightingTypeText} sources to achieve the desired lighting while maintaining all material textures, colors, and surface properties exactly as in the original. Ensure realistic light-material interactions, proper shadows, highlights, and reflections based on the new lighting conditions. Maintain all spatial relationships, proportions, and architectural elements exactly as in the original. Create a photorealistic interior render with transformed lighting suitable for design visualization and lighting design.
</context>`;
  };

  const handleGenerate = async (formData: FormData) => {
    // Override prompt with custom system prompt
    formData.set('prompt', buildSystemPrompt());
    
    // Add custom settings to formData for reference
    formData.append('lightingTypes', JSON.stringify(lightingTypes));
    formData.append('timeOfDay', timeOfDay);
    formData.append('lightingTemp', lightingTemp);
    formData.append('sunlightDirection', sunlightDirection.toString());
    
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
          <div className="space-y-4">
            {/* Row 1: Lighting Type (checkbox group - full width) */}
            <LabeledCheckboxGroup
              id="lighting-type"
              label="Lighting Type"
              options={[
                { value: 'natural', label: 'Natural' },
                { value: 'artificial', label: 'Artificial' }
              ]}
              selectedValues={lightingTypes}
              onValueChange={setLightingTypes}
              tooltip="Select lighting types. Natural: daylight illumination. Artificial: electric/ambient lighting. You can select both."
            />

            {/* Row 2: Time of Day | Lighting Temperature */}
            <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="time-of-day" className="text-sm">Time of Day</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                      <p className="max-w-xs">Select the time of day for lighting. Early Morning: soft fresh light. Midday: bright daylight. Golden Hour: warm dramatic tones. Dawn: soft morning light. Night (Artificial): artificial illumination.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
                <Select value={timeOfDay} onValueChange={(v: any) => setTimeOfDay(v)}>
                  <SelectTrigger id="time-of-day" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="early-morning">Early Morning</SelectItem>
                    <SelectItem value="midday">Midday</SelectItem>
                    <SelectItem value="golden-hour">Golden Hour</SelectItem>
                    <SelectItem value="dawn">Dawn</SelectItem>
                    <SelectItem value="night-artificial">Night (Artificial Lighting)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                  <Label htmlFor="lighting-temp" className="text-sm">Lighting Temperature</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                      <p className="max-w-xs">Control the color temperature of lighting. Natural: authentic daylight. Soft: gentle warm. Warm: golden cozy. Cool: crisp modern. Neutral: balanced.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
                <Select value={lightingTemp} onValueChange={(v: any) => setLightingTemp(v)}>
                  <SelectTrigger id="lighting-temp" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cool">Cool</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>

            {/* Row 3: Sunlight Direction (conditional, full width) */}
            {lightingTypes.includes('natural') && (
              <LabeledSlider
                label="Sunlight Direction"
                value={sunlightDirection}
                onValueChange={(values) => setSunlightDirection(values[0])}
                min={0}
                max={360}
                step={5}
                tooltip="Control the direction of sunlight. 0°: East. 90°: South. 180°: West. 270°: North."
                valueFormatter={(v) => {
                  const direction = v < 90 ? 'East' : v < 180 ? 'South' : v < 270 ? 'West' : 'North';
                  return `${v}° (${direction})`;
                }}
              />
            )}
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
