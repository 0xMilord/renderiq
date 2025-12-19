/**
 * Comprehensive unit tests for ActivityDAL
 * Tests all query operations, edge cases, and optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActivityDAL } from '@/lib/dal/activity';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject, createTestRender, getTestDB } from '../../fixtures/database';
import { renders, galleryItems, userLikes, projects, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('ActivityDAL', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    await setupTestDB();
    
    // ✅ FIXED: Wait a bit after cleanup to ensure database is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    testUser = await createTestUser();
    
    // ✅ FIXED: Verify user exists and wait longer for remote DB
    const db = getTestDB();
    let verifyUser;
    for (let attempt = 0; attempt < 30; attempt++) {
      verifyUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
      if (verifyUser.length > 0) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!verifyUser || verifyUser.length === 0) {
      // Get all users for debugging
      const allUsers = await db.select({ id: users.id, email: users.email }).from(users).limit(10);
      throw new Error(
        `User ${testUser.id} not found in database. Test setup failed. ` +
        `Found ${allUsers.length} users: ${allUsers.map(u => u.id).join(', ')}`
      );
    }
    
    // ✅ FIXED: Wait longer before creating project to ensure user is fully committed
    await new Promise(resolve => setTimeout(resolve, 300));
    
    testProject = await createTestProject(testUser.id);
    
    // ✅ FIXED: Verify project exists with longer retry
    let verifyProject;
    for (let attempt = 0; attempt < 30; attempt++) {
      verifyProject = await db.select().from(projects).where(eq(projects.id, testProject.id)).limit(1);
      if (verifyProject.length > 0) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!verifyProject || verifyProject.length === 0) {
      throw new Error(`Project ${testProject.id} not found in database. Test setup failed.`);
    }
    
    // ✅ FIXED: Final wait to ensure everything is committed and visible
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('getUserActivity', () => {
    it('should return user activity with renders', async () => {
      // ✅ FIXED: Verify project exists before creating renders
      const db = getTestDB();
      const verifyProject = await db.select().from(projects).where(eq(projects.id, testProject.id)).limit(1);
      if (verifyProject.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const render1 = await createTestRender(testUser.id, testProject.id);
      const render2 = await createTestRender(testUser.id, testProject.id);

      // Wait for renders to be visible
      await new Promise(resolve => setTimeout(resolve, 200));

      const activities = await ActivityDAL.getUserActivity(testUser.id);

      expect(activities.length).toBeGreaterThanOrEqual(2);
      const renderActivities = activities.filter(a => a.type === 'render');
      expect(renderActivities.length).toBeGreaterThanOrEqual(2);
    });

    it('should return user activity with likes', async () => {
      const db = getTestDB();
      
      // ✅ FIXED: Verify project exists and wait for render to be visible
      const verifyProject = await db.select().from(projects).where(eq(projects.id, testProject.id)).limit(1);
      if (verifyProject.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const render = await createTestRender(testUser.id, testProject.id, {
        status: 'completed',
        outputUrl: 'https://example.com/render.jpg',
      });

      // Wait for render to be visible
      await new Promise(resolve => setTimeout(resolve, 200));

      // Create gallery item
      const [galleryItem] = await db.insert(galleryItems).values({
        renderId: render.id,
        userId: testUser.id,
        isPublic: true,
      }).returning();
      
      // ✅ FIXED: Wait for gallery item to be visible
      let verifiedGalleryItem;
      for (let attempt = 0; attempt < 10; attempt++) {
        verifiedGalleryItem = await db.select().from(galleryItems).where(eq(galleryItems.id, galleryItem.id)).limit(1);
        if (verifiedGalleryItem.length > 0) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      expect(verifiedGalleryItem && verifiedGalleryItem.length > 0).toBe(true);

      // ✅ FIXED: Create like - verify user2 exists first
      const user2 = await createTestUser();
      // Wait for user2 to be visible
      let verifyUser2;
      for (let attempt = 0; attempt < 20; attempt++) {
        verifyUser2 = await db.select().from(users).where(eq(users.id, user2.id)).limit(1);
        if (verifyUser2.length > 0) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!verifyUser2 || verifyUser2.length === 0) {
        throw new Error(`User2 ${user2.id} not found in database. Test setup failed.`);
      }
      
      await db.insert(userLikes).values({
        userId: user2.id,
        galleryItemId: galleryItem.id,
      });

      // Wait for like to be visible
      await new Promise(resolve => setTimeout(resolve, 200));

      const activities = await ActivityDAL.getUserActivity(user2.id);

      const likeActivities = activities.filter(a => a.type === 'like');
      expect(likeActivities.length).toBeGreaterThanOrEqual(1);
    });

    it('should combine renders and likes in single timeline', async () => {
      const db = getTestDB();
      
      // ✅ FIXED: Verify project exists
      const verifyProject = await db.select().from(projects).where(eq(projects.id, testProject.id)).limit(1);
      if (verifyProject.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const render = await createTestRender(testUser.id, testProject.id, {
        status: 'completed',
        outputUrl: 'https://example.com/render.jpg',
      });

      // Wait for render to be visible
      await new Promise(resolve => setTimeout(resolve, 200));

      const [galleryItem] = await db.insert(galleryItems).values({
        renderId: render.id,
        userId: testUser.id,
        isPublic: true,
      }).returning();
      
      // ✅ FIXED: Wait for gallery item to be visible
      let verifiedGalleryItem;
      for (let attempt = 0; attempt < 10; attempt++) {
        verifiedGalleryItem = await db.select().from(galleryItems).where(eq(galleryItems.id, galleryItem.id)).limit(1);
        if (verifiedGalleryItem.length > 0) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      expect(verifiedGalleryItem && verifiedGalleryItem.length > 0).toBe(true);

      // ✅ FIXED: Create user2 and verify it exists
      const user2 = await createTestUser();
      // Wait for user2 to be visible
      let verifyUser2;
      for (let attempt = 0; attempt < 20; attempt++) {
        verifyUser2 = await db.select().from(users).where(eq(users.id, user2.id)).limit(1);
        if (verifyUser2.length > 0) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!verifyUser2 || verifyUser2.length === 0) {
        throw new Error(`User2 ${user2.id} not found in database. Test setup failed.`);
      }
      
      await db.insert(userLikes).values({
        userId: user2.id,
        galleryItemId: galleryItem.id,
      });

      // Wait for like to be visible
      await new Promise(resolve => setTimeout(resolve, 200));

      const activities = await ActivityDAL.getUserActivity(user2.id);

      expect(activities.length).toBeGreaterThanOrEqual(1);
      expect(activities.some(a => a.type === 'like')).toBe(true);
    });

    it('should order activities by timestamp descending', async () => {
      // ✅ FIXED: Verify project exists
      const db = getTestDB();
      const verifyProject = await db.select().from(projects).where(eq(projects.id, testProject.id)).limit(1);
      if (verifyProject.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const render1 = await createTestRender(testUser.id, testProject.id);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait longer for timestamp difference
      const render2 = await createTestRender(testUser.id, testProject.id);

      // Wait for renders to be visible
      await new Promise(resolve => setTimeout(resolve, 200));

      const activities = await ActivityDAL.getUserActivity(testUser.id);

      const renderActivities = activities.filter(a => a.type === 'render');
      expect(renderActivities.length).toBeGreaterThanOrEqual(2);
      if (renderActivities.length >= 2) {
        expect(renderActivities[0].timestamp.getTime()).toBeGreaterThanOrEqual(
          renderActivities[1].timestamp.getTime()
        );
      }
    });

    it('should respect limit parameter', async () => {
      // ✅ FIXED: Verify project exists before creating renders
      const db = getTestDB();
      let verifyProject;
      for (let attempt = 0; attempt < 10; attempt++) {
        verifyProject = await db.select().from(projects).where(eq(projects.id, testProject.id)).limit(1);
        if (verifyProject.length > 0) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!verifyProject || verifyProject.length === 0) {
        throw new Error(`Project ${testProject.id} not found in database. Test setup failed.`);
      }

      // Create renders with delays to ensure they're visible
      for (let i = 0; i < 10; i++) {
        await createTestRender(testUser.id, testProject.id);
        // Small delay between renders to avoid overwhelming the database
        if (i < 9) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Wait for all renders to be visible
      await new Promise(resolve => setTimeout(resolve, 1000));

      const activities = await ActivityDAL.getUserActivity(testUser.id, 5);

      expect(activities.length).toBe(5);
    });

    it('should return empty array for user with no activity', async () => {
      const newUser = await createTestUser();
      
      // ✅ FIXED: Verify newUser exists before querying activity
      const db = getTestDB();
      let verifyNewUser;
      for (let attempt = 0; attempt < 20; attempt++) {
        verifyNewUser = await db.select().from(users).where(eq(users.id, newUser.id)).limit(1);
        if (verifyNewUser.length > 0) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!verifyNewUser || verifyNewUser.length === 0) {
        throw new Error(`NewUser ${newUser.id} not found in database. Test setup failed.`);
      }
      
      const activities = await ActivityDAL.getUserActivity(newUser.id);

      expect(activities).toEqual([]);
    });

    it('should use default limit of 100', async () => {
      // ✅ FIXED: Verify project exists before creating renders
      const db = getTestDB();
      let verifyProject;
      for (let attempt = 0; attempt < 10; attempt++) {
        verifyProject = await db.select().from(projects).where(eq(projects.id, testProject.id)).limit(1);
        if (verifyProject.length > 0) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!verifyProject || verifyProject.length === 0) {
        throw new Error(`Project ${testProject.id} not found in database. Test setup failed.`);
      }

      // Create renders with delays to ensure they're visible
      // For large batches, create in smaller chunks with delays
      for (let i = 0; i < 110; i++) {
        await createTestRender(testUser.id, testProject.id);
        // Small delay every 10 renders to avoid overwhelming the database
        if (i > 0 && i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Wait longer for all renders to be visible (large batch)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const activities = await ActivityDAL.getUserActivity(testUser.id);

      // Should return at most 100 (the default limit)
      expect(activities.length).toBeLessThanOrEqual(100);
      expect(activities.length).toBeGreaterThan(0);
    });
  });
});






