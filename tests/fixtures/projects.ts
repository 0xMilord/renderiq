/**
 * Project factory functions for tests
 */

import { createTestProject, getTestDB } from './database';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { NewProject } from '@/lib/db/schema';

/**
 * Create a test project with default values
 */
export async function createProject(userId: string, data?: Partial<NewProject>) {
  return await createTestProject(userId, data);
}

/**
 * Create multiple test projects for a user
 */
export async function createProjects(userId: string, count: number, baseData?: Partial<NewProject>) {
  const projectPromises = Array.from({ length: count }, (_, i) =>
    createTestProject(userId, {
      ...baseData,
      name: baseData?.name || `Test Project ${i}`,
    })
  );
  return Promise.all(projectPromises);
}

/**
 * Create a public project
 */
export async function createPublicProject(userId: string, data?: Partial<NewProject>) {
  return await createTestProject(userId, {
    ...data,
    isPublic: true,
  });
}

/**
 * Create a project for tools platform
 */
export async function createToolsProject(userId: string, data?: Partial<NewProject>) {
  return await createTestProject(userId, {
    ...data,
    platform: 'tools',
  });
}

/**
 * Create a project for canvas platform
 */
export async function createCanvasProject(userId: string, data?: Partial<NewProject>) {
  return await createTestProject(userId, {
    ...data,
    platform: 'canvas',
  });
}

/**
 * Get project by slug from database
 */
export async function getProjectBySlug(slug: string) {
  const db = getTestDB();
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);
  return project || null;
}







