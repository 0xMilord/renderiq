import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { BillingDAL } from '@/lib/dal/billing';
import { BillingService } from '@/lib/services/billing';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { AISDKService } from '@/lib/services/ai-sdk-service';
import { StorageService } from '@/lib/services/storage';
import { logger } from '@/lib/utils/logger';
import { getModelConfig } from '@/lib/config/models';

export async function POST(request: NextRequest) {
  try {
    logger.log('🎬 Video API: Starting video generation request');

    // Authenticate user
    const { user } = await getCachedUser();
    
    if (!user) {
      logger.error('🎬 Video API: Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.log('✅ Video API: User authenticated:', user.id);

    // Parse form data
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const model = formData.get('model') as string; // Model ID (e.g., 'veo-3.1-generate-preview')
    const duration = parseInt(formData.get('duration') as string) || 8;
    const aspectRatio = formData.get('aspectRatio') as '16:9' | '9:16' | '1:1';
    const generationType = formData.get('generationType') as 'text-to-video' | 'image-to-video' | 'keyframe-sequence';
    const projectId = formData.get('projectId') as string;
    const chainId = formData.get('chainId') as string;
    const referenceRenderId = formData.get('referenceRenderId') as string;

    // Validate required fields
    if (!prompt || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate duration (Veo API supports 4, 6, or 8 seconds)
    if (![4, 6, 8].includes(duration)) {
      return NextResponse.json({ error: 'Duration must be 4, 6, or 8 seconds' }, { status: 400 });
    }

    logger.log('🎬 Video API: Request parameters:', {
      prompt: prompt.substring(0, 100) + '...',
      model,
      duration,
      aspectRatio,
      generationType,
      projectId,
      chainId,
      referenceRenderId
    });

    // Calculate credits cost using model-specific pricing
    const modelConfig = model ? getModelConfig(model as any) : null;
    const creditsCost = modelConfig 
      ? modelConfig.calculateCredits({ duration })
      : duration * 16; // Fallback: 16 credits/second (Veo 3.1 Standard default)

    const creditsPerSecond = modelConfig 
      ? creditsCost / duration
      : 16; // Fallback: 16 credits/second

    logger.log('💰 Video API: Credits cost calculation:', {
      duration,
      creditsPerSecond,
      totalCredits: creditsCost
    });

    // Check user credits
    const userCredits = await BillingDAL.getUserCreditsWithReset(user.id);
    
    if (!userCredits || userCredits.balance < creditsCost) {
      logger.log('❌ Video API: Insufficient credits:', {
        required: creditsCost,
        available: userCredits?.balance || 0
      });
      return NextResponse.json({ 
        error: 'Insufficient credits', 
        required: creditsCost,
        available: userCredits?.balance || 0
      }, { status: 402 });
    }

    // Deduct credits
    logger.log('💰 Video API: Deducting credits:', { amount: creditsCost, description: `Generated video - ${model} model` });
    const deductResult = await BillingService.deductCredits(
      user.id,
      creditsCost,
      `Generated video - ${model} model`,
      undefined,
      'render'
    );

    if (!deductResult.success) {
      logger.error('❌ Video API: Failed to deduct credits:', deductResult.error);
      return NextResponse.json({ 
        error: deductResult.error || 'Failed to deduct credits'
      }, { status: 500 });
    }

    // Handle chain logic
    let finalChainId = chainId;
    let chainPosition = 1;

    if (chainId) {
      const chainRenders = await RendersDAL.getByChainId(chainId);
      chainPosition = chainRenders.length + 1;
      logger.log('🔗 Video API: Using existing chain:', { chainId, chainPosition });
    }

    // Create render record in database
    const render = await RendersDAL.create({
      projectId,
      userId: user.id,
      type: 'video',
      prompt,
      settings: {
        style: 'realistic', // Default for videos
        quality: 'standard', // Default for videos
        aspectRatio,
        duration,
        model,
        generationType
      } as any, // Video-specific settings extend the base type
      status: 'pending',
      chainId: finalChainId,
      chainPosition,
      referenceRenderId: referenceRenderId || undefined,
      uploadedImageUrl: undefined, // Will be set if image uploaded
      uploadedImageKey: undefined,
      uploadedImageId: undefined,
    });

    logger.log('✅ Video API: Render record created:', render.id);

    // Update render status to processing
    await RendersDAL.updateStatus(render.id, 'processing');

    try {
      // Initialize AI SDK service
      const aiService = AISDKService.getInstance();

      let result;
      let uploadedImageUrl: string | undefined;
      let uploadedImageKey: string | undefined;
      let uploadedImageId: string | undefined;

      // Handle different generation types
      if (generationType === 'image-to-video') {
        // Handle single image upload
        const uploadedImage = formData.get('uploadedImage') as File;
        if (!uploadedImage) {
          throw new Error('Uploaded image is required for image-to-video generation');
        }

        // Upload image to storage
        const uploadResult = await StorageService.uploadFile(
          uploadedImage,
          'uploads',
          user.id,
          undefined,
          projectId
        );

        uploadedImageUrl = uploadResult.url;
        uploadedImageKey = uploadResult.key;
        uploadedImageId = uploadResult.id;

        // Convert image to base64 for Veo3
        const imageBuffer = await uploadedImage.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');

        // Generate video from image using AI SDK
        result = await aiService.generateVideo({
          prompt,
          duration,
          aspectRatio: aspectRatio,
          uploadedImageData: imageBase64,
          uploadedImageType: 'image/jpeg'
        });

      } else if (generationType === 'keyframe-sequence') {
        // Handle multiple keyframes
        const keyframeCount = parseInt(formData.get('keyframeCount') as string) || 0;
        const keyframes: string[] = [];

        for (let i = 0; i < keyframeCount; i++) {
          const keyframe = formData.get(`keyframe_${i}`) as File;
          if (keyframe) {
            const keyframeBuffer = await keyframe.arrayBuffer();
            const keyframeBase64 = Buffer.from(keyframeBuffer).toString('base64');
            keyframes.push(keyframeBase64);
          }
        }

        if (keyframes.length === 0) {
          throw new Error('At least one keyframe is required');
        }

        // Generate video from keyframes using AI SDK
        result = await aiService.generateVideo({
          prompt,
          duration,
          aspectRatio: aspectRatio,
          uploadedImageData: keyframes[0], // Use first keyframe
          uploadedImageType: 'image/jpeg'
        });

      } else {
        // Text-to-video generation using AI SDK
        result = await aiService.generateVideo({
          prompt,
          duration,
          aspectRatio: aspectRatio
        });
      }

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Video generation failed');
      }

      logger.log('🎬 Video API: Video generation completed:', {
        videoUrl: result.data.videoUrl,
        videoData: !!result.data.videoData,
        processingTime: result.data.processingTime
      });

      // Upload video to storage (same pipeline as images)
      let uploadResult;
      if (result.data.videoData) {
        // Use base64 video data
        logger.log('📤 Uploading video from base64 data to storage');
        const buffer = Buffer.from(result.data.videoData, 'base64');
        uploadResult = await StorageService.uploadFile(
          buffer,
          'renders',
          user.id,
          `render_${render.id}.mp4`,
          projectId
        );
      } else if (result.data.videoUrl) {
        // Fetch video from URL and upload to storage
        logger.log('📤 Fetching video from URL and uploading to storage');
        const response = await fetch(result.data.videoUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        const blob = await response.blob();
        const videoFile = new File([blob], `render_${render.id}.mp4`, {
          type: 'video/mp4'
        });
        uploadResult = await StorageService.uploadFile(
          videoFile,
          'renders',
          user.id,
          undefined,
          projectId
        );
      } else {
        throw new Error('No video data or URL received from generation service');
      }

      logger.log('✅ Video uploaded to storage:', uploadResult.url);

      // Update render record with results
      await RendersDAL.updateOutput(
        render.id,
        uploadResult.url,
        uploadResult.key,
        'completed',
        result.data.processingTime || 0
      );

      // Update uploaded image info if applicable
      if (uploadedImageUrl) {
        // Direct update for uploaded image fields
        const { db } = await import('@/lib/db');
        const { renders } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');
        await db
          .update(renders)
          .set({
            uploadedImageUrl,
            uploadedImageKey,
            uploadedImageId,
            updatedAt: new Date(),
          })
          .where(eq(renders.id, render.id));
      }

      // Check if user has pro subscription
      // Free users: renders are public (added to gallery)
      // Pro users: renders are private (not added to gallery)
      const isPro = await BillingDAL.isUserPro(user.id);
      const isPublic = !isPro; // Free users = public, Pro users = private
      
      // Add to gallery if public
      if (isPublic) {
        logger.log(`📸 Video API: Adding video to public gallery (User is ${isPro ? 'PRO' : 'FREE'})`);
        await RendersDAL.addToGallery(render.id, user.id, true);
      } else {
        logger.log(`🔒 Video API: Video is private (User is PRO)`);
      }

      logger.log('✅ Video API: Video generation completed successfully');

      return NextResponse.json({
        success: true,
        data: {
          id: render.id,
          outputUrl: uploadResult.url,
          status: 'completed',
          processingTime: result.data.processingTime
        }
      });

    } catch (error) {
      logger.error('🎬 Video API: Video generation failed:', error);
      
      // Update render status to failed
      await RendersDAL.updateStatus(render.id, 'failed', error instanceof Error ? error.message : 'Unknown error');

      // Refund credits
      await BillingService.addCredits(
        user.id,
        creditsCost,
        'refund',
        `Refund for failed video generation`,
        render.id,
        'render'
      );

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Video generation failed'
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('🎬 Video API: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
