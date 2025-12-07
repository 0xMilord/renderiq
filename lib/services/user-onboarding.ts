import { AuthDAL } from '@/lib/dal/auth';
import { AvatarService } from './avatar';
import { logger } from '@/lib/utils/logger';
import { SybilDetectionService, DeviceFingerprintInput } from './sybil-detection';
import { getClientIdentifier } from '@/lib/utils/rate-limit';
import { generateFingerprintHash } from '@/lib/utils/device-fingerprint';

// Maximum initial credits for new users on signup (trusted users)
const INITIAL_SIGNUP_CREDITS = 10;

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
}

export interface UserOnboardingContext {
  deviceFingerprint?: DeviceFingerprintInput;
  request?: Request;
  ipAddress?: string;
}

export class UserOnboardingService {
  static async createUserProfile(
    userProfile: UserProfile,
    context?: UserOnboardingContext
  ) {
    logger.log('👤 UserOnboarding: Creating user profile for:', userProfile.email);
    
    try {
      // Check if user already exists
      const existingUser = await AuthDAL.getUserById(userProfile.id);

      if (existingUser) {
        logger.log('✅ UserOnboarding: User already exists, skipping profile creation');
        return { success: true, data: existingUser };
      }

      // Run sybil detection if device fingerprint is available
      let sybilResult;
      let creditsToAward = INITIAL_SIGNUP_CREDITS; // Default to 10 credits
      let ipAddress: string | undefined;
      let userAgent: string | undefined;

      if (context?.deviceFingerprint && context?.request) {
        try {
          ipAddress = context.ipAddress || getClientIdentifier(context.request);
          userAgent = context.request.headers.get('user-agent') || '';

          sybilResult = await SybilDetectionService.detectSybil(
            userProfile.id,
            userProfile.email,
            context.deviceFingerprint,
            ipAddress,
            context.request.headers
          );

          // Use recommended credits from sybil detection (defaults to 10 if detection fails)
          creditsToAward = sybilResult.recommendedCredits || INITIAL_SIGNUP_CREDITS;
        } catch (error) {
          // If sybil detection fails, log but ALWAYS continue with default credits
          logger.error('❌ UserOnboarding: Sybil detection failed, using default credits:', error);
          creditsToAward = INITIAL_SIGNUP_CREDITS; // Always give 10 credits if detection fails
        }
      } else {
        // No fingerprint available - give default credits and log warning
        logger.warn('⚠️ UserOnboarding: No device fingerprint available, awarding default credits');
        creditsToAward = INITIAL_SIGNUP_CREDITS;
      }

      // Log sybil detection result if available
      if (sybilResult) {
        logger.log('🔍 UserOnboarding: Sybil detection result', {
          riskScore: sybilResult.riskScore,
          riskLevel: sybilResult.riskLevel,
          creditsToAward,
          isSuspicious: sybilResult.isSuspicious,
        });

        // Log warning for critical risk users (they get 0 credits but can still sign up)
        if (sybilResult.riskLevel === 'critical') {
          logger.warn('⚠️ UserOnboarding: Critical risk user - allowing signup with 0 credits', {
            userId: userProfile.id,
            email: userProfile.email,
            reasons: sybilResult.reasons,
          });
        }

        // Record signup activity if we have fingerprint data
        if (context?.deviceFingerprint && ipAddress && userAgent) {
          const fingerprintHash = generateFingerprintHash(context.deviceFingerprint);
          await SybilDetectionService.recordActivity(
            userProfile.id,
            'signup',
            ipAddress,
            userAgent,
            fingerprintHash
          );
        }
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

      // CRITICAL: Always initialize user credits (even if 0 from sybil detection)
      // This ensures user has a credits record in the database
      const creditsResult = await this.initializeUserCredits(userProfile.id, creditsToAward);
      if (!creditsResult.success) {
        logger.error('❌ UserOnboarding: Failed to initialize credits, retrying with default:', creditsResult.error);
        // Retry with default credits if initialization failed
        await this.initializeUserCredits(userProfile.id, INITIAL_SIGNUP_CREDITS);
      }

      // Create welcome transaction (only if credits > 0)
      if (creditsToAward > 0) {
        await this.createWelcomeTransaction(userProfile.id, creditsToAward, sybilResult);
      } else {
        logger.log('⚠️ UserOnboarding: No credits awarded, skipping welcome transaction');
      }

      return {
        success: true,
        data: newUser,
        sybilDetection: sybilResult,
      };
    } catch (error) {
      logger.error('❌ UserOnboarding: Failed to create user profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user profile' 
      };
    }
  }

  static async initializeUserCredits(userId: string, credits: number = INITIAL_SIGNUP_CREDITS) {
    logger.log('💰 UserOnboarding: Initializing credits for user:', userId, 'Credits:', credits);
    
    try {
      // Check if user already has credits
      const existingCredits = await AuthDAL.getUserCredits(userId);

      if (existingCredits) {
        logger.log('✅ UserOnboarding: User already has credits, skipping initialization');
        return { success: true };
      }

      // Create user credits record with sybil-adjusted credits
      const userCredit = await AuthDAL.createUserCredits(userId, credits);

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

  static async createWelcomeTransaction(
    userId: string,
    credits: number = INITIAL_SIGNUP_CREDITS,
    sybilResult?: { riskLevel: string; reasons: string[] }
  ) {
    logger.log('🎁 UserOnboarding: Creating welcome transaction for user:', userId);
    
    try {
      let description = `Welcome bonus - ${credits} free credits to get started!`;
      
      // Add note if credits were reduced due to sybil detection
      if (sybilResult && credits < INITIAL_SIGNUP_CREDITS) {
        if (credits === 0) {
          description = `Account created successfully. Credits not awarded due to account verification requirements. Please contact support if you believe this is an error.`;
        } else {
          description += ` (Reduced due to account verification requirements)`;
        }
      }

      // Create welcome bonus transaction
      await AuthDAL.createCreditTransaction(
        userId,
        credits,
        'bonus',
        description,
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

      // Invalidate auth cache after profile update
      const { invalidateUserCache } = await import('@/lib/services/auth-cache');
      await invalidateUserCache(userId);

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
