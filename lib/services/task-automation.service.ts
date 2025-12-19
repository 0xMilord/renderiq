import { TasksDAL } from '@/lib/dal/tasks';
import { TasksService } from './tasks.service';
import { logger } from '@/lib/utils/logger';

/**
 * TaskAutomationService - Handles automatic task completion
 * ✅ VC-SAFE: Only triggers for product-native actions
 */
export class TaskAutomationService {
  /**
   * Trigger task completion for render creation
   * Called automatically when render is created
   */
  static async onRenderCreated(userId: string, renderId: string): Promise<void> {
    try {
      logger.log('📋 TaskAutomation: Render created, checking tasks:', userId, renderId);
      
      // Get task by slug
      const task = await TasksDAL.getTaskBySlug('create-render');
      if (!task || !task.isActive) {
        return;
      }

      // Check if user can complete (cooldown check)
      const canComplete = await TasksService.canCompleteTask(userId, task.id);
      if (!canComplete.canComplete) {
        logger.log('📋 TaskAutomation: Cannot complete create-render task:', canComplete.reason);
        return;
      }

      // Complete task automatically
      const result = await TasksService.completeTask(userId, task.id, {
        renderId,
        event: 'render_created',
      });

      if (result.success) {
        logger.log('✅ TaskAutomation: Render creation task completed:', result.creditsAwarded);
      }
    } catch (error) {
      logger.error('❌ TaskAutomation: Error processing render creation task:', error);
      // Don't throw - task automation shouldn't break render creation
    }
  }

  /**
   * Trigger task completion for render refinement
   * Called when user edits/refines an existing render
   */
  static async onRenderRefined(userId: string, renderId: string, parentRenderId?: string): Promise<void> {
    try {
      logger.log('📋 TaskAutomation: Render refined, checking tasks:', userId, renderId);
      
      // Only count if it's a refinement (has parent)
      if (!parentRenderId) {
        return;
      }

      const task = await TasksDAL.getTaskBySlug('refine-render');
      if (!task || !task.isActive) {
        return;
      }

      const canComplete = await TasksService.canCompleteTask(userId, task.id);
      if (!canComplete.canComplete) {
        return;
      }

      const result = await TasksService.completeTask(userId, task.id, {
        renderId,
        parentRenderId,
        event: 'render_refined',
      });

      if (result.success) {
        logger.log('✅ TaskAutomation: Render refinement task completed:', result.creditsAwarded);
      }
    } catch (error) {
      logger.error('❌ TaskAutomation: Error processing render refinement task:', error);
    }
  }

  /**
   * Trigger task completion for render export
   * Called when user downloads/exports a render
   */
  static async onRenderExported(userId: string, renderId: string): Promise<void> {
    try {
      logger.log('📋 TaskAutomation: Render exported, checking tasks:', userId, renderId);
      
      const task = await TasksDAL.getTaskBySlug('export-render');
      if (!task || !task.isActive) {
        return;
      }

      const canComplete = await TasksService.canCompleteTask(userId, task.id);
      if (!canComplete.canComplete) {
        return;
      }

      const result = await TasksService.completeTask(userId, task.id, {
        renderId,
        event: 'render_exported',
      });

      if (result.success) {
        logger.log('✅ TaskAutomation: Render export task completed:', result.creditsAwarded);
      }
    } catch (error) {
      logger.error('❌ TaskAutomation: Error processing render export task:', error);
    }
  }

  /**
   * Trigger task completion for tool usage
   * Called when user executes a tool
   */
  static async onToolExecuted(userId: string, toolId: string): Promise<void> {
    try {
      logger.log('📋 TaskAutomation: Tool executed, checking tasks:', userId, toolId);
      
      // Track tool usage for "use 2 different tools" task
      // This will be checked when the task is evaluated
      // For now, just log it
      logger.log('📋 TaskAutomation: Tool usage tracked:', toolId);
    } catch (error) {
      logger.error('❌ TaskAutomation: Error processing tool execution task:', error);
    }
  }

  /**
   * Trigger task completion for project reuse
   * Called when user uses a project they used before
   */
  static async onProjectReused(userId: string, projectId: string): Promise<void> {
    try {
      logger.log('📋 TaskAutomation: Project reused, checking tasks:', userId, projectId);
      
      const task = await TasksDAL.getTaskBySlug('reuse-project');
      if (!task || !task.isActive) {
        return;
      }

      const canComplete = await TasksService.canCompleteTask(userId, task.id);
      if (!canComplete.canComplete) {
        return;
      }

      const result = await TasksService.completeTask(userId, task.id, {
        projectId,
        event: 'project_reused',
      });

      if (result.success) {
        logger.log('✅ TaskAutomation: Project reuse task completed:', result.creditsAwarded);
      }
    } catch (error) {
      logger.error('❌ TaskAutomation: Error processing project reuse task:', error);
    }
  }

  /**
   * Trigger daily login task
   * Called on user session creation/login
   */
  static async onDailyLogin(userId: string): Promise<void> {
    try {
      logger.log('📋 TaskAutomation: Daily login, updating streak:', userId);
      
      // Update streak (this handles the daily login task automatically)
      await TasksService.updateDailyLoginStreak(userId);
      
      logger.log('✅ TaskAutomation: Daily login streak updated');
    } catch (error) {
      logger.error('❌ TaskAutomation: Error processing daily login:', error);
    }
  }

  /**
   * Trigger task completion for project creation
   * Called automatically when project is created
   */
  static async onProjectCreated(userId: string, projectId: string): Promise<void> {
    try {
      logger.log('📋 TaskAutomation: Project created, checking tasks:', userId, projectId);
      
      const task = await TasksDAL.getTaskBySlug('create-project');
      if (!task || !task.isActive) {
        return;
      }

      const canComplete = await TasksService.canCompleteTask(userId, task.id);
      if (!canComplete.canComplete) {
        logger.log('📋 TaskAutomation: Cannot complete create-project task:', canComplete.reason);
        return;
      }

      const result = await TasksService.completeTask(userId, task.id, {
        projectId,
        event: 'project_created',
      });

      if (result.success) {
        logger.log('✅ TaskAutomation: Project creation task completed:', result.creditsAwarded);
      }
    } catch (error) {
      logger.error('❌ TaskAutomation: Error processing project creation task:', error);
      // Don't throw - task automation shouldn't break project creation
    }
  }

  /**
   * Trigger task completion for onboarding completion
   * Called when user completes onboarding
   */
  static async onOnboardingCompleted(userId: string): Promise<void> {
    try {
      logger.log('📋 TaskAutomation: Onboarding completed, checking tasks:', userId);
      
      const task = await TasksDAL.getTaskBySlug('complete-onboarding');
      if (!task || !task.isActive) {
        return;
      }

      const canComplete = await TasksService.canCompleteTask(userId, task.id);
      if (!canComplete.canComplete) {
        logger.log('📋 TaskAutomation: Cannot complete onboarding task:', canComplete.reason);
        return;
      }

      const result = await TasksService.completeTask(userId, task.id, {
        event: 'onboarding_completed',
      });

      if (result.success) {
        logger.log('✅ TaskAutomation: Onboarding completion task completed:', result.creditsAwarded);
      }
    } catch (error) {
      logger.error('❌ TaskAutomation: Error processing onboarding completion task:', error);
      // Don't throw - task automation shouldn't break onboarding
    }
  }
}
