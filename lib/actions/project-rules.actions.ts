'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ProjectRulesDAL } from '@/lib/dal/project-rules';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { ProjectsDAL } from '@/lib/dal/projects';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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
    
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify chain belongs to user's project
    const chain = await RenderChainsDAL.getById(chainId);
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== user.id) {
      return { success: false, error: 'Access denied' };
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
    
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify chain belongs to user's project
    const chain = await RenderChainsDAL.getById(chainId);
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== user.id) {
      return { success: false, error: 'Access denied' };
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
    
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const data = {
      chainId: formData.get('chainId') as string,
      rule: formData.get('rule') as string,
      isActive: formData.get('isActive') === 'true',
      order: parseInt(formData.get('order') as string) || 0,
    };

    const validated = createProjectRuleSchema.parse(data);

    // Verify chain belongs to user's project
    const chain = await RenderChainsDAL.getById(validated.chainId);
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== user.id) {
      return { success: false, error: 'Access denied' };
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
    
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const data = {
      id: formData.get('id') as string,
      rule: formData.get('rule') as string | undefined,
      isActive: formData.get('isActive') ? formData.get('isActive') === 'true' : undefined,
      order: formData.get('order') ? parseInt(formData.get('order') as string) : undefined,
    };

    const validated = updateProjectRuleSchema.parse(data);

    // Verify rule belongs to user's project
    const existingRule = await ProjectRulesDAL.getById(validated.id);
    if (!existingRule) {
      return { success: false, error: 'Rule not found' };
    }

    const chain = await RenderChainsDAL.getById(existingRule.chainId);
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== user.id) {
      return { success: false, error: 'Access denied' };
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
    
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify rule belongs to user's project
    const existingRule = await ProjectRulesDAL.getById(id);
    if (!existingRule) {
      return { success: false, error: 'Rule not found' };
    }

    const chain = await RenderChainsDAL.getById(existingRule.chainId);
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== user.id) {
      return { success: false, error: 'Access denied' };
    }

    await ProjectRulesDAL.delete(id);
    
    revalidatePath(`/project/[slug]/chain/[chainId]`, 'page');
    return { success: true };
  } catch (error) {
    logger.error('❌ [deleteProjectRule] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete project rule' };
  }
}

