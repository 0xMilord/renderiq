'use server';

import { revalidatePath } from 'next/cache';
import { RendersDAL } from '@/lib/dal/renders';
import { createClient } from '@/lib/supabase/server';

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

export async function likeGalleryItem(itemId: string) {
  try {
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await RendersDAL.toggleLike(itemId, user.data.user.id);
    revalidatePath('/gallery');
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to like item',
    };
  }
}
