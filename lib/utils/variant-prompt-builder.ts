/**
 * Variant Prompt Builder
 * Builds prompts for generating variants with batch API
 * Similar to multi-angle-view but for variant generation
 */

export interface VariantGenerationConfig {
  variantCount: number;
  variantType: 'multi-angle' | 'design-options'; // ✅ UPDATED: Two distinct types
  viewType?: 'aerial' | 'eye-level' | 'mixed';
  cameraAngles?: boolean;
  lightingVariation?: boolean;
  rotationCoverage?: number;
  variationStrength?: number; // ✅ NEW: Strength of variation (0-1)
  styleSettings?: any; // ✅ NEW: Style settings from Style Node
  materialSettings?: any; // ✅ NEW: Material settings from Material Node
  styleReference?: any; // ✅ NEW: Style reference from Style Reference Node
  previousVariants?: Array<{ prompt: string; url?: string }>; // ✅ NEW: Context of previous generations
  basePrompt?: string; // ✅ NEW: Base prompt from source image
}

/**
 * Build system prompt for a specific variant
 * ✅ UPDATED: Supports two types - multi-angle (same design, different views) and design-options (different design variations)
 * ✅ UPDATED: Includes context from previous generations to avoid duplicates
 * ✅ UPDATED: Incorporates style settings, material settings, and style reference
 */
export function buildVariantPrompt(
  variantIndex: number,
  totalVariants: number,
  basePrompt: string,
  config: VariantGenerationConfig
): string {
  // ✅ NEW: Build style context from connected nodes
  const styleContext: string[] = [];
  
  if (config.styleSettings) {
    const style = config.styleSettings;
    const styleParts: string[] = [];
    
    if (style.camera) {
      const cameraParts: string[] = [];
      if (style.camera.focalLength) cameraParts.push(`${style.camera.focalLength}mm lens`);
      if (style.camera.fStop) cameraParts.push(`f/${style.camera.fStop}`);
      if (style.camera.position) {
        const pos = style.camera.position.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        cameraParts.push(`${pos} position`);
      }
      if (style.camera.angle) {
        const angle = style.camera.angle.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        cameraParts.push(`${angle} angle`);
      }
      if (cameraParts.length > 0) styleParts.push(`Camera: ${cameraParts.join(', ')}`);
    }
    
    if (style.environment) {
      const envParts: string[] = [];
      if (style.environment.scene) envParts.push(style.environment.scene);
      if (style.environment.weather) envParts.push(style.environment.weather);
      if (style.environment.timeOfDay) envParts.push(style.environment.timeOfDay);
      if (style.environment.season) envParts.push(style.environment.season);
      if (envParts.length > 0) styleParts.push(`Environment: ${envParts.join(', ')}`);
    }
    
    if (style.lighting) {
      const lightParts: string[] = [];
      if (style.lighting.intensity !== undefined) lightParts.push(`${style.lighting.intensity}% intensity`);
      if (style.lighting.direction) lightParts.push(style.lighting.direction);
      if (style.lighting.color) lightParts.push(style.lighting.color);
      if (style.lighting.shadows) lightParts.push(style.lighting.shadows);
      if (lightParts.length > 0) styleParts.push(`Lighting: ${lightParts.join(', ')}`);
    }
    
    if (style.atmosphere) {
      const atmParts: string[] = [];
      if (style.atmosphere.mood) atmParts.push(style.atmosphere.mood);
      if (style.atmosphere.contrast !== undefined) atmParts.push(`${style.atmosphere.contrast}% contrast`);
      if (style.atmosphere.saturation !== undefined) atmParts.push(`${style.atmosphere.saturation}% saturation`);
      if (atmParts.length > 0) styleParts.push(`Atmosphere: ${atmParts.join(', ')}`);
    }
    
    if (styleParts.length > 0) {
      styleContext.push(`Style Settings: ${styleParts.join('; ')}`);
    }
  }
  
  // ✅ NEW: Build material context
  if (config.materialSettings && config.materialSettings.materials && config.materialSettings.materials.length > 0) {
    const materialParts = config.materialSettings.materials.map((mat: any) => {
      let desc = `${mat.name}: ${mat.material}`;
      if (mat.type) desc += ` (${mat.type})`;
      if (mat.color) desc += `, color: ${mat.color}`;
      if (mat.finish) desc += `, finish: ${mat.finish}`;
      return desc;
    });
    styleContext.push(`Materials: ${materialParts.join('; ')}`);
  }
  
  // ✅ NEW: Add style reference context
  if (config.styleReference && config.styleReference.extractedStyle) {
    styleContext.push(`Style Reference: Apply the visual style, composition, and aesthetic qualities from the provided style reference image.`);
  }
  
  // ✅ NEW: Build previous variants context to avoid duplicates
  // Extract key variation info from previous prompts instead of full prompts
  let previousContext = '';
  if (config.previousVariants && config.previousVariants.length > 0) {
    const previousVariations = config.previousVariants
      .slice(0, Math.min(3, config.previousVariants.length)) // Only reference last 3 to avoid token bloat
      .map((v, idx) => {
        // Extract key variation info from prompt (e.g., "variant 1 of 2 showing...")
        const match = v.prompt.match(/variant\s+(\d+)\s+of\s+\d+.*?(?:showing|with)\s+([^<\.]+)/i);
        if (match) {
          return `Variant ${match[1]}: ${match[2].trim()}`;
        }
        // Fallback: extract first meaningful sentence
        const firstSentence = v.prompt.split(/[\.\n<]/)[0].substring(0, 80);
        return `Variant ${idx + 1}: ${firstSentence}...`;
      })
      .join('\n');
    
    previousContext = `\n\n<previous_variants_context>
IMPORTANT: The following ${config.previousVariants.length} variant(s) have already been generated. Ensure this variant is DISTINCTLY DIFFERENT:
${previousVariations}

CRITICAL REQUIREMENTS:
- This variant must be visually unique and NOT duplicate any previous generation
- Vary composition, camera angle, lighting, materials, or design elements significantly
- Each variant should offer a distinct perspective or design approach
- Avoid similar color schemes, compositions, or viewpoints from previous variants
</previous_variants_context>`;
  }
  
  // Handle two variant types
  if (config.variantType === 'multi-angle') {
    // Multi-angle: Same design, different camera angles/views
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

    const viewTypeConfig = config.viewType ? viewTypeConfigs[config.viewType] : viewTypeConfigs['mixed'];
    const viewAngle = viewTypeConfig.angles[variantIndex % viewTypeConfig.angles.length];
    const rotationCoverage = config.rotationCoverage || 180;

    const lightingText = config.lightingVariation
      ? 'Apply different lighting conditions to show various times of day and lighting scenarios'
      : 'Maintain consistent lighting conditions';

    return `<role>
You are an expert architectural visualization AI specializing in generating multi-angle views of the same design.
</role>

<task>
Generate variant ${variantIndex + 1} of ${totalVariants} showing ${viewAngle} perspective of the same architectural design. ${basePrompt || config.basePrompt || 'Generate architectural visualization'}
</task>

<constraints>
1. View angle: ${viewAngle} (variant ${variantIndex + 1} of ${totalVariants})
2. View characteristics: ${viewTypeConfig.characteristics}
3. Rotation coverage: ${rotationCoverage}° coverage angle
4. Lighting: ${lightingText}
5. CRITICAL: Maintain the EXACT SAME design, materials, and architectural elements - only change the camera angle/viewpoint
6. Base prompt: ${basePrompt || config.basePrompt || ''}
${styleContext.length > 0 ? `7. ${styleContext.join('\n8. ')}` : ''}
</constraints>

<output_requirements>
- View angle: ${viewAngle} (variant ${variantIndex + 1} of ${totalVariants})
- Maintain IDENTICAL design from base prompt (same building, same materials, same layout)
- Show UNIQUE perspective based on view angle
- Professional quality suitable for design presentations
- Ensure this view is distinctly different from previous variants
</output_requirements>

<context>
Generate variant ${variantIndex + 1} of ${totalVariants} showing ${viewAngle} perspective. ${basePrompt || config.basePrompt || ''}. This is part of a set of ${totalVariants} variants showing the SAME design from different camera angles. Use ${viewTypeConfig.description} with ${viewTypeConfig.characteristics}. ${lightingText}. Maintain IDENTICAL core design elements while providing a unique viewing perspective.
${styleContext.length > 0 ? `\n\nAdditional Context:\n${styleContext.join('\n')}` : ''}${previousContext}
</context>`;
  } else {
    // Design-options: Different design variations of the same concept
    const designVariations = [
      'alternative material palette',
      'different facade treatment',
      'varied window configuration',
      'alternative roof design',
      'different landscaping approach',
      'varied color scheme',
      'alternative structural expression',
      'different spatial arrangement'
    ];
    
    const variation = designVariations[variantIndex % designVariations.length];
    // ✅ FIXED: Get variationStrength from config, default to 0.5
    const variationStrength = config.variationStrength || 0.5;
    const strengthText = variationStrength < 0.3 ? 'subtle' : variationStrength < 0.7 ? 'moderate' : 'significant';

    return `<role>
You are an expert architectural design AI specializing in generating design option variations of the same concept.
</role>

<task>
Generate variant ${variantIndex + 1} of ${totalVariants} showing a ${strengthText} design variation with ${variation}. ${basePrompt || config.basePrompt || 'Generate architectural design option'}
</task>

<constraints>
1. Design variation: ${variation} (variant ${variantIndex + 1} of ${totalVariants})
2. Variation strength: ${strengthText} (${Math.round(variationStrength * 100)}% change from base)
3. CRITICAL: Maintain the SAME core concept, program, and site context - only vary the specified design element
4. Base prompt: ${basePrompt || config.basePrompt || ''}
${styleContext.length > 0 ? `5. ${styleContext.join('\n6. ')}` : ''}
</constraints>

<output_requirements>
- Design variation: ${variation} (variant ${variantIndex + 1} of ${totalVariants})
- Maintain SAME core concept and program from base prompt
- Show DISTINCT design option with ${variation}
- Professional quality suitable for design presentations
- Ensure this option is distinctly different from previous variants
</output_requirements>

<context>
Generate variant ${variantIndex + 1} of ${totalVariants} showing a design option with ${variation}. ${basePrompt || config.basePrompt || ''}. This is part of a set of ${totalVariants} design options exploring different approaches to the same concept. Apply ${strengthText} variation (${Math.round(variationStrength * 100)}% change) while maintaining the core architectural concept.
${styleContext.length > 0 ? `\n\nAdditional Context:\n${styleContext.join('\n')}` : ''}${previousContext}
</context>`;
  }
}

/**
 * Build batch requests for variant generation
 * ✅ UPDATED: Includes context from previous variants to avoid duplicates
 */
export function buildVariantBatchRequests(
  basePrompt: string,
  config: VariantGenerationConfig
): Array<{ key: string; prompt: string; variantIndex: number }> {
  const requests: Array<{ key: string; prompt: string; variantIndex: number }> = [];
  
  // ✅ NEW: Track previous variants for context
  const previousVariants: Array<{ prompt: string; url?: string }> = [];
  
  for (let i = 0; i < config.variantCount; i++) {
    // ✅ NEW: Include previous variants context to avoid duplicates
    const promptConfig = {
      ...config,
      previousVariants: previousVariants.length > 0 ? previousVariants : undefined,
      basePrompt: basePrompt,
    };
    
    const prompt = buildVariantPrompt(i, config.variantCount, basePrompt, promptConfig);
    
    // Store this variant's prompt for next iteration
    previousVariants.push({ prompt });
    
    requests.push({
      key: `variant-${i + 1}`,
      prompt,
      variantIndex: i
    });
  }
  
  return requests;
}






