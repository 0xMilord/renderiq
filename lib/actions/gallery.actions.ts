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
    const galleryItems = await RendersDAL.getPublicGallery(limit, offset);
    
    return { success: true, data: galleryItems };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get gallery',
    };
  }
}

export async function getLongestChains(limit = 5) {
  try {
    // Get chains with most renders, ordered by render count
    const chainsWithCounts = await db
      .select({
        chainId: renders.chainId,
        renderCount: sql<number>`count(*)::int`.as('render_count'),
      })
      .from(renders)
      .where(isNotNull(renders.chainId))
      .groupBy(renders.chainId)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    // Fetch full chain details with renders
    const chains = await Promise.all(
      chainsWithCounts.map(async ({ chainId }) => {
        if (!chainId) return null;
        return await RenderChainService.getChain(chainId);
      })
    );

    return { success: true, data: chains.filter(Boolean) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get longest chains',
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
