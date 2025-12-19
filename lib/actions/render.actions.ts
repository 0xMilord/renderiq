'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AISDKService } from '@/lib/services/ai-sdk-service';
import { addCredits, deductCredits } from '@/lib/actions/billing.actions';
import { BillingDAL } from '@/lib/dal/billing';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { RenderChainService } from '@/lib/services/render-chain';
import { PlanLimitsService } from '@/lib/services/plan-limits.service';
import { StorageService } from '@/lib/services/storage';
import { logger } from '@/lib/utils/logger';
import { getCachedUser } from '@/lib/services/auth-cache';
import { getUserFromAction } from '@/lib/utils/get-user-from-action';
import { isFirstRender, getTimeToFirstRender } from '@/lib/utils/ga4-helpers';
import { 
  trackRenderCreated, 
  trackFirstRenderCreated,
  trackRenderCompleted,
  trackFirstRenderCompleted,
  trackRenderFailed
} from '@/lib/utils/ga4-tracking';

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
    
    // Try to get userId from formData first (passed from client store)
    const userIdFromClient = formData.get('userId') as string | null;
    const { userId: userIdFromAuth, user } = await getUserFromAction(userIdFromClient);
    
    // Use userId from auth
    const userId = userIdFromAuth;
    
    // If not provided, use cached auth (avoids DB call)
    if (!userId || !user) {
      logger.error('❌ Authentication failed: No user found');
      return { success: false, error: 'Authentication required' };
    }
    
    logger.log('✅ User authenticated:', userId);

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
    const model = formData.get('model') as string | null; // ✅ Extract model for model-based pricing
    const imageSize = formData.get('imageSize') as '1K' | '2K' | '4K' | null;
    
    // Check if user has pro subscription
    const isPro = await BillingDAL.isUserPro(userId);
    
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
    
    logger.log(`📸 Render visibility: ${isPublic ? 'PUBLIC' : 'PRIVATE'} (User is ${isPro ? 'PRO' : 'FREE'}, Choice: ${isPublicParam})`);
    const seedParam = formData.get('seed') as string | null;
    const seed = seedParam ? parseInt(seedParam) : undefined;
    const versionContextData = formData.get('versionContext') as string | null;
    const environment = formData.get('environment') as string | null;
    const effect = formData.get('effect') as string | null;
    // Support both styleTransferImageData (from chat) and styleReferenceImageData (from tools)
    const styleTransferImageData = formData.get('styleTransferImageData') as string | null || formData.get('styleReferenceImageData') as string | null;
    const styleTransferImageType = formData.get('styleTransferImageType') as string | null || formData.get('styleReferenceImageType') as string | null;
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

    // ✅ CHECK LIMIT: Verify user can use this quality level
    if (quality !== 'standard') {
      const qualityLimitCheck = await PlanLimitsService.checkQualityLimit(userId, quality);
      if (!qualityLimitCheck.allowed) {
        logger.warn('❌ Quality limit check failed:', qualityLimitCheck);
        return {
          success: false,
          error: qualityLimitCheck.error || 'Quality level not available',
          limitReached: true,
          limitType: qualityLimitCheck.limitType,
          current: qualityLimitCheck.current,
          limit: qualityLimitCheck.limit,
          planName: qualityLimitCheck.planName,
        };
      }
    }

    // ✅ CHECK LIMIT: Verify user can generate videos
    if (type === 'video') {
      const videoLimitCheck = await PlanLimitsService.checkVideoLimit(userId);
      if (!videoLimitCheck.allowed) {
        logger.warn('❌ Video limit check failed:', videoLimitCheck);
        return {
          success: false,
          error: videoLimitCheck.error || 'Video generation not available',
          limitReached: true,
          limitType: videoLimitCheck.limitType,
          current: videoLimitCheck.current,
          limit: videoLimitCheck.limit,
          planName: videoLimitCheck.planName,
        };
      }
    }

    // ✅ CHECK LIMIT: Verify user can create more renders in this project
    const renderLimitCheck = await PlanLimitsService.checkRenderLimit(userId, projectId);
    if (!renderLimitCheck.allowed) {
      logger.warn('❌ Render limit check failed:', renderLimitCheck);
      return {
        success: false,
        error: renderLimitCheck.error || 'Render limit reached',
        limitReached: true,
        limitType: renderLimitCheck.limitType,
        current: renderLimitCheck.current,
        limit: renderLimitCheck.limit,
        planName: renderLimitCheck.planName,
      };
    }

    // ✅ FIX: Use centralized model-based pricing instead of fixed pricing
    // This ensures consistency with API route and base tool component display
    const { getModelConfig, getDefaultModel } = await import('@/lib/config/models');
    
    let creditsCost: number;
    if (type === 'video') {
      // Video generation: Use model-based pricing
      const videoModelId = model || getDefaultModel('video').id;
      const modelConfig = getModelConfig(videoModelId as any);
      const duration = parseInt(formData.get('duration') as string) || 5;
      
      if (!modelConfig || modelConfig.type !== 'video') {
        logger.warn('⚠️ Invalid video model, using default');
        const defaultModel = getDefaultModel('video');
        creditsCost = defaultModel.calculateCredits({ duration });
      } else {
        creditsCost = modelConfig.calculateCredits({ duration });
      }
      
      logger.log('💰 Video credits cost calculation:', {
        model: videoModelId,
        duration,
        totalCredits: creditsCost
      });
    } else {
      // Image generation: Use model-based pricing
      const imageModelId = model || getDefaultModel('image').id;
      const modelConfig = getModelConfig(imageModelId as any);
      const effectiveImageSize = imageSize || (quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K');
      
      // ✅ FIX: For "auto" mode, use maximum cost (same as API route)
      if (imageModelId === 'auto') {
        const maxCostModel = getModelConfig('gemini-3-pro-image-preview' as any);
        if (maxCostModel && maxCostModel.type === 'image') {
          creditsCost = maxCostModel.calculateCredits({ quality, imageSize: effectiveImageSize });
          logger.log('💰 Image credits cost calculation (auto mode - using max cost):', {
            model: 'auto',
            estimatedModel: 'gemini-3-pro-image-preview',
            quality,
            imageSize: effectiveImageSize,
            totalCredits: creditsCost,
            note: 'Will refund difference if cheaper model is selected'
          });
        } else {
          const defaultModel = getDefaultModel('image');
          creditsCost = defaultModel.calculateCredits({ quality, imageSize: effectiveImageSize });
          logger.warn('⚠️ Max cost model not found for auto mode, using default');
        }
      } else if (!modelConfig || modelConfig.type !== 'image') {
        logger.warn('⚠️ Invalid image model, using default');
        const defaultModel = getDefaultModel('image');
        creditsCost = defaultModel.calculateCredits({ quality, imageSize: effectiveImageSize });
      } else {
        creditsCost = modelConfig.calculateCredits({ quality, imageSize: effectiveImageSize });
      }
      
      // For batch: multiply by number of requests
      const useBatchAPI = formData.get('useBatchAPI') === 'true';
      let numberOfRequests = 1;
      
      if (useBatchAPI) {
        const batchRequestsStr = formData.get('batchRequests') as string | null;
        if (batchRequestsStr) {
          try {
            const batchRequests = JSON.parse(batchRequestsStr);
            numberOfRequests = Array.isArray(batchRequests) ? batchRequests.length : 1;
          } catch (e) {
            logger.warn('Failed to parse batchRequests, defaulting to 1');
            numberOfRequests = 1;
          }
        }
      }
      
      creditsCost = creditsCost * numberOfRequests;
      
      if (imageModelId !== 'auto') {
        logger.log('💰 Image credits cost calculation:', {
          model: imageModelId,
          quality,
          imageSize: effectiveImageSize,
          numberOfRequests: useBatchAPI ? numberOfRequests : 1,
          isBatch: useBatchAPI,
          totalCredits: creditsCost
        });
      }
    }

    logger.log('💰 Credits cost:', creditsCost);

    // ✅ CHECK LIMIT: Verify user has enough credits
    const creditsLimitCheck = await PlanLimitsService.checkCreditsLimit(userId, creditsCost);
    if (!creditsLimitCheck.allowed) {
      logger.warn('❌ Credits limit check failed:', creditsLimitCheck);
      return {
        success: false,
        error: creditsLimitCheck.error || 'Insufficient credits',
        limitReached: true,
        limitType: creditsLimitCheck.limitType,
        current: creditsLimitCheck.current,
        limit: creditsLimitCheck.limit,
        planName: creditsLimitCheck.planName,
      };
    }

    // Deduct credits
    const deductResult = await deductCredits(
      creditsCost,
      `Generated ${type} - ${style} style`,
      undefined,
      'render'
    );

    if (!deductResult.success) {
      const errorMsg = 'error' in deductResult ? deductResult.error : 'Failed to deduct credits';
      logger.warn('❌ Credit deduction failed:', errorMsg);
      return { success: false, error: errorMsg };
    }

    // Verify project exists and belongs to user
    const project = await ProjectsDAL.getById(projectId);
    if (!project || project.userId !== userId) {
      logger.warn('❌ Project not found or access denied');
      return { success: false, error: 'Project not found or access denied' };
    }

    // ✅ CENTRALIZED: Get or create chain for this project using centralized service
    let finalChainId = chainId;
    let chainPosition: number;
    let chainRenders: any[] = [];
    
    if (!finalChainId) {
      logger.log('🔗 No chain specified, getting or creating default chain');
      const defaultChain = await RenderChainService.getOrCreateDefaultChain(
        projectId,
        project.name
      );
      finalChainId = defaultChain.id;
      // ✅ OPTIMIZED: Parallelize chain position and renders fetch
      [chainPosition, chainRenders] = await Promise.all([
        RenderChainService.getNextChainPosition(finalChainId),
        RendersDAL.getByChainId(finalChainId)
      ]);
    } else {
      // ✅ OPTIMIZED: Parallelize chain position and renders fetch when chainId is provided
      [chainPosition, chainRenders] = await Promise.all([
        RenderChainService.getNextChainPosition(finalChainId),
        RendersDAL.getByChainId(finalChainId)
      ]);
    }

    logger.log('📍 Chain position:', chainPosition);

    // Validate reference render ID if provided
    let validatedReferenceRenderId: string | undefined = undefined;
    let referenceRenderImageData: string | undefined = undefined;
    let referenceRenderImageType: string | undefined = undefined;
    let referenceRenderPrompt: string | undefined = undefined;
    
    if (referenceRenderId) {
      if (referenceRenderId.startsWith('temp-')) {
        logger.log('⚠️ Temporary reference render ID detected, using most recent render in chain');
        // ✅ FIXED: chainRenders is now defined above
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
                let imageUrl = referenceRender.outputUrl;
                let imageResponse = await fetch(imageUrl);
                
                // Check if response is valid (not an error XML)
                const contentType = imageResponse.headers.get('content-type') || '';
                const responseText = await imageResponse.clone().text();
                const isErrorResponse = !imageResponse.ok || 
                                       contentType.includes('xml') || 
                                       contentType.includes('text/html') ||
                                       responseText.trim().startsWith('<');
                
                // If CDN fails, try direct GCS fallback
                if (isErrorResponse && imageUrl.includes('cdn.renderiq.io')) {
                  logger.log('⚠️ CDN fetch failed, trying direct GCS fallback...');
                  imageUrl = imageUrl.replace('cdn.renderiq.io', 'storage.googleapis.com');
                  imageResponse = await fetch(imageUrl);
                }
                
                if (!imageResponse.ok) {
                  throw new Error(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
                }
                
                const imageBuffer = await imageResponse.arrayBuffer();
                const imageSize = imageBuffer.byteLength;
                
                // Validate it's actually an image (not error XML - should be > 1KB for real images)
                if (imageSize < 1024) {
                  const text = new TextDecoder().decode(imageBuffer);
                  if (text.trim().startsWith('<') || text.includes('<Error>')) {
                    throw new Error('Received error XML instead of image');
                  }
                }
                
                referenceRenderImageData = Buffer.from(imageBuffer).toString('base64');
                referenceRenderImageType = referenceRender.outputUrl.includes('.png') ? 'image/png' : 
                                          referenceRender.outputUrl.includes('.jpg') || referenceRender.outputUrl.includes('.jpeg') ? 'image/jpeg' : 
                                          'image/png';
                referenceRenderPrompt = referenceRender.prompt;
                logger.log('✅ Reference render image fetched, size:', imageSize, 'bytes');
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
          userId,
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

    // Handle batch requests - process multiple renders
    // CRITICAL: This check must happen BEFORE single render creation
    const useBatchAPI = type === 'image' ? formData.get('useBatchAPI') === 'true' : false;
    let batchRequests: Array<{ key: string; prompt: string; drawingType?: string; elevationSide?: string; floorPlanType?: string; sectionCutDirection?: string }> = [];
    
    if (useBatchAPI) {
      const batchRequestsStr = formData.get('batchRequests') as string | null;
      logger.log('📦 Server Action: Batch API flag detected, parsing batchRequests:', { 
        hasBatchRequestsStr: !!batchRequestsStr,
        batchRequestsStrLength: batchRequestsStr?.length || 0
      });
      if (batchRequestsStr) {
        try {
          batchRequests = JSON.parse(batchRequestsStr);
          logger.log('📦 Server Action: Batch request parsed successfully:', { 
            numberOfRequests: batchRequests.length, 
            batchKeys: batchRequests.map((r: any) => r.key),
            isArray: Array.isArray(batchRequests)
          });
        } catch (e) {
          logger.warn('❌ Server Action: Failed to parse batchRequests:', e);
          logger.warn('Batch requests string:', batchRequestsStr.substring(0, 200));
        }
      } else {
        logger.warn('⚠️ Server Action: useBatchAPI is true but batchRequests is missing from formData');
      }
    }

    // Process batch requests if detected
    logger.log('🔍 Server Action: Checking batch processing conditions:', {
      useBatchAPI,
      batchRequestsLength: batchRequests.length,
      type,
      willProcessBatch: useBatchAPI && batchRequests.length > 0 && type === 'image'
    });
    
    if (useBatchAPI && batchRequests.length > 0 && type === 'image') {
      logger.log('📦 Server Action: Processing batch request - ENTERING BATCH MODE:', { 
        count: batchRequests.length,
        batchKeys: batchRequests.map(r => r.key),
        batchDrawingTypes: batchRequests.map(r => `${r.drawingType}${r.elevationSide ? `-${r.elevationSide}` : ''}`)
      });
      
      const batchResults: Array<{ renderId: string; outputUrl: string; label?: string }> = [];
      let currentChainPosition = chainPosition;
      
      // First, create all render records and return IDs immediately
      // Then process them asynchronously in the background
      const renderRecords: Array<{ renderId: string; batchRequest: any; label: string }> = [];
      
      for (const batchRequest of batchRequests) {
        try {
          // Use the isolated, specific prompt from batchRequest
          const isolatedPrompt = batchRequest.prompt;
          
          // Determine platform: if imageType is set, it's from tools platform, otherwise render platform
          const batchPlatform = imageType ? 'tools' : 'render';
          
          // Create render record for this batch item
          const batchRender = await RendersDAL.create({
            projectId,
            userId: userId,
            type,
            prompt: isolatedPrompt,
            settings: {
              style,
              quality,
              aspectRatio,
              ...(imageType && { imageType }),
              ...(negativePrompt && { negativePrompt }),
              ...(environment && { environment }),
              ...(effect && { effect }),
              ...(batchRequest.drawingType && { drawingType: batchRequest.drawingType }),
              ...(batchRequest.elevationSide && { elevationSide: batchRequest.elevationSide }),
              ...(batchRequest.floorPlanType && { floorPlanType: batchRequest.floorPlanType }),
              ...(batchRequest.sectionCutDirection && { sectionCutDirection: batchRequest.sectionCutDirection }),
            },
            status: 'pending',
            chainId: batchPlatform === 'render' ? finalChainId! : undefined, // Only set chainId for render platform
            chainPosition: batchPlatform === 'render' ? currentChainPosition++ : undefined, // Only set chainPosition for render platform
            referenceRenderId: validatedReferenceRenderId,
            uploadedImageUrl,
            uploadedImageKey,
            uploadedImageId,
            platform: batchPlatform, // Set platform to prevent cross-contamination
          });

          logger.log('✅ Server Action: Batch render record created:', {
            renderId: batchRender.id,
            key: batchRequest.key,
            drawingType: batchRequest.drawingType,
            elevationSide: batchRequest.elevationSide,
            promptLength: isolatedPrompt.length
          });

          // Create label for this batch item
          let label = batchRequest.key;
          if (batchRequest.drawingType === 'floor-plan' && batchRequest.floorPlanType) {
            label = batchRequest.floorPlanType === 'normal-floor-plan' ? 'Normal Floor Plan' : 'Reflected Ceiling Plan';
          } else if (batchRequest.drawingType === 'elevation' && batchRequest.elevationSide) {
            label = `${batchRequest.elevationSide.charAt(0).toUpperCase() + batchRequest.elevationSide.slice(1)} Elevation`;
          } else if (batchRequest.drawingType === 'section' && batchRequest.sectionCutDirection) {
            label = `${batchRequest.sectionCutDirection.charAt(0).toUpperCase() + batchRequest.sectionCutDirection.slice(1)} Section`;
          }

          // Return render ID immediately (without waiting for processing)
          batchResults.push({
            renderId: batchRender.id,
            outputUrl: '', // Will be populated when render completes
            label
          });
          
          // Store for async processing
          renderRecords.push({
            renderId: batchRender.id,
            batchRequest,
            label
          });
        } catch (error) {
          logger.error('❌ Server Action: Error creating batch render record:', { 
            key: batchRequest.key, 
            error 
          });
        }
      }
      
      // ✅ FIX: Calculate credits per batch item using model-based pricing
      // Each batch item should use the same credit calculation as the main request
      // Divide total credits by number of requests to get per-item cost
      const numberOfBatchRequests = batchRequests.length; // ✅ FIXED: Use batchRequests.length instead of numberOfRequests
      const batchItemCreditsCost = Math.ceil(creditsCost / numberOfBatchRequests);
      
      logger.log('💰 Batch credits calculation:', {
        totalCredits: creditsCost,
        numberOfRequests: numberOfBatchRequests,
        perItemCredits: batchItemCreditsCost
      });
      
      // Process renders asynchronously (don't await - let them process in background)
      // This allows the server action to return immediately with render IDs
      Promise.all(renderRecords.map(async ({ renderId, batchRequest, label }) => {
        try {
          // Update render status to processing
          await RendersDAL.updateStatus(renderId, 'processing');

          // Generate image for this batch item using the isolated prompt
          const imageDataToUse = uploadedImageData || referenceRenderImageData;
          const imageTypeToUse = uploadedImageType || referenceRenderImageType;
          
          let contextualPrompt = batchRequest.prompt;
          const isUsingReferenceRender = !uploadedImageData && referenceRenderImageData && referenceRenderPrompt;
          
          if (isUsingReferenceRender) {
            contextualPrompt = `Based on the previous render (${referenceRenderPrompt}), ${batchRequest.prompt}`;
          }

          logger.log('🎨 Server Action: Generating batch item with ISOLATED prompt:', { 
            key: batchRequest.key, 
            drawingType: batchRequest.drawingType,
            elevationSide: batchRequest.elevationSide,
            promptLength: contextualPrompt.length,
            promptPreview: contextualPrompt.substring(0, 150),
            hasStyleReference: !!styleTransferImageData
          });

          // Process this batch item
          const batchRenderResult = await processRenderAsync(renderId, {
            type,
            prompt: contextualPrompt, // Use isolated prompt
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
            uploadedImageData: imageDataToUse || undefined,
            uploadedImageType: imageTypeToUse || undefined,
            referenceRenderPrompt,
            imageType: imageType || null,
            imageSize: imageSize || null,
            projectId,
            userId: userId,
            creditsCost: batchItemCreditsCost, // ✅ FIX: Use calculated per-item cost from model-based pricing
            isPublic,
          });

          if (!batchRenderResult.success || !batchRenderResult.data) {
            logger.error('❌ Server Action: Batch item generation failed:', { 
              key: batchRequest.key, 
              error: batchRenderResult.error 
            });
          } else {
            logger.log('✅ Server Action: Batch item completed:', { 
              key: batchRequest.key, 
              renderId 
            });
          }
        } catch (error) {
          logger.error('❌ Server Action: Error processing batch item:', { 
            key: batchRequest.key, 
            error 
          });
        }
      })).catch(error => {
        logger.error('❌ Server Action: Error in batch processing:', error);
      });

      logger.log('🎉 Server Action: Batch processing completed:', { 
        successCount: batchResults.length, 
        totalCount: batchRequests.length 
      });

      // Revalidate paths
      revalidatePath('/render');
      revalidatePath(`/project/${project.slug}`);
      
      return {
        success: true,
        data: batchResults,
      };
    }

    // Single render processing (existing logic)
    // Create render record in database
    logger.log('💾 Creating render record in database');
    
    // Determine platform: if imageType is set, it's from tools platform, otherwise render platform
    const platform = imageType ? 'tools' : 'render';
    
    const render = await RendersDAL.create({
      projectId,
      userId: userId,
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
      chainId: platform === 'render' ? finalChainId! : undefined, // Only set chainId for render platform
      chainPosition: platform === 'render' ? chainPosition : undefined, // Only set chainPosition for render platform
      referenceRenderId: validatedReferenceRenderId,
      uploadedImageUrl,
      uploadedImageKey,
      uploadedImageId,
      platform, // Set platform to prevent cross-contamination
    });

    logger.log('✅ Render record created:', render.id);

    // Note: GA4 tracking happens client-side after action completes
    // Server actions can't access window.gtag, so we return tracking data

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
      imageType: imageType || null,
      imageSize: imageSize || null,
      projectId,
      userId: userId,
      creditsCost,
      isPublic,
    });

    if (!renderResult.success) {
      return {
        ...renderResult,
        _ga4Track: {
          event: 'render_failed',
          renderId: render.id,
          errorType: 'generation_failed',
          errorMessage: renderResult.error || 'Unknown error',
        },
      };
    }

    // Revalidate paths
    revalidatePath('/render');
    revalidatePath(`/project/${project.slug}`);
    
    // Get first render status for tracking
    const isFirstRenderCheck = await isFirstRender(userId);
    const timeToFirstRender = isFirstRenderCheck ? await getTimeToFirstRender(userId) : null;
    const latencyMs = renderResult.data?.processingTime 
      ? renderResult.data.processingTime * 1000 
      : 0;
    
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
      _ga4Track: {
        renderCreated: {
          renderId: render.id,
          projectId,
          type,
          platform,
          quality,
          style,
          creditsCost,
          isFirst: !!isFirstRenderCheck,
          timeToFirst: timeToFirstRender || undefined,
        },
        renderCompleted: {
          renderId: render.id,
          type,
          quality,
          creditsCost,
          latencyMs,
          isFirst: !!isFirstRenderCheck,
        },
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
    imageType?: string | null;
    imageSize?: '1K' | '2K' | '4K' | null;
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
      // SKIP modification for tool-generated prompts (identified by imageType field)
      // Tool prompts are already structured with XML format and should not be modified
      const isToolPrompt = renderData.imageType && typeof renderData.imageType === 'string' && renderData.imageType.startsWith('render-');
      let contextualPrompt = renderData.prompt;
      
      if (!isToolPrompt && renderData.referenceRenderPrompt && renderData.uploadedImageData) {
        contextualPrompt = `Based on the previous render (${renderData.referenceRenderPrompt}), ${renderData.prompt}`;
        logger.log('🔗 Added reference render context to prompt (non-tool prompt)');
      } else if (isToolPrompt) {
        logger.log('🔧 Tool prompt detected - skipping reference render context modification to preserve structured XML format');
      }
      
      // Map imageSize to mediaResolution for backward compatibility, or pass imageSize directly
      // For upscaling, we want to use imageSize directly in the AI service
      const mediaResolution = renderData.imageSize === '4K' ? 'HIGH' : renderData.imageSize === '2K' ? 'MEDIUM' : 'LOW';
      
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
        mediaResolution: renderData.imageSize ? mediaResolution : undefined,
        imageSize: renderData.imageSize || undefined,
      });
    }

    if (!result.success || !result.data) {
      logger.error('❌ Generation failed:', result.error);
      await RendersDAL.updateStatus(renderId, 'failed', result.error);
      await addCredits(renderData.creditsCost, 'refund', 'Refund for failed generation', renderData.userId, 'refund');
      // ✅ FIXED: Return error object instead of undefined
      return {
        success: false,
        error: result.error || 'Generation failed',
      };
    }

    logger.log('✅ Generation successful, uploading to storage');

    // ✅ OPTIMIZED: Parallelize project fetch and pro status check
    const [project, isPro] = await Promise.all([
      ProjectsDAL.getById(renderData.projectId),
      BillingDAL.isUserPro(renderData.userId)
    ]);

    if (!project) {
      throw new Error('Project not found');
    }

    // Process image with watermark for free users, no watermark for paid users
    let processedImageData: string | undefined = undefined;
    
    if (renderData.type === 'image' && result.data.imageData) {
      // Only watermark images, not videos
      if (!isPro) {
        // Free users: Add watermark
        logger.log('🎨 Adding watermark for free user');
        const { WatermarkService } = await import('@/lib/services/watermark');
        processedImageData = await WatermarkService.addWatermark(result.data.imageData, {
          text: 'Renderiq',
          position: 'bottom-right',
          opacity: 0.5,
          useLogo: true // Use logo SVG instead of text
        });
      } else {
        // Paid users: No watermark
        logger.log('✅ Paid user - no watermark applied');
        processedImageData = result.data.imageData;
      }
    }

    // Upload generated image/video to storage
    let uploadResult;
    if (processedImageData) {
      // Use processed base64 data (with or without watermark)
      const fileExtension = 'png';
      logger.log(`📤 Uploading processed ${renderData.type} data to storage`);
      const buffer = Buffer.from(processedImageData, 'base64');
      uploadResult = await StorageService.uploadFile(
        buffer,
        'renders',
        renderData.userId,
        `render_${renderId}.${fileExtension}`,
        project.slug
      );
    } else if (result.data.imageData) {
      // Use base64 data directly (for videos or if processing skipped)
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
      await RendersDAL.addToGallery(renderId, renderData.userId, renderData.isPublic);
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

