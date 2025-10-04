import { db } from '@/lib/db';
import { projects, renders, users, galleryItems } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { NewProject, Project, NewRender, Render } from '@/lib/db/schema';

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
    console.log('📊 [ProjectsDAL] Fetching projects with render counts for user:', userId);
    
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

    console.log(`✅ [ProjectsDAL] Found ${projectsWithCounts.length} projects with render counts`);
    return projectsWithCounts;
  }

  static async updateStatus(id: string, status: 'processing' | 'completed' | 'failed'): Promise<void> {
    await db
      .update(projects)
      .set({ status, updatedAt: new Date() })
      .where(eq(projects.id, id));
  }

  static async getLatestRenders(projectId: string, limit = 4) {
    console.log('🖼️ [ProjectsDAL] Fetching latest renders for project:', projectId);
    
    const latestRenders = await db
      .select({
        id: renders.id,
        outputUrl: renders.outputUrl,
        status: renders.status,
        type: renders.type,
        createdAt: renders.createdAt,
      })
      .from(renders)
      .where(eq(renders.projectId, projectId))
      .orderBy(desc(renders.createdAt))
      .limit(limit);

    console.log(`✅ [ProjectsDAL] Found ${latestRenders.length} latest renders for project`);
    return latestRenders;
  }

  static async delete(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }
}

