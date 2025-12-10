'use server';

import { revalidatePath } from 'next/cache';
import { ToolsService } from '@/lib/services/tools.service';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';
import { deductCredits } from '@/lib/actions/billing.actions';
import { createRenderAction } from '@/lib/actions/render.actions';

// ============================================================================
// GET ACTIONS (Internal app operations)
// ============================================================================

export async function getToolsAction(options?: {
  category?: 'transformation' | 'floorplan' | 'diagram' | 'material' | 'interior' | '3d' | 'presentation' | 'video';
  outputType?: 'image' | 'video' | '3d' | 'audio' | 'doc';
  includeInactive?: boolean;
}) {
  try {
    let tools;
    if (options?.category) {
      tools = await ToolsService.getToolsByCategory(options.category);
    } else if (options?.outputType) {
      tools = await ToolsService.getToolsByOutputType(options.outputType);
    } else {
      tools = await ToolsService.getActiveTools(options?.includeInactive);
    }

    return {
      success: true,
      tools,
    };
  } catch (error) {
    logger.error('Error fetching tools:', error);
    return {
      success: false,
      error: 'Failed to fetch tools',
      tools: [],
    };
  }
}

export async function getToolBySlugAction(slug: string) {
  try {
    const tool = await ToolsService.getToolBySlug(slug);
    
    if (!tool) {
      return {
        success: false,
        error: 'Tool not found',
        tool: null,
      };
    }

    return {
      success: true,
      tool,
    };
  } catch (error) {
    logger.error('Error fetching tool:', error);
    return {
      success: false,
      error: 'Failed to fetch tool',
      tool: null,
    };
  }
}

export async function getToolExecutionsAction(options?: {
  projectId?: string;
  toolId?: string;
  limit?: number;
}) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        executions: [],
      };
    }

    let executions;
    if (options?.projectId) {
      executions = await ToolsService.getExecutionsByProject(options.projectId, options.limit);
    } else if (options?.toolId) {
      executions = await ToolsService.getExecutionsByTool(options.toolId, user.id, options.limit);
    } else {
      executions = await ToolsService.getExecutionsByUser(user.id, options?.limit);
    }

    return {
      success: true,
      executions,
    };
  } catch (error) {
    logger.error('Error fetching tool executions:', error);
    return {
      success: false,
      error: 'Failed to fetch tool executions',
      executions: [],
    };
  }
}

// ============================================================================
// CREATE/UPDATE ACTIONS
// ============================================================================

export async function createToolExecutionAction(formData: FormData) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const toolId = formData.get('toolId') as string;
    const projectId = formData.get('projectId') as string;
    const inputImagesStr = formData.get('inputImages') as string | null;
    const inputText = formData.get('inputText') as string | null;
    const inputSettingsStr = formData.get('inputSettings') as string | null;
    const creditsCostStr = formData.get('creditsCost') as string | null;
    const executionConfigStr = formData.get('executionConfig') as string | null;

    if (!toolId || !projectId) {
      return { success: false, error: 'Tool ID and Project ID are required' };
    }

    // Parse JSON fields
    const inputImages = inputImagesStr ? JSON.parse(inputImagesStr) : undefined;
    const inputSettings = inputSettingsStr ? JSON.parse(inputSettingsStr) : undefined;
    const creditsCost = creditsCostStr ? parseInt(creditsCostStr) : 0;
    const executionConfig = executionConfigStr ? JSON.parse(executionConfigStr) : {};

    // Deduct credits
    if (creditsCost > 0) {
      const deductResult = await deductCredits(
        creditsCost,
        `Tool execution - ${toolId}`,
        undefined,
        'render'
      );

      if (!deductResult.success) {
        return { success: false, error: deductResult.error || 'Insufficient credits' };
      }
    }

    // Create tool execution
    const execution = await ToolsService.createExecution({
      toolId,
      projectId,
      userId: user.id,
      inputImages,
      inputText: inputText || undefined,
      inputSettings,
      executionConfig,
      creditsCost,
    });

    // Update status to processing
    await ToolsService.updateExecutionStatus(execution.id, 'processing');

    // Create render (if needed) - this will be handled by the tool-specific logic
    // For now, we'll create the execution and let the caller handle render creation

    revalidatePath('/apps');
    revalidatePath(`/apps/${toolId}`);

    return {
      success: true,
      data: {
        executionId: execution.id,
        execution,
      },
    };
  } catch (error) {
    logger.error('Error creating tool execution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create tool execution',
    };
  }
}

export async function updateToolExecutionAction(
  executionId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
  data?: {
    outputRenderId?: string;
    outputUrl?: string;
    outputKey?: string;
    outputFileId?: string;
    errorMessage?: string;
    processingTime?: number;
  }
) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const execution = await ToolsService.updateExecutionStatus(executionId, status, data);

    if (!execution) {
      return { success: false, error: 'Execution not found' };
    }

    revalidatePath('/apps');
    revalidatePath(`/apps/${execution.toolId}`);

    return {
      success: true,
      data: execution,
    };
  } catch (error) {
    logger.error('Error updating tool execution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update tool execution',
    };
  }
}

export async function saveToolTemplateAction(formData: FormData) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const toolId = formData.get('toolId') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const settingsStr = formData.get('settings') as string;
    const isDefault = formData.get('isDefault') === 'true';
    const isPublic = formData.get('isPublic') === 'true';

    if (!toolId || !name || !settingsStr) {
      return { success: false, error: 'Tool ID, name, and settings are required' };
    }

    const settings = JSON.parse(settingsStr);

    const template = await ToolsService.saveTemplate({
      toolId,
      userId: user.id,
      name,
      description: description || undefined,
      settings,
      isDefault,
      isPublic,
    });

    revalidatePath('/apps');
    revalidatePath(`/apps/${toolId}`);

    return {
      success: true,
      data: template,
    };
  } catch (error) {
    logger.error('Error saving tool template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save tool template',
    };
  }
}

