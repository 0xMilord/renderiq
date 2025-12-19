/**
 * GA4 Tracking Hook
 * 
 * Client-side hook to track GA4 events after server actions complete
 */

'use client';

import { useAuth } from './use-auth';
import {
  trackRenderCreated,
  trackFirstRenderCreated,
  trackRenderCompleted,
  trackFirstRenderCompleted,
  trackRenderFailed,
  trackCreditsEarned,
  trackCreditsSpent,
  trackProjectCreated,
  trackToolUsed,
  trackToolCompleted,
  trackToolFailed,
} from '@/lib/utils/ga4-tracking';

export function useGA4Tracking() {
  const { user } = useAuth();

  const trackRender = (data: {
    renderId: string;
    projectId: string;
    type: 'image' | 'video';
    platform: 'render' | 'tools' | 'canvas' | 'plugin';
    quality: string;
    style: string;
    creditsCost: number;
    isFirst?: boolean;
    timeToFirst?: number;
  }) => {
    if (!user?.id) return;

    if (data.isFirst && data.timeToFirst !== undefined) {
      trackFirstRenderCreated(
        user.id,
        data.renderId,
        data.type,
        data.platform,
        data.timeToFirst
      );
    }

    trackRenderCreated(
      user.id,
      data.renderId,
      data.projectId,
      data.type,
      data.platform,
      data.quality,
      data.style,
      data.creditsCost
    );
  };

  const trackRenderComplete = (data: {
    renderId: string;
    type: string;
    quality: string;
    creditsCost: number;
    latencyMs: number;
    isFirst?: boolean;
  }) => {
    if (!user?.id) return;

    if (data.isFirst) {
      trackFirstRenderCompleted(
        user.id,
        data.renderId,
        data.type,
        data.quality,
        data.creditsCost,
        data.latencyMs
      );
    }

    trackRenderCompleted(
      user.id,
      data.renderId,
      data.type,
      data.quality,
      data.creditsCost,
      data.latencyMs
    );
  };

  const trackRenderFail = (data: {
    renderId: string;
    errorType: string;
    errorMessage: string;
  }) => {
    if (!user?.id) return;
    trackRenderFailed(user.id, data.renderId, data.errorType, data.errorMessage);
  };

  const trackCredits = (data: {
    event: 'earned' | 'spent';
    amount: number;
    source?: string;
    reason?: string;
    balanceAfter: number;
    renderId?: string;
  }) => {
    if (!user?.id) return;

    if (data.event === 'earned') {
      trackCreditsEarned(
        user.id,
        data.amount,
        (data.source as any) || 'login',
        data.balanceAfter
      );
    } else {
      trackCreditsSpent(
        user.id,
        data.amount,
        data.reason || 'unknown',
        data.balanceAfter,
        data.renderId
      );
    }
  };

  const trackProject = (data: {
    projectId: string;
    platform: 'render' | 'tools' | 'canvas';
    hasImage: boolean;
  }) => {
    if (!user?.id) return;
    trackProjectCreated(user.id, data.projectId, data.platform, data.hasImage);
  };

  const trackTool = (data: {
    event: 'used' | 'completed' | 'failed';
    toolId: string;
    toolName: string;
    toolCategory?: 'generation' | 'refine' | 'convert';
    inputType?: 'image' | 'text' | 'mixed';
    projectId?: string;
    executionId?: string;
    creditsCost?: number;
    latencyMs?: number;
    errorType?: string;
  }) => {
    if (!user?.id) return;

    if (data.event === 'used' && data.toolCategory && data.inputType && data.projectId) {
      trackToolUsed(
        user.id,
        data.toolId,
        data.toolName,
        data.toolCategory,
        data.inputType,
        data.projectId
      );
    } else if (data.event === 'completed' && data.executionId && data.creditsCost !== undefined && data.latencyMs !== undefined) {
      trackToolCompleted(
        user.id,
        data.toolId,
        data.toolName,
        data.executionId,
        data.creditsCost,
        data.latencyMs
      );
    } else if (data.event === 'failed' && data.errorType) {
      trackToolFailed(user.id, data.toolId, data.toolName, data.errorType);
    }
  };

  return {
    trackRender,
    trackRenderComplete,
    trackRenderFail,
    trackCredits,
    trackProject,
    trackTool,
  };
}

