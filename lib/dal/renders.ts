import { db } from '@/lib/db';
import { renders, renderChains, galleryItems, users, userLikes } from '@/lib/db/schema';
import { eq, and, desc, sql, inArray, ne, or, like } from 'drizzle-orm';
import { ContextData, CreateRenderWithChainData } from '@/lib/types/render-chain';
import { logger } from '@/lib/utils/logger';

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
  uploadedImageUrl?: string;
  uploadedImageKey?: string;
  uploadedImageId?: string;
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
    logger.log('📝 Creating render record:', data);
    
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
        uploadedImageUrl: data.uploadedImageUrl,
        uploadedImageKey: data.uploadedImageKey,
        uploadedImageId: data.uploadedImageId,
      })
      .returning();

    logger.log('✅ Render record created:', render.id);
    return render;
  }

  static async getById(id: string) {
    logger.log('🔍 Fetching render by ID:', id);
    
    const [render] = await db
      .select()
      .from(renders)
      .where(eq(renders.id, id))
      .limit(1);

    return render;
  }

  static async getByUser(userId: string, projectId?: string | null, limit?: number) {
    logger.log('🔍 Fetching renders for user:', userId, 'project:', projectId, 'limit:', limit);
    
    const whereCondition = projectId 
      ? and(eq(renders.userId, userId), eq(renders.projectId, projectId))
      : eq(renders.userId, userId);

    const query = db
      .select()
      .from(renders)
      .where(whereCondition)
      .orderBy(desc(renders.createdAt));

    const userRenders = limit ? await query.limit(limit) : await query;
    logger.log(`✅ Found ${userRenders.length} renders for user`);
    return userRenders;
  }

  static async getByProjectId(projectId: string) {
    logger.log('🔍 Fetching renders for project:', projectId);
    
    const projectRenders = await db
      .select()
      .from(renders)
      .where(eq(renders.projectId, projectId))
      .orderBy(desc(renders.createdAt));

    logger.log(`✅ Found ${projectRenders.length} renders for project`);
    return projectRenders;
  }

  static async updateStatus(id: string, status: 'pending' | 'processing' | 'completed' | 'failed', errorMessage?: string) {
    logger.log('🔄 Updating render status:', { id, status, errorMessage });
    
    const [updatedRender] = await db
      .update(renders)
      .set({
        status,
        errorMessage: errorMessage || null,
        updatedAt: new Date(),
      })
      .where(eq(renders.id, id))
      .returning();

    logger.log('✅ Render status updated:', updatedRender.id);
    return updatedRender;
  }

  static async updateOutput(
    id: string, 
    outputUrl: string, 
    outputKey: string, 
    status: 'completed' | 'failed',
    processingTime?: number
  ) {
    logger.log('🔄 Updating render output:', { id, outputUrl, status, processingTime });
    
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

    logger.log('✅ Render output updated:', updatedRender.id);
    return updatedRender;
  }

  static async delete(id: string) {
    logger.log('🗑️ Deleting render:', id);
    
    await db
      .delete(renders)
      .where(eq(renders.id, id));

    logger.log('✅ Render deleted:', id);
  }

  static async getByStatus(status: 'pending' | 'processing' | 'completed' | 'failed') {
    logger.log('🔍 Fetching renders by status:', status);
    
    const rendersByStatus = await db
      .select()
      .from(renders)
      .where(eq(renders.status, status))
      .orderBy(desc(renders.createdAt));

    logger.log(`✅ Found ${rendersByStatus.length} renders with status: ${status}`);
    return rendersByStatus;
  }

  // Version control methods
  static async getByChainId(chainId: string) {
    logger.log('🔍 RendersDAL.getByChainId: Fetching renders for chain:', chainId);
    
    const chainRenders = await db
      .select()
      .from(renders)
      .where(eq(renders.chainId, chainId))
      .orderBy(renders.chainPosition);

    logger.log(`✅ RendersDAL.getByChainId: Found ${chainRenders.length} renders in chain`, {
      chainId,
      rendersCount: chainRenders.length,
      renderDetails: chainRenders.map(r => ({
        id: r.id,
        prompt: r.prompt?.substring(0, 50) + '...',
        status: r.status,
        chainPosition: r.chainPosition,
        type: r.type,
        hasOutputUrl: !!r.outputUrl,
        outputUrl: r.outputUrl?.substring(0, 50) + '...',
        createdAt: r.createdAt
      }))
    });
    return chainRenders;
  }

  /**
   * Get render with all related context data
   * ✅ OPTIMIZED: Parallelized queries instead of sequential
   * Note: Could be further optimized with SQL JOINs if needed
   */
  static async getWithContext(renderId: string) {
    logger.log('🔍 Fetching render with context:', renderId);
    
    const [render] = await db
      .select()
      .from(renders)
      .where(eq(renders.id, renderId))
      .limit(1);

    if (!render) {
      return null;
    }

    // ✅ OPTIMIZED: Parallelize related data fetching
    const [parentRender, referenceRender, chain] = await Promise.all([
      render.parentRenderId 
        ? db.select().from(renders).where(eq(renders.id, render.parentRenderId)).limit(1).then(r => r[0] || null)
        : Promise.resolve(null),
      render.referenceRenderId
        ? db.select().from(renders).where(eq(renders.id, render.referenceRenderId)).limit(1).then(r => r[0] || null)
        : Promise.resolve(null),
      render.chainId
        ? db.select().from(renderChains).where(eq(renderChains.id, render.chainId)).limit(1).then(r => r[0] || null)
        : Promise.resolve(null),
    ]);

    return {
      ...render,
      parentRender,
      referenceRender,
      chain,
    };
  }

  static async updateContext(renderId: string, context: ContextData) {
    logger.log('🔄 Updating render context:', { renderId, context });
    
    const [updatedRender] = await db
      .update(renders)
      .set({
        contextData: context,
        updatedAt: new Date(),
      })
      .where(eq(renders.id, renderId))
      .returning();

    logger.log('✅ Render context updated:', updatedRender.id);
    return updatedRender;
  }

  static async getReferenceRenders(projectId: string) {
    logger.log('🔍 Fetching reference renders for project:', projectId);
    
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

    logger.log(`✅ Found ${referenceRenders.length} reference renders`);
    return referenceRenders;
  }

  static async createWithChain(data: CreateRenderWithChainData) {
    logger.log('📝 Creating render with chain context:', data);
    
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

    logger.log('✅ Render with chain created:', render.id);
    return render;
  }

  static async getPublicGallery(limit = 20, offset = 0) {
    logger.log('🖼️ Fetching public gallery items:', { limit, offset });
    
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
          settings: renders.settings,
          outputUrl: renders.outputUrl,
          status: renders.status,
          processingTime: renders.processingTime,
          uploadedImageUrl: renders.uploadedImageUrl,
          uploadedImageKey: renders.uploadedImageKey,
          uploadedImageId: renders.uploadedImageId,
          projectId: renders.projectId,
          chainId: renders.chainId,
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

    logger.log(`✅ Found ${items.length} public gallery items`);
    return items;
  }

  /**
   * Get multiple renders by IDs in ONE query
   * ✅ OPTIMIZED: Batch operation for bulk render fetching
   */
  static async getByIds(ids: string[]) {
    if (ids.length === 0) return [];
    
    logger.log('🔍 Batch fetching', ids.length, 'renders by IDs');
    
    const batchRenders = await db
      .select()
      .from(renders)
      .where(inArray(renders.id, ids))
      .orderBy(desc(renders.createdAt));

    logger.log(`✅ Found ${batchRenders.length} renders`);
    return batchRenders;
  }

  /**
   * Batch update render statuses in ONE query
   * ✅ OPTIMIZED: Update multiple renders at once
   */
  static async updateStatusBatch(
    renderIds: string[],
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ) {
    if (renderIds.length === 0) return;
    
    logger.log('🔄 Batch updating', renderIds.length, 'render statuses to:', status);
    
    await db
      .update(renders)
      .set({
        status,
        errorMessage: errorMessage || null,
        updatedAt: new Date(),
      })
      .where(inArray(renders.id, renderIds));

    logger.log('✅ Batch status update completed');
  }

  static async addToGallery(renderId: string, userId: string, isPublic: boolean) {
    logger.log('📸 Adding render to gallery:', { renderId, userId, isPublic });
    
    const [galleryItem] = await db
      .insert(galleryItems)
      .values({
        renderId,
        userId,
        isPublic,
      })
      .returning();

    logger.log('✅ Render added to gallery:', galleryItem.id);
    return galleryItem;
  }

  static async incrementViews(itemId: string) {
    logger.log('👁️ Incrementing views for gallery item:', itemId);
    
    await db
      .update(galleryItems)
      .set({
        views: sql`${galleryItems.views} + 1`,
      })
      .where(eq(galleryItems.id, itemId));

    logger.log('✅ Views incremented for gallery item:', itemId);
  }

  static async hasUserLiked(itemId: string, userId: string): Promise<boolean> {
    const like = await db
      .select()
      .from(userLikes)
      .where(and(
        eq(userLikes.galleryItemId, itemId),
        eq(userLikes.userId, userId)
      ))
      .limit(1);
    
    return like.length > 0;
  }

  static async toggleLike(itemId: string, userId: string) {
    logger.log('❤️ Toggling like for gallery item:', { itemId, userId });
    
    // Check if user already liked this item
    const alreadyLiked = await this.hasUserLiked(itemId, userId);
    
    if (alreadyLiked) {
      // Unlike: remove the like record and decrement count
      await db
        .delete(userLikes)
        .where(and(
          eq(userLikes.galleryItemId, itemId),
          eq(userLikes.userId, userId)
        ));
      
      const [updatedItem] = await db
        .update(galleryItems)
        .set({
          likes: sql`GREATEST(${galleryItems.likes} - 1, 0)`,
        })
        .where(eq(galleryItems.id, itemId))
        .returning();

      logger.log('✅ Like removed for gallery item:', itemId);
      return {
        likes: updatedItem.likes,
        liked: false,
      };
    } else {
      // Like: add the like record and increment count
      await db.insert(userLikes).values({
        userId,
        galleryItemId: itemId,
      });
      
      const [updatedItem] = await db
        .update(galleryItems)
        .set({
          likes: sql`${galleryItems.likes} + 1`,
        })
        .where(eq(galleryItems.id, itemId))
        .returning();

      logger.log('✅ Like added for gallery item:', itemId);
      return {
        likes: updatedItem.likes,
        liked: true,
      };
    }
  }

  static async getGalleryItemById(itemId: string) {
    logger.log('🔍 Fetching gallery item by ID:', itemId);
    
    const [item] = await db
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
          settings: renders.settings,
          outputUrl: renders.outputUrl,
          status: renders.status,
          processingTime: renders.processingTime,
          uploadedImageUrl: renders.uploadedImageUrl,
          uploadedImageKey: renders.uploadedImageKey,
          uploadedImageId: renders.uploadedImageId,
          projectId: renders.projectId,
          chainId: renders.chainId,
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
      .where(and(
        eq(galleryItems.id, itemId),
        eq(galleryItems.isPublic, true)
      ))
      .limit(1);

    if (!item) {
      logger.log('❌ Gallery item not found:', itemId);
      return null;
    }

    logger.log('✅ Gallery item found:', itemId);
    return item;
  }

  static async getSimilarGalleryItems(
    excludeItemId: string,
    criteria: {
      style?: string;
      quality?: string;
      aspectRatio?: string;
      promptKeywords?: string[];
    },
    limit = 12
  ) {
    logger.log('🔍 Finding similar gallery items:', { excludeItemId, criteria });
    
    // Build conditions for similarity
    const conditions = [ne(galleryItems.id, excludeItemId), eq(galleryItems.isPublic, true)];
    
    // Add style match condition
    if (criteria.style) {
      conditions.push(
        sql`${renders.settings}->>'style' = ${criteria.style}`
      );
    }
    
    // Add quality match condition
    if (criteria.quality) {
      conditions.push(
        sql`${renders.settings}->>'quality' = ${criteria.quality}`
      );
    }
    
    // Add aspect ratio match condition
    if (criteria.aspectRatio) {
      conditions.push(
        sql`${renders.settings}->>'aspectRatio' = ${criteria.aspectRatio}`
      );
    }
    
    // Get items matching criteria
    let items = await db
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
          settings: renders.settings,
          outputUrl: renders.outputUrl,
          status: renders.status,
          processingTime: renders.processingTime,
          uploadedImageUrl: renders.uploadedImageUrl,
          uploadedImageKey: renders.uploadedImageKey,
          uploadedImageId: renders.uploadedImageId,
          projectId: renders.projectId,
          chainId: renders.chainId,
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
      .where(and(...conditions))
      .orderBy(desc(sql`${galleryItems.likes} + ${galleryItems.views}`))
      .limit(limit * 2); // Get more to filter by prompt keywords
    
    // Filter by prompt keywords if provided
    if (criteria.promptKeywords && criteria.promptKeywords.length > 0) {
      items = items.filter(item => {
        const prompt = (item.render.prompt || '').toLowerCase();
        return criteria.promptKeywords!.some(keyword => prompt.includes(keyword.toLowerCase()));
      });
    }
    
    // Limit to requested amount
    items = items.slice(0, limit);
    
    logger.log(`✅ Found ${items.length} similar gallery items`);
    return items;
  }
}
