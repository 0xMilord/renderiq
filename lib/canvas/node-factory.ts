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
    label: 'Text Prompt',
    description: 'Enter text prompts for image generation',
    category: 'input',
    defaultData: {
      prompt: '',
      placeholder: 'Enter your prompt...',
    },
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
    label: 'Image Generator',
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
        required: true,
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
    label: 'Variants',
    description: 'Generate multiple variations of an image',
    category: 'output',
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
    label: 'Style Settings',
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
    label: 'Material Settings',
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
  basic: {
    name: 'Basic Workflow',
    description: 'Simple text to image generation',
    nodes: ['text', 'image'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 1, handle: 'prompt' } },
    ],
    layout: 'horizontal',
  },
  styled: {
    name: 'Styled Generation',
    description: 'Text to image with style settings',
    nodes: ['text', 'style', 'image'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 2, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 2, handle: 'style' } },
    ],
    layout: 'horizontal',
  },
  variants: {
    name: 'Variants Workflow',
    description: 'Generate image and create variants',
    nodes: ['text', 'image', 'variants'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 1, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'image' }, to: { nodeIndex: 2, handle: 'sourceImage' } },
    ],
    layout: 'horizontal',
  },
  complete: {
    name: 'Complete Workflow',
    description: 'Full workflow with all settings',
    nodes: ['text', 'style', 'material', 'image', 'variants'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 3, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 3, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'materials' }, to: { nodeIndex: 3, handle: 'material' } },
      { from: { nodeIndex: 3, handle: 'image' }, to: { nodeIndex: 4, handle: 'sourceImage' } },
    ],
    layout: 'horizontal',
  },
  // Advanced Templates
  architectural: {
    name: 'Architectural Visualization',
    description: 'Complete pipeline for architectural rendering',
    nodes: ['text', 'style', 'material', 'image', 'variants'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 3, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 3, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'materials' }, to: { nodeIndex: 3, handle: 'material' } },
      { from: { nodeIndex: 3, handle: 'image' }, to: { nodeIndex: 4, handle: 'sourceImage' } },
    ],
    layout: 'horizontal',
  },
  interior: {
    name: 'Interior Design',
    description: 'Interior design visualization workflow',
    nodes: ['text', 'style', 'image', 'variants'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 2, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 2, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'image' }, to: { nodeIndex: 3, handle: 'sourceImage' } },
    ],
    layout: 'horizontal',
  },
  exterior: {
    name: 'Exterior Architecture',
    description: 'Exterior architectural rendering workflow',
    nodes: ['text', 'style', 'material', 'image'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 3, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 3, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'materials' }, to: { nodeIndex: 3, handle: 'material' } },
    ],
    layout: 'horizontal',
  },
  product: {
    name: 'Product Visualization',
    description: 'Product rendering and visualization',
    nodes: ['text', 'style', 'image', 'variants'],
    connections: [
      { from: { nodeIndex: 0, handle: 'text' }, to: { nodeIndex: 2, handle: 'prompt' } },
      { from: { nodeIndex: 1, handle: 'style' }, to: { nodeIndex: 2, handle: 'style' } },
      { from: { nodeIndex: 2, handle: 'image' }, to: { nodeIndex: 3, handle: 'sourceImage' } },
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

