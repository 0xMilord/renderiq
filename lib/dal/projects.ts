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

  static async getByUserId(userId: string, limit = 20, offset = 0): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);
  }

  static async updateStatus(id: string, status: 'processing' | 'completed' | 'failed'): Promise<void> {
    await db
      .update(projects)
      .set({ status, updatedAt: new Date() })
      .where(eq(projects.id, id));
  }

  static async delete(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }
}

export class RendersDAL {
  static async create(render: NewRender): Promise<Render> {
    const [newRender] = await db.insert(renders).values(render).returning();
    return newRender;
  }

  static async getById(id: string): Promise<Render | null> {
    const [render] = await db.select().from(renders).where(eq(renders.id, id));
    return render || null;
  }

  static async getByUser(userId: string, projectId?: string | null, limit = 20, offset = 0): Promise<Render[]> {
    const whereClause = projectId 
      ? and(eq(renders.userId, userId), eq(renders.projectId, projectId))
      : eq(renders.userId, userId);
    
    return db
      .select()
      .from(renders)
      .where(whereClause)
      .orderBy(desc(renders.createdAt))
      .limit(limit)
      .offset(offset);
  }

  static async getByProjectId(projectId: string): Promise<Render[]> {
    return db
      .select()
      .from(renders)
      .where(eq(renders.projectId, projectId))
      .orderBy(desc(renders.createdAt));
  }

  static async updateStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    outputUrl?: string,
    outputKey?: string,
    errorMessage?: string,
    processingTime?: number
  ): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (outputUrl) updateData.outputUrl = outputUrl;
    if (outputKey) updateData.outputKey = outputKey;
    if (errorMessage) updateData.errorMessage = errorMessage;
    if (processingTime) updateData.processingTime = processingTime;

    await db.update(renders).set(updateData).where(eq(renders.id, id));
  }

  static async updateOutput(
    id: string,
    outputUrl: string,
    outputKey: string,
    status: 'completed' | 'failed',
    processingTime?: number,
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = { 
      outputUrl, 
      outputKey, 
      status, 
      completedAt: new Date(),
      updatedAt: new Date() 
    };
    if (processingTime) updateData.processingTime = processingTime;
    if (errorMessage) updateData.errorMessage = errorMessage;

    await db.update(renders).set(updateData).where(eq(renders.id, id));
  }

  static async getPublicGallery(limit = 20, offset = 0) {
    return db
      .select({
        id: galleryItems.id,
        renderId: galleryItems.renderId,
        userId: galleryItems.userId,
        isPublic: galleryItems.isPublic,
        likes: galleryItems.likes,
        views: galleryItems.views,
        createdAt: galleryItems.createdAt,
        render: {
          id: renders.id,
          type: renders.type,
          prompt: renders.prompt,
          outputUrl: renders.outputUrl,
          status: renders.status,
          createdAt: renders.createdAt,
        },
        user: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        },
      })
      .from(galleryItems)
      .innerJoin(renders, eq(galleryItems.renderId, renders.id))
      .innerJoin(users, eq(galleryItems.userId, users.id))
      .where(and(eq(galleryItems.isPublic, true), eq(renders.status, 'completed')))
      .orderBy(desc(galleryItems.createdAt))
      .limit(limit)
      .offset(offset);
  }

  static async incrementViews(id: string): Promise<void> {
    await db
      .update(galleryItems)
      .set({ views: sql`${galleryItems.views} + 1` })
      .where(eq(galleryItems.id, id));
  }

  static async addToGallery(renderId: string, userId: string, isPublic: boolean): Promise<void> {
    await db.insert(galleryItems).values({
      renderId,
      userId,
      isPublic,
      likes: 0,
      views: 0,
      featured: false,
    });
  }

  static async toggleLike(id: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    // This is a simplified implementation
    // In a real app, you'd want a separate likes table
    const [item] = await db.select().from(galleryItems).where(eq(galleryItems.id, id));
    if (!item) throw new Error('Gallery item not found');

    const newLikes = item.likes + 1;
    await db.update(galleryItems).set({ likes: newLikes }).where(eq(galleryItems.id, id));
    
    return { liked: true, likes: newLikes };
  }
}
