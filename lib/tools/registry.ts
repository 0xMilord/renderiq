import { getEffectiveToolStatus, isToolAccessible } from './feature-flags';

export type ToolCategory = 
  | 'transformation' 
  | 'floorplan' 
  | 'diagram' 
  | 'material' 
  | 'interior' 
  | '3d' 
  | 'presentation';

export interface ToolConfig {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  systemPrompt: string;
  inputType: 'image' | 'image+text' | 'multiple';
  outputType: 'image' | 'video';
  icon?: string;
  color?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'online' | 'offline'; // Feature flag: online = accessible, offline = disabled
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const TOOLS: ToolConfig[] = [
  // Category 1: Render Transformations
  {
    id: 'render-section-drawing',
    slug: 'render-section-drawing',
    name: 'Render to Section Drawing',
    description: 'Convert renders to technical CAD sections, 3D cross-sections, or illustrated 2D drawings with text control and style references for construction docs',
    category: 'transformation',
    systemPrompt: 'Transform this architectural render into a precise technical section drawing showing all structural elements, materials, and dimensions with architectural drafting standards',
    inputType: 'image',
    outputType: 'image',
    priority: 'high',
    status: 'online',
    seo: {
      title: 'Render to Section Drawing Tool | AI Architectural Section Drawing',
      description: 'Transform architectural renders into precise technical section drawings with AI. Create professional section drawings with structural details and dimensions.',
      keywords: ['architectural section drawing tool', 'render to section', 'AI section drawing', 'technical section drawing']
    }
  },
  {
    id: 'render-to-cad',
    slug: 'render-to-cad',
    name: 'Render to CAD',
    description: 'Generate floor plans, elevations, and sections in batch with CAD linework, dimensions, and annotations for permit applications and construction docs',
    category: 'transformation',
    systemPrompt: 'Convert this photorealistic render into a clean 2D CAD-style technical drawing with precise linework, dimensions, and architectural annotations',
    inputType: 'image',
    outputType: 'image',
    priority: 'medium',
    status: 'online',
    seo: {
      title: 'Render to CAD Converter | AI CAD Conversion Tool',
      description: 'Convert photorealistic renders into clean 2D CAD-style technical drawings with precise linework and dimensions.',
      keywords: ['render to CAD', 'AI CAD conversion', 'photorealistic to technical drawing', 'CAD converter']
    }
  },
  {
    id: 'render-upscale',
    slug: 'render-upscale',
    name: 'Render Upscale',
    description: 'Upscale renders 2x, 4x, or 8x with AI enhancement, sharpening edges, refining textures, and maintaining architectural accuracy for print-ready quality',
    category: 'transformation',
    systemPrompt: 'Upscale and enhance this architectural render while maintaining quality, detail, and architectural accuracy',
    inputType: 'image',
    outputType: 'image',
    priority: 'high',
    status: 'online',
    seo: {
      title: 'AI Render Upscaler | Architectural Image Enhancement',
      description: 'Upscale and enhance architectural renders with AI. Increase resolution while maintaining quality and detail.',
      keywords: ['AI image upscaler', 'render upscale', 'architectural image enhancement', 'image upscaling']
    }
  },
  {
    id: 'render-effects',
    slug: 'render-effects',
    name: 'Render Effects',
    description: 'Apply sketch, illustration, wireframe, watercolor, or pencil effects with adjustable intensity while preserving architectural proportions and design intent',
    category: 'transformation',
    systemPrompt: 'Apply creative effects to this architectural render while maintaining architectural accuracy and design intent',
    inputType: 'image',
    outputType: 'image',
    priority: 'low',
    status: 'online',
    seo: {
      title: 'Render Effects Tool | AI Architectural Style Effects',
      description: 'Add creative effects to architectural renders. Transform renders with sketch, illustration, wireframe, and artistic styles.',
      keywords: ['render effects', 'architectural style effects', 'AI render stylization', 'render filters']
    }
  },
  
  // Category 2: Floor Plan Tools
  {
    id: 'floorplan-to-furnished',
    slug: 'floorplan-to-furnished',
    name: 'Empty Floorplan to Furnished',
    description: 'Add modern, traditional, minimalist, or luxury furniture to floor plans with proper scale, room-specific layouts, and CAD-style technical drawing quality',
    category: 'floorplan',
    systemPrompt: 'Add appropriate furniture and interior elements to this floor plan in CAD architectural style, maintaining scale and proportions, showing furniture layout, fixtures, and spatial organization',
    inputType: 'image',
    outputType: 'image',
    priority: 'high',
    status: 'online',
    seo: {
      title: 'Floor Plan to Furnished | AI Furniture Placement Tool',
      description: 'Transform empty floor plans into furnished layouts. Add furniture and interior elements with proper scale and proportions.',
      keywords: ['floor plan furniture', 'empty floor plan to furnished', 'AI floor plan design', 'furniture placement tool']
    }
  },
  {
    id: 'floorplan-to-3d',
    slug: 'floorplan-to-3d',
    name: 'Floorplan to 3D Model',
    description: 'Transform 2D plans into isometric, axonometric, or oblique 3D diagrams with adjustable wall heights (2.4m-3.6m) and technical accuracy',
    category: 'floorplan',
    systemPrompt: 'Transform this 2D floor plan into a professional 3D axonometric diagram showing spatial relationships, volumes, and architectural elements with proper perspective and technical accuracy',
    inputType: 'image',
    outputType: 'image',
    priority: 'medium',
    status: 'online',
    seo: {
      title: 'Floor Plan to 3D Converter | 2D to 3D Floor Plan Tool',
      description: 'Convert 2D floor plans into professional 3D axonometric diagrams. Visualize spatial relationships and volumes.',
      keywords: ['floor plan to 3D', '2D to 3D floor plan', 'axonometric diagram generator', '3D floor plan']
    }
  },
  {
    id: 'floorplan-technical-diagrams',
    slug: 'floorplan-technical-diagrams',
    name: 'Floorplan Technical Diagrams',
    description: 'Create technical diagrams with minimal, standard, or detailed annotations, optional dimensions, room labels, and architectural symbols for documentation',
    category: 'floorplan',
    systemPrompt: 'Convert this floor plan into a professional technical architectural diagram with proper annotations, dimensions, room labels, and architectural standards',
    inputType: 'image',
    outputType: 'image',
    priority: 'medium',
    status: 'online',
    seo: {
      title: 'Floor Plan Technical Diagrams | Architectural Diagram Tool',
      description: 'Convert floor plans into professional technical diagrams with annotations, dimensions, and room labels.',
      keywords: ['technical floor plan', 'architectural diagram tool', 'floor plan annotations', 'technical diagrams']
    }
  },
  
  // Category 3: Diagram & Visualization Tools
  {
    id: 'exploded-diagram',
    slug: 'exploded-diagram',
    name: 'Exploded Diagram',
    description: 'Generate exploded axonometric views with tight, medium, or wide component spacing in vertical, horizontal, or diagonal orientations for assembly visualization',
    category: 'diagram',
    systemPrompt: 'Create an exploded axonometric diagram from this architectural design, showing all components separated with proper spacing, maintaining architectural accuracy and technical drawing standards',
    inputType: 'image',
    outputType: 'image',
    priority: 'medium',
    status: 'online',
    seo: {
      title: 'Exploded Diagram Generator | Architectural Axonometric Tool',
      description: 'Create exploded axonometric diagrams from architectural designs. Show components with proper spacing and technical accuracy.',
      keywords: ['exploded diagram', 'axonometric exploded view', 'architectural diagram generator', 'exploded view tool']
    }
  },
  {
    id: 'multi-angle-view',
    slug: 'multi-angle-view',
    name: 'Multi Angle View',
    description: 'Generate 2, 4, or 6 consistent camera angles (aerial, eye-level, or mixed) with matching lighting and materials for comprehensive design visualization',
    category: 'diagram',
    systemPrompt: 'Generate multiple camera angle views of this architectural design, showing different perspectives (aerial, eye-level, close-up) with consistent lighting and materials',
    inputType: 'image',
    outputType: 'image',
    priority: 'low',
    status: 'online',
    seo: {
      title: 'Multi Angle View Tool | Architectural Perspectives Generator',
      description: 'Generate multiple camera angle views of architectural designs. Create aerial, eye-level, and close-up perspectives.',
      keywords: ['multi angle view', 'architectural perspectives', 'camera angle tool', 'multiple views']
    }
  },
  
  // Category 4: Material & Texture Tools
  {
    id: 'change-texture',
    slug: 'change-texture',
    name: 'Change Texture',
    description: 'Replace interior materials with wood, stone, metal, fabric, concrete, marble, tile, or plaster with subtle, medium, or strong intensity and lighting control',
    category: 'material',
    systemPrompt: 'Modify the textures and materials in this interior space while maintaining lighting, proportions, and spatial relationships. Apply the specified material changes with photorealistic accuracy',
    inputType: 'image',
    outputType: 'image',
    priority: 'medium',
    status: 'online',
    seo: {
      title: 'Change Texture Tool | AI Material Replacement',
      description: 'Modify textures and materials in interior spaces with AI. Replace materials while maintaining lighting and proportions.',
      keywords: ['change texture', 'material replacement', 'interior texture tool', 'texture modification']
    }
  },
  {
    id: 'material-alteration',
    slug: 'material-alteration',
    name: 'Material Alteration',
    description: 'Replace facade materials with brick, glass, concrete, metal, wood, stone, or composite with matte, glossy, textured, or satin finishes while preserving structure',
    category: 'material',
    systemPrompt: 'Alter the building materials and facade finishes in this architectural render, replacing specified materials while maintaining structural integrity, lighting, and architectural proportions',
    inputType: 'image',
    outputType: 'image',
    priority: 'low',
    status: 'online',
    seo: {
      title: 'Material Alteration Tool | Facade Material Replacement',
      description: 'Transform building materials and facade finishes with AI. Test different materials while maintaining structural integrity.',
      keywords: ['material alteration', 'facade material tool', 'building material replacement', 'material testing']
    }
  },
  {
    id: 'change-lighting',
    slug: 'change-lighting',
    name: 'Change Lighting',
    description: 'Transform interior lighting with natural, warm, cool, dramatic, soft, or studio styles for day, sunset, night, dawn, or golden hour while preserving materials',
    category: 'material',
    systemPrompt: 'Modify the lighting conditions in this interior space, adjusting natural and artificial light sources to create the specified ambiance while maintaining material accuracy and spatial relationships',
    inputType: 'image',
    outputType: 'image',
    priority: 'medium',
    status: 'online',
    seo: {
      title: 'Change Lighting Tool | Interior Lighting Simulation',
      description: 'Transform lighting conditions in interior spaces. Adjust natural and artificial light to create different ambiances.',
      keywords: ['change lighting', 'interior lighting tool', 'lighting simulation', 'lighting design']
    }
  },
  
  // Category 5: Interior Design Tools
  {
    id: 'upholstery-change',
    slug: 'upholstery-change',
    name: 'Upholstery Change',
    description: 'Replace furniture upholstery with leather, fabric, velvet, linen, suede, or canvas in solid, striped, geometric, floral, or abstract patterns while maintaining form',
    category: 'interior',
    systemPrompt: 'Change the upholstery patterns and materials on furniture in this interior render, applying the specified fabric, pattern, and color while maintaining furniture form and lighting',
    inputType: 'image',
    outputType: 'image',
    priority: 'low',
    status: 'online',
    seo: {
      title: 'Upholstery Change Tool | Furniture Fabric Replacement',
      description: 'Transform furniture upholstery with different patterns and materials. Test fabric options while maintaining form.',
      keywords: ['upholstery change', 'furniture fabric tool', 'interior design upholstery', 'fabric replacement']
    }
  },
  {
    id: 'product-placement',
    slug: 'product-placement',
    name: 'Product Placement',
    description: 'Place products into scenes with natural, prominent, or subtle positioning, auto/ preserve/fit scale adjustment, and optional lighting matching for realistic integration',
    category: 'interior',
    systemPrompt: 'Place the specified product into this interior scene with proper scale, lighting, shadows, and perspective, making it appear naturally integrated into the space',
    inputType: 'multiple',
    outputType: 'image',
    priority: 'medium',
    status: 'online',
    seo: {
      title: 'Product Placement Tool | Interior Product Visualization',
      description: 'Place products into interior scenes with AI. Integrate products with proper scale, lighting, and perspective.',
      keywords: ['product placement', 'interior product visualization', 'furniture placement tool', 'product integration']
    }
  },
  {
    id: 'item-change',
    slug: 'item-change',
    name: 'Item Change',
    description: 'Replace furniture, decor, fixtures, or artwork with style-matched, contrasting, or neutral alternatives while preserving or adjusting scale and lighting',
    category: 'interior',
    systemPrompt: 'Replace the specified items in this interior space with alternative options, maintaining scale, lighting, shadows, and spatial relationships',
    inputType: 'image',
    outputType: 'image',
    priority: 'low',
    status: 'online',
    seo: {
      title: 'Item Change Tool | Interior Item Replacement',
      description: 'Replace and swap items in interior spaces. Test different furniture and decor options with AI precision.',
      keywords: ['item replacement', 'interior item swap', 'furniture replacement tool', 'item swap']
    }
  },
  {
    id: 'moodboard-to-render',
    slug: 'moodboard-to-render',
    name: 'Moodboard to Render',
    description: 'Convert moodboards into cohesive, eclectic, minimalist, or maximalist interior renders for living, bedroom, kitchen, office, dining, or bathroom with concept to complete detail',
    category: 'interior',
    systemPrompt: 'Transform this moodboard into a photorealistic interior render that captures the mood, color palette, materials, and aesthetic of the moodboard while creating a cohesive, realistic space',
    inputType: 'image',
    outputType: 'image',
    priority: 'medium',
    status: 'online',
    seo: {
      title: 'Moodboard to Render | Interior Design Visualization',
      description: 'Transform moodboards into photorealistic interior renders. Bring design concepts to life with AI.',
      keywords: ['moodboard to render', 'interior design visualization', 'moodboard converter', 'design visualization']
    }
  },
  
  // Category 6: 3D & Model Tools
  {
    id: '3d-to-render',
    slug: '3d-to-render',
    name: '3D to Render',
    description: 'Convert 3D model screenshots to photorealistic renders with natural/dramatic/soft/studio lighting, urban/natural/minimal environments, and eye-level/aerial/low-angle/close-up cameras',
    category: '3d',
    systemPrompt: 'Transform this 3D model into a photorealistic architectural render with realistic materials, lighting, environment, and camera composition suitable for presentation',
    inputType: 'image',
    outputType: 'image',
    priority: 'high',
    status: 'online',
    seo: {
      title: '3D to Render Converter | Model Visualization Tool',
      description: 'Transform 3D models into photorealistic renders. Create presentation-ready visualizations with realistic materials and lighting.',
      keywords: ['3D to render', 'model visualization', '3D model rendering', '3D visualization']
    }
  },
  {
    id: 'sketch-to-render',
    slug: 'sketch-to-render',
    name: 'Sketch to Render',
    description: 'Transform sketches to photorealistic renders with preserve/enhance/transform style options and sunny/overcast/sunset/night environments while maintaining design intent',
    category: '3d',
    systemPrompt: 'Transform this architectural sketch into a photorealistic render, maintaining the design intent, proportions, and key elements while adding realistic materials, lighting, and environmental context',
    inputType: 'image',
    outputType: 'image',
    priority: 'high',
    status: 'online',
    seo: {
      title: 'Sketch to Render | Architectural Sketch Visualization',
      description: 'Transform architectural sketches into photorealistic renders. Bring hand drawings to life with AI.',
      keywords: ['sketch to render', 'architectural sketch visualization', 'hand drawing to render', 'sketch converter']
    }
  },
  
  // Category 7: Presentation & Portfolio Tools
  {
    id: 'presentation-board-maker',
    slug: 'presentation-board-maker',
    name: 'Presentation Board Maker',
    description: 'Create A3/A2/A1/A0 presentation boards with grid/masonry/linear/asymmetric/magazine layouts, light/dark/neutral/custom colors, and optional annotations for client meetings',
    category: 'presentation',
    systemPrompt: 'Create a professional architectural presentation board layout with these images, arranging them with proper visual hierarchy, spacing, annotations, and design elements suitable for client presentations or portfolio display',
    inputType: 'multiple',
    outputType: 'image',
    priority: 'high',
    status: 'online',
    seo: {
      title: 'Presentation Board Maker | Architectural Board Layout Tool',
      description: 'Create professional architectural presentation boards. Design layouts with proper visual hierarchy, spacing, and annotations.',
      keywords: ['presentation board maker', 'architectural board layout', 'portfolio board tool', 'presentation board software']
    }
  },
  {
    id: 'portfolio-layout-generator',
    slug: 'portfolio-layout-generator',
    name: 'Portfolio Layout Generator',
    description: 'Generate portfolio layouts with grid/masonry/linear/magazine/editorial styles, light/dark/neutral/minimal colors, minimal/elegant/bold typography, and balanced/large/small image emphasis',
    category: 'presentation',
    systemPrompt: 'Generate a professional architectural portfolio layout that showcases these project images with proper typography, spacing, visual hierarchy, and design elements suitable for online or print portfolios',
    inputType: 'multiple',
    outputType: 'image',
    priority: 'medium',
    status: 'online',
    seo: {
      title: 'Portfolio Layout Generator | Architect Portfolio Tool',
      description: 'Generate professional portfolio layouts for architectural projects. Create stunning portfolio pages with proper typography and spacing.',
      keywords: ['portfolio layout generator', 'architect portfolio tool', 'portfolio design software', 'architectural portfolio maker']
    }
  },
  {
    id: 'presentation-sequence-creator',
    slug: 'presentation-sequence-creator',
    name: 'Presentation Sequence Creator',
    description: 'Create linear/comparison/progressive/narrative sequences with horizontal/vertical/diagonal flow, smooth/clear/dramatic transitions, and minimal/detailed/no annotations for storytelling',
    category: 'presentation',
    systemPrompt: 'Create a sequential presentation layout that tells a visual story with these architectural images, arranging them in a logical flow with proper transitions, annotations, and narrative structure for client presentations',
    inputType: 'multiple',
    outputType: 'image',
    priority: 'medium',
    status: 'online',
    seo: {
      title: 'Presentation Sequence Creator | Client Presentation Tool',
      description: 'Create sequential presentation layouts for client meetings. Tell visual stories with proper flow and narrative structure.',
      keywords: ['presentation sequence', 'architectural presentation layout', 'client presentation tool', 'design review presentation']
    }
  }
];

export const CATEGORIES: { id: ToolCategory; name: string; description: string }[] = [
  {
    id: 'transformation',
    name: 'Render Transformations',
    description: 'Transform renders into different formats and styles'
  },
  {
    id: 'floorplan',
    name: 'Floor Plan Tools',
    description: 'Work with floor plans and spatial layouts'
  },
  {
    id: 'diagram',
    name: 'Diagram & Visualization',
    description: 'Create architectural diagrams and visualizations'
  },
  {
    id: 'material',
    name: 'Material & Texture',
    description: 'Test and modify materials and textures'
  },
  {
    id: 'interior',
    name: 'Interior Design',
    description: 'Interior design specific workflows'
  },
  {
    id: '3d',
    name: '3D & Model',
    description: 'Work with 3D models and conversions'
  },
  {
    id: 'presentation',
    name: 'Presentation & Portfolio',
    description: 'Create presentations, boards, and portfolios'
  }
];

export function getToolBySlug(slug: string): ToolConfig | undefined {
  const tool = TOOLS.find(tool => tool.slug === slug);
  if (!tool) return undefined;
  
  // Apply feature flags - override status based on environment
  return {
    ...tool,
    status: getEffectiveToolStatus(tool.id, tool.status)
  };
}

export function getToolsByCategory(category: ToolCategory): ToolConfig[] {
  return TOOLS.filter(tool => tool.category === category);
}

export function getAllTools(): ToolConfig[] {
  // Apply feature flags to all tools
  return TOOLS.map(tool => ({
    ...tool,
    status: getEffectiveToolStatus(tool.id, tool.status)
  }));
}

export function getOnlineTools(): ToolConfig[] {
  return TOOLS.filter(tool => {
    const effectiveStatus = getEffectiveToolStatus(tool.id, tool.status);
    return effectiveStatus === 'online';
  });
}

export function getOfflineTools(): ToolConfig[] {
  return TOOLS.filter(tool => tool.status === 'offline');
}

