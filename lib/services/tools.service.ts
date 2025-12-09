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
    // Track analytics
    await ToolsDAL.createAnalyticsEvent({
      toolId: data.toolId,
      userId: data.userId,
      eventType: 'execution_started',
      metadata: {
        projectId: data.projectId,
        hasInputImages: !!data.inputImages?.length,
        hasInputText: !!data.inputText,
      },
    });

    return await ToolsDAL.createExecution(data);
  }

  /**
   * Update tool execution status
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
    const execution = await ToolsDAL.updateExecutionStatus(executionId, status, data?.errorMessage);

    if (execution) {
      // Track analytics
      if (status === 'completed') {
        await ToolsDAL.createAnalyticsEvent({
          toolId: execution.toolId,
          userId: execution.userId,
          executionId: execution.id,
          eventType: 'execution_completed',
          metadata: {
            processingTime: data?.processingTime,
            creditsCost: execution.creditsCost,
          },
        });
      } else if (status === 'failed') {
        await ToolsDAL.createAnalyticsEvent({
          toolId: execution.toolId,
          userId: execution.userId,
          executionId: execution.id,
          eventType: 'execution_failed',
          metadata: {
            errorMessage: data?.errorMessage,
          },
        });
      }

      // Update with additional data if provided
      if (data && (data.outputRenderId || data.outputUrl || data.outputKey || data.outputFileId || data.processingTime)) {
        await ToolsDAL.updateExecution(executionId, {
          ...data,
          status,
        });
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

    // Track analytics
    await ToolsDAL.createAnalyticsEvent({
      toolId: data.toolId,
      userId: data.userId,
      eventType: 'settings_saved',
      metadata: {
        templateId: template.id,
        templateName: data.name,
      },
    });

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
   */
  static async useTemplate(templateId: string) {
    await ToolsDAL.incrementTemplateUsage(templateId);

    const template = await ToolsDAL.getTemplateById(templateId);
    if (template) {
      await ToolsDAL.createAnalyticsEvent({
        toolId: template.toolId,
        userId: template.userId || undefined,
        eventType: 'template_used',
        metadata: {
          templateId: template.id,
        },
      });
    }
  }

  /**
   * Get tool usage statistics
   */
  static async getToolStats(toolId: string, startDate?: Date, endDate?: Date) {
    return await ToolsDAL.getToolUsageStats(toolId, startDate, endDate);
  }
}

