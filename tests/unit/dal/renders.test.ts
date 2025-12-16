/**
 * Comprehensive unit tests for RendersDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RendersDAL } from '@/lib/dal/renders';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject, createTestRender, createTestRenderChain, getTestDB } from '../../fixtures/database';
import { renders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('RendersDAL', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id);
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('create', () => {
    it('should create a new render with all required fields', async () => {
      const renderData = {
        userId: testUser.id,
        projectId: testProject.id,
        type: 'image' as const,
        prompt: 'Test prompt',
        settings: {
          style: 'photorealistic',
          quality: 'high' as const,
          aspectRatio: '16:9',
        },
        status: 'pending' as const,
      };

      const render = await RendersDAL.create(renderData);

      expect(render).toBeDefined();
      expect(render.id).toBeDefined();
      expect(render.userId).toBe(testUser.id);
      expect(render.projectId).toBe(testProject.id);
      expect(render.type).toBe('image');
      expect(render.prompt).toBe('Test prompt');
      expect(render.status).toBe('pending');
      expect(render.platform).toBe('render');
      expect(render.createdAt).toBeInstanceOf(Date);
    });

    it('should create video render', async () => {
      const renderData = {
        userId: testUser.id,
        projectId: testProject.id,
        type: 'video' as const,
        prompt: 'Test video prompt',
        settings: {
          style: 'photorealistic',
          quality: 'high' as const,
          aspectRatio: '16:9',
          duration: 30,
        },
        status: 'pending' as const,
      };

      const render = await RendersDAL.create(renderData);

      expect(render.type).toBe('video');
      expect(render.settings?.duration).toBe(30);
    });

    it('should create render with chain information', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const renderData = {
        userId: testUser.id,
        projectId: testProject.id,
        type: 'image' as const,
        prompt: 'Chain render',
        settings: {
          style: 'photorealistic',
          quality: 'high' as const,
          aspectRatio: '16:9',
        },
        status: 'pending' as const,
        chainId: chain.id,
        chainPosition: 0,
      };

      const render = await RendersDAL.create(renderData);

      expect(render.chainId).toBe(chain.id);
      expect(render.chainPosition).toBe(0);
    });

    it('should create render with reference render', async () => {
      const referenceRender = await createTestRender(testUser.id, testProject.id);
      const renderData = {
        userId: testUser.id,
        projectId: testProject.id,
        type: 'image' as const,
        prompt: 'Reference render',
        settings: {
          style: 'photorealistic',
          quality: 'high' as const,
          aspectRatio: '16:9',
        },
        status: 'pending' as const,
        referenceRenderId: referenceRender.id,
      };

      const render = await RendersDAL.create(renderData);

      expect(render.referenceRenderId).toBe(referenceRender.id);
    });

    it('should create render with uploaded image', async () => {
      const renderData = {
        userId: testUser.id,
        projectId: testProject.id,
        type: 'image' as const,
        prompt: 'Upload render',
        settings: {
          style: 'photorealistic',
          quality: 'high' as const,
          aspectRatio: '16:9',
        },
        status: 'pending' as const,
        uploadedImageUrl: 'https://example.com/upload.jpg',
        uploadedImageKey: 'uploads/upload.jpg',
      };

      const render = await RendersDAL.create(renderData);

      expect(render.uploadedImageUrl).toBe('https://example.com/upload.jpg');
      expect(render.uploadedImageKey).toBe('uploads/upload.jpg');
    });

    it('should create render for tools platform', async () => {
      const renderData = {
        userId: testUser.id,
        projectId: testProject.id,
        type: 'image' as const,
        prompt: 'Tools render',
        settings: {
          style: 'photorealistic',
          quality: 'high' as const,
          aspectRatio: '16:9',
        },
        status: 'pending' as const,
        platform: 'tools' as const,
      };

      const render = await RendersDAL.create(renderData);

      expect(render.platform).toBe('tools');
    });

    it('should default platform to render', async () => {
      const renderData = {
        userId: testUser.id,
        projectId: testProject.id,
        type: 'image' as const,
        prompt: 'Default platform',
        settings: {
          style: 'photorealistic',
          quality: 'high' as const,
          aspectRatio: '16:9',
        },
        status: 'pending' as const,
      };

      const render = await RendersDAL.create(renderData);

      expect(render.platform).toBe('render');
    });
  });

  describe('getById', () => {
    it('should return render by id', async () => {
      const testRender = await createTestRender(testUser.id, testProject.id);
      const render = await RendersDAL.getById(testRender.id);

      expect(render).toBeDefined();
      expect(render?.id).toBe(testRender.id);
      expect(render?.prompt).toBe(testRender.prompt);
    });

    it('should return undefined for non-existent render', async () => {
      const render = await RendersDAL.getById('00000000-0000-0000-0000-000000000000');
      expect(render).toBeUndefined();
    });
  });

  describe('getByUser', () => {
    it('should return renders for user', async () => {
      await createTestRender(testUser.id, testProject.id);
      await createTestRender(testUser.id, testProject.id);
      await createTestRender(testUser.id, testProject.id);

      const userRenders = await RendersDAL.getByUser(testUser.id);

      expect(userRenders.length).toBeGreaterThanOrEqual(3);
      expect(userRenders.every(r => r.userId === testUser.id)).toBe(true);
    });

    it('should filter by project when provided', async () => {
      const project2 = await createTestProject(testUser.id);
      await createTestRender(testUser.id, testProject.id);
      await createTestRender(testUser.id, project2.id);

      const projectRenders = await RendersDAL.getByUser(testUser.id, testProject.id);

      expect(projectRenders.every(r => r.projectId === testProject.id)).toBe(true);
      expect(projectRenders.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await createTestRender(testUser.id, testProject.id);
      }

      const renders = await RendersDAL.getByUser(testUser.id, undefined, 5);

      expect(renders.length).toBe(5);
    });

    it('should order by createdAt descending', async () => {
      const render1 = await createTestRender(testUser.id, testProject.id);
      await new Promise(resolve => setTimeout(resolve, 10));
      const render2 = await createTestRender(testUser.id, testProject.id);

      const renders = await RendersDAL.getByUser(testUser.id);

      expect(renders[0].id).toBe(render2.id);
      expect(renders[1].id).toBe(render1.id);
    });

    it('should return empty array for user with no renders', async () => {
      const newUser = await createTestUser();
      const renders = await RendersDAL.getByUser(newUser.id);

      expect(renders).toEqual([]);
    });
  });

  describe('getByProjectId', () => {
    it('should return renders for project', async () => {
      await createTestRender(testUser.id, testProject.id);
      await createTestRender(testUser.id, testProject.id);

      const projectRenders = await RendersDAL.getByProjectId(testProject.id);

      expect(projectRenders.length).toBeGreaterThanOrEqual(2);
      expect(projectRenders.every(r => r.projectId === testProject.id)).toBe(true);
    });

    it('should return empty array for project with no renders', async () => {
      const newProject = await createTestProject(testUser.id);
      const renders = await RendersDAL.getByProjectId(newProject.id);

      expect(renders).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update render status', async () => {
      const render = await createTestRender(testUser.id, testProject.id, { status: 'pending' });

      const updated = await RendersDAL.updateStatus(render.id, 'processing');

      expect(updated.status).toBe('processing');
    });

    it('should update status to completed', async () => {
      const render = await createTestRender(testUser.id, testProject.id);

      const updated = await RendersDAL.updateStatus(render.id, 'completed');

      expect(updated.status).toBe('completed');
    });

    it('should update status to failed with error message', async () => {
      const render = await createTestRender(testUser.id, testProject.id);

      const updated = await RendersDAL.updateStatus(render.id, 'failed', 'Render failed');

      expect(updated.status).toBe('failed');
      expect(updated.errorMessage).toBe('Render failed');
    });

    it('should clear error message when status changes from failed', async () => {
      const render = await createTestRender(testUser.id, testProject.id, {
        status: 'failed',
        errorMessage: 'Previous error',
      });

      const updated = await RendersDAL.updateStatus(render.id, 'processing');

      expect(updated.status).toBe('processing');
      expect(updated.errorMessage).toBeNull();
    });
  });

  describe('updateOutput', () => {
    it('should update render output with URL and key', async () => {
      const render = await createTestRender(testUser.id, testProject.id);

      const updated = await RendersDAL.updateOutput(
        render.id,
        'https://example.com/output.jpg',
        'renders/output.jpg',
        'completed',
        120
      );

      expect(updated.outputUrl).toBe('https://example.com/output.jpg');
      expect(updated.outputKey).toBe('renders/output.jpg');
      expect(updated.status).toBe('completed');
      expect(updated.processingTime).toBe(120);
    });

    it('should update output without processing time', async () => {
      const render = await createTestRender(testUser.id, testProject.id);

      const updated = await RendersDAL.updateOutput(
        render.id,
        'https://example.com/output.jpg',
        'renders/output.jpg',
        'completed'
      );

      expect(updated.outputUrl).toBe('https://example.com/output.jpg');
      expect(updated.processingTime).toBeNull();
    });

    it('should update output with failed status', async () => {
      const render = await createTestRender(testUser.id, testProject.id);

      const updated = await RendersDAL.updateOutput(
        render.id,
        '',
        '',
        'failed'
      );

      expect(updated.status).toBe('failed');
    });
  });

  describe('delete', () => {
    it('should delete render', async () => {
      const render = await createTestRender(testUser.id, testProject.id);

      await RendersDAL.delete(render.id);

      const deleted = await RendersDAL.getById(render.id);
      expect(deleted).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    it('should return renders by status', async () => {
      await createTestRender(testUser.id, testProject.id, { status: 'pending' });
      await createTestRender(testUser.id, testProject.id, { status: 'processing' });
      await createTestRender(testUser.id, testProject.id, { status: 'completed' });

      const pendingRenders = await RendersDAL.getByStatus('pending');
      const processingRenders = await RendersDAL.getByStatus('processing');
      const completedRenders = await RendersDAL.getByStatus('completed');

      expect(pendingRenders.every(r => r.status === 'pending')).toBe(true);
      expect(processingRenders.every(r => r.status === 'processing')).toBe(true);
      expect(completedRenders.every(r => r.status === 'completed')).toBe(true);
    });

    it('should return empty array when no renders with status exist', async () => {
      const renders = await RendersDAL.getByStatus('failed');

      expect(renders).toEqual([]);
    });
  });

  describe('getByChainId', () => {
    it('should return renders for chain ordered by position', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const render1 = await createTestRender(testUser.id, testProject.id, {
        chainId: chain.id,
        chainPosition: 0,
      });
      const render2 = await createTestRender(testUser.id, testProject.id, {
        chainId: chain.id,
        chainPosition: 1,
      });

      const chainRenders = await RendersDAL.getByChainId(chain.id);

      expect(chainRenders.length).toBe(2);
      expect(chainRenders[0].id).toBe(render1.id);
      expect(chainRenders[1].id).toBe(render2.id);
    });

    it('should return empty array for chain with no renders', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const renders = await RendersDAL.getByChainId(chain.id);

      expect(renders).toEqual([]);
    });
  });

  describe('getWithContext', () => {
    it('should return render with parent, reference, and chain context', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const parentRender = await createTestRender(testUser.id, testProject.id);
      const referenceRender = await createTestRender(testUser.id, testProject.id);
      const render = await createTestRender(testUser.id, testProject.id, {
        chainId: chain.id,
        parentRenderId: parentRender.id,
        referenceRenderId: referenceRender.id,
      });

      const renderWithContext = await RendersDAL.getWithContext(render.id);

      expect(renderWithContext).toBeDefined();
      expect(renderWithContext?.parentRender?.id).toBe(parentRender.id);
      expect(renderWithContext?.referenceRender?.id).toBe(referenceRender.id);
      expect(renderWithContext?.chain?.id).toBe(chain.id);
    });

    it('should return render without context when no relations exist', async () => {
      const render = await createTestRender(testUser.id, testProject.id);

      const renderWithContext = await RendersDAL.getWithContext(render.id);

      expect(renderWithContext).toBeDefined();
      expect(renderWithContext?.parentRender).toBeNull();
      expect(renderWithContext?.referenceRender).toBeNull();
      expect(renderWithContext?.chain).toBeNull();
    });

    it('should return null for non-existent render', async () => {
      const renderWithContext = await RendersDAL.getWithContext('00000000-0000-0000-0000-000000000000');

      expect(renderWithContext).toBeNull();
    });
  });

  describe('updateContext', () => {
    it('should update render context data', async () => {
      const render = await createTestRender(testUser.id, testProject.id);
      const context = {
        successfulElements: ['element1', 'element2'],
        previousPrompts: ['prompt1'],
        userFeedback: 'Great!',
      };

      const updated = await RendersDAL.updateContext(render.id, context);

      expect(updated.contextData).toEqual(context);
    });

    it('should update context with empty arrays', async () => {
      const render = await createTestRender(testUser.id, testProject.id);
      const context = {
        successfulElements: [],
        previousPrompts: [],
      };

      const updated = await RendersDAL.updateContext(render.id, context);

      expect(updated.contextData).toEqual(context);
    });
  });

  describe('getReferenceRenders', () => {
    it('should return only completed renders for project', async () => {
      await createTestRender(testUser.id, testProject.id, { status: 'completed' });
      await createTestRender(testUser.id, testProject.id, { status: 'pending' });
      await createTestRender(testUser.id, testProject.id, { status: 'completed' });

      const referenceRenders = await RendersDAL.getReferenceRenders(testProject.id);

      expect(referenceRenders.every(r => r.status === 'completed')).toBe(true);
      expect(referenceRenders.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no completed renders exist', async () => {
      await createTestRender(testUser.id, testProject.id, { status: 'pending' });

      const referenceRenders = await RendersDAL.getReferenceRenders(testProject.id);

      expect(referenceRenders).toEqual([]);
    });
  });

  describe('createWithChain', () => {
    it('should create render with full chain context', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const parentRender = await createTestRender(testUser.id, testProject.id);
      const referenceRender = await createTestRender(testUser.id, testProject.id);

      const renderData = {
        projectId: testProject.id,
        userId: testUser.id,
        type: 'image' as const,
        prompt: 'Chain render',
        settings: {
          style: 'photorealistic',
          quality: 'high' as const,
          aspectRatio: '16:9',
        },
        status: 'pending' as const,
        chainId: chain.id,
        chainPosition: 0,
        parentRenderId: parentRender.id,
        referenceRenderId: referenceRender.id,
        contextData: {
          successfulElements: ['element1'],
        },
      };

      const render = await RendersDAL.createWithChain(renderData);

      expect(render.chainId).toBe(chain.id);
      expect(render.parentRenderId).toBe(parentRender.id);
      expect(render.referenceRenderId).toBe(referenceRender.id);
      expect(render.contextData).toEqual({ successfulElements: ['element1'] });
    });
  });
});








