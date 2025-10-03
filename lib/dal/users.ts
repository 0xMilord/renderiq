import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email));

    if (existingUser) {
      return existingUser;
    }

    return this.create(user);
  }
}
