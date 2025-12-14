/**
 * Unit tests for CanvasService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasService } from '@/lib/services/canvas.service';
import { RendersDAL } from '@/lib/dal/renders';

vi.mock('@/lib/dal/renders', () => ({
  RendersDAL: {
    getById: vi.fn(),
    updateContext: vi.fn(),
    getByChainId: vi.fn(),
  },
}));

describe('CanvasService', () => {
  let canvasService: CanvasService;

  beforeEach(() => {
    vi.clearAllMocks();
    canvasService = CanvasService.getInstance();
  });

  describe('saveCanvasState', () => {
    it('should save canvas state to render', async () => {
      const mockRender = {
        id: 'render-id',
        contextData: {},
      };

      vi.mocked(RendersDAL.getById).mockResolvedValue(mockRender as any);
      vi.mocked(RendersDAL.updateContext).mockResolvedValue(undefined);

      const canvasState = {
        nodes: [],
        version: '1.0.0',
      } as any;

      await canvasService.saveCanvasState('render-id', canvasState);

      expect(RendersDAL.updateContext).toHaveBeenCalledWith(
        'render-id',
        expect.objectContaining({
          tldrawCanvasState: expect.objectContaining({
            nodes: [],
          }),
        })
      );
    });

    it('should merge with existing context data', async () => {
      const mockRender = {
        id: 'render-id',
        contextData: {
          pipelineMemory: { key: 'value' },
        },
      };

      vi.mocked(RendersDAL.getById).mockResolvedValue(mockRender as any);
      vi.mocked(RendersDAL.updateContext).mockResolvedValue(undefined);

      const canvasState = {
        nodes: [],
      } as any;

      await canvasService.saveCanvasState('render-id', canvasState);

      expect(RendersDAL.updateContext).toHaveBeenCalledWith(
        'render-id',
        expect.objectContaining({
          pipelineMemory: { key: 'value' },
          tldrawCanvasState: expect.any(Object),
        })
      );
    });

    it('should handle missing render', async () => {
      vi.mocked(RendersDAL.getById).mockResolvedValue(null);

      await expect(
        canvasService.saveCanvasState('non-existent', { nodes: [] } as any)
      ).rejects.toThrow();
    });
  });

  describe('loadCanvasState', () => {
    it('should load canvas state from render', async () => {
      const mockRender = {
        id: 'render-id',
        contextData: {
          tldrawCanvasState: {
            nodes: [],
            version: '1.0.0',
          },
        },
      };

      vi.mocked(RendersDAL.getById).mockResolvedValue(mockRender as any);

      const result = await canvasService.loadCanvasState('render-id');

      expect(result).toEqual(mockRender.contextData.tldrawCanvasState);
    });

    it('should return null if no canvas state', async () => {
      const mockRender = {
        id: 'render-id',
        contextData: {},
      };

      vi.mocked(RendersDAL.getById).mockResolvedValue(mockRender as any);

      const result = await canvasService.loadCanvasState('render-id');

      expect(result).toBeNull();
    });
  });

  describe('getChainCanvasState', () => {
    it('should get canvas state from latest render in chain', async () => {
      const mockRenders = [
        {
          id: 'render-1',
          chainPosition: 1,
          createdAt: new Date('2025-01-01'),
          contextData: {
            tldrawCanvasState: { nodes: ['node-1'] },
          },
        },
        {
          id: 'render-2',
          chainPosition: 2,
          createdAt: new Date('2025-01-02'),
          contextData: {
            tldrawCanvasState: { nodes: ['node-2'] },
          },
        },
      ];

      vi.mocked(RendersDAL.getByChainId).mockResolvedValue(mockRenders as any);

      const result = await canvasService.getChainCanvasState('chain-id');

      expect(result).toEqual({ nodes: ['node-2'] });
    });

    it('should return null if no renders in chain', async () => {
      vi.mocked(RendersDAL.getByChainId).mockResolvedValue([]);

      const result = await canvasService.getChainCanvasState('chain-id');

      expect(result).toBeNull();
    });
  });
});

