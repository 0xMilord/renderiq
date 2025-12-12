/**
 * Comprehensive unit tests for ProjectsDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectsDAL } from '@/lib/dal/projects';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject, getTestDB } from '../../fixtures/database';
import { projects, renders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('ProjectsDAL', () => {
  let testUser: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('create', () => {
    it('should create a new project with all required fields', async () => {
      const projectData = {
        userId: testUser.id,
        name: 'Test Project',
        platform: 'render' as const,
      };

      const project = await ProjectsDAL.create(projectData);

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.userId).toBe(testUser.id);
      expect(project.name).toBe('Test Project');
      expect(project.slug).toBeDefined();
      expect(project.platform).toBe('render');
      expect(project.status).toBe('processing');
      expect(project.isPublic).toBe(false);
      expect(project.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique slug from project name', async () => {
      const projectData = {
        userId: testUser.id,
        name: 'My Awesome Project',
        platform: 'render' as const,
      };

      const project = await ProjectsDAL.create(projectData);

      expect(project.slug).toContain('my-awesome-project');
      expect(project.slug).toMatch(/^my-awesome-project/);
    });

    it('should handle special characters in project name', async () => {
      const projectData = {
        userId: testUser.id,
        name: 'Project @#$%^&*()!',
        platform: 'render' as const,
      };

      const project = await ProjectsDAL.create(projectData);

      expect(project.slug).not.toMatch(/[@#$%^&*()!]/);
      expect(project.slug).toMatch(/^project/);
    });

    it('should ensure unique slug when duplicates exist', async () => {
      const projectData = {
        userId: testUser.id,
        name: 'Test Project',
        platform: 'render' as const,
      };

      const project1 = await ProjectsDAL.create(projectData);
      const project2 = await ProjectsDAL.create(projectData);

      expect(project1.slug).not.toBe(project2.slug);
      expect(project2.slug).toContain('test-project');
    });

    it('should create project with optional fields', async () => {
      const projectData = {
        userId: testUser.id,
        name: 'Project With Details',
        description: 'Test description',
        isPublic: true,
        tags: ['tag1', 'tag2'],
        metadata: { key: 'value' },
        platform: 'render' as const,
      };

      const project = await ProjectsDAL.create(projectData);

      expect(project.description).toBe('Test description');
      expect(project.isPublic).toBe(true);
      expect(project.tags).toEqual(['tag1', 'tag2']);
      expect(project.metadata).toEqual({ key: 'value' });
    });

    it('should create project for tools platform', async () => {
      const projectData = {
        userId: testUser.id,
        name: 'Tools Project',
        platform: 'tools' as const,
      };

      const project = await ProjectsDAL.create(projectData);

      expect(project.platform).toBe('tools');
    });

    it('should create project for canvas platform', async () => {
      const projectData = {
        userId: testUser.id,
        name: 'Canvas Project',
        platform: 'canvas' as const,
      };

      const project = await ProjectsDAL.create(projectData);

      expect(project.platform).toBe('canvas');
    });
  });

  describe('getById', () => {
    it('should return project by id', async () => {
      const testProject = await createTestProject(testUser.id);
      const project = await ProjectsDAL.getById(testProject.id);

      expect(project).toBeDefined();
      expect(project?.id).toBe(testProject.id);
      expect(project?.name).toBe(testProject.name);
    });

    it('should return null for non-existent project', async () => {
      const project = await ProjectsDAL.getById('00000000-0000-0000-0000-000000000000');
      expect(project).toBeNull();
    });

    it('should return null for invalid UUID', async () => {
      const project = await ProjectsDAL.getById('invalid-id');
      expect(project).toBeNull();
    });
  });

  describe('getBySlug', () => {
    it('should return project by slug', async () => {
      const testProject = await createTestProject(testUser.id, { name: 'Find Me Project' });
      const project = await ProjectsDAL.getBySlug(testProject.slug);

      expect(project).toBeDefined();
      expect(project?.id).toBe(testProject.id);
      expect(project?.slug).toBe(testProject.slug);
    });

    it('should return null for non-existent slug', async () => {
      const project = await ProjectsDAL.getBySlug('non-existent-slug');
      expect(project).toBeNull();
    });
  });

  describe('getByIds', () => {
    it('should return multiple projects by ids', async () => {
      const project1 = await createTestProject(testUser.id);
      const project2 = await createTestProject(testUser.id);
      const project3 = await createTestProject(testUser.id);

      const projects = await ProjectsDAL.getByIds([project1.id, project2.id, project3.id]);

      expect(projects.length).toBe(3);
      expect(projects.map(p => p.id).sort()).toEqual([project1.id, project2.id, project3.id].sort());
    });

    it('should return empty array for empty ids', async () => {
      const projects = await ProjectsDAL.getByIds([]);
      expect(projects).toEqual([]);
    });

    it('should return only existing projects', async () => {
      const project1 = await createTestProject(testUser.id);
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const projects = await ProjectsDAL.getByIds([project1.id, nonExistentId]);

      expect(projects.length).toBe(1);
      expect(projects[0].id).toBe(project1.id);
    });

    it('should handle large batch of ids', async () => {
      const projectIds: string[] = [];
      for (let i = 0; i < 50; i++) {
        const project = await createTestProject(testUser.id);
        projectIds.push(project.id);
      }

      const projects = await ProjectsDAL.getByIds(projectIds);

      expect(projects.length).toBe(50);
    });
  });

  describe('getByUserId', () => {
    it('should return projects for user', async () => {
      await createTestProject(testUser.id);
      await createTestProject(testUser.id);
      await createTestProject(testUser.id);

      const userProjects = await ProjectsDAL.getByUserId(testUser.id);

      expect(userProjects.length).toBeGreaterThanOrEqual(3);
      expect(userProjects.every(p => p.userId === testUser.id)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await createTestProject(testUser.id);
      }

      const projects = await ProjectsDAL.getByUserId(testUser.id, 5);

      expect(projects.length).toBe(5);
    });

    it('should respect offset parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await createTestProject(testUser.id);
      }

      const firstBatch = await ProjectsDAL.getByUserId(testUser.id, 5, 0);
      const secondBatch = await ProjectsDAL.getByUserId(testUser.id, 5, 5);

      expect(firstBatch.length).toBe(5);
      expect(secondBatch.length).toBe(5);
      expect(firstBatch[0].id).not.toBe(secondBatch[0].id);
    });

    it('should filter by platform', async () => {
      await createTestProject(testUser.id, { platform: 'render' });
      await createTestProject(testUser.id, { platform: 'tools' });
      await createTestProject(testUser.id, { platform: 'canvas' });

      const renderProjects = await ProjectsDAL.getByUserId(testUser.id, 100, 0, 'render');
      const toolsProjects = await ProjectsDAL.getByUserId(testUser.id, 100, 0, 'tools');
      const canvasProjects = await ProjectsDAL.getByUserId(testUser.id, 100, 0, 'canvas');

      expect(renderProjects.every(p => p.platform === 'render')).toBe(true);
      expect(toolsProjects.every(p => p.platform === 'tools')).toBe(true);
      expect(canvasProjects.every(p => p.platform === 'canvas')).toBe(true);
    });

    it('should return empty array for user with no projects', async () => {
      const newUser = await createTestUser();
      const projects = await ProjectsDAL.getByUserId(newUser.id);

      expect(projects).toEqual([]);
    });

    it('should order by createdAt descending', async () => {
      const project1 = await createTestProject(testUser.id);
      await new Promise(resolve => setTimeout(resolve, 10));
      const project2 = await createTestProject(testUser.id);

      const projects = await ProjectsDAL.getByUserId(testUser.id);

      expect(projects[0].id).toBe(project2.id);
      expect(projects[1].id).toBe(project1.id);
    });
  });

  describe('getByUserIdWithRenderCounts', () => {
    it('should return projects with render counts', async () => {
      const project = await createTestProject(testUser.id);
      const db = getTestDB();

      // Create some renders
      await db.insert(renders).values([
        {
          userId: testUser.id,
          projectId: project.id,
          type: 'image',
          prompt: 'Test 1',
          status: 'completed',
        },
        {
          userId: testUser.id,
          projectId: project.id,
          type: 'image',
          prompt: 'Test 2',
          status: 'completed',
        },
      ]);

      const projects = await ProjectsDAL.getByUserIdWithRenderCounts(testUser.id);

      expect(projects.length).toBeGreaterThan(0);
      const projectWithCount = projects.find(p => p.id === project.id);
      expect(projectWithCount).toBeDefined();
      expect(Number(projectWithCount?.renderCount || 0)).toBeGreaterThanOrEqual(2);
    });

    it('should return 0 render count for project with no renders', async () => {
      const project = await createTestProject(testUser.id);

      const projects = await ProjectsDAL.getByUserIdWithRenderCounts(testUser.id);

      const projectWithCount = projects.find(p => p.id === project.id);
      expect(Number(projectWithCount?.renderCount || 0)).toBe(0);
    });

    it('should respect limit and offset', async () => {
      for (let i = 0; i < 10; i++) {
        await createTestProject(testUser.id);
      }

      const projects = await ProjectsDAL.getByUserIdWithRenderCounts(testUser.id, 5, 0);

      expect(projects.length).toBe(5);
    });
  });

  describe('updateStatus', () => {
    it('should update project status', async () => {
      const project = await createTestProject(testUser.id);

      await ProjectsDAL.updateStatus(project.id, 'completed');

      const updated = await ProjectsDAL.getById(project.id);
      expect(updated?.status).toBe('completed');
    });

    it('should update status to failed', async () => {
      const project = await createTestProject(testUser.id);

      await ProjectsDAL.updateStatus(project.id, 'failed');

      const updated = await ProjectsDAL.getById(project.id);
      expect(updated?.status).toBe('failed');
    });

    it('should handle non-existent project gracefully', async () => {
      await expect(
        ProjectsDAL.updateStatus('00000000-0000-0000-0000-000000000000', 'completed')
      ).resolves.not.toThrow();
    });
  });

  describe('update', () => {
    it('should update project name and regenerate slug', async () => {
      const project = await createTestProject(testUser.id, { name: 'Original Name' });

      const updated = await ProjectsDAL.update(project.id, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.slug).toContain('updated-name');
      expect(updated.slug).not.toBe(project.slug);
    });

    it('should update description', async () => {
      const project = await createTestProject(testUser.id);

      const updated = await ProjectsDAL.update(project.id, {
        description: 'New description',
      });

      expect(updated.description).toBe('New description');
    });

    it('should update isPublic flag', async () => {
      const project = await createTestProject(testUser.id, { isPublic: false });

      const updated = await ProjectsDAL.update(project.id, {
        isPublic: true,
      });

      expect(updated.isPublic).toBe(true);
    });

    it('should update tags', async () => {
      const project = await createTestProject(testUser.id);

      const updated = await ProjectsDAL.update(project.id, {
        tags: ['new', 'tags'],
      });

      expect(updated.tags).toEqual(['new', 'tags']);
    });

    it('should update metadata', async () => {
      const project = await createTestProject(testUser.id);

      const updated = await ProjectsDAL.update(project.id, {
        metadata: { newKey: 'newValue' },
      });

      expect(updated.metadata).toEqual({ newKey: 'newValue' });
    });

    it('should update multiple fields at once', async () => {
      const project = await createTestProject(testUser.id);

      const updated = await ProjectsDAL.update(project.id, {
        name: 'Multi Update',
        description: 'Updated description',
        isPublic: true,
        tags: ['tag1'],
      });

      expect(updated.name).toBe('Multi Update');
      expect(updated.description).toBe('Updated description');
      expect(updated.isPublic).toBe(true);
      expect(updated.tags).toEqual(['tag1']);
    });

    it('should set description to null', async () => {
      const project = await createTestProject(testUser.id, { description: 'Original' });

      const updated = await ProjectsDAL.update(project.id, {
        description: null,
      });

      expect(updated.description).toBeNull();
    });

    it('should update updatedAt timestamp', async () => {
      const project = await createTestProject(testUser.id);
      const originalUpdatedAt = project.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await ProjectsDAL.update(project.id, {
        description: 'Updated',
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete project', async () => {
      const project = await createTestProject(testUser.id);

      await ProjectsDAL.delete(project.id);

      const deleted = await ProjectsDAL.getById(project.id);
      expect(deleted).toBeNull();
    });

    it('should handle deleting non-existent project', async () => {
      await expect(
        ProjectsDAL.delete('00000000-0000-0000-0000-000000000000')
      ).resolves.not.toThrow();
    });
  });

  describe('getByUserIdWithPlatformInfo', () => {
    it('should return projects with platform information', async () => {
      const project = await createTestProject(testUser.id, { platform: 'render' });

      const projects = await ProjectsDAL.getByUserIdWithPlatformInfo(testUser.id);

      expect(projects.length).toBeGreaterThan(0);
      const projectWithInfo = projects.find(p => p.id === project.id);
      expect(projectWithInfo).toBeDefined();
      expect(projectWithInfo).toHaveProperty('renderCount');
      expect(projectWithInfo).toHaveProperty('toolExecutionCount');
      expect(projectWithInfo).toHaveProperty('canvasFileCount');
      expect(projectWithInfo).toHaveProperty('primaryPlatform');
    });

    it('should respect limit and offset', async () => {
      for (let i = 0; i < 10; i++) {
        await createTestProject(testUser.id);
      }

      const projects = await ProjectsDAL.getByUserIdWithPlatformInfo(testUser.id, 5, 0);

      expect(projects.length).toBe(5);
    });
  });
});



