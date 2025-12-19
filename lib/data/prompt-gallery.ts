/**
 * Prompt Gallery - Ready-made prompts optimized for Renderiq's AI generation pipeline
 * Following Gemini 3 best practices: structured, clear, with constraints
 */

export type PromptCategory = 
  | 'architectural'
  | 'interior'
  | 'exterior'
  | 'product'
  | 'landscape'
  | 'urban'
  | 'conceptual'
  | 'technical'
  | 'presentation';

export type PromptType = 'image' | 'video' | 'both';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: PromptCategory;
  type: PromptType;
  prompt: string;
  tags: string[];
  exampleOutput?: string;
  tips?: string[];
  variables?: {
    name: string;
    description: string;
    defaultValue?: string;
    options?: string[];
  }[];
}

export const PROMPT_CATEGORIES: Record<PromptCategory, { label: string; icon: string; description: string }> = {
  architectural: {
    label: 'Architectural',
    icon: '🏛️',
    description: 'Building exteriors, facades, and architectural structures'
  },
  interior: {
    label: 'Interior Design',
    icon: '🏠',
    description: 'Interior spaces, rooms, and indoor environments'
  },
  exterior: {
    label: 'Exterior',
    icon: '🌆',
    description: 'Outdoor spaces, building exteriors, and landscapes'
  },
  product: {
    label: 'Product',
    icon: '📦',
    description: 'Product visualization and placement'
  },
  landscape: {
    label: 'Landscape',
    icon: '🌳',
    description: 'Landscape design and outdoor environments'
  },
  urban: {
    label: 'Urban',
    icon: '🏙️',
    description: 'Urban planning, cityscapes, and street scenes'
  },
  conceptual: {
    label: 'Conceptual',
    icon: '💡',
    description: 'Conceptual designs and abstract visualizations'
  },
  technical: {
    label: 'Technical',
    icon: '📐',
    description: 'Technical drawings, diagrams, and CAD-style renders'
  },
  presentation: {
    label: 'Presentation',
    icon: '📊',
    description: 'Presentation boards and portfolio layouts'
  }
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Architectural Prompts
  {
    id: 'arch-modern-house-exterior',
    title: 'Modern House Exterior',
    description: 'Generate a photorealistic modern house exterior with clean lines and contemporary design',
    category: 'architectural',
    type: 'image',
    prompt: 'A modern single-family house exterior with clean geometric lines, large floor-to-ceiling windows, flat or low-pitched roof, minimalist facade with natural materials like wood and concrete, contemporary landscaping, natural daylight, photorealistic architectural rendering',
    tags: ['modern', 'house', 'exterior', 'contemporary', 'residential'],
    tips: [
      'Specify materials (wood, concrete, glass) for better results',
      'Add time of day (sunset, golden hour) for atmosphere',
      'Include landscaping details for context'
    ]
  },
  {
    id: 'arch-commercial-building',
    title: 'Commercial Building Facade',
    description: 'Create a professional commercial building facade visualization',
    category: 'architectural',
    type: 'image',
    prompt: 'A modern commercial office building facade with glass curtain walls, metal cladding, professional architectural design, urban context, pedestrians and street elements, natural daylight, photorealistic commercial architecture rendering',
    tags: ['commercial', 'office', 'facade', 'urban', 'professional'],
    variables: [
      {
        name: 'buildingType',
        description: 'Type of commercial building',
        defaultValue: 'office',
        options: ['office', 'retail', 'mixed-use', 'hotel']
      }
    ]
  },
  {
    id: 'arch-interior-living-room',
    title: 'Modern Living Room',
    description: 'Generate a cozy modern living room interior with contemporary furniture',
    category: 'interior',
    type: 'image',
    prompt: 'A modern living room interior with contemporary furniture, large windows with natural light, minimalist design, neutral color palette with accent colors, plants and decorative elements, cozy atmosphere, photorealistic interior rendering',
    tags: ['living room', 'interior', 'modern', 'residential', 'cozy'],
    tips: [
      'Specify color scheme for better control',
      'Add furniture style (Scandinavian, mid-century, etc.)',
      'Include lighting mood (bright, warm, ambient)'
    ]
  },
  {
    id: 'arch-kitchen-design',
    title: 'Kitchen Design',
    description: 'Create a modern kitchen interior with professional appliances',
    category: 'interior',
    type: 'image',
    prompt: 'A modern kitchen interior with sleek cabinetry, professional-grade appliances, marble or quartz countertops, pendant lighting, open layout, natural light from windows, photorealistic kitchen design rendering',
    tags: ['kitchen', 'interior', 'modern', 'residential'],
    variables: [
      {
        name: 'style',
        description: 'Kitchen style',
        defaultValue: 'modern',
        options: ['modern', 'traditional', 'industrial', 'Scandinavian']
      }
    ]
  },
  {
    id: 'arch-bedroom-interior',
    title: 'Bedroom Interior',
    description: 'Generate a serene bedroom interior with comfortable furnishings',
    category: 'interior',
    type: 'image',
    prompt: 'A serene bedroom interior with comfortable bed, soft lighting, neutral color palette, window with natural light, minimal decor, peaceful atmosphere, photorealistic bedroom rendering',
    tags: ['bedroom', 'interior', 'residential', 'serene'],
    tips: [
      'Specify color scheme (warm, cool, neutral)',
      'Add time of day (morning light, evening ambiance)',
      'Include style preference (minimalist, cozy, luxurious)'
    ]
  },
  {
    id: 'arch-exterior-daytime',
    title: 'Exterior Daytime View',
    description: 'Create a bright exterior view with natural daylight',
    category: 'exterior',
    type: 'image',
    prompt: 'A building exterior view in bright natural daylight, clear blue sky, well-lit facade, natural shadows, surrounding landscape or urban context, photorealistic architectural exterior rendering',
    tags: ['exterior', 'daytime', 'natural light', 'architectural'],
    variables: [
      {
        name: 'weather',
        description: 'Weather condition',
        defaultValue: 'sunny',
        options: ['sunny', 'overcast', 'partly cloudy']
      }
    ]
  },
  {
    id: 'arch-exterior-sunset',
    title: 'Exterior Sunset View',
    description: 'Generate a dramatic exterior view during golden hour',
    category: 'exterior',
    type: 'image',
    prompt: 'A building exterior view during golden hour sunset, warm orange and pink sky, dramatic lighting, long shadows, atmospheric glow, photorealistic architectural exterior rendering',
    tags: ['exterior', 'sunset', 'golden hour', 'dramatic'],
    tips: [
      'Sunset lighting creates dramatic atmosphere',
      'Works well for marketing and presentation materials',
      'Add specific building type for better results'
    ]
  },
  {
    id: 'arch-exterior-night',
    title: 'Exterior Night View',
    description: 'Create an exterior view with nighttime lighting',
    category: 'exterior',
    type: 'image',
    prompt: 'A building exterior view at night with architectural lighting, illuminated windows, dark sky, ambient street lighting, dramatic night atmosphere, photorealistic architectural exterior rendering',
    tags: ['exterior', 'night', 'lighting', 'dramatic'],
    tips: [
      'Specify lighting type (warm, cool, colored)',
      'Add surrounding context (urban, suburban, rural)',
      'Include weather (clear, foggy, rainy) for atmosphere'
    ]
  },
  {
    id: 'arch-product-showcase',
    title: 'Product Showcase',
    description: 'Generate a product placement in architectural context',
    category: 'product',
    type: 'image',
    prompt: 'A product placed in an architectural or interior context, professional product photography style, clean background, natural lighting, focus on product details, photorealistic product visualization',
    tags: ['product', 'showcase', 'commercial', 'visualization'],
    variables: [
      {
        name: 'productType',
        description: 'Type of product',
        defaultValue: 'furniture',
        options: ['furniture', 'lighting', 'fixtures', 'appliances']
      }
    ]
  },
  {
    id: 'arch-landscape-design',
    title: 'Landscape Design',
    description: 'Create a landscape design visualization',
    category: 'landscape',
    type: 'image',
    prompt: 'A landscape design with plants, trees, pathways, outdoor furniture, natural materials, well-maintained garden, natural daylight, photorealistic landscape architecture rendering',
    tags: ['landscape', 'garden', 'outdoor', 'design'],
    tips: [
      'Specify plant types for accuracy',
      'Add season (spring, summer, fall, winter)',
      'Include hardscape elements (paths, patios, decks)'
    ]
  },
  {
    id: 'arch-urban-street',
    title: 'Urban Street Scene',
    description: 'Generate an urban street scene with buildings and context',
    category: 'urban',
    type: 'image',
    prompt: 'An urban street scene with buildings, sidewalks, street furniture, trees, pedestrians, vehicles, natural daylight, urban context, photorealistic urban planning visualization',
    tags: ['urban', 'street', 'city', 'planning'],
    variables: [
      {
        name: 'timeOfDay',
        description: 'Time of day',
        defaultValue: 'daytime',
        options: ['daytime', 'evening', 'night']
      }
    ]
  },
  {
    id: 'arch-conceptual-design',
    title: 'Conceptual Design',
    description: 'Create a conceptual architectural visualization',
    category: 'conceptual',
    type: 'image',
    prompt: 'A conceptual architectural design with innovative forms, futuristic elements, abstract composition, creative visualization style, artistic rendering, conceptual architecture',
    tags: ['conceptual', 'futuristic', 'innovative', 'abstract'],
    tips: [
      'Specify style (futuristic, organic, geometric)',
      'Add mood (dramatic, serene, dynamic)',
      'Include level of abstraction (realistic, stylized, abstract)'
    ]
  },
  {
    id: 'arch-technical-drawing',
    title: 'Technical Drawing Style',
    description: 'Generate a technical/CAD-style architectural drawing',
    category: 'technical',
    type: 'image',
    prompt: 'A technical architectural drawing with precise linework, CAD-style rendering, dimension lines, architectural annotations, technical drawing style, professional architectural documentation',
    tags: ['technical', 'CAD', 'drawing', 'documentation'],
    tips: [
      'Specify drawing type (elevation, section, plan)',
      'Add annotation style (detailed, minimal)',
      'Include scale information if needed'
    ]
  },
  // Video Prompts
  {
    id: 'video-exterior-walkthrough',
    title: 'Exterior Walkthrough',
    description: 'Create a video walkthrough of a building exterior',
    category: 'exterior',
    type: 'video',
    prompt: 'A smooth camera movement around a building exterior, showcasing the facade from different angles, natural daylight, cinematic camera motion, professional architectural video',
    tags: ['video', 'exterior', 'walkthrough', 'cinematic'],
    tips: [
      'Specify camera movement (orbit, dolly, crane)',
      'Add time of day for atmosphere',
      'Include duration preference (4s, 6s, 8s)'
    ]
  },
  {
    id: 'video-interior-tour',
    title: 'Interior Tour',
    description: 'Generate a video tour of an interior space',
    category: 'interior',
    type: 'video',
    prompt: 'A smooth camera movement through an interior space, showcasing the room layout and design, natural lighting, cinematic camera motion, professional interior design video',
    tags: ['video', 'interior', 'tour', 'cinematic'],
    variables: [
      {
        name: 'roomType',
        description: 'Type of room',
        defaultValue: 'living room',
        options: ['living room', 'kitchen', 'bedroom', 'office', 'bathroom']
      }
    ]
  },
  {
    id: 'video-day-to-night',
    title: 'Day to Night Transition',
    description: 'Create a time-lapse style day to night transition',
    category: 'exterior',
    type: 'video',
    prompt: 'A smooth transition from daytime to nighttime showing a building exterior, changing lighting conditions, sky color transition, architectural lighting turning on, cinematic time-lapse effect',
    tags: ['video', 'transition', 'day-night', 'time-lapse'],
    tips: [
      'Works best with 8-second duration',
      'Specify building type for better results',
      'Add weather conditions for atmosphere'
    ]
  },
  {
    id: 'video-product-rotation',
    title: 'Product Rotation',
    description: 'Generate a rotating product showcase video',
    category: 'product',
    type: 'video',
    prompt: 'A smooth 360-degree rotation of a product in an architectural or interior context, professional product showcase, natural lighting, cinematic camera motion',
    tags: ['video', 'product', 'rotation', 'showcase'],
    variables: [
      {
        name: 'productType',
        description: 'Type of product',
        defaultValue: 'furniture',
        options: ['furniture', 'lighting', 'fixtures', 'appliances']
      }
    ]
  },
  {
    id: 'video-urban-timelapse',
    title: 'Urban Timelapse',
    description: 'Create an urban scene with subtle motion',
    category: 'urban',
    type: 'video',
    prompt: 'An urban street scene with subtle motion, moving clouds, changing light, pedestrians, vehicles, natural daylight, cinematic urban video',
    tags: ['video', 'urban', 'timelapse', 'motion'],
    tips: [
      'Specify time of day',
      'Add weather conditions',
      'Include level of activity (busy, quiet)'
    ]
  },
  // Both Image and Video
  {
    id: 'both-architectural-detail',
    title: 'Architectural Detail',
    description: 'Showcase architectural details and materials',
    category: 'architectural',
    type: 'both',
    prompt: 'A close-up view of architectural details showing materials, textures, and craftsmanship, natural lighting highlighting textures, professional architectural detail photography',
    tags: ['detail', 'materials', 'texture', 'close-up'],
    tips: [
      'Specify material type (wood, concrete, metal, glass)',
      'Add lighting direction for texture emphasis',
      'Include scale reference if needed'
    ]
  },
  {
    id: 'both-skyline-view',
    title: 'Skyline View',
    description: 'Generate a city skyline view',
    category: 'urban',
    type: 'both',
    prompt: 'A city skyline view with multiple buildings, urban context, natural daylight, clear visibility, professional urban planning visualization',
    tags: ['skyline', 'city', 'urban', 'panoramic'],
    variables: [
      {
        name: 'timeOfDay',
        description: 'Time of day',
        defaultValue: 'daytime',
        options: ['daytime', 'sunset', 'night']
      }
    ]
  }
];

/**
 * Get prompts by category
 */
export function getPromptsByCategory(category: PromptCategory): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter(p => p.category === category);
}

/**
 * Get prompts by type
 */
export function getPromptsByType(type: PromptType): PromptTemplate[] {
  if (type === 'both') {
    return PROMPT_TEMPLATES;
  }
  return PROMPT_TEMPLATES.filter(p => p.type === type || p.type === 'both');
}

/**
 * Search prompts by query
 */
export function searchPrompts(query: string): PromptTemplate[] {
  const lowerQuery = query.toLowerCase();
  return PROMPT_TEMPLATES.filter(p => 
    p.title.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    p.prompt.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get prompt by ID
 */
export function getPromptById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find(p => p.id === id);
}

/**
 * Replace variables in prompt template
 */
export function renderPrompt(template: PromptTemplate, variables: Record<string, string> = {}): string {
  let rendered = template.prompt;
  
  // Replace variable placeholders if any
  if (template.variables) {
    template.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || '';
      // Simple replacement - can be enhanced with more sophisticated templating
      rendered = rendered.replace(new RegExp(`\\{${variable.name}\\}`, 'g'), value);
    });
  }
  
  return rendered;
}





