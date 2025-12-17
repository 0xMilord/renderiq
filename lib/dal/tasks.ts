import { db } from '@/lib/db';
import { 
  taskCategories, 
  tasks, 
  userTasks, 
  taskVerificationLogs, 
  userStreaks,
  users,
  creditTransactions
} from '@/lib/db/schema';
import { eq, and, desc, asc, sql, inArray, gte, lte, or } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import type { 
  TaskCategory, 
  NewTaskCategory, 
  Task, 
  NewTask, 
  UserTask, 
  NewUserTask,
  TaskVerificationLog,
  NewTaskVerificationLog,
  UserStreak,
  NewUserStreak
} from '@/lib/db/schema';

export class TasksDAL {
  // ============================================================================
  // TASK CATEGORIES
  // ============================================================================

  /**
   * Get all task categories
   */
  static async getAllCategories(filters?: { isActive?: boolean }): Promise<TaskCategory[]> {
    logger.log('📋 TasksDAL: Getting all categories', filters);
    try {
      const conditions = [];
      if (filters?.isActive !== undefined) {
        conditions.push(eq(taskCategories.isActive, filters.isActive));
      }

      const result = await db
        .select()
        .from(taskCategories)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(taskCategories.displayOrder), asc(taskCategories.name));

      logger.log(`✅ TasksDAL: Found ${result.length} categories`);
      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get category by slug
   */
  static async getCategoryBySlug(slug: string): Promise<TaskCategory | null> {
    logger.log('📋 TasksDAL: Getting category by slug:', slug);
    try {
      const [result] = await db
        .select()
        .from(taskCategories)
        .where(eq(taskCategories.slug, slug))
        .limit(1);

      if (!result) {
        logger.log('❌ TasksDAL: Category not found');
        return null;
      }

      logger.log('✅ TasksDAL: Category found');
      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting category:', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(id: string): Promise<TaskCategory | null> {
    logger.log('📋 TasksDAL: Getting category by ID:', id);
    try {
      const [result] = await db
        .select()
        .from(taskCategories)
        .where(eq(taskCategories.id, id))
        .limit(1);

      return result || null;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting category:', error);
      throw error;
    }
  }

  // ============================================================================
  // TASKS
  // ============================================================================

  /**
   * Get all tasks with optional filters
   */
  static async getAllTasks(filters?: { 
    categoryId?: string; 
    isActive?: boolean;
    categorySlug?: string;
  }): Promise<Task[]> {
    logger.log('📋 TasksDAL: Getting all tasks', filters);
    try {
      const conditions = [];
      
      if (filters?.categoryId) {
        conditions.push(eq(tasks.categoryId, filters.categoryId));
      }
      
      if (filters?.isActive !== undefined) {
        conditions.push(eq(tasks.isActive, filters.isActive));
      }

      let query = db.select().from(tasks);

      // If filtering by category slug, need to join
      if (filters?.categorySlug) {
        query = db
          .select({ task: tasks })
          .from(tasks)
          .innerJoin(taskCategories, eq(tasks.categoryId, taskCategories.id))
          .where(
            and(
              eq(taskCategories.slug, filters.categorySlug),
              ...(filters?.isActive !== undefined ? [eq(tasks.isActive, filters.isActive)] : [])
            )
          ) as any;
        
        const result = await query;
        return result.map((r: any) => r.task);
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const result = await query.orderBy(asc(tasks.displayOrder), asc(tasks.name));
      logger.log(`✅ TasksDAL: Found ${result.length} tasks`);
      return result as Task[];
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting tasks:', error);
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  static async getTaskById(taskId: string): Promise<Task | null> {
    logger.log('📋 TasksDAL: Getting task by ID:', taskId);
    try {
      const [result] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      return result || null;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting task:', error);
      throw error;
    }
  }

  /**
   * Get task by slug
   */
  static async getTaskBySlug(slug: string): Promise<Task | null> {
    logger.log('📋 TasksDAL: Getting task by slug:', slug);
    try {
      const [result] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.slug, slug))
        .limit(1);

      return result || null;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting task:', error);
      throw error;
    }
  }

  /**
   * Get tasks by category slug
   */
  static async getTasksByCategory(categorySlug: string): Promise<Task[]> {
    logger.log('📋 TasksDAL: Getting tasks by category:', categorySlug);
    return this.getAllTasks({ categorySlug, isActive: true });
  }

  // ============================================================================
  // USER TASKS (Task Completions)
  // ============================================================================

  /**
   * Get user's task completions with optional filters
   */
  static async getUserTasks(
    userId: string, 
    filters?: { 
      status?: UserTask['status']; 
      taskId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<UserTask[]> {
    logger.log('📋 TasksDAL: Getting user tasks:', userId, filters);
    try {
      const conditions = [eq(userTasks.userId, userId)];

      if (filters?.status) {
        conditions.push(eq(userTasks.status, filters.status));
      }

      if (filters?.taskId) {
        conditions.push(eq(userTasks.taskId, filters.taskId));
      }

      let query = db
        .select()
        .from(userTasks)
        .where(and(...conditions))
        .orderBy(desc(userTasks.createdAt));

      if (filters?.limit) {
        query = query.limit(filters.limit) as any;
      }

      if (filters?.offset) {
        query = query.offset(filters.offset) as any;
      }

      const result = await query;
      logger.log(`✅ TasksDAL: Found ${result.length} user tasks`);
      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting user tasks:', error);
      throw error;
    }
  }

  /**
   * Get user's task completion for a specific task on a specific date
   */
  static async getUserTaskCompletion(
    userId: string, 
    taskId: string, 
    date?: Date
  ): Promise<UserTask | null> {
    logger.log('📋 TasksDAL: Getting user task completion:', userId, taskId, date);
    try {
      const targetDate = date || new Date();
      const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const [result] = await db
        .select()
        .from(userTasks)
        .where(
          and(
            eq(userTasks.userId, userId),
            eq(userTasks.taskId, taskId),
            sql`DATE(${userTasks.createdAt}) = ${dateStr}`
          )
        )
        .limit(1);

      return result || null;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting user task completion:', error);
      throw error;
    }
  }

  /**
   * Create a new user task completion
   */
  static async createUserTask(
    userId: string, 
    taskId: string, 
    verificationData?: Record<string, any>
  ): Promise<UserTask> {
    logger.log('📋 TasksDAL: Creating user task:', userId, taskId);
    try {
      const [result] = await db
        .insert(userTasks)
        .values({
          userId,
          taskId,
          status: 'pending',
          verificationData: verificationData || {},
        })
        .returning();

      logger.log('✅ TasksDAL: User task created:', result.id);
      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error creating user task:', error);
      throw error;
    }
  }

  /**
   * Update user task status
   */
  static async updateUserTaskStatus(
    userTaskId: string, 
    status: UserTask['status'], 
    verifiedBy?: string,
    creditsAwarded?: number,
    transactionId?: string
  ): Promise<UserTask> {
    logger.log('📋 TasksDAL: Updating user task status:', userTaskId, status);
    try {
      const updateData: Partial<NewUserTask> = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'verified') {
        updateData.verifiedAt = new Date();
        if (verifiedBy) {
          updateData.verifiedBy = verifiedBy;
        }
        if (creditsAwarded !== undefined) {
          updateData.creditsAwarded = creditsAwarded;
        }
        if (transactionId) {
          updateData.transactionId = transactionId;
        }
      }

      const [result] = await db
        .update(userTasks)
        .set(updateData)
        .where(eq(userTasks.id, userTaskId))
        .returning();

      logger.log('✅ TasksDAL: User task updated');
      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error updating user task:', error);
      throw error;
    }
  }

  /**
   * Get user task stats (total completed, credits earned, etc.)
   */
  static async getUserTaskStats(userId: string): Promise<{
    totalCompleted: number;
    totalCreditsEarned: number;
    pendingCount: number;
    verifiedCount: number;
  }> {
    logger.log('📋 TasksDAL: Getting user task stats:', userId);
    try {
      const allUserTasks = await this.getUserTasks(userId);

      const totalCompleted = allUserTasks.filter(t => 
        t.status === 'verified' || t.status === 'completed'
      ).length;

      const totalCreditsEarned = allUserTasks
        .filter(t => t.status === 'verified')
        .reduce((sum, t) => sum + (t.creditsAwarded || 0), 0);

      const pendingCount = allUserTasks.filter(t => t.status === 'pending').length;
      const verifiedCount = allUserTasks.filter(t => t.status === 'verified').length;

      return {
        totalCompleted,
        totalCreditsEarned,
        pendingCount,
        verifiedCount,
      };
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting user task stats:', error);
      throw error;
    }
  }

  // ============================================================================
  // VERIFICATION LOGS
  // ============================================================================

  /**
   * Create verification log
   */
  static async createVerificationLog(
    userTaskId: string,
    method: string,
    result: 'success' | 'failed' | 'pending',
    details?: Record<string, any>,
    errorMessage?: string
  ): Promise<TaskVerificationLog> {
    logger.log('📋 TasksDAL: Creating verification log:', userTaskId, method, result);
    try {
      const [log] = await db
        .insert(taskVerificationLogs)
        .values({
          userTaskId,
          verificationMethod: method,
          verificationResult: result,
          verificationDetails: details || {},
          errorMessage,
        })
        .returning();

      logger.log('✅ TasksDAL: Verification log created');
      return log;
    } catch (error) {
      logger.error('❌ TasksDAL: Error creating verification log:', error);
      throw error;
    }
  }

  /**
   * Get verification logs for a user task
   */
  static async getVerificationLogs(userTaskId: string): Promise<TaskVerificationLog[]> {
    logger.log('📋 TasksDAL: Getting verification logs:', userTaskId);
    try {
      const logs = await db
        .select()
        .from(taskVerificationLogs)
        .where(eq(taskVerificationLogs.userTaskId, userTaskId))
        .orderBy(desc(taskVerificationLogs.createdAt));

      return logs;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting verification logs:', error);
      throw error;
    }
  }

  // ============================================================================
  // STREAKS
  // ============================================================================

  /**
   * Get user streak
   */
  static async getUserStreak(userId: string): Promise<UserStreak | null> {
    logger.log('📋 TasksDAL: Getting user streak:', userId);
    try {
      const [result] = await db
        .select()
        .from(userStreaks)
        .where(eq(userStreaks.userId, userId))
        .limit(1);

      return result || null;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting user streak:', error);
      throw error;
    }
  }

  /**
   * Create user streak record
   */
  static async createUserStreak(userId: string): Promise<UserStreak> {
    logger.log('📋 TasksDAL: Creating user streak:', userId);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

      const [result] = await db
        .insert(userStreaks)
        .values({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastLoginDate: todayStr,
          streakStartDate: todayStr,
          totalLoginDays: 1,
        })
        .returning();

      logger.log('✅ TasksDAL: User streak created');
      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error creating user streak:', error);
      throw error;
    }
  }

  /**
   * Update user streak
   */
  static async updateUserStreak(
    userId: string, 
    updates: Partial<NewUserStreak>
  ): Promise<UserStreak> {
    logger.log('📋 TasksDAL: Updating user streak:', userId, updates);
    try {
      const [result] = await db
        .update(userStreaks)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(userStreaks.userId, userId))
        .returning();

      logger.log('✅ TasksDAL: User streak updated');
      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error updating user streak:', error);
      throw error;
    }
  }

  /**
   * Reset user streak
   */
  static async resetUserStreak(userId: string): Promise<UserStreak> {
    logger.log('📋 TasksDAL: Resetting user streak:', userId);
    try {
      const [result] = await db
        .update(userStreaks)
        .set({
          currentStreak: 0,
          updatedAt: new Date(),
        })
        .where(eq(userStreaks.userId, userId))
        .returning();

      logger.log('✅ TasksDAL: User streak reset');
      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error resetting user streak:', error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS (JOINED QUERIES)
  // ============================================================================

  /**
   * Get task with category details
   */
  static async getTaskWithCategory(taskId: string): Promise<{
    task: Task;
    category: TaskCategory;
  } | null> {
    logger.log('📋 TasksDAL: Getting task with category:', taskId);
    try {
      const [result] = await db
        .select({
          task: tasks,
          category: taskCategories,
        })
        .from(tasks)
        .innerJoin(taskCategories, eq(tasks.categoryId, taskCategories.id))
        .where(eq(tasks.id, taskId))
        .limit(1);

      return result || null;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting task with category:', error);
      throw error;
    }
  }

  /**
   * Get user task with task and category details
   */
  static async getUserTaskWithDetails(userTaskId: string): Promise<{
    userTask: UserTask;
    task: Task;
    category: TaskCategory;
  } | null> {
    logger.log('📋 TasksDAL: Getting user task with details:', userTaskId);
    try {
      const [result] = await db
        .select({
          userTask: userTasks,
          task: tasks,
          category: taskCategories,
        })
        .from(userTasks)
        .innerJoin(tasks, eq(userTasks.taskId, tasks.id))
        .innerJoin(taskCategories, eq(tasks.categoryId, taskCategories.id))
        .where(eq(userTasks.id, userTaskId))
        .limit(1);

      return result || null;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting user task with details:', error);
      throw error;
    }
  }

  /**
   * Get available tasks for a user (filtered by cooldown and max completions)
   */
  static async getAvailableTasksForUser(userId: string): Promise<Task[]> {
    logger.log('📋 TasksDAL: Getting available tasks for user:', userId);
    try {
      // Get all active tasks
      const allTasks = await this.getAllTasks({ isActive: true });

      // Filter tasks based on cooldown and max completions
      const availableTasks: Task[] = [];

      for (const task of allTasks) {
        // Check max completions
        if (task.maxCompletions !== null) {
          const completions = await this.getUserTasks(userId, { taskId: task.id, status: 'verified' });
          if (completions.length >= task.maxCompletions) {
            continue; // Skip if max completions reached
          }
        }

        // Check cooldown (if task has cooldown)
        if (task.cooldownHours > 0) {
          const lastCompletion = await this.getUserTaskCompletion(userId, task.id);
          if (lastCompletion && lastCompletion.status === 'verified') {
            const hoursSinceCompletion = 
              (Date.now() - new Date(lastCompletion.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceCompletion < task.cooldownHours) {
              continue; // Skip if still in cooldown
            }
          }
        }

        availableTasks.push(task);
      }

      logger.log(`✅ TasksDAL: Found ${availableTasks.length} available tasks`);
      return availableTasks;
    } catch (error) {
      logger.error('❌ TasksDAL: Error getting available tasks:', error);
      throw error;
    }
  }

  /**
   * Check if user can complete a task (cooldown and max completions check)
   */
  static async canUserCompleteTask(userId: string, taskId: string): Promise<{
    canComplete: boolean;
    reason?: string;
    cooldownRemaining?: number; // hours
  }> {
    logger.log('📋 TasksDAL: Checking if user can complete task:', userId, taskId);
    try {
      const task = await this.getTaskById(taskId);
      if (!task || !task.isActive) {
        return { canComplete: false, reason: 'Task not found or inactive' };
      }

      // Check max completions
      if (task.maxCompletions !== null) {
        const completions = await this.getUserTasks(userId, { taskId, status: 'verified' });
        if (completions.length >= task.maxCompletions) {
          return { canComplete: false, reason: 'Maximum completions reached' };
        }
      }

      // Check cooldown
      if (task.cooldownHours > 0) {
        const lastCompletion = await this.getUserTaskCompletion(userId, taskId);
        if (lastCompletion && lastCompletion.status === 'verified') {
          const hoursSinceCompletion = 
            (Date.now() - new Date(lastCompletion.createdAt).getTime()) / (1000 * 60 * 60);
          const cooldownRemaining = task.cooldownHours - hoursSinceCompletion;
          
          if (cooldownRemaining > 0) {
            return { 
              canComplete: false, 
              reason: 'Task is on cooldown',
              cooldownRemaining: Math.ceil(cooldownRemaining)
            };
          }
        }
      }

      return { canComplete: true };
    } catch (error) {
      logger.error('❌ TasksDAL: Error checking task completion eligibility:', error);
      throw error;
    }
  }

  // ============================================================================
  // BATCH OPERATIONS (PERFORMANCE OPTIMIZED)
  // ============================================================================

  /**
   * Batch get tasks by IDs (single query)
   */
  static async getTasksByIds(taskIds: string[]): Promise<Task[]> {
    if (taskIds.length === 0) return [];
    
    logger.log('📋 TasksDAL: Batch getting tasks by IDs:', taskIds.length);
    try {
      const result = await db
        .select()
        .from(tasks)
        .where(inArray(tasks.id, taskIds));

      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error batch getting tasks:', error);
      throw error;
    }
  }

  /**
   * Batch get user tasks by task IDs (single query)
   */
  static async getUserTasksByTaskIds(
    userId: string,
    taskIds: string[]
  ): Promise<UserTask[]> {
    if (taskIds.length === 0) return [];
    
    logger.log('📋 TasksDAL: Batch getting user tasks by task IDs:', taskIds.length);
    try {
      const result = await db
        .select()
        .from(userTasks)
        .where(
          and(
            eq(userTasks.userId, userId),
            inArray(userTasks.taskId, taskIds)
          )
        );

      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error batch getting user tasks:', error);
      throw error;
    }
  }

  /**
   * Batch get tasks with categories (single joined query)
   */
  static async getTasksWithCategories(taskIds?: string[]): Promise<Array<{
    task: Task;
    category: TaskCategory;
  }>> {
    logger.log('📋 TasksDAL: Batch getting tasks with categories');
    try {
      let query = db
        .select({
          task: tasks,
          category: taskCategories,
        })
        .from(tasks)
        .innerJoin(taskCategories, eq(tasks.categoryId, taskCategories.id));

      if (taskIds && taskIds.length > 0) {
        query = query.where(inArray(tasks.id, taskIds)) as any;
      }

      const result = await query;
      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error batch getting tasks with categories:', error);
      throw error;
    }
  }

  /**
   * Batch get user tasks with details (single joined query)
   */
  static async getUserTasksWithDetails(
    userId: string,
    userTaskIds?: string[]
  ): Promise<Array<{
    userTask: UserTask;
    task: Task;
    category: TaskCategory;
  }>> {
    logger.log('📋 TasksDAL: Batch getting user tasks with details');
    try {
      let query = db
        .select({
          userTask: userTasks,
          task: tasks,
          category: taskCategories,
        })
        .from(userTasks)
        .innerJoin(tasks, eq(userTasks.taskId, tasks.id))
        .innerJoin(taskCategories, eq(tasks.categoryId, taskCategories.id))
        .where(eq(userTasks.userId, userId));

      if (userTaskIds && userTaskIds.length > 0) {
        query = query.where(inArray(userTasks.id, userTaskIds)) as any;
      }

      const result = await query;
      return result;
    } catch (error) {
      logger.error('❌ TasksDAL: Error batch getting user tasks with details:', error);
      throw error;
    }
  }

  /**
   * Batch check task completion eligibility (parallel queries)
   */
  static async batchCheckTaskEligibility(
    userId: string,
    taskIds: string[]
  ): Promise<Map<string, {
    canComplete: boolean;
    reason?: string;
    cooldownRemaining?: number;
  }>> {
    if (taskIds.length === 0) return new Map();
    
    logger.log('📋 TasksDAL: Batch checking task eligibility:', taskIds.length);
    try {
      // ✅ OPTIMIZED: Parallel fetch tasks and user completions
      const [tasksData, userCompletions] = await Promise.all([
        this.getTasksByIds(taskIds),
        this.getUserTasksByTaskIds(userId, taskIds),
      ]);

      // Create maps for quick lookup
      const tasksMap = new Map(tasksData.map(t => [t.id, t]));
      const completionsMap = new Map(
        userCompletions
          .filter(ut => ut.status === 'verified')
          .map(ut => [ut.taskId, ut])
      );

      const results = new Map<string, {
        canComplete: boolean;
        reason?: string;
        cooldownRemaining?: number;
      }>();

      for (const taskId of taskIds) {
        const task = tasksMap.get(taskId);
        if (!task || !task.isActive) {
          results.set(taskId, { canComplete: false, reason: 'Task not found or inactive' });
          continue;
        }

        // Check max completions
        if (task.maxCompletions !== null) {
          const completionCount = userCompletions.filter(
            ut => ut.taskId === taskId && ut.status === 'verified'
          ).length;
          if (completionCount >= task.maxCompletions) {
            results.set(taskId, { canComplete: false, reason: 'Maximum completions reached' });
            continue;
          }
        }

        // Check cooldown
        if (task.cooldownHours > 0) {
          const lastCompletion = completionsMap.get(taskId);
          if (lastCompletion) {
            const hoursSinceCompletion = 
              (Date.now() - new Date(lastCompletion.createdAt).getTime()) / (1000 * 60 * 60);
            const cooldownRemaining = task.cooldownHours - hoursSinceCompletion;
            
            if (cooldownRemaining > 0) {
              results.set(taskId, {
                canComplete: false,
                reason: 'Task is on cooldown',
                cooldownRemaining: Math.ceil(cooldownRemaining)
              });
              continue;
            }
          }
        }

        results.set(taskId, { canComplete: true });
      }

      return results;
    } catch (error) {
      logger.error('❌ TasksDAL: Error batch checking eligibility:', error);
      throw error;
    }
  }
}
