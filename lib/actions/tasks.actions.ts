'use server';

import { TasksDAL } from '@/lib/dal/tasks';
import { TasksService } from '@/lib/services/tasks.service';
import { TaskVerificationService } from '@/lib/services/task-verification.service';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';
import type { TaskVerificationType } from '@/lib/db/schema';

// ============================================================================
// TASK RETRIEVAL ACTIONS
// ============================================================================

/**
 * Get all available tasks for the current user
 * ✅ OPTIMIZED: Batch operations in service layer
 */
export async function getAvailableTasksAction() {
  logger.log('📋 TasksAction: Getting available tasks');
  
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const tasks = await TasksService.getAvailableTasks(user.id);
    
    return {
      success: true,
      data: tasks,
    };
  } catch (error) {
    logger.error('❌ TasksAction: Error getting available tasks:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tasks',
    };
  }
}

/**
 * Get all task categories
 * ✅ OPTIMIZED: Single query
 */
export async function getTaskCategoriesAction() {
  logger.log('📋 TasksAction: Getting task categories');
  
  try {
    const categories = await TasksDAL.getAllCategories({ isActive: true });
    
    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    logger.error('❌ TasksAction: Error getting categories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get categories',
    };
  }
}

/**
 * Get tasks by category
 * ✅ OPTIMIZED: Batch operations
 */
export async function getTasksByCategoryAction(categorySlug: string) {
  logger.log('📋 TasksAction: Getting tasks by category:', categorySlug);
  
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Get tasks for category
    const tasks = await TasksDAL.getTasksByCategory(categorySlug);
    
    if (tasks.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // ✅ OPTIMIZED: Batch check eligibility for all tasks
    const taskIds = tasks.map(t => t.id);
    const eligibilityMap = await TasksDAL.batchCheckTaskEligibility(user.id, taskIds);

    // Combine results
    const tasksWithEligibility = tasks.map(task => {
      const eligibility = eligibilityMap.get(task.id) || { canComplete: true };
      return {
        ...task,
        canComplete: eligibility.canComplete,
        reason: eligibility.reason,
        cooldownRemaining: eligibility.cooldownRemaining,
      };
    });
    
    return {
      success: true,
      data: tasksWithEligibility,
    };
  } catch (error) {
    logger.error('❌ TasksAction: Error getting tasks by category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tasks',
    };
  }
}

/**
 * Get user's completed tasks
 * ✅ OPTIMIZED: Batch fetch with details
 */
export async function getUserTasksAction(userId?: string) {
  logger.log('📋 TasksAction: Getting user tasks');
  
  try {
    let finalUserId = userId;
    if (!finalUserId) {
      const { user } = await getCachedUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }
      finalUserId = user.id;
    }

    // ✅ OPTIMIZED: Batch get user tasks with details
    const userTasksWithDetails = await TasksDAL.getUserTasksWithDetails(finalUserId);
    
    return {
      success: true,
      data: userTasksWithDetails,
    };
  } catch (error) {
    logger.error('❌ TasksAction: Error getting user tasks:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user tasks',
    };
  }
}

/**
 * Get user task stats
 * ✅ OPTIMIZED: Single aggregated query
 */
export async function getUserTaskStatsAction(userId?: string) {
  logger.log('📋 TasksAction: Getting user task stats');
  
  try {
    let finalUserId = userId;
    if (!finalUserId) {
      const { user } = await getCachedUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }
      finalUserId = user.id;
    }

    const stats = await TasksDAL.getUserTaskStats(finalUserId);
    
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    logger.error('❌ TasksAction: Error getting user task stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    };
  }
}

/**
 * Get user streak information
 */
export async function getUserStreakAction() {
  logger.log('📋 TasksAction: Getting user streak');
  
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const streak = await TasksDAL.getUserStreak(user.id);
    
    return {
      success: true,
      data: streak,
    };
  } catch (error) {
    logger.error('❌ TasksAction: Error getting streak:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get streak',
    };
  }
}

// ============================================================================
// TASK COMPLETION ACTIONS
// ============================================================================

/**
 * Complete a task
 */
export async function completeTaskAction(
  taskId: string,
  verificationData?: Record<string, any>
) {
  logger.log('📋 TasksAction: Completing task:', taskId);
  
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const result = await TasksService.completeTask(user.id, taskId, verificationData);
    
    return result;
  } catch (error) {
    logger.error('❌ TasksAction: Error completing task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete task',
    };
  }
}

/**
 * Submit task verification data
 */
export async function submitTaskVerificationAction(
  userTaskId: string,
  verificationData: Record<string, any>
) {
  logger.log('📋 TasksAction: Submitting task verification:', userTaskId);
  
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Get user task to verify ownership
    const userTasks = await TasksDAL.getUserTasks(user.id, { taskId: undefined });
    const userTask = userTasks.find(ut => ut.id === userTaskId);
    
    if (!userTask || userTask.userId !== user.id) {
      return {
        success: false,
        error: 'User task not found or access denied',
      };
    }

    // Update verification data
    await TasksDAL.updateUserTaskStatus(userTaskId, userTask.status, undefined, undefined, undefined);

    // If automatic verification, verify immediately
    const task = await TasksDAL.getTaskById(userTask.taskId);
    if (task && task.verificationType === 'automatic' || task?.verificationType === 'api_verification') {
      const verifyResult = await TaskVerificationService.verifyAutomaticTask(
        userTaskId,
        userTask.taskId,
        user.id
      );

      if (verifyResult.verified) {
        const serviceResult = await TasksService.verifyTask(userTaskId, 'automatic');
        return {
          success: true,
          verified: true,
          creditsAwarded: serviceResult.creditsAwarded,
        };
      }
    }

    return {
      success: true,
      verified: false,
      message: 'Verification submitted, pending review',
    };
  } catch (error) {
    logger.error('❌ TasksAction: Error submitting verification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit verification',
    };
  }
}

/**
 * Update daily login streak
 */
export async function updateDailyLoginStreakAction() {
  logger.log('📋 TasksAction: Updating daily login streak');
  
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const result = await TasksService.updateDailyLoginStreak(user.id);
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error('❌ TasksAction: Error updating streak:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update streak',
    };
  }
}

// ============================================================================
// ADMIN ACTIONS
// ============================================================================

/**
 * Manually verify a task (admin only)
 */
export async function verifyTaskManuallyAction(
  userTaskId: string,
  status: 'verified' | 'rejected',
  reason?: string
) {
  logger.log('📋 TasksAction: Manually verifying task:', userTaskId, status);
  
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // TODO: Check if user is admin
    // For now, allow any authenticated user (should be restricted in production)

    if (status === 'verified') {
      const result = await TasksService.verifyTask(userTaskId, 'manual', user.id);
      return {
        success: result.success,
        creditsAwarded: result.creditsAwarded,
        error: result.error,
      };
    } else {
      await TasksDAL.updateUserTaskStatus(userTaskId, 'rejected', user.id);
      await TasksDAL.createVerificationLog(
        userTaskId,
        'manual',
        'failed',
        { reason },
        reason
      );
      return {
        success: true,
        message: 'Task rejected',
      };
    }
  } catch (error) {
    logger.error('❌ TasksAction: Error manually verifying task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify task',
    };
  }
}

/**
 * Get pending manual verifications (admin only)
 * ✅ OPTIMIZED: Batch fetch with details
 */
export async function getPendingVerificationsAction(limit: number = 50) {
  logger.log('📋 TasksAction: Getting pending verifications');
  
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // TODO: Check if user is admin
    // For now, allow any authenticated user (should be restricted in production)

    const pending = await TaskVerificationService.getPendingManualVerifications(limit);
    
    return {
      success: true,
      data: pending,
    };
  } catch (error) {
    logger.error('❌ TasksAction: Error getting pending verifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pending verifications',
    };
  }
}
