'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  getAvailableTasksAction,
  getTaskCategoriesAction,
  getTasksByCategoryAction,
  getUserTasksAction,
  getUserTaskStatsAction,
  getUserStreakAction,
  completeTaskAction,
  submitTaskVerificationAction,
  updateDailyLoginStreakAction,
} from '@/lib/actions/tasks.actions';
import { logger } from '@/lib/utils/logger';
import type { Task, TaskCategory, UserTask, UserStreak } from '@/lib/db/schema';
import type { AvailableTask } from '@/lib/services/tasks.service';

// Cache for preventing duplicate requests
const fetchCache: {
  [key: string]: {
    promise: Promise<any>;
    timestamp: number;
    data: any;
  };
} = {};

const CACHE_DURATION = 30000; // 30 seconds cache
const DEBOUNCE_MS = 1000; // 1 second debounce

export interface UseTasksOptions {
  categorySlug?: string;
  autoFetch?: boolean;
}

/**
 * Hook to get available tasks
 * ✅ OPTIMIZED: Caching and debouncing
 */
export function useTasks(options: UseTasksOptions = {}) {
  const { categorySlug, autoFetch = true } = options;
  const [tasks, setTasks] = useState<AvailableTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const cacheKey = `tasks-${categorySlug || 'all'}`;

  const fetchTasks = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;

    if (timeSinceLastFetch < DEBOUNCE_MS) {
      return;
    }

    // Check cache
    const cached = fetchCache[cacheKey];
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setTasks(cached.data);
      setLoading(false);
      return;
    }

    try {
      lastFetchRef.current = now;
      setLoading(true);
      setError(null);

      let result;
      if (categorySlug) {
        result = await getTasksByCategoryAction(categorySlug);
      } else {
        result = await getAvailableTasksAction();
      }

      if (result.success && result.data) {
        setTasks(result.data);
        fetchCache[cacheKey] = {
          promise: Promise.resolve(result.data),
          timestamp: now,
          data: result.data,
        };
      } else {
        setError(result.error || 'Failed to fetch tasks');
      }
    } catch (err) {
      logger.error('❌ useTasks: Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [categorySlug, cacheKey]);

  useEffect(() => {
    if (autoFetch) {
      fetchTasks();
    }
  }, [autoFetch, fetchTasks]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
  };
}

/**
 * Hook to get task categories
 */
export function useTaskCategories() {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getTaskCategoriesAction();

        if (result.success && result.data) {
          setCategories(result.data);
        } else {
          setError(result.error || 'Failed to fetch categories');
        }
      } catch (err) {
        logger.error('❌ useTaskCategories: Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
  };
}

/**
 * Hook to get user's completed tasks
 */
export function useUserTasks(userId?: string) {
  const [userTasks, setUserTasks] = useState<Array<{
    userTask: UserTask;
    task: Task;
    category: TaskCategory;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getUserTasksAction(userId);

        if (result.success && result.data) {
          setUserTasks(result.data);
        } else {
          setError(result.error || 'Failed to fetch user tasks');
        }
      } catch (err) {
        logger.error('❌ useUserTasks: Error fetching user tasks:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTasks();
  }, [userId]);

  return {
    userTasks,
    loading,
    error,
    refetch: () => {
      if (userId) {
        getUserTasksAction(userId).then((result) => {
          if (result.success && result.data) {
            setUserTasks(result.data);
          }
        });
      }
    },
  };
}

/**
 * Hook to get user task stats
 */
export function useUserTaskStats(userId?: string) {
  const [stats, setStats] = useState<{
    totalCompleted: number;
    totalCreditsEarned: number;
    pendingCount: number;
    verifiedCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getUserTaskStatsAction(userId);

        if (result.success && result.data) {
          setStats(result.data);
        } else {
          setError(result.error || 'Failed to fetch stats');
        }
      } catch (err) {
        logger.error('❌ useUserTaskStats: Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return {
    stats,
    loading,
    error,
    refetch: () => {
      if (userId) {
        getUserTaskStatsAction(userId).then((result) => {
          if (result.success && result.data) {
            setStats(result.data);
          }
        });
      }
    },
  };
}

/**
 * Hook to get user streak
 */
export function useStreak() {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getUserStreakAction();

        if (result.success && result.data) {
          setStreak(result.data);
        } else {
          setError(result.error || 'Failed to fetch streak');
        }
      } catch (err) {
        logger.error('❌ useStreak: Error fetching streak:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, []);

  const updateStreak = useCallback(async () => {
    try {
      const result = await updateDailyLoginStreakAction();
      if (result.success && result.data) {
        // Refetch streak data
        const streakResult = await getUserStreakAction();
        if (streakResult.success && streakResult.data) {
          setStreak(streakResult.data);
        }
        return result.data;
      }
      return null;
    } catch (err) {
      logger.error('❌ useStreak: Error updating streak:', err);
      return null;
    }
  }, []);

  return {
    streak,
    loading,
    error,
    updateStreak,
    refetch: async () => {
      const result = await getUserStreakAction();
      if (result.success && result.data) {
        setStreak(result.data);
      }
    },
  };
}

/**
 * Hook to complete a task
 */
export function useTaskCompletion() {
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeTask = useCallback(async (
    taskId: string,
    verificationData?: Record<string, any>
  ) => {
    try {
      setCompleting(true);
      setError(null);
      const result = await completeTaskAction(taskId, verificationData);

      if (!result.success) {
        setError(result.error || 'Failed to complete task');
        return null;
      }

      return result;
    } catch (err) {
      logger.error('❌ useTaskCompletion: Error completing task:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setCompleting(false);
    }
  }, []);

  const submitVerification = useCallback(async (
    userTaskId: string,
    verificationData: Record<string, any>
  ) => {
    try {
      setCompleting(true);
      setError(null);
      const result = await submitTaskVerificationAction(userTaskId, verificationData);

      if (!result.success) {
        setError(result.error || 'Failed to submit verification');
        return null;
      }

      return result;
    } catch (err) {
      logger.error('❌ useTaskCompletion: Error submitting verification:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setCompleting(false);
    }
  }, []);

  return {
    completeTask,
    submitVerification,
    completing,
    error,
  };
}
