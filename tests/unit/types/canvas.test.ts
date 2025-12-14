/**
 * Tests for canvas type definitions and validations
 */

import { describe, it, expect } from 'vitest';
import type {
  NodeType,
  DataType,
  NodeInput,
  NodeOutput,
  TextNodeData,
  ImageNodeData,
  VariantsNodeData,
  StyleNodeData,
  MaterialNodeData,
  VideoNodeData,
  CanvasNode,
  CanvasEdge,
  CanvasState,
} from '@/lib/types/canvas';

describe('Canvas Types', () => {
  describe('NodeType', () => {
    it('should accept valid node types', () => {
      const types: NodeType[] = [
        'text',
        'image',
        'variants',
        'style',
        'material',
        'output',
        'prompt-builder',
        'style-reference',
        'image-input',
        'video',
      ];

      for (const type of types) {
        expect(type).toBeDefined();
      }
    });
  });

  describe('DataType', () => {
    it('should accept valid data types', () => {
      const types: DataType[] = ['string', 'image', 'number', 'object', 'array'];

      for (const type of types) {
        expect(type).toBeDefined();
      }
    });
  });

  describe('NodeInput', () => {
    it('should have all required fields', () => {
      const input: NodeInput = {
        id: 'input-1',
        name: 'Prompt',
        type: 'string',
        required: true,
      };

      expect(input.id).toBeDefined();
      expect(input.name).toBeDefined();
      expect(input.type).toBeDefined();
      expect(input.required).toBeDefined();
    });

    it('should support optional defaultValue', () => {
      const input: NodeInput = {
        id: 'input-1',
        name: 'Count',
        type: 'number',
        required: false,
        defaultValue: 1,
      };

      expect(input.defaultValue).toBe(1);
    });
  });

  describe('NodeOutput', () => {
    it('should have all required fields', () => {
      const output: NodeOutput = {
        id: 'output-1',
        name: 'Image',
        type: 'image',
      };

      expect(output.id).toBeDefined();
      expect(output.name).toBeDefined();
      expect(output.type).toBeDefined();
    });
  });

  describe('TextNodeData', () => {
    it('should have prompt field', () => {
      const data: TextNodeData = {
        prompt: 'A modern house',
      };

      expect(data.prompt).toBe('A modern house');
    });

    it('should support optional placeholder', () => {
      const data: TextNodeData = {
        prompt: '',
        placeholder: 'Enter prompt...',
      };

      expect(data.placeholder).toBeDefined();
    });
  });

  describe('ImageNodeData', () => {
    it('should have all required fields', () => {
      const data: ImageNodeData = {
        prompt: 'A house',
        settings: {
          style: 'modern',
          quality: 'high',
          aspectRatio: '16:9',
        },
        status: 'idle',
      };

      expect(data.prompt).toBeDefined();
      expect(data.settings).toBeDefined();
      expect(data.status).toBeDefined();
    });

    it('should support optional fields', () => {
      const data: ImageNodeData = {
        prompt: 'A house',
        settings: {
          style: 'modern',
          quality: 'high',
          aspectRatio: '16:9',
          negativePrompt: 'blurry',
          seed: 12345,
        },
        status: 'completed',
        outputUrl: 'https://example.com/image.jpg',
        renderId: 'render-123',
      };

      expect(data.negativePrompt).toBeDefined();
      expect(data.seed).toBeDefined();
      expect(data.outputUrl).toBeDefined();
    });
  });

  describe('VariantsNodeData', () => {
    it('should have all required fields', () => {
      const data: VariantsNodeData = {
        count: 4,
        settings: {
          variationStrength: 0.5,
          quality: 'high',
        },
        status: 'idle',
      };

      expect(data.count).toBe(4);
      expect(data.settings).toBeDefined();
      expect(data.status).toBeDefined();
    });
  });

  describe('StyleNodeData', () => {
    it('should have camera settings', () => {
      const data: StyleNodeData = {
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
      };

      expect(data.camera).toBeDefined();
      expect(data.environment).toBeDefined();
      expect(data.lighting).toBeDefined();
      expect(data.atmosphere).toBeDefined();
    });
  });

  describe('VideoNodeData', () => {
    it('should have all required fields', () => {
      const data: VideoNodeData = {
        prompt: 'A house video',
        duration: 4,
        aspectRatio: '16:9',
        status: 'idle',
      };

      expect(data.prompt).toBeDefined();
      expect(data.duration).toBe(4);
      expect(data.aspectRatio).toBe('16:9');
    });
  });

  describe('CanvasNode', () => {
    it('should have all required fields', () => {
      const node: CanvasNode = {
        id: 'node-1',
        type: 'image',
        position: { x: 100, y: 100 },
        data: {
          prompt: 'A house',
          settings: {
            style: 'modern',
            quality: 'high',
            aspectRatio: '16:9',
          },
          status: 'idle',
        },
      };

      expect(node.id).toBeDefined();
      expect(node.type).toBeDefined();
      expect(node.position).toBeDefined();
      expect(node.data).toBeDefined();
    });
  });

  describe('CanvasEdge', () => {
    it('should have source and target', () => {
      const edge: CanvasEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'output-1',
        targetHandle: 'input-1',
      };

      expect(edge.source).toBe('node-1');
      expect(edge.target).toBe('node-2');
    });
  });

  describe('CanvasState', () => {
    it('should have nodes and edges', () => {
      const state: CanvasState = {
        nodes: [
          {
            id: 'node-1',
            type: 'text',
            position: { x: 0, y: 0 },
            data: { prompt: 'Test' },
          },
        ],
        edges: [],
      };

      expect(state.nodes).toBeDefined();
      expect(state.edges).toBeDefined();
    });
  });
});

