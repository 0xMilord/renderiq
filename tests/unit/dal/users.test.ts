/**
 * Comprehensive unit tests for UsersDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UsersDAL } from '@/lib/dal/users';
import { setupTestDB, teardownTestDB, createTestUser, getTestDB } from '../../fixtures/database';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('UsersDAL', () => {
  beforeEach(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        id: 'test-user-id',
        email: 'newuser@example.com',
        name: 'New User',
        isActive: true,
        isAdmin: false,
        emailVerified: false,
      };

      const user = await UsersDAL.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBe(userData.id);
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
    });

    it('should create user with all optional fields', async () => {
      const userData = {
        id: 'test-user-id-2',
        email: 'fulluser@example.com',
        name: 'Full User',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'User bio',
        website: 'https://example.com',
        location: 'New York',
        isActive: true,
        isAdmin: false,
        emailVerified: true,
      };

      const user = await UsersDAL.create(userData);

      expect(user.avatar).toBe(userData.avatar);
      expect(user.bio).toBe(userData.bio);
      expect(user.website).toBe(userData.website);
      expect(user.location).toBe(userData.location);
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const testUser = await createTestUser();
      const user = await UsersDAL.getById(testUser.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
      expect(user?.email).toBe(testUser.email);
    });

    it('should return null for non-existent user', async () => {
      const user = await UsersDAL.getById('00000000-0000-0000-0000-000000000000');
      expect(user).toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('should return user by email', async () => {
      const testUser = await createTestUser({ email: 'findme@example.com' });
      const user = await UsersDAL.getByEmail('findme@example.com');

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
    });

    it('should return null for non-existent email', async () => {
      const user = await UsersDAL.getByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const testUser = await createTestUser();

      const updated = await UsersDAL.update(testUser.id, {
        name: 'Updated Name',
        bio: 'Updated bio',
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.bio).toBe('Updated bio');
    });

    it('should update single field', async () => {
      const testUser = await createTestUser();

      const updated = await UsersDAL.update(testUser.id, {
        name: 'New Name',
      });

      expect(updated?.name).toBe('New Name');
    });

    it('should update updatedAt timestamp', async () => {
      const testUser = await createTestUser();
      const originalUpdatedAt = testUser.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await UsersDAL.update(testUser.id, {
        name: 'Updated',
      });

      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should return null for non-existent user', async () => {
      const updated = await UsersDAL.update('00000000-0000-0000-0000-000000000000', {
        name: 'Updated',
      });

      expect(updated).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should create user if not exists', async () => {
      const userData = {
        id: 'upsert-user-id',
        email: 'upsert@example.com',
        name: 'Upsert User',
        isActive: true,
        isAdmin: false,
        emailVerified: false,
      };

      const user = await UsersDAL.upsert(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it('should update user if exists', async () => {
      const testUser = await createTestUser({ email: 'upsert-existing@example.com' });

      const updated = await UsersDAL.upsert({
        id: testUser.id,
        email: testUser.email,
        name: 'Updated Name',
        isActive: true,
        isAdmin: false,
        emailVerified: false,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.id).toBe(testUser.id);
    });

    it('should handle concurrent upserts', async () => {
      const userData = {
        id: 'concurrent-user-id',
        email: 'concurrent@example.com',
        name: 'Concurrent User',
        isActive: true,
        isAdmin: false,
        emailVerified: false,
      };

      // Simulate concurrent upserts
      const [user1, user2] = await Promise.all([
        UsersDAL.upsert(userData),
        UsersDAL.upsert(userData),
      ]);

      // Both should succeed and return the same user
      expect(user1.id).toBe(user2.id);
      expect(user1.email).toBe(user2.email);
    });
  });

  describe('getLatestUsers', () => {
    it('should return latest active users', async () => {
      await createTestUser({ isActive: true });
      await createTestUser({ isActive: true });
      await createTestUser({ isActive: true });

      const latestUsers = await UsersDAL.getLatestUsers(5);

      expect(latestUsers.length).toBeGreaterThanOrEqual(3);
      expect(latestUsers.every(u => u.isActive)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await createTestUser({ isActive: true });
      }

      const latestUsers = await UsersDAL.getLatestUsers(5);

      expect(latestUsers.length).toBe(5);
    });

    it('should exclude inactive users', async () => {
      await createTestUser({ isActive: true });
      await createTestUser({ isActive: false });
      await createTestUser({ isActive: true });

      const latestUsers = await UsersDAL.getLatestUsers(10);

      expect(latestUsers.every(u => u.isActive)).toBe(true);
    });

    it('should order by createdAt descending', async () => {
      const user1 = await createTestUser({ isActive: true });
      await new Promise(resolve => setTimeout(resolve, 10));
      const user2 = await createTestUser({ isActive: true });

      const latestUsers = await UsersDAL.getLatestUsers(10);

      expect(latestUsers[0].id).toBe(user2.id);
      expect(latestUsers[1].id).toBe(user1.id);
    });

    it('should use default limit of 10', async () => {
      for (let i = 0; i < 15; i++) {
        await createTestUser({ isActive: true });
      }

      const latestUsers = await UsersDAL.getLatestUsers();

      expect(latestUsers.length).toBe(10);
    });
  });

  describe('getActiveUserCount', () => {
    it('should return count of active users', async () => {
      await createTestUser({ isActive: true });
      await createTestUser({ isActive: true });
      await createTestUser({ isActive: false });

      const count = await UsersDAL.getActiveUserCount();

      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('should return 0 when no active users exist', async () => {
      await createTestUser({ isActive: false });
      await createTestUser({ isActive: false });

      const count = await UsersDAL.getActiveUserCount();

      expect(count).toBe(0);
    });
  });

  describe('getByIds', () => {
    it('should return multiple users by ids', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const user3 = await createTestUser();

      const users = await UsersDAL.getByIds([user1.id, user2.id, user3.id]);

      expect(users.length).toBe(3);
      expect(users.map(u => u.id).sort()).toEqual([user1.id, user2.id, user3.id].sort());
    });

    it('should return empty array for empty ids', async () => {
      const users = await UsersDAL.getByIds([]);
      expect(users).toEqual([]);
    });

    it('should return only existing users', async () => {
      const user1 = await createTestUser();
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const users = await UsersDAL.getByIds([user1.id, nonExistentId]);

      expect(users.length).toBe(1);
      expect(users[0].id).toBe(user1.id);
    });

    it('should handle large batch of ids', async () => {
      const userIds: string[] = [];
      for (let i = 0; i < 50; i++) {
        const user = await createTestUser();
        userIds.push(user.id);
      }

      const users = await UsersDAL.getByIds(userIds);

      expect(users.length).toBe(50);
    });
  });
});
