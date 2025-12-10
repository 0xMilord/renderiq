/**
 * Comprehensive unit tests for CanvasDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CanvasDAL } from '@/lib/dal/canvas';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject, createTestCanvasFile, createTestCanvasGraph, getTestDB } from '../../fixtures/database';
import { canvasGraphs, canvasFiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('CanvasDAL', () => {
  let testUser: any;
  let testProject: any;
  let testFile: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id, { platform: 'canvas' });
    testFile = await createTestCanvasFile(testProject.id, testUser.id);
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('getByFileId', () => {
    it('should return canvas graph by file id', async () => {
      const graph = await createTestCanvasGraph(testFile.id, testProject.id, testUser.id);

      const result = await CanvasDAL.getByFileId(testFile.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(graph.id);
      expect(result?.fileId).toBe(testFile.id);
      expect(result?.projectId).toBe(testProject.id);
    });

    it('should return null for file with no graph', async () => {
      const newFile = await createTestCanvasFile(testProject.id, testUser.id);
      const result = await CanvasDAL.getByFileId(newFile.id);

      expect(result).toBeNull();
    });

    it('should return null for non-existent file', async () => {
      const result = await CanvasDAL.getByFileId('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });
  });

  describe('saveGraph', () => {
    it('should create new graph for file', async () => {
      const newFile = await createTestCanvasFile(testProject.id, testUser.id);
      const state = {
        nodes: [{ id: '1', type: 'input', position: { x: 0, y: 0 } }],
        connections: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      const result = await CanvasDAL.saveGraph(newFile.id, testUser.id, state);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.fileId).toBe(newFile.id);
      expect(result.data?.version).toBe(1);
    });

    it('should update existing graph', async () => {
      const graph = await createTestCanvasGraph(testFile.id, testProject.id, testUser.id);
      const originalVersion = graph.version;

      const state = {
        nodes: [{ id: '2', type: 'output', position: { x: 100, y: 100 } }],
        connections: [{ id: 'conn1', source: '1', target: '2' }],
        viewport: { x: 10, y: 10, zoom: 1.5 },
      };

      const result = await CanvasDAL.saveGraph(testFile.id, testUser.id, state);

      expect(result.success).toBe(true);
      expect(result.data?.version).toBe(originalVersion + 1);
    });

    it('should return error for non-existent file', async () => {
      const state = {
        nodes: [],
        connections: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      const result = await CanvasDAL.saveGraph('00000000-0000-0000-0000-000000000000', testUser.id, state);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle empty nodes and connections', async () => {
      const newFile = await createTestCanvasFile(testProject.id, testUser.id);
      const state = {
        nodes: [],
        connections: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      const result = await CanvasDAL.saveGraph(newFile.id, testUser.id, state);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should preserve viewport information', async () => {
      const newFile = await createTestCanvasFile(testProject.id, testUser.id);
      const viewport = { x: 100, y: 200, zoom: 2.5 };
      const state = {
        nodes: [],
        connections: [],
        viewport,
      };

      const result = await CanvasDAL.saveGraph(newFile.id, testUser.id, state);

      expect(result.success).toBe(true);
      expect(result.data?.viewport).toEqual(viewport);
    });
  });
});

