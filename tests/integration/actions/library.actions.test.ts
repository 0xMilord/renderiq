/**
 * Integration tests for library actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getUserRendersByProject } from '@/lib/actions/library.actions';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject, createTestRender } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/dal/projects', () => ({
  ProjectsDAL: {
    getByUserId: vi.fn(),
  },
}));

vi.mock('@/lib/dal/renders', () => ({
  RendersDAL: {
    getByUser: vi.fn(),
  },
}));

describe('Library Actions', () => {
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

  describe('getUserRendersByProject', () => {
    it('should get renders grouped by project', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'Project 1' },
      ];
      const mockRenders = [
        { id: 'render-1', projectId: 'project-1', createdAt: new Date() },
      ];

      vi.mocked(ProjectsDAL.getByUserId).mockResolvedValue(mockProjects as any);
      vi.mocked(RendersDAL.getByUser).mockResolvedValue(mockRenders as any);

      const result = await getUserRendersByProject();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.[0].project).toBeDefined();
      expect(result.data?.[0].renders).toBeDefined();
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getUserRendersByProject();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });

    it('should filter out projects with no renders', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'Project 1' },
        { id: 'project-2', name: 'Project 2' },
      ];
      const mockRenders = [
        { id: 'render-1', projectId: 'project-1', createdAt: new Date() },
      ];

      vi.mocked(ProjectsDAL.getByUserId).mockResolvedValue(mockProjects as any);
      vi.mocked(RendersDAL.getByUser).mockResolvedValue(mockRenders as any);

      const result = await getUserRendersByProject();

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1); // Only project-1 has renders
    });

    it('should sort projects by most recent render', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'Project 1' },
        { id: 'project-2', name: 'Project 2' },
      ];
      const mockRenders = [
        { id: 'render-1', projectId: 'project-1', createdAt: new Date('2025-01-01') },
        { id: 'render-2', projectId: 'project-2', createdAt: new Date('2025-01-02') },
      ];

      vi.mocked(ProjectsDAL.getByUserId).mockResolvedValue(mockProjects as any);
      vi.mocked(RendersDAL.getByUser).mockResolvedValue(mockRenders as any);

      const result = await getUserRendersByProject();

      expect(result.success).toBe(true);
      expect(result.data?.[0].project.id).toBe('project-2'); // Most recent render first
    });
  });
});

