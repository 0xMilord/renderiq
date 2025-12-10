import { ToolsDAL } from '@/lib/dal/tools';
import { logger } from '@/lib/utils/logger';
import type { Tool, ToolExecution } from '@/lib/db/schema';

export class ToolsService {
  /**
   * Get all active tools
   */
  static async getActiveTools(includeInactive = false) {
    return await ToolsDAL.getAll(includeInactive);
  }

  /**
   * Get tool by slug
   */
  static async getToolBySlug(slug: string) {
    return await ToolsDAL.getBySlug(slug);
  }

  /**
   * Get tool by ID
   */
  static async getToolById(id: string) {
    return await ToolsDAL.getById(id);
  }

  /**
   * Get tools by category
   */
  static async getToolsByCategory(category: 'transformation' | 'floorplan' | 'diagram' | 'material' | 'interior' | '3d' | 'presentation' | 'video') {
    return await ToolsDAL.getByCategory(category);
  }

  /**
   * Get tools by output type
   */
  static async getToolsByOutputType(outputType: 'image' | 'video' | '3d' | 'audio' | 'doc') {
    return await ToolsDAL.getByOutputType(outputType);
  }

  /**
   * Create tool execution
   * ✅ OPTIMIZED: Parallelize analytics (fire-and-forget) to reduce blocking
   */
  static async createExecution(data: {
    toolId: string;
    projectId: string;
    userId: string;
    inputImages?: Array<{ fileId?: string; url: string; key?: string }>;
    inputText?: string;
    inputSettings?: Record<string, any>;
    executionConfig: Record<string, any>;
    creditsCost?: number;
    parentExecutionId?: string;
    batchGroupId?: string;
    batchIndex?: number;
  }) {
    // ✅ OPTIMIZED: Parallelize analytics (fire-and-forget) - doesn't block execution creation
    const execution = await ToolsDAL.createExecution(data);
    
    // Fire-and-forget analytics (non-blocking)
    ToolsDAL.createAnalyticsEvent({
      toolId: data.toolId,
      userId: data.userId,
      eventType: 'execution_started',
      metadata: {
        projectId: data.projectId,
        hasInputImages: !!data.inputImages?.length,
        hasInputText: !!data.inputText,
      },
    }).catch(err => logger.warn('Analytics event creation failed (non-critical):', err));

    return execution;
  }

  /**
   * Update tool execution status
   * ✅ OPTIMIZED: Combine updates and parallelize analytics
   */
  static async updateExecutionStatus(
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
    // ✅ OPTIMIZED: Combine all updates into a single call if additional data is provided
    // Otherwise, use the simpler status update
    let execution;
    if (data && (data.outputRenderId || data.outputUrl || data.outputKey || data.outputFileId || data.processingTime)) {
      // Update with all data in one call
      execution = await ToolsDAL.updateExecution(executionId, {
        status,
        ...data,
        errorMessage: data?.errorMessage,
      });
    } else {
      // Simple status update
      execution = await ToolsDAL.updateExecutionStatus(executionId, status, data?.errorMessage);
    }

    if (execution) {
      // ✅ OPTIMIZED: Fire-and-forget analytics (non-blocking)
      if (status === 'completed') {
        ToolsDAL.createAnalyticsEvent({
          toolId: execution.toolId,
          userId: execution.userId,
          executionId: execution.id,
          eventType: 'execution_completed',
          metadata: {
            processingTime: data?.processingTime,
            creditsCost: execution.creditsCost,
          },
        }).catch(err => logger.warn('Analytics event creation failed (non-critical):', err));
      } else if (status === 'failed') {
        ToolsDAL.createAnalyticsEvent({
          toolId: execution.toolId,
          userId: execution.userId,
          executionId: execution.id,
          eventType: 'execution_failed',
          metadata: {
            errorMessage: data?.errorMessage,
          },
        }).catch(err => logger.warn('Analytics event creation failed (non-critical):', err));
      }
    }

    return execution;
  }

  /**
   * Get tool executions for a project
   */
  static async getExecutionsByProject(projectId: string, limit?: number) {
    return await ToolsDAL.getExecutionsByProject(projectId, limit);
  }

  /**
   * Get tool executions for a user
   */
  static async getExecutionsByUser(userId: string, limit?: number) {
    return await ToolsDAL.getExecutionsByUser(userId, limit);
  }

  /**
   * Get tool executions for a specific tool
   */
  static async getExecutionsByTool(toolId: string, userId?: string, limit?: number) {
    return await ToolsDAL.getExecutionsByTool(toolId, userId, limit);
  }

  /**
   * Get batch executions
   */
  static async getBatchExecutions(batchGroupId: string) {
    return await ToolsDAL.getBatchExecutions(batchGroupId);
  }

  /**
   * Create or update tool settings template
   * ✅ OPTIMIZED: Parallelize analytics (fire-and-forget)
   */
  static async saveTemplate(data: {
    toolId: string;
    userId?: string;
    name: string;
    description?: string;
    settings: Record<string, any>;
    isDefault?: boolean;
    isPublic?: boolean;
  }) {
    const template = await ToolsDAL.createTemplate(data);

    // ✅ OPTIMIZED: Fire-and-forget analytics (non-blocking)
    ToolsDAL.createAnalyticsEvent({
      toolId: data.toolId,
      userId: data.userId,
      eventType: 'settings_saved',
      metadata: {
        templateId: template.id,
        templateName: data.name,
      },
    }).catch(err => logger.warn('Analytics event creation failed (non-critical):', err));

    return template;
  }

  /**
   * Get templates for a tool
   */
  static async getTemplates(toolId: string, userId?: string) {
    return await ToolsDAL.getTemplatesByTool(toolId, userId);
  }

  /**
   * Use a template (increment usage count)
   * ✅ OPTIMIZED: Parallelize increment and get, then fire-and-forget analytics
   */
  static async useTemplate(templateId: string) {
    // ✅ OPTIMIZED: Parallelize increment and get template
    const [template] = await Promise.all([
      ToolsDAL.getTemplateById(templateId),
      ToolsDAL.incrementTemplateUsage(templateId),
    ]);

    // ✅ OPTIMIZED: Fire-and-forget analytics (non-blocking)
    if (template) {
      ToolsDAL.createAnalyticsEvent({
        toolId: template.toolId,
        userId: template.userId || undefined,
        eventType: 'template_used',
        metadata: {
          templateId: template.id,
        },
      }).catch(err => logger.warn('Analytics event creation failed (non-critical):', err));
    }
  }

  /**
   * Get tool usage statistics
   */
  static async getToolStats(toolId: string, startDate?: Date, endDate?: Date) {
    return await ToolsDAL.getToolUsageStats(toolId, startDate, endDate);
  }
}

