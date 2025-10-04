import { db } from '@/lib/db';
import { renders, renderChains, galleryItems, users } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ContextData, CreateRenderWithChainData } from '@/lib/types/render-chain';

export interface CreateRenderData {
  projectId?: string | null;
  userId: string;
  type: 'image' | 'video';
  prompt: string;
  settings: {
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    duration?: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chainId?: string;
  chainPosition?: number;
  referenceRenderId?: string;
}

export interface UpdateRenderData {
  outputUrl?: string;
  outputKey?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  processingTime?: number;
}

export class RendersDAL {
  static async create(data: CreateRenderData) {
    console.log('📝 Creating render record:', data);
    
    const [render] = await db
      .insert(renders)
      .values({
        projectId: data.projectId,
        userId: data.userId,
        type: data.type,
        prompt: data.prompt,
        settings: data.settings,
        status: data.status,
        chainId: data.chainId,
        chainPosition: data.chainPosition,
        referenceRenderId: data.referenceRenderId,
      })
      .returning();

    console.log('✅ Render record created:', render.id);
    return render;
  }

  static async getById(id: string) {
    console.log('🔍 Fetching render by ID:', id);
    
    const [render] = await db
      .select()
      .from(renders)
      .where(eq(renders.id, id))
      .limit(1);

    return render;
  }

  static async getByUser(userId: string, projectId?: string | null, limit?: number) {
    console.log('🔍 Fetching renders for user:', userId, 'project:', projectId, 'limit:', limit);
    
    const whereCondition = projectId 
      ? and(eq(renders.userId, userId), eq(renders.projectId, projectId))
      : eq(renders.userId, userId);

    const query = db
      .select()
      .from(renders)
      .where(whereCondition)
      .orderBy(desc(renders.createdAt));

    const userRenders = limit ? await query.limit(limit) : await query;
    console.log(`✅ Found ${userRenders.length} renders for user`);
    return userRenders;
  }

  static async getByProjectId(projectId: string) {
    console.log('🔍 Fetching renders for project:', projectId);
    
    const projectRenders = await db
      .select()
      .from(renders)
      .where(eq(renders.projectId, projectId))
      .orderBy(desc(renders.createdAt));

    console.log(`✅ Found ${projectRenders.length} renders for project`);
    return projectRenders;
  }

  static async updateStatus(id: string, status: 'pending' | 'processing' | 'completed' | 'failed', errorMessage?: string) {
    console.log('🔄 Updating render status:', { id, status, errorMessage });
    
    const [updatedRender] = await db
      .update(renders)
      .set({
        status,
        errorMessage: errorMessage || null,
        updatedAt: new Date(),
      })
      .where(eq(renders.id, id))
      .returning();

    console.log('✅ Render status updated:', updatedRender.id);
    return updatedRender;
  }

  static async updateOutput(
    id: string, 
    outputUrl: string, 
    outputKey: string, 
    status: 'completed' | 'failed',
    processingTime?: number
  ) {
    console.log('🔄 Updating render output:', { id, outputUrl, status, processingTime });
    
    const [updatedRender] = await db
      .update(renders)
      .set({
        outputUrl,
        outputKey,
        status,
        processingTime: processingTime || null,
        updatedAt: new Date(),
      })
      .where(eq(renders.id, id))
      .returning();

    console.log('✅ Render output updated:', updatedRender.id);
    return updatedRender;
  }

  static async delete(id: string) {
    console.log('🗑️ Deleting render:', id);
    
    await db
      .delete(renders)
      .where(eq(renders.id, id));

    console.log('✅ Render deleted:', id);
  }

  static async getByStatus(status: 'pending' | 'processing' | 'completed' | 'failed') {
    console.log('🔍 Fetching renders by status:', status);
    
    const rendersByStatus = await db
      .select()
      .from(renders)
      .where(eq(renders.status, status))
      .orderBy(desc(renders.createdAt));

    console.log(`✅ Found ${rendersByStatus.length} renders with status: ${status}`);
    return rendersByStatus;
  }

  // Version control methods
  static async getByChainId(chainId: string) {
    console.log('🔍 Fetching renders by chain ID:', chainId);
    
    const chainRenders = await db
      .select()
      .from(renders)
      .where(eq(renders.chainId, chainId))
      .orderBy(renders.chainPosition);

    console.log(`✅ Found ${chainRenders.length} renders in chain`);
    return chainRenders;
  }

  static async getWithContext(renderId: string) {
    console.log('🔍 Fetching render with context:', renderId);
    
    const [render] = await db
      .select()
      .from(renders)
      .where(eq(renders.id, renderId))
      .limit(1);

    if (!render) {
      return null;
    }

    // Fetch related renders
    const [parentRender] = render.parentRenderId 
      ? await db.select().from(renders).where(eq(renders.id, render.parentRenderId)).limit(1)
      : [null];

    const [referenceRender] = render.referenceRenderId
      ? await db.select().from(renders).where(eq(renders.id, render.referenceRenderId)).limit(1)
      : [null];

    const [chain] = render.chainId
      ? await db.select().from(renderChains).where(eq(renderChains.id, render.chainId)).limit(1)
      : [null];

    return {
      ...render,
      parentRender,
      referenceRender,
      chain,
    };
  }

  static async updateContext(renderId: string, context: ContextData) {
    console.log('🔄 Updating render context:', { renderId, context });
    
    const [updatedRender] = await db
      .update(renders)
      .set({
        contextData: context,
        updatedAt: new Date(),
      })
      .where(eq(renders.id, renderId))
      .returning();

    console.log('✅ Render context updated:', updatedRender.id);
    return updatedRender;
  }

  static async getReferenceRenders(projectId: string) {
    console.log('🔍 Fetching reference renders for project:', projectId);
    
    const referenceRenders = await db
      .select()
      .from(renders)
      .where(
        and(
          eq(renders.projectId, projectId),
          eq(renders.status, 'completed')
        )
      )
      .orderBy(desc(renders.createdAt));

    console.log(`✅ Found ${referenceRenders.length} reference renders`);
    return referenceRenders;
  }

  static async createWithChain(data: CreateRenderWithChainData) {
    console.log('📝 Creating render with chain context:', data);
    
    const [render] = await db
      .insert(renders)
      .values({
        projectId: data.projectId,
        userId: data.userId,
        type: data.type,
        prompt: data.prompt,
        settings: data.settings,
        status: data.status,
        chainId: data.chainId,
        referenceRenderId: data.referenceRenderId,
        parentRenderId: data.parentRenderId,
        chainPosition: data.chainPosition,
        contextData: data.contextData,
      })
      .returning();

    console.log('✅ Render with chain created:', render.id);
    return render;
  }

  static async getPublicGallery(limit = 20, offset = 0) {
    console.log('🖼️ Fetching public gallery items:', { limit, offset });
    
    const items = await db
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
      .where(eq(galleryItems.isPublic, true))
      .orderBy(desc(galleryItems.createdAt))
      .limit(limit)
      .offset(offset);

    console.log(`✅ Found ${items.length} public gallery items`);
    return items;
  }

  static async addToGallery(renderId: string, userId: string, isPublic: boolean) {
    console.log('📸 Adding render to gallery:', { renderId, userId, isPublic });
    
    const [galleryItem] = await db
      .insert(galleryItems)
      .values({
        renderId,
        userId,
        isPublic,
      })
      .returning();

    console.log('✅ Render added to gallery:', galleryItem.id);
    return galleryItem;
  }

  static async incrementViews(itemId: string) {
    console.log('👁️ Incrementing views for gallery item:', itemId);
    
    await db
      .update(galleryItems)
      .set({
        views: sql`${galleryItems.views} + 1`,
      })
      .where(eq(galleryItems.id, itemId));

    console.log('✅ Views incremented for gallery item:', itemId);
  }

  static async toggleLike(itemId: string, userId: string) {
    console.log('❤️ Toggling like for gallery item:', { itemId, userId });
    
    // For now, just increment likes - in a full implementation,
    // you'd want to track individual user likes to prevent double-liking
    const [updatedItem] = await db
      .update(galleryItems)
      .set({
        likes: sql`${galleryItems.likes} + 1`,
      })
      .where(eq(galleryItems.id, itemId))
      .returning();

    console.log('✅ Like toggled for gallery item:', itemId);
    return {
      likes: updatedItem.likes,
      liked: true, // In a real implementation, check if user already liked
    };
  }
}
