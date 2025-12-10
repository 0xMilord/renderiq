'use server';

import { PlanLimitsService } from '@/lib/services/plan-limits.service';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';

export async function getUserPlanLimits() {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const limits = await PlanLimitsService.getUserPlanLimits(user.id);
    return { success: true, limits };
  } catch (error) {
    logger.error('Error getting user plan limits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get plan limits',
    };
  }
}

export async function checkProjectLimit() {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await PlanLimitsService.checkProjectLimit(user.id);
    return { success: true, result };
  } catch (error) {
    logger.error('Error checking project limit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check project limit',
    };
  }
}

export async function checkRenderLimit(projectId: string) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await PlanLimitsService.checkRenderLimit(user.id, projectId);
    return { success: true, result };
  } catch (error) {
    logger.error('Error checking render limit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check render limit',
    };
  }
}

export async function checkQualityLimit(quality: 'standard' | 'high' | 'ultra') {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await PlanLimitsService.checkQualityLimit(user.id, quality);
    return { success: true, result };
  } catch (error) {
    logger.error('Error checking quality limit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check quality limit',
    };
  }
}

export async function checkVideoLimit() {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await PlanLimitsService.checkVideoLimit(user.id);
    return { success: true, result };
  } catch (error) {
    logger.error('Error checking video limit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check video limit',
    };
  }
}

