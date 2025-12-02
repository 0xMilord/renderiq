import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BillingDAL } from '@/lib/dal/billing';
import { BillingService } from '@/lib/services/billing';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { AISDKService } from '@/lib/services/ai-sdk-service';
import { StorageService } from '@/lib/services/storage';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    logger.log('🎬 Video API: Starting video generation request');

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.error('🎬 Video API: Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.log('✅ Video API: User authenticated:', user.id);

    // Parse form data
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const model = formData.get('model') as 'veo3' | 'veo3_fast';
    const duration = parseInt(formData.get('duration') as string) || 5;
    const aspectRatio = formData.get('aspectRatio') as '16:9' | '9:16' | '1:1';
    const generationType = formData.get('generationType') as 'text-to-video' | 'image-to-video' | 'keyframe-sequence';
    const projectId = formData.get('projectId') as string;
    const chainId = formData.get('chainId') as string;
    const referenceRenderId = formData.get('referenceRenderId') as string;

    // Validate required fields
    if (!prompt || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate duration (max 5 seconds)
    if (duration > 5) {
      return NextResponse.json({ error: 'Duration cannot exceed 5 seconds' }, { status: 400 });
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

    // Calculate credits cost (video generation costs more than images)
    const baseCost = 5; // Base cost for video generation
    const durationMultiplier = duration / 5; // Scale based on duration
    const modelMultiplier = model === 'veo3_fast' ? 1 : 2; // Higher quality costs more
    const creditsCost = Math.ceil(baseCost * durationMultiplier * modelMultiplier);

    logger.log('💰 Video API: Credits cost calculation:', {
      baseCost,
      durationMultiplier,
      modelMultiplier,
      creditsCost
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
      const renderChainsDAL = new RenderChainsDAL();
      const chainRenders = await renderChainsDAL.getRendersByChainId(chainId);
      chainPosition = chainRenders.length + 1;
      logger.log('🔗 Video API: Using existing chain:', { chainId, chainPosition });
    }

    // Create render record in database
    const rendersDAL = new RendersDAL();
    const render = await rendersDAL.create({
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
      },
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
    await rendersDAL.updateStatus(render.id, 'processing');

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
        const storageService = new StorageService();
        const uploadResult = await storageService.uploadFile(
          uploadedImage,
          `projects/${projectId}/${user.id}`,
          'video-input'
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
        processingTime: result.data.processingTime
      });

      // Update render record with results
      await rendersDAL.updateRenderOutput({
        id: render.id,
        outputUrl: result.data.videoUrl || '',
        status: 'completed',
        processingTime: result.data.processingTime || 0
      });

      // Update uploaded image info if applicable
      if (uploadedImageUrl) {
        await rendersDAL.updateUploadedImage({
          id: render.id,
          uploadedImageUrl,
          uploadedImageKey,
          uploadedImageId
        });
      }

      logger.log('✅ Video API: Video generation completed successfully');

      return NextResponse.json({
        success: true,
        data: {
          id: render.id,
          outputUrl: result.data.videoUrl,
          status: 'completed',
          processingTime: result.data.processingTime
        }
      });

    } catch (error) {
      logger.error('🎬 Video API: Video generation failed:', error);
      
      // Update render status to failed
      await rendersDAL.updateStatus(render.id, 'failed', error instanceof Error ? error.message : 'Unknown error');

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
