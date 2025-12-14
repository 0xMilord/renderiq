/**
 * Tests for render type definitions and validations
 */

import { describe, it, expect } from 'vitest';
import type {
  Render,
  CanvasState,
  CanvasLayer,
  CanvasMask,
  CanvasMetadata,
  RenderChain,
  RenderVersion,
} from '@/lib/types/render';

describe('Render Types', () => {
  describe('Render', () => {
    it('should have all required fields', () => {
      const render: Render = {
        id: '123',
        projectId: 'project-123',
        userId: 'user-123',
        type: 'image',
        prompt: 'Test prompt',
        settings: { style: 'photorealistic' },
        outputUrl: 'https://example.com/image.jpg',
        outputKey: 'renders/image.jpg',
        status: 'completed',
        errorMessage: null,
        processingTime: 5000,
        creditsCost: 10,
        chainId: null,
        chainPosition: null,
        referenceRenderId: null,
        uploadedImageUrl: null,
        uploadedImageKey: null,
        uploadedImageId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(render.id).toBeDefined();
      expect(render.type).toBe('image');
      expect(render.status).toBe('completed');
    });

    it('should accept both image and video types', () => {
      const types: Render['type'][] = ['image', 'video'];
      
      for (const type of types) {
        const render: Render = {
          id: '123',
          projectId: 'project-123',
          userId: 'user-123',
          type,
          prompt: 'Test',
          settings: {},
          outputUrl: null,
          outputKey: null,
          status: 'pending',
          errorMessage: null,
          processingTime: null,
          creditsCost: 0,
          chainId: null,
          chainPosition: null,
          referenceRenderId: null,
          uploadedImageUrl: null,
          uploadedImageKey: null,
          uploadedImageId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        expect(render.type).toBe(type);
      }
    });

    it('should accept all status values', () => {
      const statuses: Render['status'][] = ['pending', 'processing', 'completed', 'failed'];
      
      for (const status of statuses) {
        const render: Render = {
          id: '123',
          projectId: 'project-123',
          userId: 'user-123',
          type: 'image',
          prompt: 'Test',
          settings: {},
          outputUrl: null,
          outputKey: null,
          status,
          errorMessage: null,
          processingTime: null,
          creditsCost: 0,
          chainId: null,
          chainPosition: null,
          referenceRenderId: null,
          uploadedImageUrl: null,
          uploadedImageKey: null,
          uploadedImageId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        expect(render.status).toBe(status);
      }
    });

    it('should allow optional contextData', () => {
      const render: Render = {
        id: '123',
        projectId: 'project-123',
        userId: 'user-123',
        type: 'image',
        prompt: 'Test',
        settings: {},
        outputUrl: null,
        outputKey: null,
        status: 'pending',
        errorMessage: null,
        processingTime: null,
        creditsCost: 0,
        chainId: null,
        chainPosition: null,
        referenceRenderId: null,
        uploadedImageUrl: null,
        uploadedImageKey: null,
        uploadedImageId: null,
        contextData: {
          successfulElements: ['element1'],
          previousPrompts: ['prompt1'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(render.contextData).toBeDefined();
      expect(render.contextData?.successfulElements).toContain('element1');
    });
  });

  describe('CanvasState', () => {
    it('should have required fields', () => {
      const state: CanvasState = {
        version: '1.0.0',
        canvasData: {},
        layers: [],
        masks: [],
      };
      
      expect(state.version).toBeDefined();
    });

    it('should allow optional fields', () => {
      const state: CanvasState = {
        version: '1.0.0',
      };
      
      expect(state.canvasData).toBeUndefined();
      expect(state.layers).toBeUndefined();
      expect(state.masks).toBeUndefined();
    });
  });

  describe('CanvasLayer', () => {
    it('should have all required fields', () => {
      const layer: CanvasLayer = {
        id: 'layer-123',
        name: 'Layer 1',
        visible: true,
        locked: false,
        opacity: 1.0,
        renderId: 'render-123',
        order: 0,
      };
      
      expect(layer.id).toBeDefined();
      expect(layer.renderId).toBeDefined();
      expect(layer.order).toBe(0);
    });
  });

  describe('CanvasMask', () => {
    it('should have all required fields', () => {
      const mask: CanvasMask = {
        id: 'mask-123',
        renderId: 'render-123',
        maskData: 'base64data',
        prompt: 'Inpaint this area',
        createdAt: '2025-01-27T00:00:00Z',
      };
      
      expect(mask.renderId).toBeDefined();
      expect(mask.maskData).toBeDefined();
      expect(mask.prompt).toBeDefined();
    });

    it('should allow optional applied field', () => {
      const mask: CanvasMask = {
        id: 'mask-123',
        renderId: 'render-123',
        maskData: 'base64data',
        prompt: 'Inpaint',
        createdAt: '2025-01-27T00:00:00Z',
        applied: true,
      };
      
      expect(mask.applied).toBe(true);
    });
  });

  describe('CanvasMetadata', () => {
    it('should allow all optional fields', () => {
      const metadata: CanvasMetadata = {
        canvasId: 'canvas-123',
        toolVersion: '1.0.0',
        lastModified: '2025-01-27T00:00:00Z',
        zoomLevel: 1.5,
        viewport: { x: 0, y: 0, zoom: 1.0 },
      };
      
      expect(metadata.canvasId).toBeDefined();
      expect(metadata.viewport).toBeDefined();
    });
  });

  describe('RenderChain', () => {
    it('should have all required fields', () => {
      const chain: RenderChain = {
        id: 'chain-123',
        projectId: 'project-123',
        name: 'Chain 1',
        description: 'Test chain',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(chain.id).toBeDefined();
      expect(chain.name).toBeDefined();
    });

    it('should allow null description', () => {
      const chain: RenderChain = {
        id: 'chain-123',
        projectId: 'project-123',
        name: 'Chain 1',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(chain.description).toBeNull();
    });
  });

  describe('RenderVersion', () => {
    it('should have all required fields', () => {
      const version: RenderVersion = {
        id: 'version-123',
        renderId: 'render-123',
        versionNumber: 1,
        imageUrl: 'https://example.com/image.jpg',
        settings: { style: 'photorealistic' },
        createdAt: new Date(),
      };
      
      expect(version.versionNumber).toBe(1);
      expect(version.imageUrl).toBeDefined();
    });

    it('should allow null settings', () => {
      const version: RenderVersion = {
        id: 'version-123',
        renderId: 'render-123',
        versionNumber: 1,
        imageUrl: 'https://example.com/image.jpg',
        settings: null,
        createdAt: new Date(),
      };
      
      expect(version.settings).toBeNull();
    });
  });
});

