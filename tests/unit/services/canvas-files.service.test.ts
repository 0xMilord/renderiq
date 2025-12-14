/**
 * Unit tests for CanvasFilesService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasFilesService } from '@/lib/services/canvas-files.service';
import { CanvasFilesDAL } from '@/lib/dal/canvas-files';
import { CanvasDAL } from '@/lib/dal/canvas';

vi.mock('@/lib/dal/canvas-files', () => ({
  CanvasFilesDAL: {
    create: vi.fn(),
    getById: vi.fn(),
    getBySlug: vi.fn(),
    getFileWithGraph: vi.fn(),
    getFileWithGraphBySlug: vi.fn(),
    getByProject: vi.fn(),
    getByUser: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    incrementVersion: vi.fn(),
    createVersion: vi.fn(),
  },
}));

vi.mock('@/lib/dal/canvas', () => ({
  CanvasDAL: {
    saveGraph: vi.fn(),
    getGraph: vi.fn(),
  },
}));

describe('CanvasFilesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFile', () => {
    it('should create canvas file', async () => {
      const mockFile = {
        id: 'file-id',
        name: 'Test File',
      };

      vi.mocked(CanvasFilesDAL.create).mockResolvedValue(mockFile as any);

      const result = await CanvasFilesService.createFile({
        projectId: 'project-id',
        userId: 'user-id',
        name: 'Test File',
        slug: 'test-file',
      });

      expect(result).toEqual(mockFile);
      expect(CanvasFilesDAL.create).toHaveBeenCalled();
    });
  });

  describe('getFileById', () => {
    it('should get file by ID', async () => {
      const mockFile = { id: 'file-id', name: 'Test File' };
      vi.mocked(CanvasFilesDAL.getById).mockResolvedValue(mockFile as any);

      const result = await CanvasFilesService.getFileById('file-id');

      expect(result).toEqual(mockFile);
    });
  });

  describe('getFileWithGraph', () => {
    it('should get file with graph', async () => {
      const mockResult = {
        file: { id: 'file-id' },
        graph: { nodes: [] },
      };

      vi.mocked(CanvasFilesDAL.getFileWithGraph).mockResolvedValue(mockResult as any);

      const result = await CanvasFilesService.getFileWithGraph('file-id');

      expect(result).toEqual(mockResult);
    });
  });

  describe('saveGraph', () => {
    it('should save graph and increment version', async () => {
      const mockState = { nodes: [] } as any;
      const mockResult = {
        success: true,
        data: { version: 1 },
      };

      vi.mocked(CanvasDAL.saveGraph).mockResolvedValue(mockResult as any);
      vi.mocked(CanvasFilesDAL.incrementVersion).mockResolvedValue(undefined);
      vi.mocked(CanvasFilesDAL.createVersion).mockResolvedValue(undefined);

      const result = await CanvasFilesService.saveGraph('file-id', 'user-id', mockState);

      expect(result.success).toBe(true);
      expect(CanvasDAL.saveGraph).toHaveBeenCalled();
      expect(CanvasFilesDAL.incrementVersion).toHaveBeenCalled();
    });
  });

  describe('loadGraph', () => {
    it('should load graph', async () => {
      const mockGraph = { nodes: [] };
      vi.mocked(CanvasDAL.getGraph).mockResolvedValue(mockGraph as any);

      const result = await CanvasFilesService.loadGraph('file-id');

      expect(result).toEqual(mockGraph);
    });
  });

  describe('updateFile', () => {
    it('should update file', async () => {
      const mockFile = { id: 'file-id', name: 'Updated File' };
      vi.mocked(CanvasFilesDAL.update).mockResolvedValue(mockFile as any);

      const result = await CanvasFilesService.updateFile('file-id', {
        name: 'Updated File',
      });

      expect(result).toEqual(mockFile);
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      vi.mocked(CanvasFilesDAL.delete).mockResolvedValue(undefined);

      await CanvasFilesService.deleteFile('file-id');

      expect(CanvasFilesDAL.delete).toHaveBeenCalledWith('file-id');
    });
  });
});

