import { AuthDAL } from '@/lib/dal/auth';
import { AvatarService } from './avatar';
import { logger } from '@/lib/utils/logger';

// Maximum initial credits for new users on signup
const INITIAL_SIGNUP_CREDITS = 10;

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
}

export class UserOnboardingService {
  static async createUserProfile(userProfile: UserProfile) {
    logger.log('👤 UserOnboarding: Creating user profile for:', userProfile.email);
    
    try {
      // Check if user already exists
      const existingUser = await AuthDAL.getUserById(userProfile.id);

      if (existingUser) {
        logger.log('✅ UserOnboarding: User already exists, skipping profile creation');
        return { success: true, data: existingUser };
      }

      // Generate unique avatar if not provided
      let avatarUrl = userProfile.avatar;
      if (!avatarUrl) {
        logger.log('🎨 UserOnboarding: Generating avatar for user:', userProfile.email);
        avatarUrl = AvatarService.generateAvatarFromEmail(userProfile.email, {
          size: 128,
          backgroundColor: ['transparent'],
          backgroundType: ['solid'],
          eyesColor: ['4a90e2', '7b68ee', 'ff6b6b', '4ecdc4', '45b7d1'],
          mouthColor: ['f4a261', 'e76f51', 'd62828', 'f77f00', 'fcbf49'],
          shapeColor: ['f4a261', 'e76f51', 'd62828', 'f77f00', 'fcbf49'],
          radius: 8,
        });
      }

      // Create user profile
      const newUser = await AuthDAL.createUser({
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name || undefined,
        avatar: avatarUrl,
        bio: undefined,
        website: undefined,
        location: undefined,
        isActive: true,
        isAdmin: false,
        emailVerified: false,
        lastLoginAt: undefined,
      });

      logger.log('✅ UserOnboarding: User profile created:', newUser.id);

      // Initialize user credits with initial signup credits (max 10)
      await this.initializeUserCredits(userProfile.id);

      // Create welcome transaction
      await this.createWelcomeTransaction(userProfile.id);

      return { success: true, data: newUser };
    } catch (error) {
      logger.error('❌ UserOnboarding: Failed to create user profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user profile' 
      };
    }
  }

  static async initializeUserCredits(userId: string) {
    logger.log('💰 UserOnboarding: Initializing credits for user:', userId);
    
    try {
      // Check if user already has credits
      const existingCredits = await AuthDAL.getUserCredits(userId);

      if (existingCredits) {
        logger.log('✅ UserOnboarding: User already has credits, skipping initialization');
        return { success: true };
      }

      // Create user credits record with initial signup credits (max 10)
      const userCredit = await AuthDAL.createUserCredits(userId, INITIAL_SIGNUP_CREDITS);

      logger.log('✅ UserOnboarding: User credits initialized:', userCredit.balance);

      return { success: true, data: userCredit };
    } catch (error) {
      logger.error('❌ UserOnboarding: Failed to initialize credits:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize credits' 
      };
    }
  }

  static async createWelcomeTransaction(userId: string) {
    logger.log('🎁 UserOnboarding: Creating welcome transaction for user:', userId);
    
    try {
      // Create welcome bonus transaction
      await AuthDAL.createCreditTransaction(
        userId,
        INITIAL_SIGNUP_CREDITS,
        'bonus',
        `Welcome bonus - ${INITIAL_SIGNUP_CREDITS} free credits to get started!`,
        undefined,
        'bonus'
      );

      logger.log('✅ UserOnboarding: Welcome transaction created');

      return { success: true };
    } catch (error) {
      logger.error('❌ UserOnboarding: Failed to create welcome transaction:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create welcome transaction' 
      };
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    logger.log('🔄 UserOnboarding: Updating user profile for:', userId);
    
    try {
      const updatedUser = await AuthDAL.updateUser(userId, updates);

      logger.log('✅ UserOnboarding: User profile updated:', updatedUser.id);

      return { success: true, data: updatedUser };
    } catch (error) {
      logger.error('❌ UserOnboarding: Failed to update user profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user profile' 
      };
    }
  }

  static async getUserProfile(userId: string) {
    logger.log('🔍 UserOnboarding: Getting user profile for:', userId);
    
    try {
      const user = await AuthDAL.getUserById(userId);

      if (!user) {
        logger.log('❌ UserOnboarding: User not found:', userId);
        return { success: false, error: 'User not found' };
      }

      logger.log('✅ UserOnboarding: User profile retrieved:', user.id);

      return { success: true, data: user };
    } catch (error) {
      logger.error('❌ UserOnboarding: Failed to get user profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get user profile' 
      };
    }
  }
}
