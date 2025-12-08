import { db } from '@/lib/db';
import { projects, renders, users, galleryItems } from '@/lib/db/schema';
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
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const [existing] = await db
      .select()
      .from(projects)
      .where(
        excludeId 
          ? and(eq(projects.slug, slug), sql`${projects.id} != ${excludeId}`)
          : eq(projects.slug, slug)
      );
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
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

  static async getBySlug(slug: string): Promise<Project | null> {
    const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
    return project || null;
  }

  static async getByUserId(userId: string, limit = 100, offset = 0): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
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

