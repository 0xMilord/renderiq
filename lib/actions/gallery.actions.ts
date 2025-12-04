'use server';

import { revalidatePath } from 'next/cache';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainService } from '@/lib/services/render-chain';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { renders, renderChains, galleryItems } from '@/lib/db/schema';
import { eq, and, isNotNull, desc, sql, ne, or, inArray } from 'drizzle-orm';
import type { GalleryItemWithDetails } from '@/lib/types';

export async function getPublicGallery(page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    // RendersDAL.getPublicGallery already sorts by popularity in SQL, so we can use it directly
    // Only fetch what we need (no need to fetch 10x and sort in memory)
    const items = await RendersDAL.getPublicGallery(limit, offset);
    
    return { success: true, data: items };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get gallery',
    };
  }
}

export async function getLongestChains(limit = 5) {
  try {
    // OPTIMIZED: Batch fetch chains with their public renders in minimal queries
    // Step 1: Get chains with popularity scores (single query)
    const chainsWithCounts = await db
      .select({
        chainId: renders.chainId,
        renderCount: sql<number>`count(*)::int`.as('render_count'),
        totalLikes: sql<number>`COALESCE(SUM(${galleryItems.likes}), 0)::int`.as('total_likes'),
        totalViews: sql<number>`COALESCE(SUM(${galleryItems.views}), 0)::int`.as('total_views'),
      })
      .from(renders)
      .innerJoin(galleryItems, eq(galleryItems.renderId, renders.id))
      .where(
        and(
          isNotNull(renders.chainId),
          eq(renders.status, 'completed'),
          eq(galleryItems.isPublic, true)
        )
      )
      .groupBy(renders.chainId)
      .orderBy(desc(sql`COALESCE(SUM(${galleryItems.likes}), 0) + COALESCE(SUM(${galleryItems.views}), 0)`))
      .limit(limit * 3); // Get a few extra to filter down

    if (chainsWithCounts.length === 0) {
      console.log('⚠️ No chains with public renders found');
      return { success: true, data: [] };
    }

    const chainIds = chainsWithCounts.map(c => c.chainId).filter(Boolean) as string[];
    console.log(`✅ Found ${chainIds.length} chains with public renders`);

    // Step 2: Batch fetch all chain metadata in one query
    const chainMetadata = await db
      .select()
      .from(renderChains)
      .where(inArray(renderChains.id, chainIds));

    const chainMetadataMap = new Map(chainMetadata.map(c => [c.id, c]));

    // Step 3: Batch fetch all public renders for these chains in one query
    // Use RendersDAL.getByChainId pattern but batch for multiple chains
    const allPublicRenders = await db
      .select()
      .from(renders)
      .where(
        and(
          inArray(renders.chainId, chainIds),
          eq(renders.status, 'completed'),
          isNotNull(renders.outputUrl)
        )
      )
      .orderBy(renders.chainPosition);
    
    // Filter to only renders that are in public gallery
    // We need to check which renders are public by joining with galleryItems
    const publicRenderIds = await db
      .select({ renderId: galleryItems.renderId })
      .from(galleryItems)
      .where(
        and(
          inArray(galleryItems.renderId, allPublicRenders.map(r => r.id)),
          eq(galleryItems.isPublic, true)
        )
      );
    
    const publicRenderIdSet = new Set(publicRenderIds.map(r => r.renderId));
    const rendersList = allPublicRenders.filter(r => publicRenderIdSet.has(r.id));

    // Step 4: Group renders by chain
    const rendersByChain = new Map<string, typeof rendersList>();
    rendersList.forEach((render) => {
      if (!render.chainId) return;
      if (!rendersByChain.has(render.chainId)) {
        rendersByChain.set(render.chainId, []);
      }
      rendersByChain.get(render.chainId)!.push(render);
    });

    // Step 5: Build final chains array with filtered renders
    const chains = chainsWithCounts
      .map(({ chainId }) => {
        if (!chainId) return null;
        const metadata = chainMetadataMap.get(chainId);
        if (!metadata) return null;

        const chainRenders = rendersByChain.get(chainId) || [];
        if (chainRenders.length === 0) return null;

        // Renders are already in the correct format
        const publicRenders = chainRenders;

        return {
          ...metadata,
          renders: publicRenders,
        };
      })
      .filter(Boolean) as any[];

    console.log(`✅ Returning ${chains.length} valid chains with public renders (batch optimized)`);
    
    // Chains are already sorted by popularity from the SQL query
    return { success: true, data: chains.slice(0, limit) };
  } catch (error) {
    console.error('❌ Error in getLongestChains:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get longest chains',
      data: [],
    };
  }
}

export async function viewGalleryItem(itemId: string) {
  try {
    await RendersDAL.incrementViews(itemId);
    revalidatePath('/gallery');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record view',
    };
  }
}

export async function checkUserLiked(itemId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: true, data: { liked: false } };
    }

    const liked = await RendersDAL.hasUserLiked(itemId, user.id);
    return { success: true, data: { liked } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check like status',
    };
  }
}

export async function likeGalleryItem(itemId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await RendersDAL.toggleLike(itemId, user.id);
    revalidatePath('/gallery');
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to like item',
    };
  }
}

export async function getPublicGalleryItem(itemId: string) {
  try {
    const item = await RendersDAL.getGalleryItemById(itemId);
    
    if (!item) {
      return { success: false, error: 'Gallery item not found' };
    }
    
    return { success: true, data: item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get gallery item',
    };
  }
}

export async function getSimilarGalleryItems(itemId: string, limit = 12) {
  try {
    // Get the current item to find similar ones
    const currentItem = await RendersDAL.getGalleryItemById(itemId);
    
    if (!currentItem) {
      return { success: false, error: 'Gallery item not found' };
    }

    const currentSettings = (currentItem.render.settings || {}) as Record<string, any>;
    const currentStyle = currentSettings.style as string | undefined;
    const currentQuality = currentSettings.quality as string | undefined;
    const currentAspectRatio = currentSettings.aspectRatio as string | undefined;
    const currentPrompt = currentItem.render.prompt?.toLowerCase() || '';

    // Extract keywords from prompt (simple approach)
    const promptWords = currentPrompt.split(/\s+/).filter(w => w.length > 3);
    
    // Get similar items based on:
    // 1. Same style (highest priority)
    // 2. Same quality
    // 3. Same aspect ratio
    // 4. Similar prompt keywords
    // 5. Similar engagement (likes + views)
    
    const similarItems = await RendersDAL.getSimilarGalleryItems(
      itemId,
      {
        style: currentStyle,
        quality: currentQuality,
        aspectRatio: currentAspectRatio,
        promptKeywords: promptWords.slice(0, 5), // Top 5 keywords
      },
      limit
    );
    
    return { success: true, data: similarItems };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get similar items',
    };
  }
}
