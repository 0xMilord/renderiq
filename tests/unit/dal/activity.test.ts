/**
 * Comprehensive unit tests for ActivityDAL
 * Tests all query operations, edge cases, and optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActivityDAL } from '@/lib/dal/activity';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject, createTestRender, getTestDB } from '../../fixtures/database';
import { renders, galleryItems, userLikes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('ActivityDAL', () => {
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

  describe('getUserActivity', () => {
    it('should return user activity with renders', async () => {
      await createTestRender(testUser.id, testProject.id);
      await createTestRender(testUser.id, testProject.id);

      const activities = await ActivityDAL.getUserActivity(testUser.id);

      expect(activities.length).toBeGreaterThanOrEqual(2);
      const renderActivities = activities.filter(a => a.type === 'render');
      expect(renderActivities.length).toBeGreaterThanOrEqual(2);
    });

    it('should return user activity with likes', async () => {
      const db = getTestDB();
      const render = await createTestRender(testUser.id, testProject.id, {
        status: 'completed',
        outputUrl: 'https://example.com/render.jpg',
      });

      // Create gallery item
      const [galleryItem] = await db.insert(galleryItems).values({
        renderId: render.id,
        userId: testUser.id,
        isPublic: true,
      }).returning();

      // Create like
      const user2 = await createTestUser();
      await db.insert(userLikes).values({
        userId: user2.id,
        galleryItemId: galleryItem.id,
      });

      const activities = await ActivityDAL.getUserActivity(user2.id);

      const likeActivities = activities.filter(a => a.type === 'like');
      expect(likeActivities.length).toBeGreaterThanOrEqual(1);
    });

    it('should combine renders and likes in single timeline', async () => {
      const db = getTestDB();
      const render = await createTestRender(testUser.id, testProject.id, {
        status: 'completed',
        outputUrl: 'https://example.com/render.jpg',
      });

      const [galleryItem] = await db.insert(galleryItems).values({
        renderId: render.id,
        userId: testUser.id,
        isPublic: true,
      }).returning();

      const user2 = await createTestUser();
      await db.insert(userLikes).values({
        userId: user2.id,
        galleryItemId: galleryItem.id,
      });

      const activities = await ActivityDAL.getUserActivity(user2.id);

      expect(activities.length).toBeGreaterThanOrEqual(1);
      expect(activities.some(a => a.type === 'like')).toBe(true);
    });

    it('should order activities by timestamp descending', async () => {
      const render1 = await createTestRender(testUser.id, testProject.id);
      await new Promise(resolve => setTimeout(resolve, 10));
      const render2 = await createTestRender(testUser.id, testProject.id);

      const activities = await ActivityDAL.getUserActivity(testUser.id);

      const renderActivities = activities.filter(a => a.type === 'render');
      expect(renderActivities[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        renderActivities[1].timestamp.getTime()
      );
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await createTestRender(testUser.id, testProject.id);
      }

      const activities = await ActivityDAL.getUserActivity(testUser.id, 5);

      expect(activities.length).toBe(5);
    });

    it('should return empty array for user with no activity', async () => {
      const newUser = await createTestUser();
      const activities = await ActivityDAL.getUserActivity(newUser.id);

      expect(activities).toEqual([]);
    });

    it('should use default limit of 100', async () => {
      for (let i = 0; i < 150; i++) {
        await createTestRender(testUser.id, testProject.id);
      }

      const activities = await ActivityDAL.getUserActivity(testUser.id);

      expect(activities.length).toBe(100);
    });
  });
});



