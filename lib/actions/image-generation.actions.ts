'use server';

import { revalidatePath } from 'next/cache';
import { ImageGenerationService } from '@/lib/services/image-generation';
import { createClient } from '@/lib/supabase/server';
import { addCredits, deductCredits } from './billing.actions';

const imageService = ImageGenerationService.getInstance();

export async function generateImage(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const prompt = formData.get('prompt') as string;
    const style = formData.get('style') as string;
    const quality = formData.get('quality') as 'standard' | 'high' | 'ultra';
    const aspectRatio = formData.get('aspectRatio') as string;
    const type = formData.get('type') as 'image' | 'video';
    const uploadedImageData = formData.get('uploadedImageData') as string | null;
    const uploadedImageType = formData.get('uploadedImageType') as string | null;

    if (!prompt || !style || !quality || !aspectRatio || !type) {
      return { success: false, error: 'Missing required parameters' };
    }

    // Calculate credits cost
    const baseCost = type === 'video' ? 5 : 1;
    const qualityMultiplier = quality === 'high' ? 2 : quality === 'ultra' ? 3 : 1;
    const creditsCost = baseCost * qualityMultiplier;

    // Check if user has enough credits
    const deductResult = await deductCredits(
      creditsCost,
      `Generated ${type} - ${style} style`,
      undefined,
      'render'
    );

    if (!deductResult.success) {
      return { success: false, error: deductResult.error || 'Insufficient credits' };
    }

    // Generate image
    const result = await imageService.generateImage({
      prompt,
      style,
      quality,
      aspectRatio,
      type,
      uploadedImageData: uploadedImageData || undefined,
      uploadedImageType: uploadedImageType || undefined,
    });

    if (!result.success) {
      // Refund credits if generation failed
      await addCredits(
        creditsCost,
        'refund',
        `Refund for failed ${type} generation`,
        undefined,
        'refund'
      );
      return result;
    }

    revalidatePath('/gallery');
    revalidatePath('/profile');
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image',
    };
  }
}

export async function generateVideo(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const prompt = formData.get('prompt') as string;
    const style = formData.get('style') as string;
    const quality = formData.get('quality') as 'standard' | 'high' | 'ultra';
    const aspectRatio = formData.get('aspectRatio') as string;
    const duration = parseInt(formData.get('duration') as string);
    const uploadedImage = formData.get('uploadedImage') as File | null;

    if (!prompt || !style || !quality || !aspectRatio || !duration) {
      return { success: false, error: 'Missing required parameters' };
    }

    // Calculate credits cost
    const baseCost = 5; // Video base cost
    const qualityMultiplier = quality === 'high' ? 2 : quality === 'ultra' ? 3 : 1;
    const creditsCost = baseCost * qualityMultiplier;

    // Check if user has enough credits
    const deductResult = await deductCredits(
      creditsCost,
      `Generated video - ${style} style`,
      undefined,
      'render'
    );

    if (!deductResult.success) {
      return { success: false, error: deductResult.error || 'Insufficient credits' };
    }

    // Generate video
    const result = await imageService.generateVideo({
      prompt,
      style,
      quality,
      aspectRatio,
      duration,
      uploadedImage: uploadedImage || undefined,
    });

    if (!result.success) {
      // Refund credits if generation failed
      await addCredits(
        creditsCost,
        'refund',
        `Refund for failed video generation`,
        undefined,
        'refund'
      );
      return result;
    }

    revalidatePath('/gallery');
    revalidatePath('/profile');
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate video',
    };
  }
}
