/**
 * Comprehensive unit tests for AuthDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthDAL } from '@/lib/dal/auth';
import { setupTestDB, teardownTestDB, createTestUser, createTestUserCredits, getTestDB } from '../../fixtures/database';
import { users, userCredits, creditTransactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('AuthDAL', () => {
  beforeEach(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const testUser = await createTestUser();
      
      // ✅ FIXED: Wait for user to be visible in database
      let user = null;
      for (let attempt = 0; attempt < 20; attempt++) {
        user = await AuthDAL.getUserById(testUser.id);
        if (user) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
      expect(user?.email).toBe(testUser.email);
    });

    it('should return null for non-existent user', async () => {
      const user = await AuthDAL.getUserById('00000000-0000-0000-0000-000000000000');
      expect(user).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const testUser = await createTestUser({ email: 'findme@example.com' });
      const user = await AuthDAL.getUserByEmail('findme@example.com');

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUser.id);
    });

    it('should return null for non-existent email', async () => {
      const user = await AuthDAL.getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      // ✅ FIXED: Use randomUUID() instead of hardcoded 'test-id'
      const { randomUUID } = await import('crypto');
      const userData = {
        id: randomUUID(),
        email: 'newuser@example.com',
        name: 'New User',
        isActive: true,
        isAdmin: false,
        emailVerified: false,
      };

      const user = await AuthDAL.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const testUser = await createTestUser();

      const updated = await AuthDAL.updateUser(testUser.id, {
        name: 'Updated Name',
        bio: 'Updated bio',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.bio).toBe('Updated bio');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        AuthDAL.updateUser('00000000-0000-0000-0000-000000000000', {
          name: 'Updated',
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const testUser = await createTestUser();

      const deleted = await AuthDAL.deleteUser(testUser.id);

      expect(deleted).toBe(true);

      const user = await AuthDAL.getUserById(testUser.id);
      expect(user).toBeNull();
    });
  });

  describe('getUserCredits', () => {
    it('should return user credits', async () => {
      const testUser = await createTestUser();
      
      // ✅ FIXED: Verify user exists before creating credits
      const db = getTestDB();
      const verifyUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
      if (verifyUser.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const retryUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
        if (retryUser.length === 0) {
          throw new Error(`User ${testUser.id} not found in database. Test setup failed.`);
        }
      }
      
      await createTestUserCredits(testUser.id, 100);

      const credits = await AuthDAL.getUserCredits(testUser.id);

      expect(credits).toBeDefined();
      expect(credits?.balance).toBe(100);
    });

    it('should return null when user has no credits record', async () => {
      const testUser = await createTestUser();
      const credits = await AuthDAL.getUserCredits(testUser.id);

      expect(credits).toBeNull();
    });
  });

  describe('createUserCredits', () => {
    it('should create user credits with initial balance', async () => {
      const testUser = await createTestUser();

      const credits = await AuthDAL.createUserCredits(testUser.id, 50);

      expect(credits).toBeDefined();
      expect(credits.balance).toBe(50);
      expect(credits.totalEarned).toBe(50);
      expect(credits.totalSpent).toBe(0);
    });

    it('should create credits with zero balance by default', async () => {
      const testUser = await createTestUser();

      // ✅ FIXED: Verify user exists before creating credits (fixes timing issue)
      const db = getTestDB();
      const verifyUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
      if (verifyUser.length === 0) {
        // Retry once if user not visible
        await new Promise(resolve => setTimeout(resolve, 100));
        const retryUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
        if (retryUser.length === 0) {
          throw new Error(`User ${testUser.id} not found in database. Test setup failed.`);
        }
      }

      const credits = await AuthDAL.createUserCredits(testUser.id);

      expect(credits.balance).toBe(0);
    });
  });

  describe('updateUserCredits', () => {
    it('should update user credits', async () => {
      const testUser = await createTestUser();
      
      // ✅ FIXED: Verify user exists before creating credits
      const db = getTestDB();
      const verifyUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
      if (verifyUser.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const retryUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
        if (retryUser.length === 0) {
          throw new Error(`User ${testUser.id} not found in database. Test setup failed.`);
        }
      }
      
      await createTestUserCredits(testUser.id, 100);

      const updated = await AuthDAL.updateUserCredits(testUser.id, {
        balance: 150,
        totalEarned: 200,
      });

      expect(updated.balance).toBe(150);
      expect(updated.totalEarned).toBe(200);
    });

    it('should throw error for non-existent credits', async () => {
      const testUser = await createTestUser();

      await expect(
        AuthDAL.updateUserCredits(testUser.id, {
          balance: 100,
        })
      ).rejects.toThrow();
    });
  });

  describe('createCreditTransaction', () => {
    it('should create credit transaction', async () => {
      const testUser = await createTestUser();

      // ✅ FIXED: Verify user exists before creating transaction (fixes foreign key constraint)
      const db = getTestDB();
      const verifyUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
      if (verifyUser.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const retryUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
        if (retryUser.length === 0) {
          throw new Error(`User ${testUser.id} not found in database. Test setup failed.`);
        }
      }

      await AuthDAL.createCreditTransaction(
        testUser.id,
        100,
        'earned',
        'Test transaction',
        'ref-id',
        'render'
      );

      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, testUser.id));

      expect(transactions.length).toBe(1);
      expect(transactions[0].amount).toBe(100);
      expect(transactions[0].type).toBe('earned');
    });

    it('should create transaction with all types', async () => {
      const testUser = await createTestUser();
      
      // ✅ FIXED: Verify user exists and wait for it to be visible before creating transactions
      const db = getTestDB();
      let verifyUser;
      for (let attempt = 0; attempt < 10; attempt++) {
        verifyUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
        if (verifyUser.length > 0) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!verifyUser || verifyUser.length === 0) {
        throw new Error(`User ${testUser.id} not found in database. Test setup failed.`);
      }
      
      const types = ['earned', 'spent', 'refund', 'bonus'] as const;

      for (const type of types) {
        // ✅ FIXED: Verify user still exists before each transaction (handles timing in loops)
        const userCheck = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
        if (userCheck.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await AuthDAL.createCreditTransaction(
          testUser.id,
          10,
          type,
          `${type} transaction`
        );
      }

      // Wait for all transactions to be visible
      await new Promise(resolve => setTimeout(resolve, 200));

      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, testUser.id));

      expect(transactions.length).toBe(4);
    });
  });

  describe('updateLastLogin', () => {
    it('should update user last login timestamp', async () => {
      const testUser = await createTestUser();
      
      // ✅ FIXED: Verify user exists and is visible before updating last login (fixes user streak creation)
      let dbUser = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        dbUser = await AuthDAL.getUserById(testUser.id);
        if (dbUser) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!dbUser) {
        throw new Error(`User ${testUser.id} not found in database after creation. Test setup failed.`);
      }
      
      const loginTime = new Date();

      await AuthDAL.updateLastLogin(testUser.id);

      // ✅ FIXED: Wait and retry to ensure update is visible
      let updated = null;
      for (let attempt = 0; attempt < 20; attempt++) {
        updated = await AuthDAL.getUserById(testUser.id);
        if (updated?.lastLoginAt) {
          const lastLoginTime = updated.lastLoginAt.getTime();
          if (lastLoginTime >= loginTime.getTime()) {
            break; // Update is visible and correct
          }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(updated).not.toBeNull();
      expect(updated?.lastLoginAt).toBeInstanceOf(Date);
      expect(updated?.lastLoginAt?.getTime()).toBeGreaterThanOrEqual(loginTime.getTime());
    });
  });

  describe('getUserStatus', () => {
    it('should return user active and admin status', async () => {
      const testUser = await createTestUser({ isActive: true, isAdmin: false });

      const status = await AuthDAL.getUserStatus(testUser.id);

      expect(status.isActive).toBe(true);
      expect(status.isAdmin).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const status = await AuthDAL.getUserStatus('00000000-0000-0000-0000-000000000000');

      expect(status.isActive).toBe(false);
      expect(status.isAdmin).toBe(false);
    });
  });

  describe('isUserActive', () => {
    it('should return true for active user', async () => {
      const testUser = await createTestUser({ isActive: true });

      const isActive = await AuthDAL.isUserActive(testUser.id);

      expect(isActive).toBe(true);
    });

    it('should return false for inactive user', async () => {
      const testUser = await createTestUser({ isActive: false });

      const isActive = await AuthDAL.isUserActive(testUser.id);

      expect(isActive).toBe(false);
    });
  });

  describe('isUserAdmin', () => {
    it('should return true for admin user', async () => {
      const testUser = await createTestUser({ isAdmin: true });

      const isAdmin = await AuthDAL.isUserAdmin(testUser.id);

      expect(isAdmin).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      const testUser = await createTestUser({ isAdmin: false });

      const isAdmin = await AuthDAL.isUserAdmin(testUser.id);

      expect(isAdmin).toBe(false);
    });
  });
});








