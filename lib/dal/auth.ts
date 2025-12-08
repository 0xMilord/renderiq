import { db } from '@/lib/db';
import { users, userCredits, creditTransactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

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
    logger.log('🔍 AuthDAL: Getting user by ID:', userId);
    
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        logger.log('❌ AuthDAL: User not found:', userId);
        return null;
      }

      logger.log('✅ AuthDAL: User found:', user.id);
      return user;
    } catch (error) {
      console.error('❌ AuthDAL: Error getting user:', error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    logger.log('🔍 AuthDAL: Getting user by email:', email);
    
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        logger.log('❌ AuthDAL: User not found:', email);
        return null;
      }

      logger.log('✅ AuthDAL: User found:', user.id);
      return user;
    } catch (error) {
      console.error('❌ AuthDAL: Error getting user by email:', error);
      throw error;
    }
  }

  static async createUser(userData: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    logger.log('👤 AuthDAL: Creating user:', userData.email);
    
    try {
      const [newUser] = await db
        .insert(users)
        .values({
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      logger.log('✅ AuthDAL: User created:', newUser.id);
      return newUser;
    } catch (error) {
      console.error('❌ AuthDAL: Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): Promise<UserProfile> {
    logger.log('🔄 AuthDAL: Updating user:', userId);
    
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

      logger.log('✅ AuthDAL: User updated:', updatedUser.id);
      return updatedUser;
    } catch (error) {
      console.error('❌ AuthDAL: Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(userId: string): Promise<boolean> {
    logger.log('🗑️ AuthDAL: Deleting user:', userId);
    
    try {
      const result = await db
        .delete(users)
        .where(eq(users.id, userId));

      logger.log('✅ AuthDAL: User deleted:', userId);
      return true;
    } catch (error) {
      console.error('❌ AuthDAL: Error deleting user:', error);
      throw error;
    }
  }

  static async getUserCredits(userId: string): Promise<UserCredits | null> {
    logger.log('💰 AuthDAL: Getting user credits:', userId);
    
    try {
      const [credits] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (!credits) {
        logger.log('❌ AuthDAL: User credits not found:', userId);
        return null;
      }

      logger.log('✅ AuthDAL: User credits found:', credits.balance);
      return credits;
    } catch (error) {
      console.error('❌ AuthDAL: Error getting user credits:', error);
      throw error;
    }
  }

  static async createUserCredits(userId: string, initialBalance: number = 0): Promise<UserCredits> {
    logger.log('💰 AuthDAL: Creating user credits:', userId);
    
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

      logger.log('✅ AuthDAL: User credits created:', newCredits.balance);
      return newCredits;
    } catch (error) {
      console.error('❌ AuthDAL: Error creating user credits:', error);
      throw error;
    }
  }

  static async updateUserCredits(userId: string, updates: Partial<Omit<UserCredits, 'id' | 'userId' | 'createdAt'>>): Promise<UserCredits> {
    logger.log('💰 AuthDAL: Updating user credits:', userId);
    
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

      logger.log('✅ AuthDAL: User credits updated:', updatedCredits.balance);
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
    logger.log('💳 AuthDAL: Creating credit transaction:', userId, amount, type);
    
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

      logger.log('✅ AuthDAL: Credit transaction created');
    } catch (error) {
      console.error('❌ AuthDAL: Error creating credit transaction:', error);
      throw error;
    }
  }

  static async updateLastLogin(userId: string): Promise<void> {
    logger.log('🕐 AuthDAL: Updating last login:', userId);
    
    try {
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      logger.log('✅ AuthDAL: Last login updated');
    } catch (error) {
      console.error('❌ AuthDAL: Error updating last login:', error);
      throw error;
    }
  }

  // ✅ OPTIMIZED: Single query to check both active and admin status
  static async getUserStatus(userId: string): Promise<{ isActive: boolean; isAdmin: boolean }> {
    logger.log('🔍 AuthDAL: Getting user status:', userId);
    
    try {
      const [user] = await db
        .select({
          isActive: users.isActive,
          isAdmin: users.isAdmin,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        logger.log('❌ AuthDAL: User not found:', userId);
        return { isActive: false, isAdmin: false };
      }

      logger.log(`✅ AuthDAL: User status - active: ${user.isActive}, admin: ${user.isAdmin}`);
      return { isActive: user.isActive, isAdmin: user.isAdmin };
    } catch (error) {
      console.error('❌ AuthDAL: Error getting user status:', error);
      return { isActive: false, isAdmin: false };
    }
  }

  static async isUserActive(userId: string): Promise<boolean> {
    logger.log('🔍 AuthDAL: Checking if user is active:', userId);
    
    try {
      // ✅ OPTIMIZED: Use optimized method that only fetches needed fields
      const status = await this.getUserStatus(userId);
      return status.isActive;
    } catch (error) {
      console.error('❌ AuthDAL: Error checking user status:', error);
      return false;
    }
  }

  static async isUserAdmin(userId: string): Promise<boolean> {
    logger.log('🔍 AuthDAL: Checking if user is admin:', userId);
    
    try {
      // ✅ OPTIMIZED: Use optimized method that only fetches needed fields
      const status = await this.getUserStatus(userId);
      return status.isAdmin;
    } catch (error) {
      console.error('❌ AuthDAL: Error checking admin status:', error);
      return false;
    }
  }
}
