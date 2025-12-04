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
    // Get all items first, then sort by popularity (likes + views)
    const allItems = await RendersDAL.getPublicGallery(limit * 10, 0); // Get more to sort properly
    const sortedItems = allItems.sort((a, b) => {
      const aPopularity = (a.likes || 0) + (a.views || 0);
      const bPopularity = (b.likes || 0) + (b.views || 0);
      return bPopularity - aPopularity; // Descending order
    });
    const paginatedItems = sortedItems.slice(offset, offset + limit);
    
    return { success: true, data: paginatedItems };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get gallery',
    };
  }
}

export async function getLongestChains(limit = 5) {
  try {
    // Get chains with most PUBLIC renders (from gallery), ordered by popularity (likes + views)
    // Only get renders that are:
    // 1. Completed
    // 2. In the public gallery (isPublic = true)
    // 3. Have a chainId
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
      .limit(limit * 5); // Get more chains to filter down (increased from 3 to 5)

    if (chainsWithCounts.length === 0) {
      console.log('⚠️ No chains with public renders found');
      return { success: true, data: [] };
    }

    console.log(`✅ Found ${chainsWithCounts.length} chains with public renders`);

    // Fetch full chain details with renders (only public ones)
    const chains = await Promise.all(
      chainsWithCounts.map(async ({ chainId }) => {
        if (!chainId) return null;
        try {
          const chain = await RenderChainService.getChain(chainId);
          if (!chain) {
            console.log(`⚠️ Chain ${chainId} not found`);
            return null;
          }
          
          // Get all public render IDs for this chain from gallery
          const publicRenderIds = await db
            .select({ renderId: galleryItems.renderId })
            .from(galleryItems)
            .innerJoin(renders, eq(renders.id, galleryItems.renderId))
            .where(
              and(
                eq(renders.chainId, chainId),
                eq(renders.status, 'completed'),
                eq(galleryItems.isPublic, true)
              )
            );
          
          const publicRenderIdSet = new Set(publicRenderIds.map(r => r.renderId));
          
          // Filter renders to only include public, completed ones
          const publicRenders = chain.renders?.filter(render => {
            return render.status === 'completed' && 
                   render.outputUrl && 
                   publicRenderIdSet.has(render.id);
          }) || [];
          
          console.log(`  Chain ${chain.name || chainId}: ${chain.renders?.length || 0} total renders, ${publicRenders.length} public renders`);
          
          if (publicRenders.length === 0) {
            return null;
          }
          
          // Return chain with filtered renders
          return {
            ...chain,
            renders: publicRenders
          };
        } catch (error) {
          console.error(`❌ Error fetching chain ${chainId}:`, error);
          return null;
        }
      })
    );

    const validChains = chains.filter(Boolean) as any[];
    console.log(`✅ Returning ${validChains.length} valid chains with public renders`);
    
    // Chains are already sorted by popularity (likes + views) from the SQL query
    // Just return top chains
    return { success: true, data: validChains.slice(0, limit) };
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
