import { db } from '@/lib/db';
import { users, userCredits, creditTransactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  isActive: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredits {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastResetAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthDAL {
  static async getUserById(userId: string): Promise<UserProfile | null> {
    console.log('🔍 AuthDAL: Getting user by ID:', userId);
    
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        console.log('❌ AuthDAL: User not found:', userId);
        return null;
      }

      console.log('✅ AuthDAL: User found:', user.id);
      return user;
    } catch (error) {
      console.error('❌ AuthDAL: Error getting user:', error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    console.log('🔍 AuthDAL: Getting user by email:', email);
    
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        console.log('❌ AuthDAL: User not found:', email);
        return null;
      }

      console.log('✅ AuthDAL: User found:', user.id);
      return user;
    } catch (error) {
      console.error('❌ AuthDAL: Error getting user by email:', error);
      throw error;
    }
  }

  static async createUser(userData: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    console.log('👤 AuthDAL: Creating user:', userData.email);
    
    try {
      const [newUser] = await db
        .insert(users)
        .values({
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log('✅ AuthDAL: User created:', newUser.id);
      return newUser;
    } catch (error) {
      console.error('❌ AuthDAL: Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): Promise<UserProfile> {
    console.log('🔄 AuthDAL: Updating user:', userId);
    
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      console.log('✅ AuthDAL: User updated:', updatedUser.id);
      return updatedUser;
    } catch (error) {
      console.error('❌ AuthDAL: Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(userId: string): Promise<boolean> {
    console.log('🗑️ AuthDAL: Deleting user:', userId);
    
    try {
      const result = await db
        .delete(users)
        .where(eq(users.id, userId));

      console.log('✅ AuthDAL: User deleted:', userId);
      return true;
    } catch (error) {
      console.error('❌ AuthDAL: Error deleting user:', error);
      throw error;
    }
  }

  static async getUserCredits(userId: string): Promise<UserCredits | null> {
    console.log('💰 AuthDAL: Getting user credits:', userId);
    
    try {
      const [credits] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (!credits) {
        console.log('❌ AuthDAL: User credits not found:', userId);
        return null;
      }

      console.log('✅ AuthDAL: User credits found:', credits.balance);
      return credits;
    } catch (error) {
      console.error('❌ AuthDAL: Error getting user credits:', error);
      throw error;
    }
  }

  static async createUserCredits(userId: string, initialBalance: number = 0): Promise<UserCredits> {
    console.log('💰 AuthDAL: Creating user credits:', userId);
    
    try {
      const [newCredits] = await db
        .insert(userCredits)
        .values({
          userId,
          balance: initialBalance,
          totalEarned: initialBalance,
          totalSpent: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log('✅ AuthDAL: User credits created:', newCredits.balance);
      return newCredits;
    } catch (error) {
      console.error('❌ AuthDAL: Error creating user credits:', error);
      throw error;
    }
  }

  static async updateUserCredits(userId: string, updates: Partial<Omit<UserCredits, 'id' | 'userId' | 'createdAt'>>): Promise<UserCredits> {
    console.log('💰 AuthDAL: Updating user credits:', userId);
    
    try {
      const [updatedCredits] = await db
        .update(userCredits)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId))
        .returning();

      if (!updatedCredits) {
        throw new Error('User credits not found');
      }

      console.log('✅ AuthDAL: User credits updated:', updatedCredits.balance);
      return updatedCredits;
    } catch (error) {
      console.error('❌ AuthDAL: Error updating user credits:', error);
      throw error;
    }
  }

  static async createCreditTransaction(
    userId: string,
    amount: number,
    type: 'earned' | 'spent' | 'refund' | 'bonus',
    description: string,
    referenceId?: string,
    referenceType?: 'render' | 'subscription' | 'bonus' | 'refund'
  ): Promise<void> {
    console.log('💳 AuthDAL: Creating credit transaction:', userId, amount, type);
    
    try {
      await db
        .insert(creditTransactions)
        .values({
          userId,
          amount,
          type,
          description,
          referenceId,
          referenceType,
          createdAt: new Date(),
        });

      console.log('✅ AuthDAL: Credit transaction created');
    } catch (error) {
      console.error('❌ AuthDAL: Error creating credit transaction:', error);
      throw error;
    }
  }

  static async updateLastLogin(userId: string): Promise<void> {
    console.log('🕐 AuthDAL: Updating last login:', userId);
    
    try {
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log('✅ AuthDAL: Last login updated');
    } catch (error) {
      console.error('❌ AuthDAL: Error updating last login:', error);
      throw error;
    }
  }

  static async isUserActive(userId: string): Promise<boolean> {
    console.log('🔍 AuthDAL: Checking if user is active:', userId);
    
    try {
      const user = await this.getUserById(userId);
      return user?.isActive ?? false;
    } catch (error) {
      console.error('❌ AuthDAL: Error checking user status:', error);
      return false;
    }
  }

  static async isUserAdmin(userId: string): Promise<boolean> {
    console.log('🔍 AuthDAL: Checking if user is admin:', userId);
    
    try {
      const user = await this.getUserById(userId);
      return user?.isAdmin ?? false;
    } catch (error) {
      console.error('❌ AuthDAL: Error checking admin status:', error);
      return false;
    }
  }
}
