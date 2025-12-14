/**
 * Integration tests for canvas-files actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCanvasFilesAction,
  getCanvasFileByIdAction,
  createCanvasFileAction,
  updateCanvasFileAction,
  deleteCanvasFileAction,
  saveCanvasGraphAction,
  loadCanvasGraphAction,
} from '@/lib/actions/canvas-files.actions';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { CanvasFilesService } from '@/lib/services/canvas-files.service';
import { StorageService } from '@/lib/services/storage';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/canvas-files.service');
vi.mock('@/lib/services/storage');

describe('Canvas Files Actions', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id);

    vi.mocked(getCachedUser).mockResolvedValue({
      user: testUser as any,
      fromCache: false,
    });
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  describe('getCanvasFilesAction', () => {
    it('should get canvas files', async () => {
      vi.mocked(CanvasFilesService.getFilesByProject).mockResolvedValue([
        { id: 'file-1', name: 'File 1' },
      ] as any);

      const result = await getCanvasFilesAction({ projectId: testProject.id });

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getCanvasFilesAction();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });
  });

  describe('getCanvasFileByIdAction', () => {
    it('should get canvas file by ID', async () => {
      vi.mocked(CanvasFilesService.getFileWithGraph).mockResolvedValue({
        file: { id: 'file-1', userId: testUser.id },
        graph: { nodes: [] },
      } as any);

      const result = await getCanvasFileByIdAction('file-1');

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
    });

    it('should reject unauthorized access', async () => {
      vi.mocked(CanvasFilesService.getFileWithGraph).mockResolvedValue({
        file: { id: 'file-1', userId: 'other-user-id' },
        graph: null,
      } as any);

      const result = await getCanvasFileByIdAction('file-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });

  describe('createCanvasFileAction', () => {
    it('should create canvas file', async () => {
      vi.mocked(CanvasFilesService.createFile).mockResolvedValue({
        id: 'file-1',
        name: 'New File',
      } as any);

      const formData = new FormData();
      formData.append('projectId', testProject.id);
      formData.append('name', 'New File');
      formData.append('slug', 'new-file');

      const result = await createCanvasFileAction(formData);

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
    });

    it('should handle thumbnail upload', async () => {
      const mockFile = new File(['thumbnail'], 'thumb.jpg', { type: 'image/jpeg' });
      vi.mocked(StorageService.uploadFile).mockResolvedValue({
        id: 'thumb-id',
        url: 'https://example.com/thumb.jpg',
      } as any);

      vi.mocked(CanvasFilesService.createFile).mockResolvedValue({
        id: 'file-1',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      } as any);

      const formData = new FormData();
      formData.append('projectId', testProject.id);
      formData.append('name', 'New File');
      formData.append('slug', 'new-file');
      formData.append('thumbnail', mockFile);

      const result = await createCanvasFileAction(formData);

      expect(result.success).toBe(true);
      expect(StorageService.uploadFile).toHaveBeenCalled();
    });
  });

  describe('updateCanvasFileAction', () => {
    it('should update canvas file', async () => {
      vi.mocked(CanvasFilesService.getFileById).mockResolvedValue({
        id: 'file-1',
        userId: testUser.id,
      } as any);

      vi.mocked(CanvasFilesService.updateFile).mockResolvedValue({
        id: 'file-1',
        name: 'Updated File',
      } as any);

      const formData = new FormData();
      formData.append('fileId', 'file-1');
      formData.append('name', 'Updated File');

      const result = await updateCanvasFileAction(formData);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteCanvasFileAction', () => {
    it('should delete canvas file', async () => {
      vi.mocked(CanvasFilesService.getFileById).mockResolvedValue({
        id: 'file-1',
        userId: testUser.id,
      } as any);

      vi.mocked(CanvasFilesService.deleteFile).mockResolvedValue(undefined);

      const result = await deleteCanvasFileAction('file-1');

      expect(result.success).toBe(true);
    });
  });

  describe('saveCanvasGraphAction', () => {
    it('should save canvas graph', async () => {
      vi.mocked(CanvasFilesService.getFileById).mockResolvedValue({
        id: 'file-1',
        userId: testUser.id,
      } as any);

      vi.mocked(CanvasFilesService.saveGraph).mockResolvedValue({
        success: true,
        data: { version: 1 },
      } as any);

      const result = await saveCanvasGraphAction('file-1', { nodes: [] } as any);

      expect(result.success).toBe(true);
    });
  });

  describe('loadCanvasGraphAction', () => {
    it('should load canvas graph', async () => {
      vi.mocked(CanvasFilesService.getFileWithGraph).mockResolvedValue({
        file: { id: 'file-1', userId: testUser.id },
        graph: { nodes: [] },
      } as any);

      const result = await loadCanvasGraphAction('file-1');

      expect(result.success).toBe(true);
      expect(result.graph).toBeDefined();
    });
  });
});

