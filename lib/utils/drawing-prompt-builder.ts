import type { DrawingGenerationConfig } from '@/components/canvas/generate-drawing-dialog';
import { logger } from '@/lib/utils/logger';

/**
 * Builds a system prompt for generating a CAD drawing from an image.
 * Reuses the logic from render-to-cad tool.
 */
export const buildDrawingSystemPrompt = (
  drawingType: 'floor-plan' | 'elevation' | 'section',
  config: DrawingGenerationConfig,
  floorPlanType?: 'normal-floor-plan' | 'reflected-ceiling-plan',
  elevationSide?: 'front' | 'back' | 'left' | 'right',
  sectionCutDirection?: 'latitudinal' | 'longitudinal'
): string => {
  const shouldIncludeText = config.includeText;

  // Drawing type configurations (simplified from render-to-cad)
  const drawingTypeConfigs = {
    'floor-plan': {
      'normal-floor-plan': {
        type: 'normal floor plan',
        role: 'expert architectural draftsman specializing in technical floor plan drawings',
        task: 'Transform the architectural render into a precise technical normal floor plan drawing showing spatial layout, room divisions, openings, and architectural elements as viewed from above',
        description: 'A top-down orthographic view showing the layout of spaces, rooms, walls, doors, windows, and other architectural elements as if viewed from above',
        elements: 'room boundaries, walls, doors, windows, openings, stairs, columns, structural elements, spatial relationships, and circulation paths',
      },
      'reflected-ceiling-plan': {
        type: 'reflected ceiling plan',
        role: 'expert architectural draftsman specializing in technical reflected ceiling plan drawings',
        task: 'Transform the architectural render into a precise technical reflected ceiling plan drawing showing ceiling layout, lighting fixtures, HVAC elements, and overhead architectural features',
        description: 'A top-down orthographic view showing the ceiling as if reflected in a mirror on the floor',
        elements: 'ceiling boundaries, lighting fixtures, HVAC diffusers, ceiling materials, overhead architectural features',
      }
    },
    'elevation': {
      type: `elevation drawing (${elevationSide || 'front'} elevation)`,
      role: 'expert architectural draftsman specializing in technical elevation drawings',
      task: `Transform the architectural render into a precise technical ${elevationSide || 'front'} elevation drawing showing the building facade, openings, and vertical elements`,
      description: `A vertical orthographic projection showing the ${elevationSide || 'front'} face of the building`,
      elements: 'building facade, windows, doors, openings, vertical elements, roof lines, material changes',
    },
    'section': {
      type: `section drawing (${sectionCutDirection || 'longitudinal'} cut)`,
      role: 'expert architectural draftsman specializing in technical section drawings',
      task: `Transform the architectural render into a precise technical section drawing showing the building cut through ${sectionCutDirection === 'latitudinal' ? 'latitudinally (across the width)' : 'longitudinally (along the length)'} to reveal interior structure`,
      description: `A vertical cut through the building ${sectionCutDirection === 'latitudinal' ? 'across the width' : 'along the length'}`,
      elements: 'structural elements, floor levels, ceiling heights, interior spaces, vertical circulation',
    }
  };

  let drawingConfig: any;
  if (drawingType === 'floor-plan' && floorPlanType) {
    drawingConfig = drawingTypeConfigs['floor-plan'][floorPlanType];
  } else if (drawingType === 'elevation') {
    drawingConfig = drawingTypeConfigs['elevation'];
  } else if (drawingType === 'section') {
    drawingConfig = drawingTypeConfigs['section'];
  } else {
    drawingConfig = drawingTypeConfigs['floor-plan']['normal-floor-plan'];
  }

  const textInstruction = shouldIncludeText 
    ? 'Include text labels, room names, dimensions, annotations, and technical notes as appropriate.'
    : 'CRITICAL: DO NOT include ANY text labels, text annotations, written text, dimension text, dimension numbers, or ANY readable text characters. Use ONLY graphical annotation symbols, dimension lines (without text), leader lines (without text), and graphical symbols. NO text of any kind.';

  return `<role>
You are an ${drawingConfig.role}.
</role>

<task>
${drawingConfig.task}. Create a complete, full "as-is" ${drawingConfig.type} that accurately represents ALL architectural content shown in the input render.

CRITICAL: Generate ONLY ONE single ${drawingConfig.type} drawing. Do NOT create multiple drawings, compositions, or combined views.
</task>

<constraints>
1. Output format: Generate EXACTLY ONE single architectural ${drawingConfig.type} image - NOT multiple drawings, NOT a composition.
2. Drawing type: ${drawingConfig.description}
3. Projection type: CRITICAL - Use ONLY orthographic projection. NO perspective, NO isometric, NO 3D views. Parallel projection lines, no vanishing points, no perspective distortion.
4. Visual style: Technical CAD linework with precise measurements${shouldIncludeText ? ', architectural annotations' : ' and graphical symbols (NO text)'}, and standard CAD conventions. Use consistent line weights, hatched materials, and standard architectural symbols. Style: ${config.style}.
5. Text and annotations: ${textInstruction}
6. Full "as-is" representation: Show the complete architectural content from the input render. Include all visible elements, structures, and details.
7. Scale handling: The drawing must be marked as NTS (Not To Scale) unless a specific scale is explicitly mentioned or shown in the input image.
8. Element recognition: Identify and represent visible architectural elements: ${drawingConfig.elements}
9. Maintain: Architectural drafting standards, accurate proportions, and professional presentation quality
</constraints>

<output_requirements>
- Drawing type: ${drawingConfig.type}
- Projection: ORTHOGRAPHIC ONLY - parallel projection lines, no perspective, no vanishing points
- Visual style: Technical CAD linework with ${config.style} style${shouldIncludeText ? ', architectural annotations' : ' and graphical symbols (NO text)'}
- Elements: ${drawingConfig.elements}
- Technical accuracy: Must follow architectural drafting standards and CAD conventions
- Professional quality: Suitable for construction documentation and design presentations
- Text handling: ${shouldIncludeText ? 'Include appropriate text labels, dimensions, and annotations' : 'CRITICAL: Use ONLY graphical symbols, dimension lines (without text), leader lines (without text), and annotation symbols. NO text labels, NO written annotations, NO dimension numbers, NO readable text of any kind.'}
</output_requirements>

<context>
Convert the architectural render into a ${drawingConfig.type} following technical CAD conventions using ORTHOGRAPHIC projection only. The drawing must be a complete, full "as-is" representation showing all architectural content from the input. Work with any architectural content, building type, or style. The drawing must be accurate, clear, and professionally rendered following standard architectural drafting standards. ${shouldIncludeText ? 'Include text labels where appropriate.' : 'CRITICAL: Use ONLY graphical symbols with NO text. Do NOT include any dimension numbers, dimension text, labels, or readable text. Users will add text in post-processing using CAD software.'}

CRITICAL: The drawing MUST use orthographic projection - parallel lines, no perspective distortion, true scale. NO perspective, NO isometric, NO 3D views.
</context>`;
};

/**
 * Builds batch requests for drawing generation
 */
export const buildDrawingBatchRequests = (
  config: DrawingGenerationConfig
): Array<{ key: string; prompt: string; drawingType: string; floorPlanType?: string; elevationSide?: string; sectionCutDirection?: string }> => {
  const requests: Array<{ key: string; prompt: string; drawingType: string; floorPlanType?: string; elevationSide?: string; sectionCutDirection?: string }> = [];

  // Floor plans
  config.selectedFloorPlans.forEach((floorPlanType) => {
    const prompt = buildDrawingSystemPrompt('floor-plan', config, floorPlanType);
    requests.push({
      key: floorPlanType,
      prompt,
      drawingType: 'floor-plan',
      floorPlanType,
    });
  });

  // Elevations
  config.selectedElevationSides.forEach((side) => {
    const prompt = buildDrawingSystemPrompt('elevation', config, undefined, side);
    requests.push({
      key: `elevation-${side}`,
      prompt,
      drawingType: 'elevation',
      elevationSide: side,
    });
  });

  // Sections
  config.selectedSectionCuts.forEach((cutDirection) => {
    const prompt = buildDrawingSystemPrompt('section', config, undefined, undefined, cutDirection);
    requests.push({
      key: `section-${cutDirection}`,
      prompt,
      drawingType: 'section',
      sectionCutDirection: cutDirection,
    });
  });

  logger.log('📋 Built drawing batch requests:', {
    count: requests.length,
    floorPlans: config.selectedFloorPlans.size,
    elevations: config.selectedElevationSides.size,
    sections: config.selectedSectionCuts.size,
  });

  return requests;
};





