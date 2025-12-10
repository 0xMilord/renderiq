'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ProjectRulesDAL } from '@/lib/dal/project-rules';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { ProjectsDAL } from '@/lib/dal/projects';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';
import { db } from '@/lib/db';
import { renderChains, projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const createProjectRuleSchema = z.object({
  chainId: z.string().uuid(),
  rule: z.string().min(1, 'Rule cannot be empty'),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
});

const updateProjectRuleSchema = z.object({
  id: z.string().uuid(),
  rule: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export async function getProjectRules(chainId: string) {
  try {
    logger.log('📋 [getProjectRules] Getting rules for chain:', chainId);
    
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    // ✅ OPTIMIZED: Use JOIN query to verify chain belongs to user's project in one query
    const [chainWithProject] = await db
      .select({
        chain: renderChains,
        project: projects,
      })
      .from(renderChains)
      .innerJoin(projects, eq(renderChains.projectId, projects.id))
      .where(and(
        eq(renderChains.id, chainId),
        eq(projects.userId, userId)
      ))
      .limit(1);

    if (!chainWithProject || !chainWithProject.chain) {
      return { success: false, error: 'Chain not found or access denied' };
    }

    const rules = await ProjectRulesDAL.getAllRulesByChainId(chainId);
    return { success: true, data: rules };
  } catch (error) {
    logger.error('❌ [getProjectRules] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get project rules' };
  }
}

export async function getActiveProjectRules(chainId: string) {
  try {
    logger.log('📋 [getActiveProjectRules] Getting active rules for chain:', chainId);
    
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    // ✅ OPTIMIZED: Use JOIN query to verify chain belongs to user's project in one query
    const [chainWithProject] = await db
      .select({
        chain: renderChains,
        project: projects,
      })
      .from(renderChains)
      .innerJoin(projects, eq(renderChains.projectId, projects.id))
      .where(and(
        eq(renderChains.id, chainId),
        eq(projects.userId, userId)
      ))
      .limit(1);

    if (!chainWithProject || !chainWithProject.chain) {
      return { success: false, error: 'Chain not found or access denied' };
    }

    const rules = await ProjectRulesDAL.getActiveRulesByChainId(chainId);
    return { success: true, data: rules };
  } catch (error) {
    logger.error('❌ [getActiveProjectRules] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get active project rules' };
  }
}

export async function createProjectRule(formData: FormData) {
  try {
    logger.log('📋 [createProjectRule] Creating new rule');
    
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    const data = {
      chainId: formData.get('chainId') as string,
      rule: formData.get('rule') as string,
      isActive: formData.get('isActive') === 'true',
      order: parseInt(formData.get('order') as string) || 0,
    };

    const validated = createProjectRuleSchema.parse(data);

    // ✅ OPTIMIZED: Use JOIN query to verify chain belongs to user's project in one query
    const [chainWithProject] = await db
      .select({
        chain: renderChains,
        project: projects,
      })
      .from(renderChains)
      .innerJoin(projects, eq(renderChains.projectId, projects.id))
      .where(and(
        eq(renderChains.id, validated.chainId),
        eq(projects.userId, userId)
      ))
      .limit(1);

    if (!chainWithProject || !chainWithProject.chain) {
      return { success: false, error: 'Chain not found or access denied' };
    }

    const rule = await ProjectRulesDAL.create(validated);
    
    revalidatePath(`/project/[slug]/chain/[chainId]`, 'page');
    return { success: true, data: rule };
  } catch (error) {
    logger.error('❌ [createProjectRule] Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create project rule' };
  }
}

export async function updateProjectRule(formData: FormData) {
  try {
    logger.log('📋 [updateProjectRule] Updating rule');
    
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    const data = {
      id: formData.get('id') as string,
      rule: formData.get('rule') as string | undefined,
      isActive: formData.get('isActive') ? formData.get('isActive') === 'true' : undefined,
      order: formData.get('order') ? parseInt(formData.get('order') as string) : undefined,
    };

    const validated = updateProjectRuleSchema.parse(data);

    // Verify rule exists first
    const existingRule = await ProjectRulesDAL.getById(validated.id);
    if (!existingRule) {
      return { success: false, error: 'Rule not found' };
    }

    // ✅ OPTIMIZED: Use JOIN query to verify chain belongs to user's project in one query
    const [chainWithProject] = await db
      .select({
        chain: renderChains,
        project: projects,
      })
      .from(renderChains)
      .innerJoin(projects, eq(renderChains.projectId, projects.id))
      .where(and(
        eq(renderChains.id, existingRule.chainId),
        eq(projects.userId, userId)
      ))
      .limit(1);

    if (!chainWithProject || !chainWithProject.chain) {
      return { success: false, error: 'Chain not found or access denied' };
    }

    const updates: any = {};
    if (validated.rule !== undefined) updates.rule = validated.rule;
    if (validated.isActive !== undefined) updates.isActive = validated.isActive;
    if (validated.order !== undefined) updates.order = validated.order;

    const rule = await ProjectRulesDAL.update(validated.id, updates);
    
    revalidatePath(`/project/[slug]/chain/[chainId]`, 'page');
    return { success: true, data: rule };
  } catch (error) {
    logger.error('❌ [updateProjectRule] Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update project rule' };
  }
}

export async function deleteProjectRule(id: string) {
  try {
    logger.log('📋 [deleteProjectRule] Deleting rule:', id);
    
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    // Verify rule exists first
    const existingRule = await ProjectRulesDAL.getById(id);
    if (!existingRule) {
      return { success: false, error: 'Rule not found' };
    }

    // ✅ OPTIMIZED: Use JOIN query to verify chain belongs to user's project in one query
    const [chainWithProject] = await db
      .select({
        chain: renderChains,
        project: projects,
      })
      .from(renderChains)
      .innerJoin(projects, eq(renderChains.projectId, projects.id))
      .where(and(
        eq(renderChains.id, existingRule.chainId),
        eq(projects.userId, userId)
      ))
      .limit(1);

    if (!chainWithProject || !chainWithProject.chain) {
      return { success: false, error: 'Chain not found or access denied' };
    }

    await ProjectRulesDAL.delete(id);
    
    revalidatePath(`/project/[slug]/chain/[chainId]`, 'page');
    return { success: true };
  } catch (error) {
    logger.error('❌ [deleteProjectRule] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete project rule' };
  }
}

