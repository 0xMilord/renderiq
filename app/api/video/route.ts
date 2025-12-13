import { NextRequest, NextResponse } from 'next/server';
import { BillingDAL } from '@/lib/dal/billing';
import { BillingService } from '@/lib/services/billing';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { AISDKService } from '@/lib/services/ai-sdk-service';
import { StorageService } from '@/lib/services/storage';
import { logger } from '@/lib/utils/logger';
import { getModelConfig } from '@/lib/config/models';
import { withAuthenticatedApiRoute } from '@/lib/middleware/api-route';
import * as Sentry from '@sentry/nextjs';

export const POST = withAuthenticatedApiRoute(
  async ({ request, user }) => {
    logger.log('🎬 Video API: Starting video generation request');
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
      const errorMessage = 'error' in deductResult ? deductResult.error : 'Failed to deduct credits';
      logger.error('❌ Video API: Failed to deduct credits:', errorMessage);
      return NextResponse.json({ 
        error: errorMessage
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

      // 🚀 TECHNICAL MOAT: Full Video Pipeline (optional - can be enabled via feature flag)
      const useFullPipeline = process.env.ENABLE_FULL_VIDEO_PIPELINE === 'true' || 
                               request.nextUrl.searchParams.get('fullPipeline') === 'true';
      
      let optimizedPrompt = prompt;
      let selectedModel = model;

      if (useFullPipeline) {
        try {
          logger.log('🚀 Using FULL Technical Moat Video Pipeline (all stages)');
          const { VideoPipeline } = await import('@/lib/services/video-pipeline');
          
          // Build reference images array if we have them
          const referenceImages: Array<{ imageData: string; imageType: string }> = [];
          let firstFrameImage: { imageData: string; imageType: string } | undefined;
          let lastFrameImage: { imageData: string; imageType: string } | undefined;

          // Collect images based on generation type
          if (generationType === 'image-to-video') {
            const uploadedImage = formData.get('uploadedImage') as File;
            if (uploadedImage) {
              const imageBuffer = await uploadedImage.arrayBuffer();
              const imageBase64 = Buffer.from(imageBuffer).toString('base64');
              firstFrameImage = {
                imageData: imageBase64,
                imageType: 'image/jpeg'
              };
            }
          } else if (generationType === 'keyframe-sequence') {
            const keyframeCount = parseInt(formData.get('keyframeCount') as string) || 0;
            for (let i = 0; i < keyframeCount; i++) {
              const keyframe = formData.get(`keyframe_${i}`) as File;
              if (keyframe) {
                const keyframeBuffer = await keyframe.arrayBuffer();
                const keyframeBase64 = Buffer.from(keyframeBuffer).toString('base64');
                if (i === 0) {
                  firstFrameImage = { imageData: keyframeBase64, imageType: 'image/jpeg' };
                }
                if (i === keyframeCount - 1) {
                  lastFrameImage = { imageData: keyframeBase64, imageType: 'image/jpeg' };
                }
                referenceImages.push({ imageData: keyframeBase64, imageType: 'image/jpeg' });
              }
            }
          }

          const quality = 'standard' as 'standard' | 'high' | 'ultra'; // Can be enhanced later
          
          const pipelineResult = await VideoPipeline.generateVideo({
            prompt,
            referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
            firstFrameImage,
            lastFrameImage,
            quality,
            aspectRatio: aspectRatio || '16:9',
            durationSeconds: duration,
            chainId: finalChainId,
            // Only pass forceModel if a specific model is selected (not "auto")
            // When "auto" is selected, ModelRouter will automatically select the best model
            forceModel: (model && model !== 'auto') ? (model as any) : undefined,
            skipStages: {
              validation: true, // Skip validation for now
              memoryExtraction: true // Skip memory extraction for now
            }
          });

          if (pipelineResult.success && pipelineResult.data) {
            // Our AISDKService.generateVideo currently polls until completion.
            // If videoUrl is present, return completed immediately.
            if ((pipelineResult.data as any).videoUrl) {
              return NextResponse.json({
                success: true,
                status: 'completed',
                videoUrl: (pipelineResult.data as any).videoUrl,
                selectedModel: pipelineResult.data.selectedModel
              });
            }

            // Fallback: return operationName if available for future async handling
            return NextResponse.json({
              success: true,
              operationName: pipelineResult.data.operationName,
              status: 'completed',
              selectedModel: pipelineResult.data.selectedModel
            });
          } else {
            logger.error('❌ Full video pipeline failed, falling back to simple flow:', pipelineResult.error);
            // Fall through to simple flow
          }
        } catch (error) {
          logger.error('⚠️ Full video pipeline error, falling back to simple flow:', error);
          // Fall through to simple flow
        }
      }

      // 🚀 TECHNICAL MOAT: Simple Optimization (always enabled)
      // Optimize prompt if we have image inputs
      if (!result && (generationType === 'image-to-video' || generationType === 'keyframe-sequence')) {
        try {
          logger.log('🔍 Video API: Optimizing prompt with vision model (Technical Moat - Simple)...');
          const { VideoPromptOptimizer } = await import('@/lib/services/video-prompt-optimizer');
          
          // Collect reference images
          const referenceImages: Array<{ imageData: string; imageType: string }> = [];
          
          if (generationType === 'image-to-video') {
            // Will be handled in the specific handler below
          } else if (generationType === 'keyframe-sequence') {
            const keyframeCount = parseInt(formData.get('keyframeCount') as string) || 0;
            for (let i = 0; i < keyframeCount; i++) {
              const keyframe = formData.get(`keyframe_${i}`) as File;
              if (keyframe) {
                const keyframeBuffer = await keyframe.arrayBuffer();
                const keyframeBase64 = Buffer.from(keyframeBuffer).toString('base64');
                referenceImages.push({ imageData: keyframeBase64, imageType: 'image/jpeg' });
              }
            }
          }

          if (referenceImages.length > 0) {
            const optimization = await VideoPromptOptimizer.optimizeVideoPrompt(
              prompt,
              referenceImages
            );
            optimizedPrompt = optimization.optimizedPrompt;
            logger.log('✅ Video API: Prompt optimized');
          }
        } catch (error) {
          logger.error('⚠️ Video prompt optimization failed:', error);
        }
      }

      // Use ModelRouter to select optimal model if not explicitly provided
      if (!selectedModel && !result) {
        try {
          const { ModelRouter } = await import('@/lib/services/model-router');
          const quality = 'standard' as 'standard' | 'high' | 'ultra';
          selectedModel = ModelRouter.selectVideoModel(quality);
          logger.log('🎯 Video API: ModelRouter selected model:', selectedModel);
        } catch (error) {
          logger.error('⚠️ Video model routing failed, using default:', error);
          const { getDefaultModel } = await import('@/lib/config/models');
          selectedModel = getDefaultModel('video').id;
        }
      }

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

        // Optimize prompt with the uploaded image
        try {
          const { SimplePromptOptimizer } = await import('@/lib/services/simple-prompt-optimizer');
          optimizedPrompt = await SimplePromptOptimizer.optimizePrompt(
            prompt,
            imageBase64,
            'image/jpeg'
          );
          logger.log('✅ Video API: Prompt optimized with image');
        } catch (error) {
          logger.error('⚠️ Video prompt optimization failed:', error);
        }

        // Generate video from image using AI SDK
        result = await aiService.generateVideo({
          prompt: optimizedPrompt,
          duration,
          aspectRatio: aspectRatio,
          uploadedImageData: imageBase64,
          uploadedImageType: 'image/jpeg',
          model: selectedModel
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

        // Optimize prompt with first keyframe
        try {
          const { SimplePromptOptimizer } = await import('@/lib/services/simple-prompt-optimizer');
          optimizedPrompt = await SimplePromptOptimizer.optimizePrompt(
            prompt,
            keyframes[0],
            'image/jpeg'
          );
          logger.log('✅ Video API: Prompt optimized with keyframe');
        } catch (error) {
          logger.error('⚠️ Video prompt optimization failed:', error);
        }

        // Optimize prompt with first keyframe
        if (!result) {
          try {
            const { VideoPromptOptimizer } = await import('@/lib/services/video-prompt-optimizer');
            const optimization = await VideoPromptOptimizer.optimizeVideoPrompt(
              prompt,
              keyframes.map(k => ({ imageData: k, imageType: 'image/jpeg' }))
            );
            optimizedPrompt = optimization.optimizedPrompt;
            logger.log('✅ Video API: Prompt optimized with keyframes');
          } catch (error) {
            logger.error('⚠️ Video prompt optimization failed:', error);
          }
        }

        // Generate video from keyframes using AI SDK
        if (!result) {
          result = await aiService.generateVideo({
            prompt: optimizedPrompt,
            duration: duration,
            durationSeconds: duration,
            aspectRatio: aspectRatio,
            firstFrameImage: { imageData: keyframes[0], imageType: 'image/jpeg' },
            lastFrameImage: keyframes.length > 1 ? { imageData: keyframes[keyframes.length - 1], imageType: 'image/jpeg' } : undefined,
            referenceImages: keyframes.slice(0, 3).map(k => ({ imageData: k, imageType: 'image/jpeg' })),
            model: selectedModel,
            resolution: '720p'
          });
        }

      } else {
        // Text-to-video generation using AI SDK
        if (!result) {
          result = await aiService.generateVideo({
            prompt: optimizedPrompt,
            duration: duration,
            durationSeconds: duration,
            aspectRatio: aspectRatio,
            model: selectedModel,
            resolution: '720p'
          });
        }
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
      const isPro = await BillingDAL.isUserPro(user.id);
      
      // Get privacy preference from formData (user's choice from UI)
      const isPublicParam = formData.get('isPublic') as string | null;
      let isPublic: boolean;
      
      if (isPro) {
        // Pro users can choose: respect their choice from UI
        isPublic = isPublicParam === 'true' || isPublicParam === null; // Default to public if not specified
      } else {
        // Free users: always public (can't make private)
        isPublic = true;
      }
      
      // Add to gallery if public
      if (isPublic) {
        logger.log(`📸 Video API: Adding video to public gallery (User is ${isPro ? 'PRO' : 'FREE'}, Choice: ${isPublicParam})`);
        await RendersDAL.addToGallery(render.id, user.id, isPublic);
      } else {
        logger.log(`🔒 Video API: Video is private (User is PRO, Choice: ${isPublicParam})`);
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
  },
  {
    routeName: 'POST /api/video',
    enableCORS: true,
    enableRateLimit: false, // Video generation should not be rate limited (handled by credits)
    onError: (error, request) => {
      logger.error('🎬 Video API: Unexpected error:', error);
      Sentry.setContext('video_api', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null; // Use default error handler
    }
  }
);
