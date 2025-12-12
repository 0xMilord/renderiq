/**
 * Render factory functions for tests
 */

import { createTestRender, getTestDB } from './database';
import { renders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { NewRender } from '@/lib/db/schema';

/**
 * Create a test render with default values
 */
export async function createRender(
  userId: string,
  projectId: string,
  data?: Partial<NewRender>
) {
  return await createTestRender(userId, projectId, data);
}

/**
 * Create multiple test renders
 */
export async function createRenders(
  userId: string,
  projectId: string,
  count: number,
  baseData?: Partial<NewRender>
) {
  const renderPromises = Array.from({ length: count }, () =>
    createTestRender(userId, projectId, baseData)
  );
  return Promise.all(renderPromises);
}

/**
 * Create a completed render
 */
export async function createCompletedRender(
  userId: string,
  projectId: string,
  data?: Partial<NewRender>
) {
  return await createTestRender(userId, projectId, {
    ...data,
    status: 'completed',
    outputUrl: data?.outputUrl || 'https://example.com/render.jpg',
    outputKey: data?.outputKey || 'renders/render.jpg',
  });
}

/**
 * Create a failed render
 */
export async function createFailedRender(
  userId: string,
  projectId: string,
  data?: Partial<NewRender>
) {
  return await createTestRender(userId, projectId, {
    ...data,
    status: 'failed',
    errorMessage: data?.errorMessage || 'Render failed',
  });
}

/**
 * Create a video render
 */
export async function createVideoRender(
  userId: string,
  projectId: string,
  data?: Partial<NewRender>
) {
  return await createTestRender(userId, projectId, {
    ...data,
    type: 'video',
    settings: {
      style: 'photorealistic',
      quality: 'high',
      aspectRatio: '16:9',
      duration: 30,
    },
  });
}

/**
 * Get render by ID from database
 */
export async function getRenderById(id: string) {
  const db = getTestDB();
  const [render] = await db
    .select()
    .from(renders)
    .where(eq(renders.id, id))
    .limit(1);
  return render || null;
}



