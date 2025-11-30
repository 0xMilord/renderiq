// Canvas node types and interfaces

export type NodeType = 'text' | 'image' | 'variants' | 'style' | 'material';

export type DataType = 'string' | 'image' | 'number' | 'object' | 'array';

export interface NodeInput {
  id: string;
  name: string;
  type: DataType;
  required: boolean;
  defaultValue?: any;
}

export interface NodeOutput {
  id: string;
  name: string;
  type: DataType;
}

export interface TextNodeData {
  prompt: string;
  placeholder?: string;
}

export interface ImageNodeData {
  prompt: string;
  settings: {
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    negativePrompt?: string;
    seed?: number;
  };
  styleSettings?: StyleNodeData; // From Style Node
  materialSettings?: MaterialNodeData; // From Material Node
  status: 'idle' | 'generating' | 'completed' | 'error';
  outputUrl?: string;
  errorMessage?: string;
  generatedAt?: Date;
  renderId?: string;
}

export interface VariantsNodeData {
  sourceImageUrl?: string;
  prompt?: string;
  count: number;
  settings: {
    variationStrength: number;
    style?: string;
    quality: 'standard' | 'high' | 'ultra';
  };
  status: 'idle' | 'generating' | 'completed' | 'error';
  variants: Array<{
    id: string;
    url: string;
    prompt: string;
    settings: object;
    renderId: string;
  }>;
  selectedVariantId?: string;
  errorMessage?: string;
}

export interface StyleNodeData {
  camera: {
    focalLength: number; // 18-200mm
    fStop: number; // f/1.4 - f/22
    position: 'eye-level' | 'low-angle' | 'high-angle' | 'bird-eye' | 'worm-eye';
    angle: 'front' | 'side' | 'three-quarter' | 'back';
  };
  environment: {
    scene: 'interior' | 'exterior' | 'mixed';
    weather: 'sunny' | 'cloudy' | 'rainy' | 'foggy' | 'sunset' | 'night' | 'golden-hour';
    timeOfDay: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
    season: 'spring' | 'summer' | 'autumn' | 'winter';
  };
  lighting: {
    intensity: number; // 0-100
    direction: 'front' | 'side' | 'back' | 'top' | 'rim';
    color: 'warm' | 'cool' | 'neutral' | 'golden' | 'blue';
    shadows: 'soft' | 'hard' | 'none';
  };
  atmosphere: {
    mood: 'bright' | 'dramatic' | 'peaceful' | 'mysterious' | 'professional';
    contrast: number; // 0-100
    saturation: number; // 0-100
  };
}

export interface MaterialNodeData {
  materials: Array<{
    id: string;
    name: string;
    type: 'wall' | 'floor' | 'ceiling' | 'furniture' | 'exterior' | 'other';
    material: string; // e.g., 'concrete', 'wood', 'glass', 'metal'
    color?: string;
    texture?: string;
    finish?: 'matte' | 'glossy' | 'semi-gloss' | 'rough';
  }>;
}

export type NodeData = TextNodeData | ImageNodeData | VariantsNodeData | StyleNodeData | MaterialNodeData;

export interface CanvasNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  inputs: NodeInput[];
  outputs: NodeOutput[];
}

export interface NodeConnection {
  id: string;
  source: string; // source node id
  sourceHandle: string; // source output id
  target: string; // target node id
  targetHandle: string; // target input id
}

export interface CanvasState {
  nodes: CanvasNode[];
  connections: NodeConnection[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

