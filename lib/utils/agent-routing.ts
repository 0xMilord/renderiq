/**
 * Smart routing utility for deciding between agent mode, image generation mode, or hybrid
 * Analyzes user input to determine the best execution path
 */

export type RoutingMode = 'agent' | 'image-gen' | 'hybrid' | 'generate-and-place';

export interface RoutingDecision {
  mode: RoutingMode;
  confidence: number;
  reasoning: string;
  agentPrompt?: string;
  imageGenPrompt?: string;
}

/**
 * Keywords that indicate canvas/agent operations
 */
const AGENT_KEYWORDS = [
  // Canvas manipulation
  'on canvas',
  'on the canvas',
  'draw',
  'create shape',
  'add shape',
  'arrange',
  'align',
  'organize',
  'layout',
  'diagram',
  'flowchart',
  'presentation',
  'move',
  'resize',
  'rotate',
  'delete',
  'remove',
  'stack',
  'distribute',
  'group',
  'ungroup',
  'bring to front',
  'send to back',
  'layer',
  
  // Agent-specific commands
  '/canvas',
  '/agent',
  '/diagram',
  '/presentation',
  '/organize',
  
  // Visual operations
  'annotate',
  'label',
  'highlight',
  'mark',
  'circle',
  'arrow',
  'line',
  'text box',
  'note',
  'comment',
  
  // Multi-step operations
  'create a',
  'make a',
  'build a',
  'design a',
  'sketch',
  'illustrate',
  
  // Canvas planning keywords
  'plan',
  'planning',
  'structure',
  'outline',
  'blueprint',
  'wireframe',
  'mockup',
  
  // Building keywords
  'build',
  'construct',
  'assemble',
  'compose',
  'form',
  'develop',
  
  // Presentation keywords
  'slide',
  'deck',
  'showcase',
  'portfolio',
  'gallery',
  'show',
  'display',
  'exhibit',
  
  // Placement keywords
  'place',
  'put',
  'position',
  'add to canvas',
  'put on canvas',
];

/**
 * Keywords that indicate image generation
 */
const IMAGE_GEN_KEYWORDS = [
  // Direct generation requests
  'generate',
  'create image',
  'make image',
  'render',
  'image of',
  'picture of',
  'photo of',
  'visualize',
  'show me',
  'give me',
  
  // Architectural/design generation
  'architectural',
  'building',
  'house',
  'interior',
  'exterior',
  'design',
  'concept',
  'style',
  'aesthetic',
  
  // Variant/iteration requests
  'variant',
  'variation',
  'alternative',
  'different',
  'another',
  'more',
  'options',
  
  // Quality/style modifiers
  'high quality',
  'ultra',
  '4k',
  'hd',
  'professional',
  'photorealistic',
];

/**
 * Keywords that indicate hybrid (both agent and image gen)
 */
const HYBRID_KEYWORDS = [
  'and then',
  'also',
  'plus',
  'additionally',
  'after that',
  'then',
  'next',
  'followed by',
  'along with',
];

/**
 * Analyze user input and determine routing mode
 */
export function analyzeRouting(input: string): RoutingDecision {
  const lowerInput = input.toLowerCase().trim();
  
  // Check for explicit commands
  if (lowerInput.startsWith('/canvas') || lowerInput.startsWith('/agent')) {
    return {
      mode: 'agent',
      confidence: 1.0,
      reasoning: 'Explicit agent command',
      agentPrompt: input,
    };
  }
  
  if (lowerInput.startsWith('/image') || lowerInput.startsWith('/gen')) {
    return {
      mode: 'image-gen',
      confidence: 1.0,
      reasoning: 'Explicit image generation command',
      imageGenPrompt: input,
    };
  }
  
  // Count keyword matches
  const agentMatches = AGENT_KEYWORDS.filter(keyword => 
    lowerInput.includes(keyword.toLowerCase())
  ).length;
  
  const imageGenMatches = IMAGE_GEN_KEYWORDS.filter(keyword => 
    lowerInput.includes(keyword.toLowerCase())
  ).length;
  
  const hybridMatches = HYBRID_KEYWORDS.filter(keyword => 
    lowerInput.includes(keyword.toLowerCase())
  ).length;
  
  // Check for hybrid patterns (contains both agent and image gen keywords)
  if (agentMatches > 0 && imageGenMatches > 0) {
    // Split into agent and image gen parts
    const parts = splitHybridInput(input);
    
    return {
      mode: 'hybrid',
      confidence: 0.8,
      reasoning: `Contains both agent (${agentMatches}) and image gen (${imageGenMatches}) keywords`,
      agentPrompt: parts.agent,
      imageGenPrompt: parts.imageGen,
    };
  }
  
  // Check for hybrid connectors
  if (hybridMatches > 0 && (agentMatches > 0 || imageGenMatches > 0)) {
    const parts = splitHybridInput(input);
    
    return {
      mode: 'hybrid',
      confidence: 0.7,
      reasoning: 'Contains hybrid connector keywords',
      agentPrompt: parts.agent,
      imageGenPrompt: parts.imageGen,
    };
  }
  
  // Pure agent mode
  if (agentMatches > 2 || (agentMatches > 0 && imageGenMatches === 0)) {
    return {
      mode: 'agent',
      confidence: Math.min(0.9, 0.5 + agentMatches * 0.1),
      reasoning: `Strong agent keywords (${agentMatches} matches)`,
      agentPrompt: input,
    };
  }
  
  // Pure image gen mode
  if (imageGenMatches > 2 || (imageGenMatches > 0 && agentMatches === 0)) {
    return {
      mode: 'image-gen',
      confidence: Math.min(0.9, 0.5 + imageGenMatches * 0.1),
      reasoning: `Strong image generation keywords (${imageGenMatches} matches)`,
      imageGenPrompt: input,
    };
  }
  
  // Check for "generate and place" pattern
  const generateAndPlacePatterns = [
    'generate and place',
    'create and add',
    'make and put',
    'render and place',
    'generate then place',
  ];
  
  const hasGenerateAndPlace = generateAndPlacePatterns.some(pattern => 
    lowerInput.includes(pattern)
  );
  
  if (hasGenerateAndPlace || (imageGenMatches > 0 && lowerInput.includes('place'))) {
    return {
      mode: 'generate-and-place',
      confidence: 0.85,
      reasoning: 'Generate image and place on canvas',
      imageGenPrompt: input,
      agentPrompt: 'Place the generated image on the canvas',
    };
  }

  // Default: image generation (most common use case)
  return {
    mode: 'image-gen',
    confidence: 0.5,
    reasoning: 'Default to image generation (most common use case)',
    imageGenPrompt: input,
  };
}

/**
 * Split hybrid input into agent and image gen parts
 */
function splitHybridInput(input: string): { agent: string; imageGen: string } {
  const lowerInput = input.toLowerCase();
  
  // Find split points
  const splitKeywords = ['and then', 'then', 'also', 'plus', 'additionally', 'after that', 'next', 'followed by'];
  
  for (const keyword of splitKeywords) {
    const index = lowerInput.indexOf(keyword);
    if (index > 0) {
      const before = input.substring(0, index).trim();
      const after = input.substring(index + keyword.length).trim();
      
      // Determine which part is agent vs image gen
      const beforeIsAgent = AGENT_KEYWORDS.some(k => before.toLowerCase().includes(k.toLowerCase()));
      const afterIsAgent = AGENT_KEYWORDS.some(k => after.toLowerCase().includes(k.toLowerCase()));
      
      if (beforeIsAgent && !afterIsAgent) {
        return { agent: before, imageGen: after };
      } else if (!beforeIsAgent && afterIsAgent) {
        return { agent: after, imageGen: before };
      }
    }
  }
  
  // If no clear split, return original for both (will be handled by routing logic)
  return { agent: input, imageGen: input };
}

/**
 * Check if input should definitely go to agent
 */
export function isAgentCommand(input: string): boolean {
  const decision = analyzeRouting(input);
  return decision.mode === 'agent' && decision.confidence > 0.7;
}

/**
 * Check if input should definitely go to image generation
 */
export function isImageGenCommand(input: string): boolean {
  const decision = analyzeRouting(input);
  return decision.mode === 'image-gen' && decision.confidence > 0.7;
}

/**
 * Check if input should use hybrid mode
 */
export function isHybridCommand(input: string): boolean {
  const decision = analyzeRouting(input);
  return decision.mode === 'hybrid';
}

