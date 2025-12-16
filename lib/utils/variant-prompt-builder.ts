/**
 * Variant Prompt Builder
 * Builds prompts for generating variants with batch API
 * Similar to multi-angle-view but for variant generation
 */

export interface VariantGenerationConfig {
  variantCount: number;
  variantType: 'consistent' | 'varied';
  viewType?: 'aerial' | 'eye-level' | 'mixed';
  cameraAngles?: boolean;
  lightingVariation?: boolean;
  rotationCoverage?: number;
}

/**
 * Build system prompt for a specific variant
 */
export function buildVariantPrompt(
  variantIndex: number,
  totalVariants: number,
  basePrompt: string,
  config: VariantGenerationConfig
): string {
  if (config.variantType === 'consistent') {
    // Consistent variants - same prompt with variant number
    return `${basePrompt} (variant ${variantIndex + 1} of ${totalVariants}, maintain consistent style and composition)`;
  }

  // Varied variants - use view angles similar to multi-angle-view
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
You are an expert image generator specializing in creating variant views of designs.
</role>

<task>
Generate variant ${variantIndex + 1} of ${totalVariants} showing ${viewAngle} perspective. ${basePrompt}
</task>

<constraints>
1. View angle: ${viewAngle} (variant ${variantIndex + 1} of ${totalVariants})
2. View characteristics: ${viewTypeConfig.characteristics}
3. Rotation coverage: ${rotationCoverage}° coverage angle
4. Lighting: ${lightingText}
5. Consistency: Maintain core design elements while showing a unique perspective
6. Base prompt: ${basePrompt}
</constraints>

<output_requirements>
- View angle: ${viewAngle} (variant ${variantIndex + 1} of ${totalVariants})
- Maintain core design from base prompt
- Show unique perspective based on view angle
- Professional quality suitable for design presentations
</output_requirements>

<context>
Generate variant ${variantIndex + 1} of ${totalVariants} showing ${viewAngle} perspective. ${basePrompt}. This is part of a set of ${totalVariants} variants showing different perspectives of the same design. Use ${viewTypeConfig.description} with ${viewTypeConfig.characteristics}. ${lightingText}. Maintain core design elements while providing a unique and valuable perspective.
</context>`;
}

/**
 * Build batch requests for variant generation
 */
export function buildVariantBatchRequests(
  basePrompt: string,
  config: VariantGenerationConfig
): Array<{ key: string; prompt: string; variantIndex: number }> {
  const requests: Array<{ key: string; prompt: string; variantIndex: number }> = [];
  
  for (let i = 0; i < config.variantCount; i++) {
    const prompt = buildVariantPrompt(i, config.variantCount, basePrompt, config);
    requests.push({
      key: `variant-${i + 1}`,
      prompt,
      variantIndex: i
    });
  }
  
  return requests;
}






