/**
 * Integration tests for projects actions
 * Tests server actions with real database operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createProject } from '@/lib/actions/projects.actions';
import { setupTestDB, teardownTestDB, createTestUser, getTestDB } from '../../fixtures/database';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock getUserFromAction
vi.mock('@/lib/utils/get-user-from-action', () => ({
  getUserFromAction: vi.fn(),
}));

describe('Projects Actions', () => {
  let testUser: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    
    // Setup mock for getUserFromAction
    const { getUserFromAction } = await import('@/lib/utils/get-user-from-action');
    vi.mocked(getUserFromAction).mockResolvedValue({
      user: testUser,
      userId: testUser.id,
    });
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a new project with valid data', async () => {
      const formData = new FormData();
      formData.append('projectName', 'Test Project');
      formData.append('description', 'Test description');
      formData.append('userId', testUser.id);

      const result = await createProject(formData);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.name).toBe('Test Project');
      expect(result.project?.userId).toBe(testUser.id);

      // Verify in database
      const db = getTestDB();
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, result.project!.id));
      
      expect(project).toBeDefined();
      expect(project.name).toBe('Test Project');
    });

    it('should create project without description', async () => {
      const formData = new FormData();
      formData.append('projectName', 'Project Without Description');
      formData.append('userId', testUser.id);

      const result = await createProject(formData);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      const { getUserFromAction } = await import('@/lib/utils/get-user-from-action');
      vi.mocked(getUserFromAction).mockResolvedValue({
        user: null,
        userId: null,
      });

      const formData = new FormData();
      formData.append('projectName', 'Test Project');

      const result = await createProject(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });

    it('should handle empty project name', async () => {
      const formData = new FormData();
      formData.append('projectName', '');
      formData.append('userId', testUser.id);

      const result = await createProject(formData);

      // Should either reject or handle gracefully
      expect(result.success).toBe(false);
    });

    it('should generate unique slug for project', async () => {
      const formData1 = new FormData();
      formData1.append('projectName', 'Test Project');
      formData1.append('userId', testUser.id);

      const formData2 = new FormData();
      formData2.append('projectName', 'Test Project');
      formData2.append('userId', testUser.id);

      const result1 = await createProject(formData1);
      const result2 = await createProject(formData2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.project?.slug).not.toBe(result2.project?.slug);
    });

    it('should set default platform to render', async () => {
      const formData = new FormData();
      formData.append('projectName', 'Test Project');
      formData.append('userId', testUser.id);

      const result = await createProject(formData);

      expect(result.success).toBe(true);
      expect(result.project?.platform).toBe('render');
    });
  });
});

