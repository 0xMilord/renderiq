import { BillingDAL } from '@/lib/dal/billing';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { db } from '@/lib/db';
import { projects, renders } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export type LimitType = 'projects' | 'renders_per_project' | 'renders_per_chain' | 'credits' | 'quality' | 'video' | 'api';

export interface LimitCheckResult {
  allowed: boolean;
  limitType: LimitType;
  current: number;
  limit: number | null; // null means unlimited
  planName: string;
  error?: string;
}

export interface PlanLimits {
  maxProjects: number | null;
  maxRendersPerProject: number | null;
  creditsPerMonth: number;
  allowsHighQuality: boolean;
  allowsUltraQuality: boolean;
  allowsVideo: boolean;
  allowsAPI: boolean;
  planName: string;
}

export class PlanLimitsService {
  /**
   * Get user's plan limits
   * Returns Free plan limits if no subscription or subscription is not valid
   * ✅ FIXED: Uses isUserPro() to check if subscription is valid (handles canceled subscriptions with valid period)
   */
  static async getUserPlanLimits(userId: string): Promise<PlanLimits> {
    // ✅ FIXED: Check if user is pro first (this validates subscription period)
    const isPro = await BillingDAL.isUserPro(userId);
    
    if (!isPro) {
      // Free plan defaults
      return {
        maxProjects: 3,
        maxRendersPerProject: 5,
        creditsPerMonth: 10,
        allowsHighQuality: false,
        allowsUltraQuality: false,
        allowsVideo: false,
        allowsAPI: false,
        planName: 'Free',
      };
    }

    // User is pro, get subscription details
    const subscription = await BillingDAL.getUserSubscription(userId);
    
    if (!subscription || !subscription.plan) {
      // Fallback to free if subscription not found (shouldn't happen if isPro is true)
      logger.log('⚠️ PlanLimitsService: User is pro but subscription not found, using free limits');
      return {
        maxProjects: 3,
        maxRendersPerProject: 5,
        creditsPerMonth: 10,
        allowsHighQuality: false,
        allowsUltraQuality: false,
        allowsVideo: false,
        allowsAPI: false,
        planName: 'Free',
      };
    }

    const plan = subscription.plan;
    const planName = plan.name;

    // Determine feature access based on plan
    const allowsHighQuality = ['Pro', 'Pro Annual', 'Enterprise', 'Enterprise Annual'].includes(planName);
    const allowsUltraQuality = ['Enterprise', 'Enterprise Annual'].includes(planName);
    const allowsVideo = ['Pro', 'Pro Annual', 'Enterprise', 'Enterprise Annual'].includes(planName);
    const allowsAPI = ['Enterprise', 'Enterprise Annual'].includes(planName);

    return {
      maxProjects: plan.maxProjects,
      maxRendersPerProject: plan.maxRendersPerProject,
      creditsPerMonth: plan.creditsPerMonth,
      allowsHighQuality,
      allowsUltraQuality,
      allowsVideo,
      allowsAPI,
      planName,
    };
  }

  /**
   * Check if user can create a new project
   * ✅ OPTIMIZED: Use SQL COUNT instead of fetching all projects
   */
  static async checkProjectLimit(userId: string): Promise<LimitCheckResult> {
    const limits = await this.getUserPlanLimits(userId);
    
    // Unlimited projects
    if (limits.maxProjects === null) {
      return {
        allowed: true,
        limitType: 'projects',
        current: 0,
        limit: null,
        planName: limits.planName,
      };
    }

    // ✅ OPTIMIZED: Use SQL COUNT instead of fetching all projects (much faster)
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(projects)
      .where(eq(projects.userId, userId));
    const currentCount = result.count;

    const allowed = currentCount < limits.maxProjects;

    return {
      allowed,
      limitType: 'projects',
      current: currentCount,
      limit: limits.maxProjects,
      planName: limits.planName,
      error: allowed ? undefined : `You've reached the limit of ${limits.maxProjects} projects. Upgrade to create more projects.`,
    };
  }

  /**
   * Check if user can create a render in a project
   * ✅ OPTIMIZED: Use SQL COUNT instead of fetching all renders
   * ✅ FIXED: Now counts per chain if chainId is provided, otherwise per project
   */
  static async checkRenderLimit(userId: string, projectId: string, chainId?: string | null): Promise<LimitCheckResult> {
    const limits = await this.getUserPlanLimits(userId);
    
    // Unlimited renders per project/chain
    if (limits.maxRendersPerProject === null) {
      return {
        allowed: true,
        limitType: chainId ? 'renders_per_chain' : 'renders_per_project',
        current: 0,
        limit: null,
        planName: limits.planName,
      };
    }

    // ✅ FIXED: Count renders per chain if chainId provided, otherwise per project
    let currentCount: number;
    if (chainId) {
      // Count renders in this specific chain
      const [result] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(renders)
        .where(and(
          eq(renders.projectId, projectId),
          eq(renders.chainId, chainId)
        ));
      currentCount = result.count;
    } else {
      // Count renders in entire project (fallback for backward compatibility)
      const [result] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(renders)
        .where(eq(renders.projectId, projectId));
      currentCount = result.count;
    }

    const allowed = currentCount < limits.maxRendersPerProject;

    return {
      allowed,
      limitType: chainId ? 'renders_per_chain' : 'renders_per_project',
      current: currentCount,
      limit: limits.maxRendersPerProject,
      planName: limits.planName,
      error: allowed ? undefined : `You've reached the limit of ${limits.maxRendersPerProject} renders per ${chainId ? 'chain' : 'project'}. Upgrade to create more renders.`,
    };
  }

  /**
   * Check if user can use a specific quality level
   */
  static async checkQualityLimit(userId: string, quality: 'standard' | 'high' | 'ultra'): Promise<LimitCheckResult> {
    const limits = await this.getUserPlanLimits(userId);

    let allowed = true;
    let error: string | undefined;

    if (quality === 'high' && !limits.allowsHighQuality) {
      allowed = false;
      error = 'High quality renders are only available on Pro plans and above. Upgrade to access high quality renders.';
    } else if (quality === 'ultra' && !limits.allowsUltraQuality) {
      allowed = false;
      error = 'Ultra quality renders are only available on Enterprise plans. Upgrade to access ultra quality renders.';
    }

    return {
      allowed,
      limitType: 'quality',
      current: quality === 'standard' ? 1 : quality === 'high' ? 2 : 3,
      limit: limits.allowsUltraQuality ? 3 : limits.allowsHighQuality ? 2 : 1,
      planName: limits.planName,
      error,
    };
  }

  /**
   * Check if user can generate videos
   */
  static async checkVideoLimit(userId: string): Promise<LimitCheckResult> {
    const limits = await this.getUserPlanLimits(userId);

    return {
      allowed: limits.allowsVideo,
      limitType: 'video',
      current: limits.allowsVideo ? 1 : 0,
      limit: limits.allowsVideo ? null : 0,
      planName: limits.planName,
      error: limits.allowsVideo ? undefined : 'Video generation is only available on Pro plans and above. Upgrade to generate videos.',
    };
  }

  /**
   * Check if user can access API
   */
  static async checkAPILimit(userId: string): Promise<LimitCheckResult> {
    const limits = await this.getUserPlanLimits(userId);

    return {
      allowed: limits.allowsAPI,
      limitType: 'api',
      current: limits.allowsAPI ? 1 : 0,
      limit: limits.allowsAPI ? null : 0,
      planName: limits.planName,
      error: limits.allowsAPI ? undefined : 'API access is only available on Enterprise plans. Upgrade to access the API.',
    };
  }

  /**
   * Check credits (delegates to billing service)
   * This is already checked in render creation, but included for completeness
   */
  static async checkCreditsLimit(userId: string, requiredCredits: number): Promise<LimitCheckResult> {
    const creditsData = await BillingDAL.getUserCreditsWithReset(userId);
    const limits = await this.getUserPlanLimits(userId);

    if (!creditsData) {
      return {
        allowed: false,
        limitType: 'credits',
        current: 0,
        limit: limits.creditsPerMonth,
        planName: limits.planName,
        error: 'Unable to check credits. Please try again.',
      };
    }

    const allowed = creditsData.balance >= requiredCredits;

    return {
      allowed,
      limitType: 'credits',
      current: creditsData.balance,
      limit: limits.creditsPerMonth,
      planName: limits.planName,
      error: allowed ? undefined : `Insufficient credits. You need ${requiredCredits} credits but only have ${creditsData.balance}. Upgrade to get more credits.`,
    };
  }
}

