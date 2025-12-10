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
      // ✅ FIXED: Better race condition handling - check both ID and email first
      // This prevents duplicate creation when multiple requests come in simultaneously
      let existingUser = await AuthDAL.getUserById(userProfile.id);
      
      if (!existingUser) {
        // Also check by email in case user was created with different ID
        existingUser = await AuthDAL.getUserByEmail(userProfile.email);
      }

      if (existingUser) {
        logger.log('✅ UserOnboarding: User already exists, skipping profile creation');
        // ✅ Ensure credits exist even if user already exists (legacy users)
        const existingCredits = await AuthDAL.getUserCredits(existingUser.id);
        if (!existingCredits) {
          logger.log('💰 UserOnboarding: User exists but no credits, initializing default credits');
          await this.initializeUserCredits(existingUser.id, INITIAL_SIGNUP_CREDITS);
        }
        return { success: true, data: existingUser };
      }

      // Generate unique avatar if not provided (do this before creating user)
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

      // CRITICAL: Create user profile FIRST before running sybil detection
      // This ensures the user exists in the database before we try to store device fingerprints
      let newUser: UserProfile;
      try {
        newUser = await AuthDAL.createUser({
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
      } catch (error) {
        // Handle duplicate user creation (race condition or user created between checks)
        if (error instanceof Error && error.message.includes('duplicate key') || 
            (error as any)?.cause?.code === '23505') {
          logger.warn('⚠️ UserOnboarding: User already exists (duplicate key), fetching existing user');
          // Try to get the existing user
          existingUser = await AuthDAL.getUserByEmail(userProfile.email);
          if (existingUser) {
            logger.log('✅ UserOnboarding: Found existing user, skipping profile creation');
            return { success: true, data: existingUser };
          }
          // If we still can't find it, rethrow the error
          throw error;
        }
        throw error;
      }

      // NOW run sybil detection AFTER user is created (so foreign keys exist)
      let sybilResult;
      let creditsToAward = INITIAL_SIGNUP_CREDITS; // Default to 10 credits
      let ipAddress: string | undefined;
      let userAgent: string | undefined;

      if (context?.deviceFingerprint && context?.request) {
        try {
          ipAddress = context.ipAddress || getClientIdentifier(context.request);
          userAgent = context.request.headers.get('user-agent') || '';

          sybilResult = await SybilDetectionService.detectSybil(
            newUser.id,
            newUser.email,
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
            userId: newUser.id,
            email: newUser.email,
            reasons: sybilResult.reasons,
          });
        }

        // Record signup activity if we have fingerprint data
        if (context?.deviceFingerprint && ipAddress && userAgent) {
          const fingerprintHash = generateFingerprintHash(context.deviceFingerprint);
          await SybilDetectionService.recordActivity(
            newUser.id,
            'signup',
            ipAddress,
            userAgent,
            fingerprintHash
          );
        }
      }

      // CRITICAL: Always initialize user credits (even if 0 from sybil detection)
      // This ensures user has a credits record in the database
      const creditsResult = await this.initializeUserCredits(newUser.id, creditsToAward);
      if (!creditsResult.success) {
        logger.error('❌ UserOnboarding: Failed to initialize credits, retrying with default:', creditsResult.error);
        // Retry with default credits if initialization failed
        await this.initializeUserCredits(newUser.id, INITIAL_SIGNUP_CREDITS);
      }

      // Create welcome transaction (only if credits > 0)
      if (creditsToAward > 0) {
        await this.createWelcomeTransaction(newUser.id, creditsToAward, sybilResult);
      } else {
        logger.log('⚠️ UserOnboarding: No credits awarded, skipping welcome transaction');
      }

      // Send welcome email
      try {
        const { sendWelcomeEmail } = await import('@/lib/services/email.service');
        await sendWelcomeEmail({
          name: newUser.name || 'User',
          email: newUser.email,
          subject: 'Welcome to Renderiq!',
          content: '',
        });
      } catch (error) {
        logger.error('❌ UserOnboarding: Failed to send welcome email:', error);
        // Don't fail profile creation if email fails
      }

      // Track ambassador referral if present
      if (context?.request) {
        try {
          const cookies = context.request.headers.get('cookie') || '';
          const ambassadorRefMatch = cookies.match(/ambassador_ref=([^;]+)/);
          if (ambassadorRefMatch) {
            const referralCode = ambassadorRefMatch[1];
            logger.log('🔗 UserOnboarding: Tracking ambassador referral:', referralCode);
            
            // Import here to avoid circular dependency
            const { AmbassadorService } = await import('./ambassador.service');
            await AmbassadorService.trackSignup(referralCode, newUser.id);
          }
        } catch (error) {
          logger.warn('⚠️ UserOnboarding: Failed to track ambassador referral:', error);
          // Don't fail user creation if referral tracking fails
        }
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
      // ✅ OPTIMIZED: Use billing service which already has upsert pattern (2 queries → 1)
      const { BillingService } = await import('./billing');
      const creditsResult = await BillingService.getUserCredits(userId);
      
      if (creditsResult.success && creditsResult.credits) {
        logger.log('✅ UserOnboarding: User already has credits, skipping initialization');
        return { success: true };
      }

      // If credits don't exist, add them using billing service (uses upsert internally)
      if (credits > 0) {
        const addCreditsResult = await BillingService.addCredits(
          userId,
          credits,
          'bonus',
          'Initial signup credits'
        );
        
        if (addCreditsResult.success) {
          logger.log('✅ UserOnboarding: User credits initialized:', addCreditsResult.newBalance);
          return { success: true, data: { balance: addCreditsResult.newBalance || credits } };
        } else {
          throw new Error(addCreditsResult.error || 'Failed to add credits');
        }
      }

      return { success: true };
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
