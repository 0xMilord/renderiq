/**
 * Unit tests for MaskInpaintingService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaskInpaintingService } from '@/lib/services/mask-inpainting';
import { RenderPipeline } from '@/lib/services/render-pipeline';

vi.mock('@/lib/services/render-pipeline', () => ({
  RenderPipeline: {
    generateRender: vi.fn(),
  },
}));

describe('MaskInpaintingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInpainted', () => {
    it('should generate inpainted image', async () => {
      vi.mocked(RenderPipeline.generateRender).mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/inpainted.jpg',
        imageData: 'base64data',
      } as any);

      const result = await MaskInpaintingService.generateInpainted({
        renderId: 'render-id',
        imageData: 'base64imagedata',
        maskData: 'base64maskdata',
        prompt: 'Add a garden',
        quality: 'high',
      });

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(RenderPipeline.generateRender).toHaveBeenCalled();
    });

    it('should handle pipeline failures', async () => {
      vi.mocked(RenderPipeline.generateRender).mockResolvedValue({
        success: false,
        error: 'Pipeline failed',
      } as any);

      const result = await MaskInpaintingService.generateInpainted({
        renderId: 'render-id',
        imageData: 'base64imagedata',
        maskData: 'base64maskdata',
        prompt: 'Add a garden',
        quality: 'high',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should pass chainId and contextData', async () => {
      vi.mocked(RenderPipeline.generateRender).mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/inpainted.jpg',
      } as any);

      await MaskInpaintingService.generateInpainted({
        renderId: 'render-id',
        imageData: 'base64imagedata',
        maskData: 'base64maskdata',
        prompt: 'Add a garden',
        quality: 'high',
        chainId: 'chain-id',
        contextData: { key: 'value' },
      });

      expect(RenderPipeline.generateRender).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: 'chain-id',
          contextData: { key: 'value' },
        })
      );
    });
  });
});

