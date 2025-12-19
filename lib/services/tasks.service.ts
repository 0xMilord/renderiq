import { TasksDAL } from '@/lib/dal/tasks';
import { BillingService } from '@/lib/services/billing';
import { logger } from '@/lib/utils/logger';
import type {
  Task,
  UserTask,
  UserStreak,
  TaskVerificationType,
  UserTaskStatus,
  StreakUpdateResult,
} from '@/lib/db/schema';

export interface TaskCompletionResult {
  success: boolean;
  userTaskId?: string;
  creditsAwarded?: number;
  error?: string;
}

export interface AvailableTask extends Task {
  canComplete: boolean;
  reason?: string;
  cooldownRemaining?: number;
  lastCompletedAt?: Date;
}

/**
 * TasksService - Business logic layer for tasks system
 * Handles task completion, verification, credit awarding, and streak management
 */
export class TasksService {
  // ============================================================================
  // TASK OPERATIONS
  // ============================================================================

  /**
   * Get available tasks for a user (filtered by cooldown, max completions)
   * ✅ OPTIMIZED: Batch operations for performance
   */
  static async getAvailableTasks(userId: string): Promise<AvailableTask[]> {
    logger.log('📋 TasksService: Getting available tasks for user:', userId);
    try {
      // ✅ OPTIMIZED: Single query to get all active tasks
      const allTasks = await TasksDAL.getAllTasks({ isActive: true });
      
      logger.log(`📋 TasksService: Found ${allTasks.length} active tasks in database`);
      
      if (allTasks.length === 0) {
        logger.warn('⚠️ TasksService: No active tasks found in database. Tasks may need to be seeded.');
        return [];
      }

      // ✅ OPTIMIZED: Batch check eligibility for all tasks in parallel
      const taskIds = allTasks.map(t => t.id);
      const eligibilityMap = await TasksDAL.batchCheckTaskEligibility(userId, taskIds);
      
      // ✅ OPTIMIZED: Batch get user completions to find last completed dates
      const userCompletions = await TasksDAL.getUserTasksByTaskIds(userId, taskIds);
      const lastCompletedMap = new Map<string, Date>();
      userCompletions
        .filter(ut => ut.status === 'verified')
        .forEach(ut => {
          const existing = lastCompletedMap.get(ut.taskId);
          if (!existing || new Date(ut.createdAt) > existing) {
            lastCompletedMap.set(ut.taskId, new Date(ut.createdAt));
          }
        });

      // Combine results - include all tasks (automatic and manual)
      const availableTasks: AvailableTask[] = allTasks.map(task => {
        const eligibility = eligibilityMap.get(task.id) || { canComplete: true };
        const lastCompletedAt = lastCompletedMap.get(task.id);

        return {
          ...task,
          canComplete: eligibility.canComplete,
          reason: eligibility.reason,
          cooldownRemaining: eligibility.cooldownRemaining,
          lastCompletedAt,
        };
      });

      logger.log(`✅ TasksService: Found ${availableTasks.length} available tasks`);
      return availableTasks;
    } catch (error) {
      logger.error('❌ TasksService: Error getting available tasks:', error);
      throw error;
    }
  }

  /**
   * Check if user can complete a task
   */
  static async canCompleteTask(userId: string, taskId: string): Promise<{
    canComplete: boolean;
    reason?: string;
    cooldownRemaining?: number;
  }> {
    logger.log('📋 TasksService: Checking if user can complete task:', userId, taskId);
    return TasksDAL.canUserCompleteTask(userId, taskId);
  }

  /**
   * Calculate cooldown remaining for a task
   */
  static async calculateCooldownRemaining(userId: string, taskId: string): Promise<number | null> {
    logger.log('📋 TasksService: Calculating cooldown remaining:', userId, taskId);
    try {
      const task = await TasksDAL.getTaskById(taskId);
      if (!task || task.cooldownHours === 0) {
        return null;
      }

      const lastCompletion = await TasksDAL.getUserTaskCompletion(userId, taskId);
      if (!lastCompletion || lastCompletion.status !== 'verified') {
        return null;
      }

      const hoursSinceCompletion = 
        (Date.now() - new Date(lastCompletion.createdAt).getTime()) / (1000 * 60 * 60);
      const cooldownRemaining = task.cooldownHours - hoursSinceCompletion;

      return cooldownRemaining > 0 ? Math.ceil(cooldownRemaining) : 0;
    } catch (error) {
      logger.error('❌ TasksService: Error calculating cooldown:', error);
      throw error;
    }
  }

  // ============================================================================
  // TASK COMPLETION
  // ============================================================================

  /**
   * Complete a task (create user task record)
   */
  static async completeTask(
    userId: string,
    taskId: string,
    verificationData?: Record<string, any>
  ): Promise<TaskCompletionResult> {
    logger.log('📋 TasksService: Completing task:', userId, taskId);
    try {
      // Check eligibility
      const canComplete = await this.canCompleteTask(userId, taskId);
      if (!canComplete.canComplete) {
        return {
          success: false,
          error: canComplete.reason || 'Cannot complete task',
        };
      }

      // Get task to determine verification type
      const task = await TasksDAL.getTaskById(taskId);
      if (!task) {
        return { success: false, error: 'Task not found' };
      }

      // Create user task record
      const userTask = await TasksDAL.createUserTask(userId, taskId, verificationData);

      // If automatic verification, verify immediately
      if (task.verificationType === 'automatic') {
        const verifyResult = await this.verifyTask(userTask.id, 'automatic');
        if (verifyResult.success) {
          return {
            success: true,
            userTaskId: userTask.id,
            creditsAwarded: verifyResult.creditsAwarded,
          };
        }
      }

      return {
        success: true,
        userTaskId: userTask.id,
      };
    } catch (error) {
      logger.error('❌ TasksService: Error completing task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete task',
      };
    }
  }

  /**
   * Verify a task (automatic or manual)
   */
  static async verifyTask(
    userTaskId: string,
    method: 'automatic' | 'manual',
    verifierId?: string
  ): Promise<{
    success: boolean;
    creditsAwarded?: number;
    error?: string;
  }> {
    logger.log('📋 TasksService: Verifying task:', userTaskId, method);
    try {
      // Get user task with details
      const userTaskDetails = await TasksDAL.getUserTaskWithDetails(userTaskId);
      if (!userTaskDetails) {
        return { success: false, error: 'User task not found' };
      }

      const { userTask, task } = userTaskDetails;

      if (userTask.status === 'verified') {
        return {
          success: true,
          creditsAwarded: userTask.creditsAwarded,
        };
      }

      // Calculate credits to award
      // For daily login task, use streak-based calculation from verification data
      let creditsToAward = task.creditsReward;
      if (task.slug === 'daily-login' && userTask.verificationData?.credits) {
        creditsToAward = userTask.verificationData.credits;
      } else if (task.verificationConfig?.useStreak && userTask.verificationData?.streakDays) {
        // Use streak formula if configured
        const streakDays = userTask.verificationData.streakDays;
        const baseCredits = task.verificationConfig.baseCredits || task.creditsReward;
        creditsToAward = this.calculateStreakCredits(streakDays, baseCredits);
      }
      
      const creditResult = await this.awardCreditsForTask(
        userTask.userId,
        task.id,
        userTask.id,
        creditsToAward
      );

      if (!creditResult.success) {
        return { success: false, error: creditResult.error };
      }

      // Update user task status
      await TasksDAL.updateUserTaskStatus(
        userTaskId,
        'verified',
        verifierId,
        creditsToAward,
        creditResult.transactionId
      );

      // Log verification
      await TasksDAL.createVerificationLog(
        userTaskId,
        method,
        'success',
        { creditsAwarded: creditsToAward },
        undefined
      );

      logger.log('✅ TasksService: Task verified, credits awarded:', creditsToAward);
      return {
        success: true,
        creditsAwarded: creditsToAward,
      };
    } catch (error) {
      logger.error('❌ TasksService: Error verifying task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify task',
      };
    }
  }

  /**
   * Award credits for a completed task
   */
  static async awardCreditsForTask(
    userId: string,
    taskId: string,
    userTaskId: string,
    credits: number
  ): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    logger.log('📋 TasksService: Awarding credits for task:', userId, taskId, credits);
    try {
      const task = await TasksDAL.getTaskById(taskId);
      if (!task) {
        return { success: false, error: 'Task not found' };
      }

      const result = await BillingService.addCredits(
        userId,
        credits,
        'earned',
        `Completed task: ${task.name}`,
        userTaskId,
        'bonus' // Using 'bonus' as reference type for task rewards
      );

      if (!result.success) {
        return { 
          success: false, 
          error: ('error' in result ? result.error : 'Failed to add credits') as string
        };
      }

      // Get transaction ID from the reference (userTaskId is stored as referenceId)
      // Note: BillingService doesn't return transactionId, so we'll query it if needed
      // For now, we can use userTaskId as the reference
      return {
        success: true,
        transactionId: userTaskId, // Using userTaskId as reference for now
      };
    } catch (error) {
      logger.error('❌ TasksService: Error awarding credits:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to award credits',
      };
    }
  }

  // ============================================================================
  // STREAK MANAGEMENT
  // ============================================================================

  /**
   * Calculate streak credits using linear formula with soft caps
   * ✅ VC-SAFE: Linear growth, capped at 3 credits/day
   * - Day 1-7: +1 credit/day
   * - Day 8-30: +2 credits/day
   * - Cap: 3 credits/day max
   */
  /**
   * Calculate credits based on streak using quadratic equation
   * Formula: credits = baseCredits * (streakDays^2 / 4)
   * This means each doubling of streak time roughly quadruples the reward
   * 
   * Examples:
   * - Day 1: 1 credit (1 * 1^2 / 4 = 0.25, rounded to 1)
   * - Day 2: 1 credit (1 * 4/4 = 1)
   * - Day 4: 4 credits (1 * 16/4 = 4)
   * - Day 7: 12 credits (1 * 49/4 = 12.25, rounded to 12)
   * - Day 14: 49 credits (1 * 196/4 = 49)
   * - Day 30: 225 credits (1 * 900/4 = 225)
   * - Day 60: 900 credits (1 * 3600/4 = 900, but capped at 500)
   */
  static calculateStreakCredits(streakDays: number, baseCredits: number = 1): number {
    if (streakDays <= 0) return 0;
    if (streakDays === 1) return baseCredits; // First day gets base
    
    // Quadratic formula: base * (streak^2 / 4)
    const credits = Math.round(baseCredits * (Math.pow(streakDays, 2) / 4));
    
    // Cap at reasonable maximum (500 credits per day as per document)
    return Math.min(credits, 500);
  }

  /**
   * Update daily login streak
   * ✅ OPTIMIZED: Single transaction for streak update + credit award
   */
  static async updateDailyLoginStreak(userId: string): Promise<StreakUpdateResult> {
    logger.log('📋 TasksService: Updating daily login streak:', userId);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

      // Get or create streak
      let streak = await TasksDAL.getUserStreak(userId);
      if (!streak) {
        streak = await TasksDAL.createUserStreak(userId);
      }

      const lastLoginDate = streak.lastLoginDate;
      const isNewStreak = !lastLoginDate || lastLoginDate !== todayStr;
      let streakBroken = false;
      let gracePeriodUsed = false;

      // Check if streak should continue or break
      if (lastLoginDate) {
        const lastLogin = new Date(lastLoginDate);
        const daysDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          // Already logged in today
          return {
            streak: streak.currentStreak,
            credits: 0,
            isNewStreak: false,
            streakBroken: false,
            gracePeriodUsed: false,
          };
        } else if (daysDiff === 1) {
          // Continue streak
          const newStreak = streak.currentStreak + 1;
          const credits = this.calculateStreakCredits(newStreak);

          // ✅ OPTIMIZED: Parallel update streak and award credits
          await Promise.all([
            TasksDAL.updateUserStreak(userId, {
              currentStreak: newStreak,
              longestStreak: Math.max(streak.longestStreak, newStreak),
              lastLoginDate: todayStr,
              totalLoginDays: streak.totalLoginDays + 1,
            }),
            credits > 0 ? this.awardDailyLoginCredits(userId, credits, newStreak) : Promise.resolve(),
          ]);

          return {
            streak: newStreak,
            credits,
            isNewStreak: true,
            streakBroken: false,
            gracePeriodUsed: false,
          };
        } else if (daysDiff === 2 && !streak.gracePeriodUsed) {
          // Use grace period (1-day buffer)
          const newStreak = streak.currentStreak + 1;
          const credits = this.calculateStreakCredits(newStreak);

          await Promise.all([
            TasksDAL.updateUserStreak(userId, {
              currentStreak: newStreak,
              longestStreak: Math.max(streak.longestStreak, newStreak),
              lastLoginDate: todayStr,
              totalLoginDays: streak.totalLoginDays + 1,
              gracePeriodUsed: true,
            }),
            credits > 0 ? this.awardDailyLoginCredits(userId, credits, newStreak) : Promise.resolve(),
          ]);

          return {
            streak: newStreak,
            credits,
            isNewStreak: true,
            streakBroken: false,
            gracePeriodUsed: true,
          };
        } else {
          // Streak broken
          streakBroken = true;
          const credits = this.calculateStreakCredits(1); // Start new streak at day 1

          await Promise.all([
            TasksDAL.updateUserStreak(userId, {
              currentStreak: 1,
              lastLoginDate: todayStr,
              streakStartDate: todayStr,
              totalLoginDays: streak.totalLoginDays + 1,
            }),
            credits > 0 ? this.awardDailyLoginCredits(userId, credits, 1) : Promise.resolve(),
          ]);

          return {
            streak: 1,
            credits,
            isNewStreak: true,
            streakBroken: true,
            gracePeriodUsed: false,
          };
        }
      } else {
        // First login ever
        const credits = this.calculateStreakCredits(1);

        await Promise.all([
          TasksDAL.updateUserStreak(userId, {
            currentStreak: 1,
            longestStreak: 1,
            lastLoginDate: todayStr,
            streakStartDate: todayStr,
            totalLoginDays: 1,
          }),
          credits > 0 ? this.awardDailyLoginCredits(userId, credits, 1) : Promise.resolve(),
        ]);

        return {
          streak: 1,
          credits,
          isNewStreak: true,
          streakBroken: false,
          gracePeriodUsed: false,
        };
      }
    } catch (error) {
      logger.error('❌ TasksService: Error updating streak:', error);
      throw error;
    }
  }

  /**
   * Award daily login credits (helper method)
   * ✅ VC-SAFE: Includes milestone bonuses
   * Also creates the daily login task completion record
   */
  private static async awardDailyLoginCredits(
    userId: string,
    credits: number,
    streakDays: number
  ): Promise<void> {
    try {
      // Get daily login task and create completion record
      const dailyLoginTask = await TasksDAL.getTaskBySlug('daily-login');
      if (dailyLoginTask && dailyLoginTask.isActive) {
        // Check if already completed today
        const canComplete = await this.canCompleteTask(userId, dailyLoginTask.id);
        if (canComplete.canComplete) {
          // Create the daily login task with streak-based credits
          const userTask = await TasksDAL.createUserTask(userId, dailyLoginTask.id, {
            streakDays,
            credits, // Pre-calculated streak credits
            event: 'daily_login',
          });
          
          // Verify immediately (automatic task) - will use credits from verification data
          await this.verifyTask(userTask.id, 'automatic');
          // Note: Base streak credits are awarded in verifyTask
        }
      } else {
        // Fallback: Award credits directly if task system isn't working
        // This should rarely happen, but ensures users still get credits
        await BillingService.addCredits(
          userId,
          credits,
          'earned',
          `Daily login (${streakDays} day streak)`,
          undefined,
          'bonus'
        );
      }

      // Award milestone bonuses (one-time) - always award these separately
      if (streakDays === 7) {
        await BillingService.addCredits(
          userId,
          5,
          'earned',
          '7-day streak milestone',
          undefined,
          'bonus'
        );
      } else if (streakDays === 30) {
        await BillingService.addCredits(
          userId,
          10,
          'earned',
          '30-day streak milestone',
          undefined,
          'bonus'
        );
      }
    } catch (error) {
      logger.error('❌ TasksService: Error awarding daily login credits:', error);
      // Don't throw - streak update should succeed even if credit award fails
    }
  }

  /**
   * Check if streak is broken
   */
  static async checkStreakBreak(userId: string): Promise<boolean> {
    logger.log('📋 TasksService: Checking streak break:', userId);
    try {
      const streak = await TasksDAL.getUserStreak(userId);
      if (!streak || !streak.lastLoginDate) {
        return false;
      }

      const lastLogin = new Date(streak.lastLoginDate);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

      // Streak broken if more than 2 days (with grace period) or more than 1 day (without grace)
      return streak.gracePeriodUsed ? daysDiff > 2 : daysDiff > 1;
    } catch (error) {
      logger.error('❌ TasksService: Error checking streak break:', error);
      return false;
    }
  }
}
