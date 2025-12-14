/**
 * Unit tests for RenderService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RenderService } from '@/lib/services/render';
import { AISDKService } from '@/lib/services/ai-sdk-service';
import { StorageService } from '@/lib/services/storage';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainService } from '@/lib/services/render-chain';

vi.mock('@/lib/services/ai-sdk-service');
vi.mock('@/lib/services/storage');
vi.mock('@/lib/dal/projects');
vi.mock('@/lib/dal/renders');
vi.mock('@/lib/services/render-chain');

describe('RenderService', () => {
  let renderService: RenderService;

  beforeEach(() => {
    vi.clearAllMocks();
    renderService = new RenderService();
  });

  describe('createProject', () => {
    it('should create project with image upload', async () => {
      const mockFile = new File(['image'], 'image.jpg', { type: 'image/jpeg' });
      const mockUploadResult = {
        id: 'file-id',
        url: 'https://example.com/image.jpg',
      };

      vi.mocked(StorageService.uploadFile).mockResolvedValue(mockUploadResult as any);
      vi.mocked(ProjectsDAL.create).mockResolvedValue({
        id: 'project-id',
        slug: 'project-slug',
      } as any);

      const result = await renderService.createProject(
        'user-id',
        mockFile,
        'Project Name',
        'Description'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(StorageService.uploadFile).toHaveBeenCalled();
      expect(ProjectsDAL.create).toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['image'], 'image.jpg', { type: 'image/jpeg' });

      vi.mocked(StorageService.uploadFile).mockRejectedValue(new Error('Upload failed'));

      const result = await renderService.createProject('user-id', mockFile, 'Project Name');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('createRender', () => {
    it('should create render with chain', async () => {
      const mockProject = {
        id: 'project-id',
        name: 'Project',
      };

      const mockChain = {
        id: 'chain-id',
      };

      vi.mocked(ProjectsDAL.getById).mockResolvedValue(mockProject as any);
      vi.mocked(RenderChainService.getOrCreateDefaultChain).mockResolvedValue(mockChain as any);
      vi.mocked(RenderChainService.getNextChainPosition).mockResolvedValue(1);
      vi.mocked(AISDKService.getInstance).mockReturnValue({
        generateImage: vi.fn().mockResolvedValue({
          outputUrl: 'https://example.com/output.jpg',
          outputKey: 'output.jpg',
        }),
      } as any);
      vi.mocked(RendersDAL.create).mockResolvedValue({
        id: 'render-id',
        outputUrl: 'https://example.com/output.jpg',
      } as any);

      const result = await renderService.createRender({
        projectId: 'project-id',
        userId: 'user-id',
        prompt: 'A house',
        type: 'image',
        style: 'modern',
        quality: 'high',
        aspectRatio: '16:9',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle missing project', async () => {
      vi.mocked(ProjectsDAL.getById).mockResolvedValue(null);

      const result = await renderService.createRender({
        projectId: 'non-existent',
        userId: 'user-id',
        prompt: 'A house',
        type: 'image',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('updateRender', () => {
    it('should update render status', async () => {
      vi.mocked(RendersDAL.updateOutput).mockResolvedValue({
        id: 'render-id',
        status: 'completed',
        outputUrl: 'https://example.com/output.jpg',
      } as any);

      const result = await renderService.updateRender('render-id', {
        status: 'completed',
        outputUrl: 'https://example.com/output.jpg',
      });

      expect(result.success).toBe(true);
      expect(RendersDAL.updateOutput).toHaveBeenCalled();
    });
  });
});

