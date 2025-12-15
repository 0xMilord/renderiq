/**
 * Comprehensive unit tests for CanvasFilesDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CanvasFilesDAL } from '@/lib/dal/canvas-files';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject, createTestCanvasFile, createTestCanvasGraph, getTestDB } from '../../fixtures/database';
import { canvasFiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('CanvasFilesDAL', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id, { platform: 'canvas' });
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('create', () => {
    it('should create a new canvas file', async () => {
      const fileData = {
        projectId: testProject.id,
        userId: testUser.id,
        name: 'Test Canvas File',
        slug: 'test-canvas-file',
        description: 'Test description',
      };

      const file = await CanvasFilesDAL.create(fileData);

      expect(file).toBeDefined();
      expect(file.id).toBeDefined();
      expect(file.projectId).toBe(testProject.id);
      expect(file.userId).toBe(testUser.id);
      expect(file.name).toBe('Test Canvas File');
      expect(file.slug).toBe('test-canvas-file');
      expect(file.version).toBe(1);
      expect(file.isActive).toBe(true);
      expect(file.isArchived).toBe(false);
    });

    it('should create file with optional fields', async () => {
      const fileData = {
        projectId: testProject.id,
        userId: testUser.id,
        name: 'File With Details',
        slug: 'file-with-details',
        description: 'Description',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        thumbnailKey: 'thumbs/thumb.jpg',
        metadata: { key: 'value' },
      };

      const file = await CanvasFilesDAL.create(fileData);

      expect(file.description).toBe('Description');
      expect(file.thumbnailUrl).toBe('https://example.com/thumb.jpg');
      expect(file.metadata).toEqual({ key: 'value' });
    });

    it('should throw error on duplicate slug in same project', async () => {
      const fileData = {
        projectId: testProject.id,
        userId: testUser.id,
        name: 'Duplicate Slug',
        slug: 'duplicate-slug',
      };

      await CanvasFilesDAL.create(fileData);

      await expect(CanvasFilesDAL.create(fileData)).rejects.toThrow();
    });

    it('should allow same slug in different projects', async () => {
      const project2 = await createTestProject(testUser.id, { platform: 'canvas' });
      const fileData1 = {
        projectId: testProject.id,
        userId: testUser.id,
        name: 'Same Slug',
        slug: 'same-slug',
      };
      const fileData2 = {
        projectId: project2.id,
        userId: testUser.id,
        name: 'Same Slug',
        slug: 'same-slug',
      };

      const file1 = await CanvasFilesDAL.create(fileData1);
      const file2 = await CanvasFilesDAL.create(fileData2);

      expect(file1.slug).toBe(file2.slug);
      expect(file1.projectId).not.toBe(file2.projectId);
    });
  });

  describe('getById', () => {
    it('should return file by id', async () => {
      const testFile = await createTestCanvasFile(testProject.id, testUser.id);
      const file = await CanvasFilesDAL.getById(testFile.id);

      expect(file).toBeDefined();
      expect(file?.id).toBe(testFile.id);
    });

    it('should return null for non-existent file', async () => {
      const file = await CanvasFilesDAL.getById('00000000-0000-0000-0000-000000000000');
      expect(file).toBeNull();
    });
  });

  describe('getBySlug', () => {
    it('should return file by slug and project', async () => {
      const testFile = await createTestCanvasFile(testProject.id, testUser.id, { slug: 'find-me' });
      const file = await CanvasFilesDAL.getBySlug(testProject.id, 'find-me');

      expect(file).toBeDefined();
      expect(file?.id).toBe(testFile.id);
    });

    it('should return null for non-existent slug', async () => {
      const file = await CanvasFilesDAL.getBySlug(testProject.id, 'non-existent');
      expect(file).toBeNull();
    });
  });

  describe('getByProject', () => {
    it('should return files for project', async () => {
      await createTestCanvasFile(testProject.id, testUser.id);
      await createTestCanvasFile(testProject.id, testUser.id);
      await createTestCanvasFile(testProject.id, testUser.id);

      const files = await CanvasFilesDAL.getByProject(testProject.id);

      expect(files.length).toBeGreaterThanOrEqual(3);
      expect(files.every(f => f.projectId === testProject.id)).toBe(true);
    });

    it('should exclude archived files by default', async () => {
      const activeFile = await createTestCanvasFile(testProject.id, testUser.id, { isArchived: false });
      const archivedFile = await createTestCanvasFile(testProject.id, testUser.id, { isArchived: true });

      const files = await CanvasFilesDAL.getByProject(testProject.id);

      expect(files.some(f => f.id === activeFile.id)).toBe(true);
      expect(files.some(f => f.id === archivedFile.id)).toBe(false);
    });

    it('should include archived files when requested', async () => {
      const archivedFile = await createTestCanvasFile(testProject.id, testUser.id, { isArchived: true });

      const files = await CanvasFilesDAL.getByProject(testProject.id, true);

      expect(files.some(f => f.id === archivedFile.id)).toBe(true);
    });

    it('should order by updatedAt descending', async () => {
      const file1 = await createTestCanvasFile(testProject.id, testUser.id);
      await new Promise(resolve => setTimeout(resolve, 10));
      const file2 = await createTestCanvasFile(testProject.id, testUser.id);

      const files = await CanvasFilesDAL.getByProject(testProject.id);

      expect(files[0].id).toBe(file2.id);
    });
  });

  describe('getByUser', () => {
    it('should return files for user', async () => {
      await createTestCanvasFile(testProject.id, testUser.id);
      await createTestCanvasFile(testProject.id, testUser.id);

      const files = await CanvasFilesDAL.getByUser(testUser.id);

      expect(files.length).toBeGreaterThanOrEqual(2);
      expect(files.every(f => f.userId === testUser.id)).toBe(true);
    });

    it('should exclude archived files by default', async () => {
      await createTestCanvasFile(testProject.id, testUser.id, { isArchived: false });
      await createTestCanvasFile(testProject.id, testUser.id, { isArchived: true });

      const files = await CanvasFilesDAL.getByUser(testUser.id);

      expect(files.every(f => !f.isArchived)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update file name', async () => {
      const file = await createTestCanvasFile(testProject.id, testUser.id);

      const updated = await CanvasFilesDAL.update(file.id, {
        name: 'Updated Name',
      });

      expect(updated?.name).toBe('Updated Name');
    });

    it('should update slug and handle uniqueness', async () => {
      const file = await createTestCanvasFile(testProject.id, testUser.id, { slug: 'original-slug' });

      const updated = await CanvasFilesDAL.update(file.id, {
        slug: 'updated-slug',
      });

      expect(updated?.slug).toBe('updated-slug');
    });

    it('should throw error on duplicate slug update', async () => {
      const file1 = await createTestCanvasFile(testProject.id, testUser.id, { slug: 'slug1' });
      const file2 = await createTestCanvasFile(testProject.id, testUser.id, { slug: 'slug2' });

      await expect(
        CanvasFilesDAL.update(file2.id, { slug: 'slug1' })
      ).rejects.toThrow();
    });

    it('should update multiple fields', async () => {
      const file = await createTestCanvasFile(testProject.id, testUser.id);

      const updated = await CanvasFilesDAL.update(file.id, {
        name: 'Updated',
        description: 'New description',
        isPublic: true,
      });

      expect(updated?.name).toBe('Updated');
      expect(updated?.description).toBe('New description');
    });

    it('should update isActive flag', async () => {
      const file = await createTestCanvasFile(testProject.id, testUser.id);

      const updated = await CanvasFilesDAL.update(file.id, {
        isActive: false,
      });

      expect(updated?.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('should soft delete file by archiving', async () => {
      const file = await createTestCanvasFile(testProject.id, testUser.id);

      await CanvasFilesDAL.delete(file.id);

      const deleted = await CanvasFilesDAL.getById(file.id);
      expect(deleted?.isActive).toBe(false);
      expect(deleted?.isArchived).toBe(true);
    });
  });

  describe('getFileWithGraph', () => {
    it('should return file with graph', async () => {
      const file = await createTestCanvasFile(testProject.id, testUser.id);
      const graph = await createTestCanvasGraph(file.id, testProject.id, testUser.id);

      const result = await CanvasFilesDAL.getFileWithGraph(file.id);

      expect(result).toBeDefined();
      expect(result?.file?.id).toBe(file.id);
      expect(result?.graph?.id).toBe(graph.id);
    });

    it('should return file without graph when graph does not exist', async () => {
      const file = await createTestCanvasFile(testProject.id, testUser.id);

      const result = await CanvasFilesDAL.getFileWithGraph(file.id);

      expect(result).toBeDefined();
      expect(result?.file?.id).toBe(file.id);
      expect(result?.graph).toBeNull();
    });

    it('should return null for non-existent file', async () => {
      const result = await CanvasFilesDAL.getFileWithGraph('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });
  });

  describe('duplicate', () => {
    it('should duplicate file with graph', async () => {
      const file = await createTestCanvasFile(testProject.id, testUser.id);
      const graph = await createTestCanvasGraph(file.id, testProject.id, testUser.id, {
        nodes: [{ id: '1', type: 'input' }],
        connections: [],
      });

      const duplicated = await CanvasFilesDAL.duplicate(file.id, 'Duplicated File');

      expect(duplicated).toBeDefined();
      expect(duplicated.name).toBe('Duplicated File');
      expect(duplicated.projectId).toBe(file.projectId);

      // Verify graph was duplicated
      const duplicatedGraph = await CanvasDAL.getByFileId(duplicated.id);
      expect(duplicatedGraph).toBeDefined();
    });

    it('should duplicate file without graph', async () => {
      const file = await createTestCanvasFile(testProject.id, testUser.id);

      const duplicated = await CanvasFilesDAL.duplicate(file.id);

      expect(duplicated).toBeDefined();
      expect(duplicated.name).toContain('Copy');
    });

    it('should generate unique slug for duplicate', async () => {
      const file = await createTestCanvasFile(testProject.id, testUser.id, { slug: 'original' });

      const duplicated = await CanvasFilesDAL.duplicate(file.id);

      expect(duplicated.slug).not.toBe(file.slug);
      expect(duplicated.slug).toContain('original');
    });
  });

  describe('incrementVersion', () => {
    it('should increment file version', async () => {
      const file = await createTestCanvasFile(testProject.id, testUser.id);
      const originalVersion = file.version;

      const updated = await CanvasFilesDAL.incrementVersion(file.id);

      expect(updated?.version).toBe(originalVersion + 1);
    });

    it('should return null for non-existent file', async () => {
      const updated = await CanvasFilesDAL.incrementVersion('00000000-0000-0000-0000-000000000000');

      expect(updated).toBeNull();
    });
  });
});







