'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { AISDKService } from '@/lib/services/ai-sdk-service';
import { addCredits, deductCredits } from '@/lib/actions/billing.actions';
import { BillingDAL } from '@/lib/dal/billing';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { StorageService } from '@/lib/services/storage';
import { logger } from '@/lib/utils/logger';

const aiService = AISDKService.getInstance();

// Schema for render creation
const createRenderSchema = z.object({
  prompt: z.string().min(1),
  style: z.string(),
  quality: z.enum(['standard', 'high', 'ultra']),
  aspectRatio: z.string(),
  type: z.enum(['image', 'video']),
  projectId: z.string().uuid(),
  chainId: z.string().uuid().optional().nullable(),
  referenceRenderId: z.string().uuid().optional().nullable(),
  negativePrompt: z.string().optional().nullable(),
  imageType: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  seed: z.number().optional().nullable(),
  versionContext: z.any().optional().nullable(),
  environment: z.string().optional().nullable(),
  effect: z.string().optional().nullable(),
  styleTransferImageData: z.string().optional().nullable(),
  styleTransferImageType: z.string().optional().nullable(),
  temperature: z.number().optional().nullable(),
  uploadedImageData: z.string().optional().nullable(),
  uploadedImageType: z.string().optional().nullable(),
  // Video-specific
  model: z.enum(['veo3', 'veo3_fast']).optional(),
  duration: z.number().optional(),
  generationType: z.enum(['text-to-video', 'image-to-video', 'keyframe-sequence']).optional(),
});

export async function createRenderAction(formData: FormData) {
  try {
    logger.log('🚀 Starting render generation server action');
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.error('❌ Authentication failed:', authError?.message);
      return { success: false, error: 'Authentication required' };
    }
    
    logger.log('✅ User authenticated:', user.id);

    // Extract form data
    const prompt = formData.get('prompt') as string;
    const style = formData.get('style') as string;
    const quality = formData.get('quality') as 'standard' | 'high' | 'ultra';
    const aspectRatio = formData.get('aspectRatio') as string;
    const typeParam = formData.get('type') as string;
    const type = (typeParam === 'video' ? 'video' : 'image') as 'image' | 'video';
    const uploadedImageData = formData.get('uploadedImageData') as string | null;
    const uploadedImageType = formData.get('uploadedImageType') as string | null;
    const projectId = formData.get('projectId') as string;
    const chainId = formData.get('chainId') as string | null;
    const referenceRenderId = formData.get('referenceRenderId') as string | null;
    const negativePrompt = formData.get('negativePrompt') as string | null;
    const imageType = formData.get('imageType') as string | null;
    
    // Check if user has pro subscription
    // Free users: renders are public (added to gallery)
    // Pro users: renders are private (not added to gallery)
    const isPro = await BillingDAL.isUserPro(user.id);
    const isPublic = !isPro; // Free users = public, Pro users = private
    logger.log(`📸 Render visibility: ${isPublic ? 'PUBLIC' : 'PRIVATE'} (User is ${isPro ? 'PRO' : 'FREE'})`);
    const seedParam = formData.get('seed') as string | null;
    const seed = seedParam ? parseInt(seedParam) : undefined;
    const versionContextData = formData.get('versionContext') as string | null;
    const environment = formData.get('environment') as string | null;
    const effect = formData.get('effect') as string | null;
    const styleTransferImageData = formData.get('styleTransferImageData') as string | null;
    const styleTransferImageType = formData.get('styleTransferImageType') as string | null;
    const temperatureParam = formData.get('temperature') as string | null;
    const temperature = temperatureParam ? parseFloat(temperatureParam) : 0.7;

    // Validate required fields
    if (!prompt || !style || !quality || !aspectRatio || !type || !projectId) {
      logger.warn('❌ Missing required parameters');
      return { success: false, error: 'Missing required parameters (prompt, style, quality, aspectRatio, type, projectId)' };
    }

    logger.log('📝 Render parameters:', { 
      prompt: prompt.substring(0, 50) + '...', 
      style, 
      quality, 
      aspectRatio, 
      type, 
      projectId
    });

    // Calculate credits cost
    // Image: 5 credits base (standard), 10 credits (high), 15 credits (ultra)
    // Video: 30 credits per second (based on Veo 3.1 pricing with 2x markup and 100 INR/USD conversion)
    if (type === 'video') {
      // Video: 30 credits per second
      const duration = parseInt(formData.get('duration') as string) || 5;
      const creditsPerSecond = 30;
      creditsCost = creditsPerSecond * duration;
    } else {
      // Image: 5 credits base, multiplied by quality
      const baseCreditsPerImage = 5;
      const qualityMultiplier = quality === 'high' ? 2 : quality === 'ultra' ? 3 : 1;
      creditsCost = baseCreditsPerImage * qualityMultiplier;
    }

    logger.log('💰 Credits cost:', creditsCost);

    // Check if user has enough credits
    const deductResult = await deductCredits(
      creditsCost,
      `Generated ${type} - ${style} style`,
      undefined,
      'render'
    );

    if (!deductResult.success) {
      logger.warn('❌ Insufficient credits:', deductResult.error);
      return { success: false, error: deductResult.error || 'Insufficient credits' };
    }

    // Verify project exists and belongs to user
    const project = await ProjectsDAL.getById(projectId);
    if (!project || project.userId !== user.id) {
      logger.warn('❌ Project not found or access denied');
      return { success: false, error: 'Project not found or access denied' };
    }

    // Get or create chain for this project
    let finalChainId = chainId;
    
    if (!finalChainId) {
      logger.log('🔗 No chain specified, finding or creating default chain');
      
      const existingChains = await RenderChainsDAL.getByProjectId(projectId);
      
      if (existingChains.length > 0) {
        finalChainId = existingChains[0].id;
        logger.log('✅ Using existing chain:', finalChainId);
      } else {
        const chainName = project ? `${project.name} - Iterations` : 'Default Chain';
        const newChain = await RenderChainsDAL.create({
          projectId,
          name: chainName,
          description: 'Automatic chain for render iterations',
        });
        finalChainId = newChain.id;
        logger.log('✅ Created new chain:', finalChainId);
      }
    }

    // Get chain position
    const chainRenders = await RendersDAL.getByChainId(finalChainId!);
    const chainPosition = chainRenders.length;

    logger.log('📍 Chain position:', chainPosition);

    // Validate reference render ID if provided
    let validatedReferenceRenderId: string | undefined = undefined;
    let referenceRenderImageData: string | undefined = undefined;
    let referenceRenderImageType: string | undefined = undefined;
    let referenceRenderPrompt: string | undefined = undefined;
    
    if (referenceRenderId) {
      if (referenceRenderId.startsWith('temp-')) {
        logger.log('⚠️ Temporary reference render ID detected, using most recent render in chain');
        if (chainRenders.length > 0) {
          const mostRecentRender = chainRenders
            .filter(r => r.status === 'completed')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          
          if (mostRecentRender) {
            validatedReferenceRenderId = mostRecentRender.id;
            if (mostRecentRender.outputUrl) {
              try {
                const imageResponse = await fetch(mostRecentRender.outputUrl);
                const imageBuffer = await imageResponse.arrayBuffer();
                referenceRenderImageData = Buffer.from(imageBuffer).toString('base64');
                referenceRenderImageType = mostRecentRender.outputUrl.includes('.png') ? 'image/png' : 
                                          mostRecentRender.outputUrl.includes('.jpg') || mostRecentRender.outputUrl.includes('.jpeg') ? 'image/jpeg' : 
                                          'image/png';
                referenceRenderPrompt = mostRecentRender.prompt;
              } catch (error) {
                logger.error('❌ Failed to fetch reference render image:', error);
              }
            }
          }
        }
      } else {
        try {
          const referenceRender = await RendersDAL.getById(referenceRenderId);
          if (referenceRender && referenceRender.status === 'completed') {
            validatedReferenceRenderId = referenceRenderId;
            if (referenceRender.outputUrl) {
              try {
                const imageResponse = await fetch(referenceRender.outputUrl);
                const imageBuffer = await imageResponse.arrayBuffer();
                referenceRenderImageData = Buffer.from(imageBuffer).toString('base64');
                referenceRenderImageType = referenceRender.outputUrl.includes('.png') ? 'image/png' : 
                                          referenceRender.outputUrl.includes('.jpg') || referenceRender.outputUrl.includes('.jpeg') ? 'image/jpeg' : 
                                          'image/png';
                referenceRenderPrompt = referenceRender.prompt;
              } catch (error) {
                logger.error('❌ Failed to fetch reference render image:', error);
              }
            }
          }
        } catch (error) {
          logger.warn('⚠️ Error validating reference render, ignoring reference:', error);
        }
      }
    }

    // Upload original image if provided
    let uploadedImageUrl: string | undefined = undefined;
    let uploadedImageKey: string | undefined = undefined;
    let uploadedImageId: string | undefined = undefined;

    if (uploadedImageData && uploadedImageType) {
      logger.log('📤 Uploading original image to storage');
      try {
        const buffer = Buffer.from(uploadedImageData, 'base64');
        const uploadedImageFile = new File([buffer], `upload_${Date.now()}.${uploadedImageType.split('/')[1] || 'png'}`, { type: uploadedImageType });
        
        const uploadResult = await StorageService.uploadFile(
          uploadedImageFile,
          'uploads',
          user.id,
          undefined,
          project.slug
        );

        uploadedImageUrl = uploadResult.url;
        uploadedImageKey = uploadResult.key;
        uploadedImageId = uploadResult.id;
        
        logger.log('✅ Original image uploaded:', uploadResult.url);
      } catch (error) {
        logger.error('❌ Failed to upload original image:', error);
      }
    }

    // Create render record in database
    logger.log('💾 Creating render record in database');
    const render = await RendersDAL.create({
      projectId,
      userId: user.id,
      type,
      prompt,
      settings: {
        style,
        quality,
        aspectRatio,
        ...(imageType && { imageType }),
        ...(negativePrompt && { negativePrompt }),
        ...(environment && { environment }),
        ...(effect && { effect }),
      },
      status: 'pending',
      chainId: finalChainId!,
      chainPosition,
      referenceRenderId: validatedReferenceRenderId,
      uploadedImageUrl,
      uploadedImageKey,
      uploadedImageId,
    });

    logger.log('✅ Render record created:', render.id);

    // Update render status to processing
    await RendersDAL.updateStatus(render.id, 'processing');

    // Process render - wait for completion for now (can be made async later)
    const renderResult = await processRenderAsync(render.id, {
      type,
      prompt,
      style,
      quality,
      aspectRatio,
      negativePrompt,
      seed,
      environment,
      effect,
      styleTransferImageData,
      styleTransferImageType,
      temperature,
      uploadedImageData: uploadedImageData || referenceRenderImageData,
      uploadedImageType: uploadedImageType || referenceRenderImageType,
      referenceRenderPrompt,
      projectId,
      userId: user.id,
      creditsCost,
      isPublic,
    });

    if (!renderResult.success) {
      return renderResult;
    }

    // Revalidate paths
    revalidatePath('/render');
    revalidatePath(`/project/${project.slug}`);
    
    return {
      success: true,
      data: {
        id: render.id,
        renderId: render.id,
        status: 'completed',
        outputUrl: renderResult.data?.outputUrl,
        processingTime: renderResult.data?.processingTime,
        provider: renderResult.data?.provider,
        type,
      },
    };

  } catch (error) {
    logger.error('❌ Server action error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Process render function
async function processRenderAsync(
  renderId: string,
  renderData: {
    type: 'image' | 'video';
    prompt: string;
    style: string;
    quality: string;
    aspectRatio: string;
    negativePrompt?: string | null;
    seed?: number;
    environment?: string | null;
    effect?: string | null;
    styleTransferImageData?: string | null;
    styleTransferImageType?: string | null;
    temperature?: number;
    uploadedImageData?: string;
    uploadedImageType?: string;
    referenceRenderPrompt?: string;
    projectId: string;
    userId: string;
    creditsCost: number;
    isPublic: boolean;
  }
) {
  try {
    logger.log('🎨 Starting AI generation for render:', renderId);
    
    let result;
    
    if (renderData.type === 'video') {
      result = await aiService.generateVideo({
        prompt: renderData.prompt,
        duration: 5,
        aspectRatio: renderData.aspectRatio as '16:9' | '9:16',
        uploadedImageData: renderData.uploadedImageData || undefined,
      });
    } else {
      // Enhance prompt with context from previous render if available
      let contextualPrompt = renderData.prompt;
      if (renderData.referenceRenderPrompt && renderData.uploadedImageData) {
        contextualPrompt = `Based on the previous render (${renderData.referenceRenderPrompt}), ${renderData.prompt}`;
      }
      
      result = await aiService.generateImage({
        prompt: contextualPrompt,
        aspectRatio: renderData.aspectRatio,
        uploadedImageData: renderData.uploadedImageData || undefined,
        uploadedImageType: renderData.uploadedImageType || undefined,
        negativePrompt: renderData.negativePrompt || undefined,
        seed: renderData.seed,
        environment: renderData.environment || undefined,
        effect: renderData.effect || undefined,
        styleTransferImageData: renderData.styleTransferImageData || undefined,
        styleTransferImageType: renderData.styleTransferImageType || undefined,
        temperature: renderData.temperature,
      });
    }

    if (!result.success || !result.data) {
      logger.error('❌ Generation failed:', result.error);
      await RendersDAL.updateStatus(renderId, 'failed', result.error);
      await addCredits(renderData.creditsCost, 'refund', 'Refund for failed generation', renderData.userId, 'refund');
      return;
    }

    logger.log('✅ Generation successful, uploading to storage');

    // Get project to get slug
    const project = await ProjectsDAL.getById(renderData.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Upload generated image/video to storage
    let uploadResult;
    if (result.data.imageData) {
      const fileExtension = renderData.type === 'video' ? 'mp4' : 'png';
      const buffer = Buffer.from(result.data.imageData, 'base64');
      uploadResult = await StorageService.uploadFile(
        buffer,
        'renders',
        renderData.userId,
        `render_${renderId}.${fileExtension}`,
        project.slug
      );
    } else if (result.data.imageUrl) {
      const response = await fetch(result.data.imageUrl);
      const blob = await response.blob();
      const fileExtension = renderData.type === 'video' ? 'mp4' : 'png';
      const outputFile = new File([blob], `render_${renderId}.${fileExtension}`, {
        type: renderData.type === 'video' ? 'video/mp4' : 'image/png'
      });
      uploadResult = await StorageService.uploadFile(
        outputFile,
        'renders',
        renderData.userId,
        undefined,
        project.slug
      );
    } else {
      throw new Error('No data or URL received from generation service');
    }

    logger.log('✅ File uploaded to storage:', uploadResult.url);

    // Update render with output URL
    await RendersDAL.updateOutput(renderId, uploadResult.url, uploadResult.key, 'completed', Math.round(result.data.processingTime));

    // Add to gallery if public
    if (renderData.isPublic) {
      logger.log('📸 Adding render to public gallery');
      await RendersDAL.addToGallery(renderId, renderData.userId, true);
    }

    logger.log('🎉 Render completed successfully:', renderId);
    
    return {
      success: true,
      data: {
        outputUrl: uploadResult.url,
        processingTime: result.data.processingTime,
        provider: result.data.provider,
      },
    };
    
  } catch (error) {
    logger.error('❌ Generation error:', error);
    await RendersDAL.updateStatus(renderId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    await addCredits(renderData.creditsCost, 'refund', 'Refund for failed generation', renderData.userId, 'refund');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

