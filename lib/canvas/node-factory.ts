/**
 * Node Factory System
 * Provides a centralized registry and factory for creating canvas nodes
 * This eliminates the need to manually create node cards and configurations
 */

import { Node } from '@xyflow/react';
import { NodeType } from '@/lib/types/canvas';

export interface NodeDefinition {
  type: NodeType;
  label: string;
  description: string;
  icon?: string;
  category: 'input' | 'processing' | 'output' | 'utility';
  defaultData: any;
  defaultPosition?: { x: number; y: number };
  inputs?: Array<{
    id: string;
    label: string;
    type: 'text' | 'image' | 'style' | 'material' | 'variants';
    required?: boolean;
  }>;
  outputs?: Array<{
    id: string;
    label: string;
    type: 'text' | 'image' | 'style' | 'material' | 'variants';
  }>;
  color?: {
    header: string;
    accent: string;
    icon: string;
  };
}

/**
 * Node Registry - Centralized definitions for all node types
 */
export const NODE_REGISTRY: Record<NodeType, NodeDefinition> = {
  text: {
    type: 'text',
    label: 'Text Prompt - Enter text prompts for image generation',
    description: 'Enter text prompts for image generation',
    category: 'input',
    defaultData: {
      prompt: '',
      placeholder: 'Enter your prompt...',
    },
    inputs: [
      {
        id: 'text',
        label: 'Text',
        type: 'text',
        required: false,
      },
    ],
    outputs: [
      {
        id: 'text',
        label: 'Text',
        type: 'text',
      },
    ],
    color: {
      header: 'bg-blue-500/20 border-blue-500/30',
      accent: 'text-blue-500',
      icon: 'text-blue-500',
    },
  },
  image: {
    type: 'image',
    label: 'Image Generator - Generate images from prompts',
    description: 'Generate images from prompts',
    category: 'processing',
    defaultData: {
      prompt: '',
      settings: {
        style: 'architectural',
        quality: 'standard',
        aspectRatio: '16:9',
      },
      status: 'idle',
    },
    inputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        required: false,
      },
      {
        id: 'baseImage',
        label: 'Base Image',
        type: 'image',
        required: false,
      },
      {
        id: 'style',
        label: 'Style',
        type: 'style',
        required: false,
      },
      {
        id: 'material',
        label: 'Material',
        type: 'material',
        required: false,
      },
    ],
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
      },
    ],
    color: {
      header: 'bg-purple-500/20 border-purple-500/30',
      accent: 'text-purple-500',
      icon: 'text-purple-500',
    },
  },
  variants: {
    type: 'variants',
    label: 'Variants - Generate multiple variations of an image',
    description: 'Generate multiple variations of an image',
    category: 'processing',
    defaultData: {
      count: 4,
      settings: {
        variationStrength: 0.5,
        quality: 'standard',
      },
      status: 'idle',
      variants: [],
    },
    inputs: [
      {
        id: 'sourceImage',
        label: 'Source Image',
        type: 'image',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'variants',
        label: 'Variants',
        type: 'variants',
      },
    ],
    color: {
      header: 'bg-pink-500/20 border-pink-500/30',
      accent: 'text-pink-500',
      icon: 'text-pink-500',
    },
  },
  style: {
    type: 'style',
    label: 'Style Settings - Configure rendering style and camera settings',
    description: 'Configure rendering style and camera settings',
    category: 'utility',
    defaultData: {
      camera: {
        focalLength: 35,
        fStop: 5.6,
        position: 'eye-level',
        angle: 'three-quarter',
      },
      environment: {
        scene: 'exterior',
        weather: 'sunny',
        timeOfDay: 'afternoon',
        season: 'summer',
      },
      lighting: {
        intensity: 70,
        direction: 'side',
        color: 'warm',
        shadows: 'soft',
      },
      atmosphere: {
        mood: 'professional',
        contrast: 50,
        saturation: 50,
      },
    },
    outputs: [
      {
        id: 'style',
        label: 'Style',
        type: 'style',
      },
    ],
    color: {
      header: 'bg-orange-500/20 border-orange-500/30',
      accent: 'text-orange-500',
      icon: 'text-orange-500',
    },
  },
  material: {
    type: 'material',
    label: 'Material Settings - Configure material properties',
    description: 'Configure material properties',
    category: 'utility',
    defaultData: {
      materials: [],
    },
    outputs: [
      {
        id: 'materials',
        label: 'Materials',
        type: 'material',
      },
    ],
    color: {
      header: 'bg-indigo-500/20 border-indigo-500/30',
      accent: 'text-indigo-500',
      icon: 'text-indigo-500',
    },
  },
  output: {
    type: 'output',
    label: 'Output - Final output node for images and variants',
    description: 'Final output node for images and variants. Can output image for iterative workflows.',
    category: 'output',
    defaultData: {
      status: 'idle',
    },
    inputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        required: false,
      },
      {
        id: 'variants',
        label: 'Variants',
        type: 'variants',
        required: false,
      },
    ],
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
      },
    ],
    color: {
      header: 'bg-green-500/20 border-green-500/30',
      accent: 'text-green-500',
      icon: 'text-green-500',
    },
  },
  'prompt-builder': {
    type: 'prompt-builder',
    label: 'Prompt Builder - AI-powered prompt generator using dropdowns',
    description: 'AI-powered prompt generator using dropdowns',
    category: 'input',
    defaultData: {
      sceneType: 'interior',
      style: 'modern',
      mood: 'bright',
      subject: 'architecture',
      additionalDetails: '',
      generatedPrompt: '',
      status: 'idle',
    },
    outputs: [
      {
        id: 'prompt',
        label: 'Generated Prompt',
        type: 'text',
      },
    ],
    color: {
      header: 'bg-cyan-500/20 border-cyan-500/30',
      accent: 'text-cyan-500',
      icon: 'text-cyan-500',
    },
  },
  'style-reference': {
    type: 'style-reference',
    label: 'Style Reference - Extract style from uploaded image',
    description: 'Extract style from uploaded image',
    category: 'utility',
    defaultData: {
      imageUrl: null,
      imageData: null,
      imageType: null,
      imageName: null,
      styleExtraction: {
        extractCamera: true,
        extractLighting: true,
        extractAtmosphere: true,
        extractEnvironment: true,
        extractColors: true,
        extractComposition: true,
      },
      extractedStyle: undefined,
    },
    outputs: [
      {
        id: 'style',
        label: 'Style',
        type: 'style',
      },
    ],
    color: {
      header: 'bg-amber-500/20 border-amber-500/30',
      accent: 'text-amber-500',
      icon: 'text-amber-500',
    },
  },
  'image-input': {
    type: 'image-input',
    label: 'Image Input - Upload base image for image-to-image generation',
    description: 'Upload base image for image-to-image generation',
    category: 'input',
    defaultData: {
      imageUrl: null,
      imageData: null,
      imageType: null,
      imageName: null,
    },
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
      },
    ],
    color: {
      header: 'bg-blue-500/20 border-blue-500/30',
      accent: 'text-blue-500',
      icon: 'text-blue-500',
    },
  },
  video: {
    type: 'video',
    label: 'Video Generator - Generate videos from text or animate images',
    description: 'Generate videos from text or animate images',
    category: 'processing',
    defaultData: {
      prompt: '',
      settings: {
        duration: 8,
        aspectRatio: '16:9',
        model: 'veo-3.1-generate-preview',
      },
      status: 'idle',
    },
    inputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        required: false,
      },
      {
        id: 'baseImage',
        label: 'Base Image',
        type: 'image',
        required: false,
      },
    ],
    outputs: [
      {
        id: 'video',
        label: 'Video',
        type: 'image',
      },
    ],
    color: {
      header: 'bg-purple-500/20 border-purple-500/30',
      accent: 'text-purple-500',
      icon: 'text-purple-500',
    },
  },
};

/**
 * Node Factory - Creates nodes from definitions
 */
export class NodeFactory {
  /**
   * Create a new node from a type
   */
  static createNode(
    type: NodeType,
    position?: { x: number; y: number },
    customData?: any
  ): Node {
    const definition = NODE_REGISTRY[type];
    if (!definition) {
      throw new Error(`Unknown node type: ${type}`);
    }

    const defaultPosition = position || definition.defaultPosition || { x: 100, y: 100 };
    const nodeId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: nodeId,
      type: type,
      position: defaultPosition,
      data: {
        ...definition.defaultData,
        ...customData,
      },
    };
  }

  /**
   * Create multiple nodes at once with proper spacing
   */
  static createNodes(
    types: NodeType[],
    startPosition: { x: number; y: number } = { x: 100, y: 100 },
    spacing: { x: number; y: number } = { x: 400, y: 0 }, // Horizontal layout by default
    layout: 'horizontal' | 'vertical' = 'horizontal'
  ): Node[] {
    return types.map((type, index) => {
      let position: { x: number; y: number };
      
      if (layout === 'horizontal') {
        // Horizontal layout: nodes side by side
        position = {
          x: startPosition.x + (index * spacing.x),
          y: startPosition.y,
        };
      } else {
        // Vertical layout: nodes stacked
        position = {
          x: startPosition.x,
          y: startPosition.y + (index * spacing.y || 250),
        };
      }
      
      return this.createNode(type, position);
    });
  }

  /**
   * Get node definition
   */
  static getDefinition(type: NodeType): NodeDefinition {
    const definition = NODE_REGISTRY[type];
    if (!definition) {
      throw new Error(`Unknown node type: ${type}`);
    }
    return definition;
  }

  /**
   * Get all node definitions
   */
  static getAllDefinitions(): NodeDefinition[] {
    return Object.values(NODE_REGISTRY);
  }

  /**
   * Get node definitions by category
   */
  static getDefinitionsByCategory(category: NodeDefinition['category']): NodeDefinition[] {
    return Object.values(NODE_REGISTRY).filter(def => def.category === category);
  }

  /**
   * Validate node data against definition
   */
  static validateNodeData(type: NodeType, data: any): { valid: boolean; errors: string[] } {
    const definition = NODE_REGISTRY[type];
    if (!definition) {
      return { valid: false, errors: [`Unknown node type: ${type}`] };
    }

    const errors: string[] = [];

    // Check required inputs
    if (definition.inputs) {
      definition.inputs
        .filter(input => input.required)
        .forEach(input => {
          if (!data[input.id]) {
            errors.push(`Required input '${input.label}' is missing`);
          }
        });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get default position for a new node (avoids overlap)
   * Uses proper spacing based on node width (typically 320px for our nodes)
   */
  static getDefaultPosition(existingNodes: Node[]): { x: number; y: number } {
    if (existingNodes.length === 0) {
      return { x: 100, y: 100 };
    }

    // Node width is typically 320px (w-80 = 20rem = 320px)
    const NODE_WIDTH = 320;
    const NODE_SPACING = 400; // Extra spacing between nodes

    // Find the rightmost node
    const rightmostNode = existingNodes.reduce((prev, current) => {
      return (current.position.x > prev.position.x) ? current : prev;
    });

    return {
      x: rightmostNode.position.x + NODE_SPACING,
      y: rightmostNode.position.y,
    };
  }
}

/**
 * Node Templates - Pre-configured node combinations with connections
 */
export interface NodeTemplate {
  name: string;
  description: string;
  nodes: NodeType[];
  connections: Array<{
    from: { nodeIndex: number; handle: string };
    to: { nodeIndex: number; handle: string };
  }>;
  layout?: 'horizontal' | 'vertical';
}

export const NODE_TEMPLATES: Record<string, NodeTemplate> = {
  // Basic Templates
  basic: {
    name: 'Basic Workflow - Simple text to image generation',
    description: 'Simple text to image generation',
    nodes: ['text', 'image', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 1, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'image' }, to: { nodeIndex: 2, handle: 'image' } },
    ],
    layout: 'horizontal',
  },
  styled: {
    name: 'Styled Generation - Text to image with style settings',
    description: 'Text to image with style settings',
    nodes: ['text', 'style', 'image', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 2, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 2, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'image' }, to: { nodeIndex: 3, handle: 'image' } },
    ],
    layout: 'horizontal',
  },
  variants: {
    name: 'Variants Workflow - Generate image and create variants',
    description: 'Generate image and create variants',
    nodes: ['text', 'image', 'variants', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 1, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'image' }, to: { nodeIndex: 2, handle: 'sourceImage' } },
      { from: { nodeIndex: 2, handle: 'variants' }, to: { nodeIndex: 3, handle: 'variants' } },
    ],
    layout: 'horizontal',
  },
  complete: {
    name: 'Complete Workflow - Full workflow with all settings and variants',
    description: 'Full workflow with all settings and variants',
    nodes: ['text', 'style', 'material', 'image', 'variants', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 3, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 3, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'materials' }, to: { nodeIndex: 3, handle: 'material' } },
      { from: { nodeIndex: 3, handle: 'image' }, to: { nodeIndex: 4, handle: 'sourceImage' } },
      { from: { nodeIndex: 4, handle: 'variants' }, to: { nodeIndex: 5, handle: 'variants' } },
    ],
    layout: 'horizontal',
  },
  
  // Image-to-Image Templates
  'image-to-image': {
    name: 'Image-to-Image - Modify an existing image with text guidance',
    description: 'Modify an existing image with text guidance',
    nodes: ['image-input', 'text', 'image', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'image' }, to: { nodeIndex: 2, handle: 'baseImage' } },
      { from: { nodeIndex: 1, handle: 'text' }, to: { nodeIndex: 2, handle: 'prompt' } },
      { from: { nodeIndex: 2, handle: 'image' }, to: { nodeIndex: 3, handle: 'image' } },
    ],
    layout: 'horizontal',
  },
  'image-to-image-styled': {
    name: 'Image-to-Image with Style - Iterative editing with style guidance',
    description: 'Iterative editing with style guidance',
    nodes: ['image-input', 'text', 'style', 'image', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'image' }, to: { nodeIndex: 3, handle: 'baseImage' } },
      { from: { nodeIndex: 1, handle: 'text' }, to: { nodeIndex: 3, handle: 'prompt' } },
      { from: { nodeIndex: 2, handle: 'style' }, to: { nodeIndex: 3, handle: 'style' } },
      { from: { nodeIndex: 3, handle: 'image' }, to: { nodeIndex: 4, handle: 'image' } },
    ],
    layout: 'horizontal',
  },
  
  // Video Templates
  'text-to-video': {
    name: 'Text-to-Video - Generate video from text prompt',
    description: 'Generate video from text prompt',
    nodes: ['text', 'video', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 1, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'video' }, to: { nodeIndex: 2, handle: 'image' } },
    ],
    layout: 'horizontal',
  },
  'image-to-video': {
    name: 'Image-to-Video - Animate an uploaded image into video',
    description: 'Animate an uploaded image into video',
    nodes: ['image-input', 'text', 'video', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'image' }, to: { nodeIndex: 2, handle: 'baseImage' } },
      { from: { nodeIndex: 1, handle: 'text' }, to: { nodeIndex: 2, handle: 'prompt' } },
      { from: { nodeIndex: 2, handle: 'video' }, to: { nodeIndex: 3, handle: 'image' } },
    ],
    layout: 'horizontal',
  },
  'image-to-video-animated': {
    name: 'Image to Video (Animated) - Generate image first, then animate it into video',
    description: 'Generate image first, then animate it into video',
    nodes: ['text', 'image', 'video', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 1, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'image' }, to: { nodeIndex: 2, handle: 'baseImage' } },
      { from: { nodeIndex: 2, handle: 'video' }, to: { nodeIndex: 3, handle: 'image' } },
    ],
    layout: 'horizontal',
  },
  
  // Style Reference Templates
  'style-reference': {
    name: 'Style Reference - Extract style from reference image and apply to new generation',
    description: 'Extract style from reference image and apply to new generation (upload image in Style Reference node)',
    nodes: ['style-reference', 'text', 'image', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'style' }, to: { nodeIndex: 2, handle: 'style' } },
      { from: { nodeIndex: 1, handle: 'text' }, to: { nodeIndex: 2, handle: 'prompt' } },
      { from: { nodeIndex: 2, handle: 'image' }, to: { nodeIndex: 3, handle: 'image' } },
    ],
    layout: 'horizontal',
  },
  
  // Prompt Builder Templates
  'prompt-builder': {
    name: 'AI Prompt Builder - Use AI to generate prompts, then create images',
    description: 'Use AI to generate prompts, then create images',
    nodes: ['prompt-builder', 'image', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'prompt' }, to: { nodeIndex: 1, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'image' }, to: { nodeIndex: 2, handle: 'image' } },
    ],
    layout: 'horizontal',
  },
  'prompt-builder-styled': {
    name: 'AI Prompt Builder with Style - AI-generated prompts with style settings',
    description: 'AI-generated prompts with style settings',
    nodes: ['prompt-builder', 'style', 'image', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'prompt' }, to: { nodeIndex: 2, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 2, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'image' }, to: { nodeIndex: 3, handle: 'image' } },
    ],
    layout: 'horizontal',
  },
  
  // Advanced Templates
  architectural: {
    name: 'Architectural Visualization - Complete pipeline for architectural rendering with variants',
    description: 'Complete pipeline for architectural rendering with variants',
    nodes: ['text', 'style', 'material', 'image', 'variants', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 3, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 3, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'materials' }, to: { nodeIndex: 3, handle: 'material' } },
      { from: { nodeIndex: 3, handle: 'image' }, to: { nodeIndex: 4, handle: 'sourceImage' } },
      { from: { nodeIndex: 4, handle: 'variants' }, to: { nodeIndex: 5, handle: 'variants' } },
    ],
    layout: 'horizontal',
  },
  interior: {
    name: 'Interior Design - Interior design visualization workflow',
    description: 'Interior design visualization workflow',
    nodes: ['text', 'style', 'image', 'variants', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 2, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 2, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'image' }, to: { nodeIndex: 3, handle: 'sourceImage' } },
      { from: { nodeIndex: 3, handle: 'variants' }, to: { nodeIndex: 4, handle: 'variants' } },
    ],
    layout: 'horizontal',
  },
  exterior: {
    name: 'Exterior Architecture - Exterior architectural rendering workflow',
    description: 'Exterior architectural rendering workflow',
    nodes: ['text', 'style', 'material', 'image', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 3, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 3, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'materials' }, to: { nodeIndex: 3, handle: 'material' } },
      { from: { nodeIndex: 3, handle: 'image' }, to: { nodeIndex: 4, handle: 'image' } },
    ],
    layout: 'horizontal',
  },
  product: {
    name: 'Product Visualization - Product rendering and visualization with variants',
    description: 'Product rendering and visualization with variants',
    nodes: ['text', 'style', 'image', 'variants', 'output'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 2, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 2, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'image' }, to: { nodeIndex: 3, handle: 'sourceImage' } },
      { from: { nodeIndex: 3, handle: 'variants' }, to: { nodeIndex: 4, handle: 'variants' } },
    ],
    layout: 'horizontal',
  },
};

/**
 * Create nodes and edges from a template
 */
export function createNodesFromTemplate(
  templateName: keyof typeof NODE_TEMPLATES,
  startPosition: { x: number; y: number } = { x: 100, y: 100 }
): { nodes: Node[]; edges: Array<{ id: string; source: string; target: string; sourceHandle: string; targetHandle: string }> } {
  const template = NODE_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Unknown template: ${templateName}`);
  }

  // Create nodes with proper spacing
  const nodes = NodeFactory.createNodes(
    template.nodes,
    startPosition,
    { x: 400, y: 250 },
    template.layout || 'horizontal'
  );

  // Create edges based on template connections
  const edges = template.connections.map((conn, index) => {
    const sourceNode = nodes[conn.from.nodeIndex];
    const targetNode = nodes[conn.to.nodeIndex];
    
    if (!sourceNode || !targetNode) {
      throw new Error(`Invalid connection in template: node index out of range`);
    }

    return {
      id: `edge-${templateName}-${index}-${Date.now()}`,
      source: sourceNode.id,
      target: targetNode.id,
      sourceHandle: conn.from.handle,
      targetHandle: conn.to.handle,
    };
  });

  return { nodes, edges };
}

