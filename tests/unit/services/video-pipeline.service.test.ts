/**
 * Unit tests for VideoPipeline
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoPipeline } from '@/lib/services/video-pipeline';
import { VideoPromptOptimizer } from '@/lib/services/video-prompt-optimizer';
import { ImageUnderstandingService } from '@/lib/services/image-understanding';
import { ModelRouter } from '@/lib/services/model-router';
import { AISDKService } from '@/lib/services/ai-sdk-service';

vi.mock('@/lib/services/video-prompt-optimizer', () => ({
  VideoPromptOptimizer: {
    optimizePrompt: vi.fn(),
  },
}));
vi.mock('@/lib/services/image-understanding', () => ({
  ImageUnderstandingService: {
    analyzeReferenceImage: vi.fn(),
  },
}));
vi.mock('@/lib/services/model-router', () => ({
  ModelRouter: {
    selectVideoModel: vi.fn(),
  },
}));
vi.mock('@/lib/services/ai-sdk-service', () => ({
  AISDKService: {
    getInstance: vi.fn(),
  },
}));

describe('VideoPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateVideo', () => {
    it('should generate video through full pipeline', async () => {
      const mockAIService = {
        generateVideo: vi.fn().mockResolvedValue({
          outputUrl: 'https://example.com/video.mp4',
          outputKey: 'video.mp4',
        }),
      };

      vi.mocked(AISDKService.getInstance).mockReturnValue(mockAIService as any);
      vi.mocked(VideoPromptOptimizer.optimizePrompt).mockResolvedValue({
        optimizedPrompt: 'Optimized prompt',
        designIntent: {} as any,
      });
      vi.mocked(ImageUnderstandingService.analyzeReferenceImage).mockResolvedValue({
        architecturalStyle: 'modern',
      } as any);
      vi.mocked(ModelRouter.selectVideoModel).mockResolvedValue('veo-3.1' as any);

      const result = await VideoPipeline.generateVideo({
        prompt: 'A house video',
        quality: 'high',
        aspectRatio: '16:9',
        referenceImages: [
          { imageData: 'base64data', imageType: 'image/jpeg' },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should skip stages when requested', async () => {
      const mockAIService = {
        generateVideo: vi.fn().mockResolvedValue({
          outputUrl: 'https://example.com/video.mp4',
        }),
      };

      vi.mocked(AISDKService.getInstance).mockReturnValue(mockAIService as any);
      vi.mocked(VideoPromptOptimizer.optimizePrompt).mockResolvedValue({
        optimizedPrompt: 'Optimized prompt',
        designIntent: {} as any,
      });
      vi.mocked(ModelRouter.selectVideoModel).mockResolvedValue('veo-3.1' as any);

      const result = await VideoPipeline.generateVideo({
        prompt: 'A house video',
        quality: 'high',
        aspectRatio: '16:9',
        skipStages: {
          imageUnderstanding: true,
          validation: true,
          memoryExtraction: true,
        },
      });

      expect(result.success).toBe(true);
      expect(ImageUnderstandingService.analyzeReferenceImage).not.toHaveBeenCalled();
    });

    it('should handle generation errors', async () => {
      const mockAIService = {
        generateVideo: vi.fn().mockRejectedValue(new Error('Generation failed')),
      };

      vi.mocked(AISDKService.getInstance).mockReturnValue(mockAIService as any);
      vi.mocked(VideoPromptOptimizer.optimizePrompt).mockResolvedValue({
        optimizedPrompt: 'Optimized prompt',
        designIntent: {} as any,
      });
      vi.mocked(ModelRouter.selectVideoModel).mockResolvedValue('veo-3.1' as any);

      const result = await VideoPipeline.generateVideo({
        prompt: 'A house video',
        quality: 'high',
        aspectRatio: '16:9',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

