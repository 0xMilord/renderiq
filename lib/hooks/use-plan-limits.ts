'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlanLimitsService, type LimitCheckResult, type PlanLimits } from '@/lib/services/plan-limits.service';

export function usePlanLimits() {
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLimits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/billing/plan-limits');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLimits(data.limits);
        }
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

  const checkProjectLimit = useCallback(async (): Promise<LimitCheckResult> => {
    const response = await fetch('/api/billing/check-limit?type=projects');
    if (response.ok) {
      const data = await response.json();
      return data.result;
    }
    return { allowed: false, limitType: 'projects', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
  }, []);

  const checkRenderLimit = useCallback(async (projectId: string): Promise<LimitCheckResult> => {
    const response = await fetch(`/api/billing/check-limit?type=renders_per_project&projectId=${projectId}`);
    if (response.ok) {
      const data = await response.json();
      return data.result;
    }
    return { allowed: false, limitType: 'renders_per_project', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
  }, []);

  const checkQualityLimit = useCallback(async (quality: 'standard' | 'high' | 'ultra'): Promise<LimitCheckResult> => {
    const response = await fetch(`/api/billing/check-limit?type=quality&quality=${quality}`);
    if (response.ok) {
      const data = await response.json();
      return data.result;
    }
    return { allowed: false, limitType: 'quality', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
  }, []);

  const checkVideoLimit = useCallback(async (): Promise<LimitCheckResult> => {
    const response = await fetch('/api/billing/check-limit?type=video');
    if (response.ok) {
      const data = await response.json();
      return data.result;
    }
    return { allowed: false, limitType: 'video', current: 0, limit: 0, planName: 'Free', error: 'Failed to check limit' };
  }, []);

  return {
    limits,
    loading,
    refetch: fetchLimits,
    checkProjectLimit,
    checkRenderLimit,
    checkQualityLimit,
    checkVideoLimit,
  };
}

