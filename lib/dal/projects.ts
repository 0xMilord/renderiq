import { db } from '@/lib/db';
import { projects, renders, users, galleryItems, toolExecutions, canvasFiles, tools } from '@/lib/db/schema';
import { eq, desc, and, sql, inArray, ne } from 'drizzle-orm';
import type { NewProject, Project, NewRender, Render } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';

// Helper function to generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// Helper function to ensure unique slug
// ✅ OPTIMIZED: Use timestamp-based slug generation to avoid sequential queries
// Falls back to conflict handling if timestamp collision occurs
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  // First try with timestamp to avoid most collisions
  const timestampSlug = `${baseSlug}-${Date.now().toString(36)}`;
  
  const [existingTimestamp] = await db
    .select()
    .from(projects)
    .where(
      excludeId 
        ? and(eq(projects.slug, timestampSlug), sql`${projects.id} != ${excludeId}`)
        : eq(projects.slug, timestampSlug)
    )
    .limit(1);
  
  if (!existingTimestamp) {
    return timestampSlug;
  }
  
  // Fallback to counter-based approach if timestamp collision (rare)
  let slug = baseSlug;
  let counter = 1;
  
  while (counter < 100) { // Safety limit
    const [existing] = await db
      .select()
      .from(projects)
      .where(
        excludeId 
          ? and(eq(projects.slug, slug), sql`${projects.id} != ${excludeId}`)
          : eq(projects.slug, slug)
      )
      .limit(1);
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  // Last resort: timestamp + counter
  return `${baseSlug}-${Date.now()}-${counter}`;
}

export class ProjectsDAL {
  static async create(projectData: Omit<NewProject, 'slug'>): Promise<Project> {
    // Generate unique slug from project name
    const baseSlug = generateSlug(projectData.name);
    const slug = await ensureUniqueSlug(baseSlug);
    
    const project: NewProject = {
      ...projectData,
      slug,
    };
    
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  static async getById(id: string): Promise<Project | null> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || null;
  }

  /**
   * ✅ OPTIMIZED: Batch get projects by IDs in ONE query
   * This replaces sequential calls to getById for each project
   */
  static async getByIds(ids: string[]): Promise<Project[]> {
    if (ids.length === 0) return [];
    
    logger.log('🔍 [BATCH] Fetching', ids.length, 'projects by IDs');
    
    const projectList = await db
      .select()
      .from(projects)
      .where(inArray(projects.id, ids));

    logger.log(`✅ [BATCH] Found ${projectList.length} projects`);
    return projectList;
  }

  static async getBySlug(slug: string): Promise<Project | null> {
    const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
    return project || null;
  }

  static async getByUserId(userId: string, limit = 100, offset = 0, platform?: 'render' | 'tools' | 'canvas'): Promise<Project[]> {
    const conditions = platform 
      ? and(eq(projects.userId, userId), eq(projects.platform, platform))
      : eq(projects.userId, userId);
    
    return db
      .select()
      .from(projects)
      .where(conditions)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);
  }

  static async getByUserIdWithRenderCounts(userId: string, limit = 20, offset = 0) {
    logger.log('📊 [ProjectsDAL] Fetching projects with render counts for user:', userId);
    
    const projectsWithCounts = await db
      .select({
        id: projects.id,
        userId: projects.userId,
        name: projects.name,
        slug: projects.slug,
        description: projects.description,
        originalImageId: projects.originalImageId,
        status: projects.status,
        isPublic: projects.isPublic,
        tags: projects.tags,
        metadata: projects.metadata,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        renderCount: sql<number>`COALESCE(COUNT(${renders.id}), 0)`.as('renderCount'),
      })
      .from(projects)
      .leftJoin(renders, eq(projects.id, renders.projectId))
      .where(eq(projects.userId, userId))
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    logger.log(`✅ [ProjectsDAL] Found ${projectsWithCounts.length} projects with render counts`);
    return projectsWithCounts;
  }

  /**
   * ✅ NEW: Get projects with platform and tool information for categorization
   * Returns projects with:
   * - Render count (by platform)
   * - Tool execution count
   * - Canvas file count
   * - Primary platform (most used)
   * - Tool categories used
   */
  static async getByUserIdWithPlatformInfo(userId: string, limit = 100, offset = 0) {
    logger.log('📊 [ProjectsDAL] Fetching projects with platform info for user:', userId);
    
    const projectsWithPlatformInfo = await db
      .select({
        id: projects.id,
        userId: projects.userId,
        name: projects.name,
        slug: projects.slug,
        description: projects.description,
        originalImageId: projects.originalImageId,
        status: projects.status,
        isPublic: projects.isPublic,
        tags: projects.tags,
        metadata: projects.metadata,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        // Render counts by platform
        renderCount: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${renders.id} IS NOT NULL THEN ${renders.id} END), 0)`.as('renderCount'),
        renderPlatformCount: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${renders.platform} = 'render' THEN ${renders.id} END), 0)`.as('renderPlatformCount'),
        toolsPlatformCount: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${renders.platform} = 'tools' THEN ${renders.id} END), 0)`.as('toolsPlatformCount'),
        canvasPlatformCount: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${renders.platform} = 'canvas' THEN ${renders.id} END), 0)`.as('canvasPlatformCount'),
        // Tool execution count
        toolExecutionCount: sql<number>`COALESCE(COUNT(DISTINCT ${toolExecutions.id}), 0)`.as('toolExecutionCount'),
        // Canvas file count
        canvasFileCount: sql<number>`COALESCE(COUNT(DISTINCT ${canvasFiles.id}), 0)`.as('canvasFileCount'),
      })
      .from(projects)
      .leftJoin(renders, eq(projects.id, renders.projectId))
      .leftJoin(toolExecutions, eq(projects.id, toolExecutions.projectId))
      .leftJoin(canvasFiles, eq(projects.id, canvasFiles.projectId))
      .where(eq(projects.userId, userId))
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    // Get tool categories for each project
    const projectIds = projectsWithPlatformInfo.map(p => p.id);
    const toolCategoriesByProject = projectIds.length > 0 ? await db
      .select({
        projectId: toolExecutions.projectId,
        toolCategory: tools.category,
      })
      .from(toolExecutions)
      .innerJoin(tools, eq(toolExecutions.toolId, tools.id))
      .where(inArray(toolExecutions.projectId, projectIds))
      .groupBy(toolExecutions.projectId, tools.category) : [];

    // Group categories by project
    const categoriesByProject = toolCategoriesByProject.reduce((acc, row) => {
      if (!acc[row.projectId]) {
        acc[row.projectId] = [];
      }
      if (!acc[row.projectId].includes(row.toolCategory)) {
        acc[row.projectId].push(row.toolCategory);
      }
      return acc;
    }, {} as Record<string, string[]>);

    // Determine primary platform for each project
    const projectsWithInfo = projectsWithPlatformInfo.map(project => {
      const renderCount = Number(project.renderCount || 0);
      const toolExecutionCount = Number(project.toolExecutionCount || 0);
      const canvasFileCount = Number(project.canvasFileCount || 0);
      const renderPlatformCount = Number(project.renderPlatformCount || 0);
      const toolsPlatformCount = Number(project.toolsPlatformCount || 0);
      const canvasPlatformCount = Number(project.canvasPlatformCount || 0);

      // Determine primary platform based on activity
      let primaryPlatform: 'render' | 'tools' | 'canvas' | null = null;
      if (toolExecutionCount > 0 || toolsPlatformCount > 0) {
        primaryPlatform = 'tools';
      } else if (canvasFileCount > 0 || canvasPlatformCount > 0) {
        primaryPlatform = 'canvas';
      } else if (renderPlatformCount > 0) {
        primaryPlatform = 'render';
      }

      return {
        ...project,
        renderCount,
        toolExecutionCount,
        canvasFileCount,
        primaryPlatform,
        toolCategories: categoriesByProject[project.id] || [],
      };
    });

    logger.log(`✅ [ProjectsDAL] Found ${projectsWithInfo.length} projects with platform info`);
    return projectsWithInfo;
  }

  static async updateStatus(id: string, status: 'processing' | 'completed' | 'failed'): Promise<void> {
    await db
      .update(projects)
      .set({ status, updatedAt: new Date() })
      .where(eq(projects.id, id));
  }

  static async update(id: string, updateData: {
    name?: string;
    description?: string | null;
    isPublic?: boolean;
    tags?: string[] | null;
    metadata?: Record<string, any> | null;
  }): Promise<Project> {
    const updateFields: any = {
      updatedAt: new Date(),
    };

    // Update name and regenerate slug if name changed
    if (updateData.name !== undefined) {
      updateFields.name = updateData.name;
      const baseSlug = generateSlug(updateData.name);
      updateFields.slug = await ensureUniqueSlug(baseSlug, id);
    }

    if (updateData.description !== undefined) {
      updateFields.description = updateData.description;
    }

    if (updateData.isPublic !== undefined) {
      updateFields.isPublic = updateData.isPublic;
    }

    if (updateData.tags !== undefined) {
      updateFields.tags = updateData.tags;
    }

    if (updateData.metadata !== undefined) {
      updateFields.metadata = updateData.metadata;
    }

    const [updatedProject] = await db
      .update(projects)
      .set(updateFields)
      .where(eq(projects.id, id))
      .returning();

    return updatedProject;
  }

  static async getLatestRenders(projectId: string, limit = 4) {
    logger.log('🖼️ [ProjectsDAL] Fetching latest renders for project:', projectId);
    
    const latestRenders = await db
      .select({
        id: renders.id,
        projectId: renders.projectId,
        outputUrl: renders.outputUrl,
        status: renders.status,
        type: renders.type,
        createdAt: renders.createdAt,
      })
      .from(renders)
      .where(
        and(
          eq(renders.projectId, projectId),
          ne(renders.status, 'failed') // Exclude failed renders
        )
      )
      .orderBy(desc(renders.createdAt))
      .limit(limit);

    logger.log(`✅ [ProjectsDAL] Found ${latestRenders.length} latest renders (excluding failed) for project`);
    return latestRenders;
  }

  // Batch method: Get latest renders for multiple projects in ONE query
  static async getLatestRendersForProjects(projectIds: string[], limitPerProject = 4) {
    logger.log('🖼️ [ProjectsDAL] Batch fetching latest renders for', projectIds.length, 'projects');
    
    if (projectIds.length === 0) {
      return [];
    }

    // Use window functions to get top N renders per project, excluding failed renders
    const latestRenders = await db
      .select({
        id: renders.id,
        projectId: renders.projectId,
        outputUrl: renders.outputUrl,
        status: renders.status,
        type: renders.type,
        createdAt: renders.createdAt,
        rowNum: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${renders.projectId} ORDER BY ${renders.createdAt} DESC)`.as('row_num'),
      })
      .from(renders)
      .where(
        and(
          inArray(renders.projectId, projectIds),
          ne(renders.status, 'failed') // Exclude failed renders
        )
      )
      .orderBy(desc(renders.createdAt));

    // Filter to only include top N per project
    const filtered = latestRenders.filter(r => r.rowNum <= limitPerProject);

    logger.log(`✅ [ProjectsDAL] Found ${filtered.length} total renders (excluding failed) for ${projectIds.length} projects`);
    return filtered;
  }

  static async delete(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }
}

