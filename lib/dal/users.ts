import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, desc, sql, inArray } from 'drizzle-orm';
import type { NewUser, User } from '@/lib/db/schema';

export class UsersDAL {
  static async create(user: NewUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  static async getById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  static async getByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  static async update(id: string, updates: Partial<NewUser>): Promise<User | null> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || null;
  }

  static async upsert(user: NewUser): Promise<User> {
    // ✅ OPTIMIZED: Use PostgreSQL INSERT ... ON CONFLICT (upsert) instead of check-then-insert
    // This eliminates the race condition and reduces from 2 queries to 1 query
    try {
      const [upsertedUser] = await db
        .insert(users)
        .values(user)
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: user.name,
            avatar: user.avatar,
            updatedAt: new Date(),
          },
        })
        .returning();
      
      return upsertedUser;
    } catch (error: any) {
      // If conflict occurs, fetch existing user
      // This handles edge cases where ON CONFLICT might not work as expected
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);
      
      if (existingUser) {
        return existingUser;
      }
      
      throw error;
    }
  }

  static async getLatestUsers(limit: number = 10): Promise<User[]> {
    const latestUsers = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(desc(users.createdAt))
      .limit(limit);
    return latestUsers;
  }

  static async getActiveUserCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.isActive, true));
    return result[0]?.count || 0;
  }

  // ✅ OPTIMIZED: Batch operation for getting multiple users by IDs
  static async getByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    
    return await db
      .select()
      .from(users)
      .where(inArray(users.id, ids));
  }
}
