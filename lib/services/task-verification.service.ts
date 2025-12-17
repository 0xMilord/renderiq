import { TasksDAL } from '@/lib/dal/tasks';
import { TasksService } from './tasks.service';
import { logger } from '@/lib/utils/logger';
import type { Task, UserTask } from '@/lib/db/schema';

/**
 * TaskVerificationService - Handles automatic and manual task verification
 * Supports Twitter, GitHub, Discord, Telegram, Link, and Screenshot verification
 */
export class TaskVerificationService {
  // ============================================================================
  // AUTOMATIC VERIFICATION
  // ============================================================================

  /**
   * Verify automatic task (routes to appropriate verification method)
   * ✅ OPTIMIZED: Parallel verification where possible
   */
  static async verifyAutomaticTask(
    userTaskId: string,
    taskId: string,
    userId: string
  ): Promise<{
    success: boolean;
    verified: boolean;
    error?: string;
  }> {
    logger.log('📋 TaskVerificationService: Verifying automatic task:', userTaskId, taskId);
    try {
      const task = await TasksDAL.getTaskById(taskId);
      if (!task) {
        return { success: false, verified: false, error: 'Task not found' };
      }

      const userTask = await TasksDAL.getUserTasks(userId, { taskId, limit: 1 });
      const currentUserTask = userTask.find(ut => ut.id === userTaskId);
      if (!currentUserTask) {
        return { success: false, verified: false, error: 'User task not found' };
      }

      const verificationData = currentUserTask.verificationData || {};
      const config = task.verificationConfig || {};

      let result: { success: boolean; verified: boolean; error?: string };

      switch (task.verificationType) {
        case 'automatic':
          // Fully automatic tasks (daily login, render creation, etc.)
          result = await this.verifyFullyAutomaticTask(userTaskId, task, currentUserTask);
          break;
        case 'api_verification':
          // API-based verification (Twitter, GitHub, Discord, Telegram)
          result = await this.verifyApiTask(userTaskId, task, currentUserTask, verificationData, config);
          break;
        case 'link_verification':
          // Link-based verification (reviews, shares)
          result = await this.verifyLinkTask(userTaskId, task, currentUserTask, verificationData, config);
          break;
        default:
          result = { success: false, verified: false, error: 'Invalid verification type' };
      }

      // Log verification attempt
      await TasksDAL.createVerificationLog(
        userTaskId,
        task.verificationType,
        result.verified ? 'success' : 'failed',
        { taskId, verificationType: task.verificationType },
        result.error
      );

      return result;
    } catch (error) {
      logger.error('❌ TaskVerificationService: Error verifying automatic task:', error);
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Verify fully automatic task (no user input needed)
   */
  private static async verifyFullyAutomaticTask(
    userTaskId: string,
    task: Task,
    userTask: UserTask
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    // For fully automatic tasks, verification is always successful
    // The task should have been created by the system itself
    const verifyResult = await TasksService.verifyTask(userTaskId, 'automatic');
    
    return {
      success: verifyResult.success,
      verified: verifyResult.success,
      error: verifyResult.error,
    };
  }

  /**
   * Verify API-based task (Twitter, GitHub, Discord, Telegram)
   */
  private static async verifyApiTask(
    userTaskId: string,
    task: Task,
    userTask: UserTask,
    verificationData: Record<string, any>,
    config: Record<string, any>
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    const platform = config.platform || task.slug.split('-')[0]; // Extract platform from slug

    try {
      switch (platform) {
        case 'twitter':
        case 'x':
          return await this.verifyTwitterTask(userTaskId, task, userTask, verificationData, config);
        case 'github':
          return await this.verifyGitHubTask(userTaskId, task, userTask, verificationData, config);
        case 'discord':
          return await this.verifyDiscordTask(userTaskId, task, userTask, verificationData, config);
        case 'telegram':
          return await this.verifyTelegramTask(userTaskId, task, userTask, verificationData, config);
        default:
          return { success: false, verified: false, error: `Unsupported platform: ${platform}` };
      }
    } catch (error) {
      logger.error(`❌ TaskVerificationService: Error verifying ${platform} task:`, error);
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Verify Twitter/X task
   * ✅ MVP: Not implemented - social tasks removed for VC-safe MVP
   */
  private static async verifyTwitterTask(
    userTaskId: string,
    task: Task,
    userTask: UserTask,
    verificationData: Record<string, any>,
    config: Record<string, any>
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    return {
      success: false,
      verified: false,
      error: 'Social verification tasks are not available in MVP',
    };
  }

  /**
   * Verify GitHub task
   * ✅ MVP: Not implemented - social tasks removed for VC-safe MVP
   */
  private static async verifyGitHubTask(
    userTaskId: string,
    task: Task,
    userTask: UserTask,
    verificationData: Record<string, any>,
    config: Record<string, any>
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    return {
      success: false,
      verified: false,
      error: 'Social verification tasks are not available in MVP',
    };
  }

  /**
   * Verify Discord task
   * ✅ MVP: Not implemented - social tasks removed for VC-safe MVP
   */
  private static async verifyDiscordTask(
    userTaskId: string,
    task: Task,
    userTask: UserTask,
    verificationData: Record<string, any>,
    config: Record<string, any>
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    return {
      success: false,
      verified: false,
      error: 'Social verification tasks are not available in MVP',
    };
  }

  /**
   * Verify Telegram task
   * ✅ MVP: Not implemented - social tasks removed for VC-safe MVP
   */
  private static async verifyTelegramTask(
    userTaskId: string,
    task: Task,
    userTask: UserTask,
    verificationData: Record<string, any>,
    config: Record<string, any>
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    return {
      success: false,
      verified: false,
      error: 'Social verification tasks are not available in MVP',
    };
  }

  /**
   * Verify link-based task (reviews, shares)
   */
  private static async verifyLinkTask(
    userTaskId: string,
    task: Task,
    userTask: UserTask,
    verificationData: Record<string, any>,
    config: Record<string, any>
  ): Promise<{ success: boolean; verified: boolean; error?: string }> {
    const url = verificationData.url || verificationData.link;
    if (!url) {
      return { success: false, verified: false, error: 'No URL provided' };
    }

    // Validate URL format
    const isValid = this.validateReviewLink(url, config.platform || '');
    if (!isValid) {
      return { success: false, verified: false, error: 'Invalid URL format' };
    }

    // ✅ MVP: Link verification not used - only automatic tasks in MVP
    logger.log('📋 TaskVerificationService: Link verification not available in MVP');
    return {
      success: false,
      verified: false,
      error: 'Link verification tasks are not available in MVP',
    };
  }

  // ============================================================================
  // MANUAL VERIFICATION QUEUE
  // ============================================================================

  /**
   * Queue task for manual verification
   */
  static async queueForManualVerification(
    userTaskId: string,
    reason: string
  ): Promise<void> {
    logger.log('📋 TaskVerificationService: Queuing for manual verification:', userTaskId, reason);
    try {
      await TasksDAL.createVerificationLog(
        userTaskId,
        'manual',
        'pending',
        { reason },
        undefined
      );
    } catch (error) {
      logger.error('❌ TaskVerificationService: Error queueing for manual verification:', error);
      throw error;
    }
  }

  /**
   * Get pending manual verifications
   * ✅ OPTIMIZED: Batch fetch with details
   */
  static async getPendingManualVerifications(limit: number = 50): Promise<Array<{
    userTask: UserTask;
    task: Task;
    category: any;
    verificationLogs: any[];
  }>> {
    logger.log('📋 TaskVerificationService: Getting pending manual verifications');
    try {
      // Get pending user tasks
      const pendingTasks = await TasksDAL.getUserTasks('', { status: 'pending', limit });
      
      if (pendingTasks.length === 0) {
        return [];
      }

      // ✅ OPTIMIZED: Batch get tasks and verification logs in parallel
      const userTaskIds = pendingTasks.map(ut => ut.id);
      const taskIds = [...new Set(pendingTasks.map(ut => ut.taskId))];

      const [tasksWithCategories, verificationLogs] = await Promise.all([
        TasksDAL.getTasksWithCategories(taskIds),
        Promise.all(
          userTaskIds.map(id => TasksDAL.getVerificationLogs(id))
        ),
      ]);

      // Create maps for quick lookup
      const tasksMap = new Map(tasksWithCategories.map(tc => [tc.task.id, tc]));
      const logsMap = new Map(userTaskIds.map((id, idx) => [id, verificationLogs[idx]]));

      // Combine results
      return pendingTasks.map(userTask => {
        const taskData = tasksMap.get(userTask.taskId);
        return {
          userTask,
          task: taskData?.task || null,
          category: taskData?.category || null,
          verificationLogs: logsMap.get(userTask.id) || [],
        };
      }).filter(item => item.task !== null);
    } catch (error) {
      logger.error('❌ TaskVerificationService: Error getting pending verifications:', error);
      throw error;
    }
  }

  // ============================================================================
  // VERIFICATION HELPERS
  // ============================================================================

  /**
   * Check Twitter follow status
   * ✅ MVP: Not implemented - social tasks removed
   */
  static async checkTwitterFollowStatus(
    username: string,
    targetUsername: string
  ): Promise<boolean> {
    return false;
  }

  /**
   * Check GitHub follow status
   * ✅ MVP: Not implemented - social tasks removed
   */
  static async checkGitHubFollowStatus(
    username: string,
    targetUsername: string
  ): Promise<boolean> {
    return false;
  }

  /**
   * Validate review link format
   */
  static validateReviewLink(url: string, platform: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      const platformPatterns: Record<string, RegExp> = {
        'producthunt': /producthunt\.com/i,
        'g2': /g2\.com/i,
        'capterra': /capterra\.com/i,
        'trustpilot': /trustpilot\.com/i,
        'sourceforge': /sourceforge\.net/i,
        'alternativeto': /alternativeto\.net/i,
      };

      if (platform && platformPatterns[platform.toLowerCase()]) {
        return platformPatterns[platform.toLowerCase()].test(hostname);
      }

      // Check against all patterns if platform not specified
      return Object.values(platformPatterns).some(pattern => pattern.test(hostname));
    } catch {
      return false;
    }
  }

  /**
   * Extract platform from URL
   */
  static extractPlatformFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.includes('producthunt')) return 'producthunt';
      if (hostname.includes('g2')) return 'g2';
      if (hostname.includes('capterra')) return 'capterra';
      if (hostname.includes('trustpilot')) return 'trustpilot';
      if (hostname.includes('sourceforge')) return 'sourceforge';
      if (hostname.includes('alternativeto')) return 'alternativeto';
      if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
      if (hostname.includes('github')) return 'github';
      if (hostname.includes('linkedin')) return 'linkedin';
      if (hostname.includes('youtube')) return 'youtube';

      return null;
    } catch {
      return null;
    }
  }
}
