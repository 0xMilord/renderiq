/**
 * Comprehensive unit tests for RenderChainsDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject, createTestRenderChain, createTestRender, getTestDB } from '../../fixtures/database';
import { renderChains, renders, projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('RenderChainsDAL', () => {
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
    it('should create a new render chain', async () => {
      // Verify project exists before creating chain
      const db = getTestDB();
      const verifyProject = await db.select().from(projects).where(eq(projects.id, testProject.id)).limit(1);
      if (verifyProject.length === 0) {
        throw new Error(`Project ${testProject.id} does not exist in database. Test setup failed.`);
      }
      
      const chainData = {
        projectId: testProject.id,
        name: 'Test Chain',
        description: 'Test description',
      };

      const chain = await RenderChainsDAL.create(chainData);

      expect(chain).toBeDefined();
      expect(chain.id).toBeDefined();
      expect(chain.projectId).toBe(testProject.id);
      expect(chain.name).toBe('Test Chain');
      expect(chain.description).toBe('Test description');
      expect(chain.createdAt).toBeInstanceOf(Date);
    });

    it('should create chain without description', async () => {
      const chainData = {
        projectId: testProject.id,
        name: 'Chain Without Description',
      };

      const chain = await RenderChainsDAL.create(chainData);

      expect(chain).toBeDefined();
      expect(chain.description).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return chain by id', async () => {
      const testChain = await createTestRenderChain(testProject.id);
      const chain = await RenderChainsDAL.getById(testChain.id);

      expect(chain).toBeDefined();
      expect(chain?.id).toBe(testChain.id);
    });

    it('should return undefined for non-existent chain', async () => {
      const chain = await RenderChainsDAL.getById('00000000-0000-0000-0000-000000000000');
      expect(chain).toBeUndefined();
    });

    it('should return undefined for invalid UUID', async () => {
      const chain = await RenderChainsDAL.getById('invalid-id');
      expect(chain).toBeUndefined();
    });

    it('should return undefined for temp ID', async () => {
      const chain = await RenderChainsDAL.getById('temp-123');
      expect(chain).toBeUndefined();
    });
  });

  describe('getByProjectId', () => {
    it('should return chains for project', async () => {
      await createTestRenderChain(testProject.id);
      await createTestRenderChain(testProject.id);
      await createTestRenderChain(testProject.id);

      const chains = await RenderChainsDAL.getByProjectId(testProject.id);

      expect(chains.length).toBeGreaterThanOrEqual(3);
      expect(chains.every(c => c.projectId === testProject.id)).toBe(true);
    });

    it('should order by createdAt descending', async () => {
      const chain1 = await createTestRenderChain(testProject.id);
      await new Promise(resolve => setTimeout(resolve, 10));
      const chain2 = await createTestRenderChain(testProject.id);

      const chains = await RenderChainsDAL.getByProjectId(testProject.id);

      expect(chains[0].id).toBe(chain2.id);
      expect(chains[1].id).toBe(chain1.id);
    });

    it('should return empty array for project with no chains', async () => {
      const newProject = await createTestProject(testUser.id);
      const chains = await RenderChainsDAL.getByProjectId(newProject.id);

      expect(chains).toEqual([]);
    });
  });

  describe('getByProjectIds', () => {
    it('should return chains for multiple projects', async () => {
      const project2 = await createTestProject(testUser.id);
      const chain1 = await createTestRenderChain(testProject.id);
      const chain2 = await createTestRenderChain(project2.id);

      const chains = await RenderChainsDAL.getByProjectIds([testProject.id, project2.id]);

      expect(chains.length).toBeGreaterThanOrEqual(2);
      expect(chains.some(c => c.id === chain1.id)).toBe(true);
      expect(chains.some(c => c.id === chain2.id)).toBe(true);
    });

    it('should return empty array for empty project ids', async () => {
      const chains = await RenderChainsDAL.getByProjectIds([]);

      expect(chains).toEqual([]);
    });

    it('should handle single project id', async () => {
      const chain = await createTestRenderChain(testProject.id);

      const chains = await RenderChainsDAL.getByProjectIds([testProject.id]);

      expect(chains.length).toBeGreaterThanOrEqual(1);
      expect(chains.some(c => c.id === chain.id)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update chain name', async () => {
      const chain = await createTestRenderChain(testProject.id);

      const updated = await RenderChainsDAL.update(chain.id, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should update chain description', async () => {
      const chain = await createTestRenderChain(testProject.id);

      const updated = await RenderChainsDAL.update(chain.id, {
        description: 'Updated description',
      });

      expect(updated.description).toBe('Updated description');
    });

    it('should update multiple fields', async () => {
      const chain = await createTestRenderChain(testProject.id);

      const updated = await RenderChainsDAL.update(chain.id, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
    });

    it('should update updatedAt timestamp', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const originalUpdatedAt = chain.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await RenderChainsDAL.update(chain.id, {
        name: 'Updated',
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete chain', async () => {
      const chain = await createTestRenderChain(testProject.id);

      await RenderChainsDAL.delete(chain.id);

      const deleted = await RenderChainsDAL.getById(chain.id);
      expect(deleted).toBeUndefined();
    });
  });

  describe('addRender', () => {
    it('should add render to chain without position', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const render = await createTestRender(testUser.id, testProject.id);

      const updated = await RenderChainsDAL.addRender(chain.id, render.id);

      expect(updated.chainId).toBe(chain.id);
      expect(updated.chainPosition).toBe(0);
    });

    it('should add multiple renders with auto-incrementing positions', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const render1 = await createTestRender(testUser.id, testProject.id);
      const render2 = await createTestRender(testUser.id, testProject.id);
      const render3 = await createTestRender(testUser.id, testProject.id);

      const updated1 = await RenderChainsDAL.addRender(chain.id, render1.id);
      const updated2 = await RenderChainsDAL.addRender(chain.id, render2.id);
      const updated3 = await RenderChainsDAL.addRender(chain.id, render3.id);

      expect(updated1.chainPosition).toBe(0);
      expect(updated2.chainPosition).toBe(1);
      expect(updated3.chainPosition).toBe(2);
    });

    it('should add render with specific position', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const render = await createTestRender(testUser.id, testProject.id);

      const updated = await RenderChainsDAL.addRender(chain.id, render.id, 5);

      expect(updated.chainId).toBe(chain.id);
      expect(updated.chainPosition).toBe(5);
    });

    it('should handle adding render to chain with existing renders', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const render1 = await createTestRender(testUser.id, testProject.id);
      const render2 = await createTestRender(testUser.id, testProject.id);

      await RenderChainsDAL.addRender(chain.id, render1.id, 0);
      const updated2 = await RenderChainsDAL.addRender(chain.id, render2.id);

      expect(updated2.chainPosition).toBe(1);
    });
  });

  describe('removeRender', () => {
    it('should remove render from chain', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const render = await createTestRender(testUser.id, testProject.id, {
        chainId: chain.id,
        chainPosition: 0,
      });

      const updated = await RenderChainsDAL.removeRender(chain.id, render.id);

      expect(updated.chainId).toBeNull();
      expect(updated.chainPosition).toBeNull();
    });

    it('should handle removing render not in chain', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const render = await createTestRender(testUser.id, testProject.id);

      const updated = await RenderChainsDAL.removeRender(chain.id, render.id);

      expect(updated.chainId).toBeNull();
    });
  });

  describe('getChainRenders', () => {
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

      const chainRenders = await RenderChainsDAL.getChainRenders(chain.id);

      expect(chainRenders.length).toBe(2);
      expect(chainRenders[0].id).toBe(render2.id); // Descending order
      expect(chainRenders[1].id).toBe(render1.id);
    });

    it('should return empty array for chain with no renders', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const renders = await RenderChainsDAL.getChainRenders(chain.id);

      expect(renders).toEqual([]);
    });
  });

  describe('getChainWithRenders', () => {
    it('should return chain with all renders', async () => {
      const chain = await createTestRenderChain(testProject.id);
      const render1 = await createTestRender(testUser.id, testProject.id, {
        chainId: chain.id,
        chainPosition: 0,
      });
      const render2 = await createTestRender(testUser.id, testProject.id, {
        chainId: chain.id,
        chainPosition: 1,
      });

      const chainWithRenders = await RenderChainsDAL.getChainWithRenders(chain.id);

      expect(chainWithRenders).toBeDefined();
      expect(chainWithRenders?.id).toBe(chain.id);
      expect(chainWithRenders?.renders.length).toBe(2);
      expect(chainWithRenders?.renders.some(r => r.id === render1.id)).toBe(true);
      expect(chainWithRenders?.renders.some(r => r.id === render2.id)).toBe(true);
    });

    it('should return chain with empty renders array', async () => {
      const chain = await createTestRenderChain(testProject.id);

      const chainWithRenders = await RenderChainsDAL.getChainWithRenders(chain.id);

      expect(chainWithRenders).toBeDefined();
      expect(chainWithRenders?.renders).toEqual([]);
    });

    it('should return null for non-existent chain', async () => {
      const chainWithRenders = await RenderChainsDAL.getChainWithRenders('00000000-0000-0000-0000-000000000000');

      expect(chainWithRenders).toBeNull();
    });

    it('should return null for invalid UUID', async () => {
      const chainWithRenders = await RenderChainsDAL.getChainWithRenders('invalid-id');

      expect(chainWithRenders).toBeNull();
    });

    it('should return null for temp ID', async () => {
      const chainWithRenders = await RenderChainsDAL.getChainWithRenders('temp-123');

      expect(chainWithRenders).toBeNull();
    });
  });
});



