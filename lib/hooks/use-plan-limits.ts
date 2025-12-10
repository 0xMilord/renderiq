'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserPlanLimits, checkProjectLimit, checkRenderLimit, checkQualityLimit, checkVideoLimit } from '@/lib/actions/plan-limits.actions';
import type { LimitCheckResult, PlanLimits } from '@/lib/services/plan-limits.service';

export function usePlanLimits() {
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ OPTIMIZED: Use server action instead of API route
  const fetchLimits = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getUserPlanLimits();
      if (result.success && result.limits) {
        setLimits(result.limits);
      }
    } catch (error) {
      console.error('Failed to fetch plan limits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  // ✅ OPTIMIZED: Use server action instead of API route
  const checkProjectLimitAction = useCallback(async (): Promise<LimitCheckResult> => {
    try {
      const result = await checkProjectLimit();
      if (result.success && result.result) {
        return result.result;
      }
      return { allowed: false, limitType: 'projects', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
    } catch (error) {
      console.error('Failed to check project limit:', error);
      return { allowed: false, limitType: 'projects', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
    }
  }, []);

  // ✅ OPTIMIZED: Use server action instead of API route
  const checkRenderLimitAction = useCallback(async (projectId: string): Promise<LimitCheckResult> => {
    try {
      const result = await checkRenderLimit(projectId);
      if (result.success && result.result) {
        return result.result;
      }
      return { allowed: false, limitType: 'renders_per_project', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
    } catch (error) {
      console.error('Failed to check render limit:', error);
      return { allowed: false, limitType: 'renders_per_project', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
    }
  }, []);

  // ✅ OPTIMIZED: Use server action instead of API route
  const checkQualityLimitAction = useCallback(async (quality: 'standard' | 'high' | 'ultra'): Promise<LimitCheckResult> => {
    try {
      const result = await checkQualityLimit(quality);
      if (result.success && result.result) {
        return result.result;
      }
      return { allowed: false, limitType: 'quality', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
    } catch (error) {
      console.error('Failed to check quality limit:', error);
      return { allowed: false, limitType: 'quality', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
    }
  }, []);

  // ✅ OPTIMIZED: Use server action instead of API route
  const checkVideoLimitAction = useCallback(async (): Promise<LimitCheckResult> => {
    try {
      const result = await checkVideoLimit();
      if (result.success && result.result) {
        return result.result;
      }
      return { allowed: false, limitType: 'video', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
    } catch (error) {
      console.error('Failed to check video limit:', error);
      return { allowed: false, limitType: 'video', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
    }
  }, []);

  return {
    limits,
    loading,
    refetch: fetchLimits,
    checkProjectLimit: checkProjectLimitAction,
    checkRenderLimit: checkRenderLimitAction,
    checkQualityLimit: checkQualityLimitAction,
    checkVideoLimit: checkVideoLimitAction,
  };
}

