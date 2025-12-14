/**
 * Tests for render-chain type definitions and validations
 */

import { describe, it, expect } from 'vitest';
import type {
  ChainContext,
  ContextData,
  RenderWithContext,
  RenderChainWithRenders,
  EnhancedPrompt,
  PromptFeedback,
  ThumbnailSize,
  ThumbnailGrid,
  CreateChainData,
  UpdateChainData,
  CreateRenderWithChainData,
} from '@/lib/types/render-chain';

describe('Render Chain Types', () => {
  describe('ChainContext', () => {
    it('should allow all optional fields', () => {
      const context: ChainContext = {
        successfulElements: ['element1', 'element2'],
        previousPrompts: ['prompt1', 'prompt2'],
        userFeedback: 'Great work!',
        chainEvolution: 'Improved lighting',
      };
      
      expect(context.successfulElements).toHaveLength(2);
      expect(context.previousPrompts).toHaveLength(2);
    });

    it('should allow empty context', () => {
      const context: ChainContext = {};
      
      expect(context.successfulElements).toBeUndefined();
    });
  });

  describe('ContextData', () => {
    it('should include pipeline memory', () => {
      const context: ContextData = {
        successfulElements: ['element1'],
        pipelineMemory: {
          styleCodes: {
            colorPalette: ['#ff0000', '#00ff00'],
            lightingStyle: 'natural',
            materialStyle: 'wood',
            architecturalStyle: 'modern',
          },
          palette: ['#ff0000', '#00ff00'],
          geometry: {
            perspective: 'perspective',
            focalLength: '50mm',
            cameraAngle: 'eye-level',
          },
          materials: ['wood', 'concrete'],
          extractedAt: '2025-01-27T00:00:00Z',
        },
      };
      
      expect(context.pipelineMemory).toBeDefined();
      expect(context.pipelineMemory?.styleCodes).toBeDefined();
      expect(context.pipelineMemory?.geometry?.perspective).toBe('perspective');
    });
  });

  describe('EnhancedPrompt', () => {
    it('should have all required fields', () => {
      const prompt: EnhancedPrompt = {
        originalPrompt: 'A house',
        enhancedPrompt: 'A beautiful modern house with natural lighting',
        contextElements: ['modern', 'natural lighting'],
        styleModifiers: ['photorealistic', 'high detail'],
      };
      
      expect(prompt.originalPrompt).toBe('A house');
      expect(prompt.enhancedPrompt).toContain('beautiful');
    });
  });

  describe('PromptFeedback', () => {
    it('should have all required fields', () => {
      const feedback: PromptFeedback = {
        renderId: 'render-123',
        rating: 5,
        successfulElements: ['lighting', 'composition'],
        issuesFound: ['perspective'],
        improvements: ['better shadows'],
      };
      
      expect(feedback.rating).toBe(5);
      expect(feedback.successfulElements).toHaveLength(2);
    });
  });

  describe('ThumbnailSize', () => {
    it('should accept all valid sizes', () => {
      const sizes: ThumbnailSize[] = ['small', 'medium', 'large'];
      
      for (const size of sizes) {
        expect(size).toBeDefined();
      }
    });
  });

  describe('ThumbnailGrid', () => {
    it('should have all required fields', () => {
      const grid: ThumbnailGrid = {
        chainId: 'chain-123',
        thumbnails: [
          {
            renderId: 'render-1',
            url: 'https://example.com/thumb1.jpg',
            position: 0,
          },
          {
            renderId: 'render-2',
            url: 'https://example.com/thumb2.jpg',
            position: 1,
          },
        ],
      };
      
      expect(grid.chainId).toBeDefined();
      expect(grid.thumbnails).toHaveLength(2);
    });
  });

  describe('CreateChainData', () => {
    it('should have required fields', () => {
      const data: CreateChainData = {
        projectId: 'project-123',
        name: 'New Chain',
      };
      
      expect(data.projectId).toBeDefined();
      expect(data.name).toBeDefined();
    });

    it('should allow optional description', () => {
      const data: CreateChainData = {
        projectId: 'project-123',
        name: 'New Chain',
        description: 'Chain description',
      };
      
      expect(data.description).toBe('Chain description');
    });
  });

  describe('UpdateChainData', () => {
    it('should allow all optional fields', () => {
      const data: UpdateChainData = {
        name: 'Updated Chain',
        description: 'Updated description',
      };
      
      expect(data.name).toBeDefined();
      expect(data.description).toBeDefined();
    });

    it('should allow empty update', () => {
      const data: UpdateChainData = {};
      
      expect(data.name).toBeUndefined();
      expect(data.description).toBeUndefined();
    });
  });

  describe('CreateRenderWithChainData', () => {
    it('should have all required fields', () => {
      const data: CreateRenderWithChainData = {
        userId: 'user-123',
        type: 'image',
        prompt: 'Test prompt',
        settings: {
          style: 'photorealistic',
          quality: 'high',
          aspectRatio: '16:9',
        },
        status: 'pending',
      };
      
      expect(data.userId).toBeDefined();
      expect(data.type).toBe('image');
      expect(data.status).toBe('pending');
    });

    it('should allow optional projectId', () => {
      const data: CreateRenderWithChainData = {
        projectId: 'project-123',
        userId: 'user-123',
        type: 'image',
        prompt: 'Test',
        settings: {
          style: 'photorealistic',
          quality: 'high',
          aspectRatio: '16:9',
        },
        status: 'pending',
      };
      
      expect(data.projectId).toBe('project-123');
    });

    it('should accept both image and video types', () => {
      const types: CreateRenderWithChainData['type'][] = ['image', 'video'];
      
      for (const type of types) {
        const data: CreateRenderWithChainData = {
          userId: 'user-123',
          type,
          prompt: 'Test',
          settings: {
            style: 'photorealistic',
            quality: 'high',
            aspectRatio: '16:9',
          },
          status: 'pending',
        };
        
        expect(data.type).toBe(type);
      }
    });
  });
});

