import { db } from '@/lib/db';
import { tools, toolExecutions, toolSettingsTemplates, toolAnalytics } from '@/lib/db/schema';
import { eq, and, desc, sql, inArray, or, like, isNull, ne } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import type { NewTool, NewToolExecution, NewToolSettingsTemplate, NewToolAnalytics } from '@/lib/db/schema';

export interface CreateToolData {
  slug: string;
  name: string;
  description?: string;
  category: 'transformation' | 'floorplan' | 'diagram' | 'material' | 'interior' | '3d' | 'presentation' | 'video';
  systemPrompt: string;
  inputType: 'image' | 'image+text' | 'multiple';
  outputType: 'image' | 'video' | '3d' | 'audio' | 'doc';
  icon?: string;
  color?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'online' | 'offline';
  settingsSchema?: Record<string, any>;
  defaultSettings?: Record<string, any>;
  seoMetadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  metadata?: Record<string, any>;
}

export interface CreateToolExecutionData {
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
}

export interface UpdateToolExecutionData {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  outputRenderId?: string;
  outputUrl?: string;
  outputKey?: string;
  outputFileId?: string;
  errorMessage?: string;
  processingTime?: number;
  startedAt?: Date;
  completedAt?: Date;
}

export class ToolsDAL {
  // ============================================================================
  // TOOLS (Tool Definitions)
  // ============================================================================

  static async create(data: CreateToolData) {
    logger.log('📝 Creating tool:', data.slug);
    
    const [tool] = await db
      .insert(tools)
      .values({
        slug: data.slug,
        name: data.name,
        description: data.description,
        category: data.category,
        systemPrompt: data.systemPrompt,
        inputType: data.inputType,
        outputType: data.outputType,
        icon: data.icon,
        color: data.color,
        priority: data.priority || 'medium',
        status: data.status || 'online',
        settingsSchema: data.settingsSchema,
        defaultSettings: data.defaultSettings,
        seoMetadata: data.seoMetadata,
        metadata: data.metadata,
      })
      .returning();

    logger.log('✅ Tool created:', tool.id);
    return tool;
  }

  static async getById(id: string) {
    const [tool] = await db
      .select()
      .from(tools)
      .where(eq(tools.id, id))
      .limit(1);

    return tool || null;
  }

  static async getBySlug(slug: string) {
    const [tool] = await db
      .select()
      .from(tools)
      .where(eq(tools.slug, slug))
      .limit(1);

    return tool || null;
  }

  static async getAll(includeInactive = false) {
    const whereCondition = includeInactive 
      ? undefined 
      : and(eq(tools.isActive, true), eq(tools.status, 'online'));

    return await db
      .select()
      .from(tools)
      .where(whereCondition)
      .orderBy(tools.priority, tools.name);
  }

  static async getByCategory(category: 'transformation' | 'floorplan' | 'diagram' | 'material' | 'interior' | '3d' | 'presentation' | 'video', includeInactive = false) {
    const whereCondition = includeInactive
      ? eq(tools.category, category)
      : and(
          eq(tools.category, category),
          eq(tools.isActive, true),
          eq(tools.status, 'online')
        );

    return await db
      .select()
      .from(tools)
      .where(whereCondition)
      .orderBy(tools.priority, tools.name);
  }

  static async getByOutputType(outputType: 'image' | 'video' | '3d' | 'audio' | 'doc', includeInactive = false) {
    const whereCondition = includeInactive
      ? eq(tools.outputType, outputType)
      : and(
          eq(tools.outputType, outputType),
          eq(tools.isActive, true),
          eq(tools.status, 'online')
        );

    return await db
      .select()
      .from(tools)
      .where(whereCondition)
      .orderBy(tools.priority, tools.name);
  }

  static async update(id: string, data: Partial<CreateToolData>) {
    const [updated] = await db
      .update(tools)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tools.id, id))
      .returning();

    return updated || null;
  }

  static async delete(id: string) {
    await db
      .update(tools)
      .set({ isActive: false })
      .where(eq(tools.id, id));
  }

  // ============================================================================
  // TOOL EXECUTIONS
  // ============================================================================

  static async createExecution(data: CreateToolExecutionData) {
    logger.log('📝 Creating tool execution:', { toolId: data.toolId, projectId: data.projectId });
    
    const [execution] = await db
      .insert(toolExecutions)
      .values({
        toolId: data.toolId,
        projectId: data.projectId,
        userId: data.userId,
        inputImages: data.inputImages,
        inputText: data.inputText,
        inputSettings: data.inputSettings,
        executionConfig: data.executionConfig,
        creditsCost: data.creditsCost || 0,
        parentExecutionId: data.parentExecutionId,
        batchGroupId: data.batchGroupId,
        batchIndex: data.batchIndex,
        status: 'pending',
      })
      .returning();

    logger.log('✅ Tool execution created:', execution.id);
    return execution;
  }

  static async getExecutionById(id: string) {
    const [execution] = await db
      .select()
      .from(toolExecutions)
      .where(eq(toolExecutions.id, id))
      .limit(1);

    return execution || null;
  }

  static async getExecutionsByTool(toolId: string, userId?: string, limit?: number) {
    const whereCondition = userId
      ? and(eq(toolExecutions.toolId, toolId), eq(toolExecutions.userId, userId))
      : eq(toolExecutions.toolId, toolId);

    const query = db
      .select()
      .from(toolExecutions)
      .where(whereCondition)
      .orderBy(desc(toolExecutions.createdAt));

    return limit ? await query.limit(limit) : await query;
  }

  static async getExecutionsByProject(projectId: string, limit?: number) {
    const query = db
      .select()
      .from(toolExecutions)
      .where(eq(toolExecutions.projectId, projectId))
      .orderBy(desc(toolExecutions.createdAt));

    return limit ? await query.limit(limit) : await query;
  }

  static async getExecutionsByUser(userId: string, limit?: number) {
    const query = db
      .select()
      .from(toolExecutions)
      .where(eq(toolExecutions.userId, userId))
      .orderBy(desc(toolExecutions.createdAt));

    return limit ? await query.limit(limit) : await query;
  }

  static async getBatchExecutions(batchGroupId: string) {
    return await db
      .select()
      .from(toolExecutions)
      .where(eq(toolExecutions.batchGroupId, batchGroupId))
      .orderBy(toolExecutions.batchIndex);
  }

  static async updateExecution(id: string, data: UpdateToolExecutionData) {
    const [updated] = await db
      .update(toolExecutions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(toolExecutions.id, id))
      .returning();

    return updated || null;
  }

  static async updateExecutionStatus(id: string, status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled', errorMessage?: string) {
    const updateData: UpdateToolExecutionData = { status };
    
    if (status === 'processing') {
      updateData.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }
    
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    return await this.updateExecution(id, updateData);
  }

  // ============================================================================
  // TOOL SETTINGS TEMPLATES
  // ============================================================================

  static async createTemplate(data: {
    toolId: string;
    userId?: string;
    name: string;
    description?: string;
    settings: Record<string, any>;
    isDefault?: boolean;
    isPublic?: boolean;
  }) {
    // If setting as default, unset other defaults for this tool/user
    if (data.isDefault) {
      await db
        .update(toolSettingsTemplates)
        .set({ isDefault: false })
        .where(
          and(
            eq(toolSettingsTemplates.toolId, data.toolId),
            data.userId ? eq(toolSettingsTemplates.userId, data.userId) : isNull(toolSettingsTemplates.userId)
          )
        );
    }

    const [template] = await db
      .insert(toolSettingsTemplates)
      .values({
        toolId: data.toolId,
        userId: data.userId,
        name: data.name,
        description: data.description,
        settings: data.settings,
        isDefault: data.isDefault || false,
        isPublic: data.isPublic || false,
      })
      .returning();

    return template;
  }

  static async getTemplateById(id: string) {
    const [template] = await db
      .select()
      .from(toolSettingsTemplates)
      .where(eq(toolSettingsTemplates.id, id))
      .limit(1);

    return template || null;
  }

  static async getTemplatesByTool(toolId: string, userId?: string) {
    const whereCondition = userId
      ? or(
          and(eq(toolSettingsTemplates.toolId, toolId), eq(toolSettingsTemplates.userId, userId)),
          and(eq(toolSettingsTemplates.toolId, toolId), isNull(toolSettingsTemplates.userId), eq(toolSettingsTemplates.isPublic, true))
        )
      : and(eq(toolSettingsTemplates.toolId, toolId), isNull(toolSettingsTemplates.userId), eq(toolSettingsTemplates.isPublic, true));

    return await db
      .select()
      .from(toolSettingsTemplates)
      .where(whereCondition)
      .orderBy(desc(toolSettingsTemplates.isDefault), toolSettingsTemplates.name);
  }

  static async getDefaultTemplate(toolId: string, userId?: string) {
    const whereCondition = userId
      ? or(
          and(eq(toolSettingsTemplates.toolId, toolId), eq(toolSettingsTemplates.userId, userId), eq(toolSettingsTemplates.isDefault, true)),
          and(eq(toolSettingsTemplates.toolId, toolId), isNull(toolSettingsTemplates.userId), eq(toolSettingsTemplates.isDefault, true))
        )
      : and(eq(toolSettingsTemplates.toolId, toolId), isNull(toolSettingsTemplates.userId), eq(toolSettingsTemplates.isDefault, true));

    const [template] = await db
      .select()
      .from(toolSettingsTemplates)
      .where(whereCondition)
      .limit(1);

    return template || null;
  }

  static async updateTemplate(id: string, data: Partial<{
    name: string;
    description: string;
    settings: Record<string, any>;
    isDefault: boolean;
    isPublic: boolean;
  }>) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      const [template] = await db
        .select()
        .from(toolSettingsTemplates)
        .where(eq(toolSettingsTemplates.id, id))
        .limit(1);

      if (template) {
        await db
          .update(toolSettingsTemplates)
          .set({ isDefault: false })
          .where(
            and(
              eq(toolSettingsTemplates.toolId, template.toolId),
              template.userId ? eq(toolSettingsTemplates.userId, template.userId) : isNull(toolSettingsTemplates.userId),
              ne(toolSettingsTemplates.id, id)
            )
          );
      }
    }

    const [updated] = await db
      .update(toolSettingsTemplates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(toolSettingsTemplates.id, id))
      .returning();

    return updated || null;
  }

  static async deleteTemplate(id: string) {
    await db
      .delete(toolSettingsTemplates)
      .where(eq(toolSettingsTemplates.id, id));
  }

  static async incrementTemplateUsage(id: string) {
    await db
      .update(toolSettingsTemplates)
      .set({
        usageCount: sql`${toolSettingsTemplates.usageCount} + 1`,
      })
      .where(eq(toolSettingsTemplates.id, id));
  }

  // ============================================================================
  // TOOL ANALYTICS
  // ============================================================================

  static async createAnalyticsEvent(data: {
    toolId: string;
    userId?: string;
    executionId?: string;
    eventType: 'execution_started' | 'execution_completed' | 'execution_failed' | 'template_used' | 'settings_saved';
    metadata?: Record<string, any>;
  }) {
    const [event] = await db
      .insert(toolAnalytics)
      .values({
        toolId: data.toolId,
        userId: data.userId,
        executionId: data.executionId,
        eventType: data.eventType,
        metadata: data.metadata,
      })
      .returning();

    return event;
  }

  static async getAnalyticsByTool(toolId: string, startDate?: Date, endDate?: Date) {
    const conditions = [eq(toolAnalytics.toolId, toolId)];
    
    if (startDate) {
      conditions.push(sql`${toolAnalytics.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${toolAnalytics.createdAt} <= ${endDate}`);
    }

    return await db
      .select()
      .from(toolAnalytics)
      .where(and(...conditions))
      .orderBy(desc(toolAnalytics.createdAt));
  }

  static async getToolUsageStats(toolId: string, startDate?: Date, endDate?: Date) {
    const conditions = [eq(toolAnalytics.toolId, toolId)];
    
    if (startDate) {
      conditions.push(sql`${toolAnalytics.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${toolAnalytics.createdAt} <= ${endDate}`);
    }

    const stats = await db
      .select({
        eventType: toolAnalytics.eventType,
        count: sql<number>`count(*)::int`,
      })
      .from(toolAnalytics)
      .where(and(...conditions))
      .groupBy(toolAnalytics.eventType);

    return stats;
  }
}

