import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AISDKService } from '@/lib/services/ai-sdk-service';
import { addCredits, deductCredits } from '@/lib/actions/billing.actions';
import { BillingDAL } from '@/lib/dal/billing';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { ProjectRulesDAL } from '@/lib/dal/project-rules';
import { StorageService } from '@/lib/services/storage';
import { logger } from '@/lib/utils/logger';
import { 
  validatePrompt, 
  sanitizeInput, 
  isAllowedOrigin, 
  getSafeErrorMessage, 
  securityLog,
  isValidUUID,
  isValidImageType,
  isValidFileSize,
  redactSensitive
} from '@/lib/utils/security';
import { rateLimitMiddleware } from '@/lib/utils/rate-limit';

const aiService = AISDKService.getInstance();

// Configure route to handle large body sizes (for image uploads)
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video generation

export async function POST(request: NextRequest) {
  let creditsCost: number | undefined;
  let user: { id: string } | null = null;
  
  try {
    // Rate limiting
    const rateLimit = rateLimitMiddleware(request, { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }

    // Check origin (only if provided - optimized for performance)
    const origin = request.headers.get('origin');
    if (origin && !isAllowedOrigin(origin)) {
      securityLog('unauthorized_origin', { origin }, 'warn');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }
    // Note: Requests without origin header are allowed (same-origin or direct API calls)

    logger.log('🚀 Starting render generation API call');
    
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      securityLog('auth_failed', { error: 'Authentication required' }, 'warn');
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    user = authUser;
    
    // Redact user ID in logs
    logger.log('✅ User authenticated');

    const formData = await request.formData();
    
    // Validate and sanitize all inputs
    const promptRaw = formData.get('prompt') as string;
    const promptValidation = validatePrompt(promptRaw);
    if (!promptValidation.valid) {
      securityLog('invalid_prompt', { error: promptValidation.error }, 'warn');
      return NextResponse.json({ success: false, error: promptValidation.error || 'Invalid prompt' }, { status: 400 });
    }
    const prompt = promptValidation.sanitized!;
    
    const style = sanitizeInput(formData.get('style') as string);
    const quality = sanitizeInput(formData.get('quality') as string) as 'standard' | 'high' | 'ultra';
    const aspectRatio = sanitizeInput(formData.get('aspectRatio') as string);
    
    // Validate type
    const typeParam = sanitizeInput(formData.get('type') as string);
    const type = (typeParam === 'video' ? 'video' : 'image') as 'image' | 'video';
    
    const uploadedImageData = formData.get('uploadedImageData') as string | null;
    const uploadedImageType = formData.get('uploadedImageType') as string | null;
    
    // Validate image type if provided
    if (uploadedImageType && !isValidImageType(uploadedImageType)) {
      securityLog('invalid_image_type', { type: uploadedImageType }, 'warn');
      return NextResponse.json({ success: false, error: 'Invalid image type' }, { status: 400 });
    }
    
    const projectIdRaw = formData.get('projectId') as string;
    if (!projectIdRaw || !isValidUUID(projectIdRaw)) {
      securityLog('invalid_project_id', {}, 'warn');
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
    }
    const projectId = projectIdRaw;
    
    const chainIdRaw = formData.get('chainId') as string | null;
    const chainId = chainIdRaw && isValidUUID(chainIdRaw) ? chainIdRaw : null;
    
    const referenceRenderIdRaw = formData.get('referenceRenderId') as string | null;
    const referenceRenderId = referenceRenderIdRaw && isValidUUID(referenceRenderIdRaw) ? referenceRenderIdRaw : null;
    
    const negativePromptRaw = formData.get('negativePrompt') as string | null;
    const negativePrompt = negativePromptRaw ? sanitizeInput(negativePromptRaw) : null;
    
    const imageType = sanitizeInput(formData.get('imageType') as string | null);
    
    // Check if user has pro subscription
    // Free users: renders are public (added to gallery)
    // Pro users: renders are private (not added to gallery)
    const isPro = await BillingDAL.isUserPro(user.id);
    const isPublic = !isPro; // Free users = public, Pro users = private
    logger.log(`📸 Render visibility: ${isPublic ? 'PUBLIC' : 'PRIVATE'} (User is ${isPro ? 'PRO' : 'FREE'})`);
    
    const seedParam = formData.get('seed') as string | null;
    const seed = seedParam ? parseInt(seedParam) : undefined;
    if (seed && (isNaN(seed) || seed < 0 || seed > 2147483647)) {
      return NextResponse.json({ success: false, error: 'Invalid seed value' }, { status: 400 });
    }
    
    const versionContextData = formData.get('versionContext') as string | null;
    const environment = sanitizeInput(formData.get('environment') as string | null);
    const effect = sanitizeInput(formData.get('effect') as string | null);
    const styleTransferImageData = formData.get('styleTransferImageData') as string | null;
    const styleTransferImageType = formData.get('styleTransferImageType') as string | null;
    
    if (styleTransferImageType && !isValidImageType(styleTransferImageType)) {
      securityLog('invalid_style_image_type', { type: styleTransferImageType }, 'warn');
      return NextResponse.json({ success: false, error: 'Invalid style image type' }, { status: 400 });
    }
    
    const temperatureParam = formData.get('temperature') as string | null;
    const temperature = temperatureParam ? parseFloat(temperatureParam) : 0.7;
    if (isNaN(temperature) || temperature < 0 || temperature > 2) {
      return NextResponse.json({ success: false, error: 'Invalid temperature value' }, { status: 400 });
    }
    
    const durationParam = formData.get('duration') as string | null;
    const duration = durationParam ? parseInt(durationParam) : (type === 'video' ? 8 : undefined);
    if (duration && (isNaN(duration) || duration < 1 || duration > 60)) {
      return NextResponse.json({ success: false, error: 'Invalid duration value' }, { status: 400 });
    }
    const videoDuration = type === 'video' ? (duration || 8) : undefined;

    // Log parameters with redacted sensitive info
    logger.log('📝 Render parameters:', redactSensitive({ 
      prompt: prompt.substring(0, 50) + '...',
      style, 
      quality, 
      aspectRatio, 
      type, 
      imageType,
      negativePrompt: negativePrompt ? 'provided' : 'none',
      hasImage: !!uploadedImageData, 
      projectId: projectId.substring(0, 8) + '...',
      hasChainId: !!chainId,
      hasReferenceRenderId: !!referenceRenderId,
      isPublic,
      hasSeed: !!seed,
      duration: duration || 'N/A'
    }));

    if (!prompt || !style || !quality || !aspectRatio || !type || !projectId) {
      logger.warn('❌ Missing required parameters');
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    // Calculate credits cost FIRST
    // For videos: Based on Google Veo 3.1 pricing ($0.75/second) with 2x markup
    // 1 credit = 5 INR, 1 USD = 100 INR (updated conversion rate)
    // Cost per second: $0.75 × 2 (markup) × 100 (INR/USD) / 5 (INR/credit) = 30 credits/second
    if (type === 'video') {
      // Veo 3.1 pricing: $0.75/second, with 2x markup = $1.50/second
      // In INR: $1.50 × 100 = 150 INR/second
      // At 5 INR/credit: 150 / 5 = 30 credits/second
      const creditsPerSecond = 30;
      creditsCost = creditsPerSecond * videoDuration;
      logger.log('💰 Video credits cost calculation:', {
        duration: videoDuration,
        creditsPerSecond,
        totalCredits: creditsCost
      });
    } else {
      // Image generation: Based on Google Gemini 3 Pro Image Preview pricing ($0.134/image) with 2x markup
      // 1 credit = 5 INR, 1 USD = 100 INR (updated conversion rate)
      // Base cost: $0.134 × 2 (markup) × 100 (INR/USD) / 5 (INR/credit) = 5.36 credits/image (round to 5)
      const baseCreditsPerImage = 5;
      const qualityMultiplier = quality === 'high' ? 2 : quality === 'ultra' ? 3 : 1;
      creditsCost = baseCreditsPerImage * qualityMultiplier;
      logger.log('💰 Image credits cost calculation:', {
        quality,
        baseCreditsPerImage,
        qualityMultiplier,
        totalCredits: creditsCost
      });
    }

    // CRITICAL: Check balance BEFORE attempting deduction to prevent any leakage
    const userCredits = await BillingDAL.getUserCreditsWithReset(user.id);
    
    if (!userCredits || userCredits.balance < creditsCost) {
      logger.warn('❌ Insufficient credits - balance check failed:', {
        required: creditsCost,
        available: userCredits?.balance || 0,
        userId: user.id.substring(0, 8) + '...' // Redact full user ID
      });
      // Return minimal info - don't expose exact balance in error response
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient credits',
        required: creditsCost
        // Don't expose available balance in response
      }, { status: 402 });
    }

    // Only proceed with deduction if balance check passes
    const deductResult = await deductCredits(
      creditsCost,
      `Generated ${type} - ${style} style`,
      undefined,
      'render'
    );

    if (!deductResult.success) {
      logger.warn('❌ Credit deduction failed after balance check:', deductResult.error);
      return NextResponse.json({ success: false, error: deductResult.error || 'Failed to deduct credits' }, { status: 402 });
    }

    // Verify project exists and belongs to user
    const project = await ProjectsDAL.getById(projectId);
    if (!project || project.userId !== user.id) {
      logger.warn('❌ Project not found or access denied');
      return NextResponse.json({ success: false, error: 'Project not found or access denied' }, { status: 403 });
    }

    // Get or create chain for this project
    let finalChainId = chainId;
    
    if (!finalChainId) {
      logger.log('🔗 No chain specified, finding or creating default chain');
      
      // Check if project already has a default chain
      const existingChains = await RenderChainsDAL.getByProjectId(projectId);
      
      if (existingChains.length > 0) {
        // Use the most recent chain
        finalChainId = existingChains[0].id;
        logger.log('✅ Using existing chain:', finalChainId);
      } else {
        // Create a new default chain
        const chainName = project ? `${project.name} - Iterations` : 'Default Chain';
        const newChain = await RenderChainsDAL.create({
          projectId,
          name: chainName,
          description: 'Automatic chain for render iterations',
        });
        finalChainId = newChain.id;
        logger.log('✅ Created new chain:', finalChainId);
      }
    } else {
      logger.log('🔗 Using chain from request:', finalChainId);
    }

    // Get chain position
    const chainRenders = await RendersDAL.getByChainId(finalChainId);
    const chainPosition = chainRenders.length;

    logger.log('📍 Chain position:', chainPosition);

    // Validate reference render ID if provided and fetch its image for context
    let validatedReferenceRenderId: string | undefined = undefined;
    let referenceRenderImageData: string | undefined = undefined;
    let referenceRenderImageType: string | undefined = undefined;
    let referenceRenderPrompt: string | undefined = undefined;
    
    if (referenceRenderId) {
      // Handle temporary render IDs (generated by frontend before DB persistence)
      if (referenceRenderId.startsWith('temp-')) {
        logger.log('⚠️ Temporary reference render ID detected, using most recent render in chain:', referenceRenderId);
        // Use the most recent completed render in the chain as reference
        if (chainRenders.length > 0) {
          const mostRecentRender = chainRenders
            .filter(r => r.status === 'completed')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          
          if (mostRecentRender) {
            validatedReferenceRenderId = mostRecentRender.id;
            logger.log('✅ Using most recent completed render as reference:', validatedReferenceRenderId);
            // Fetch the reference render's image
            if (mostRecentRender.outputUrl) {
              try {
                logger.log('📥 Fetching reference render image:', mostRecentRender.outputUrl);
                const imageResponse = await fetch(mostRecentRender.outputUrl);
                const imageBuffer = await imageResponse.arrayBuffer();
                referenceRenderImageData = Buffer.from(imageBuffer).toString('base64');
                referenceRenderImageType = mostRecentRender.outputUrl.includes('.png') ? 'image/png' : 
                                          mostRecentRender.outputUrl.includes('.jpg') || mostRecentRender.outputUrl.includes('.jpeg') ? 'image/jpeg' : 
                                          'image/png';
                referenceRenderPrompt = mostRecentRender.prompt;
                logger.log('✅ Reference render image fetched, size:', referenceRenderImageData.length);
              } catch (error) {
                logger.error('❌ Failed to fetch reference render image:', error);
              }
            }
          } else {
            logger.log('⚠️ No completed renders found in chain, will generate new image');
          }
        }
      } else {
        logger.log('🔍 Validating reference render ID:', referenceRenderId);
        try {
          const referenceRender = await RendersDAL.getById(referenceRenderId);
          if (referenceRender && referenceRender.status === 'completed') {
            validatedReferenceRenderId = referenceRenderId;
            logger.log('✅ Reference render validated:', referenceRenderId);
            // Fetch the reference render's image
            if (referenceRender.outputUrl) {
              try {
                logger.log('📥 Fetching reference render image:', referenceRender.outputUrl);
                const imageResponse = await fetch(referenceRender.outputUrl);
                const imageBuffer = await imageResponse.arrayBuffer();
                referenceRenderImageData = Buffer.from(imageBuffer).toString('base64');
                referenceRenderImageType = referenceRender.outputUrl.includes('.png') ? 'image/png' : 
                                          referenceRender.outputUrl.includes('.jpg') || referenceRender.outputUrl.includes('.jpeg') ? 'image/jpeg' : 
                                          'image/png';
                referenceRenderPrompt = referenceRender.prompt;
                logger.log('✅ Reference render image fetched, size:', referenceRenderImageData.length);
              } catch (error) {
                logger.error('❌ Failed to fetch reference render image:', error);
              }
            }
          } else {
            logger.log('⚠️ Reference render not found or not completed, ignoring reference');
          }
        } catch (error) {
          logger.log('⚠️ Error validating reference render, ignoring reference:', error);
        }
      }
    }

    // Fetch and append project rules to prompt if chainId is provided
    let finalPrompt = prompt;
    if (chainId) {
      try {
        const activeRules = await ProjectRulesDAL.getActiveRulesByChainId(chainId);
        if (activeRules.length > 0) {
          const rulesText = activeRules.map(r => r.rule).join('. ');
          finalPrompt = `${prompt}. Project rules: ${rulesText}`;
          logger.log('📋 Project rules appended to prompt:', {
            rulesCount: activeRules.length,
            promptLength: finalPrompt.length
          });
        }
      } catch (error) {
        logger.warn('⚠️ Failed to fetch project rules, continuing without them:', error);
        // Continue without rules rather than failing the request
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
        // Continue without uploaded image rather than failing the entire request
      }
    }

    // Create render record in database
    logger.log('💾 Creating render record in database', {
      projectId,
      userId: user.id,
      type,
      prompt: prompt.substring(0, 50) + '...',
      chainId: finalChainId,
      chainPosition
    });
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
      chainId: finalChainId,
      chainPosition,
      referenceRenderId: validatedReferenceRenderId,
      uploadedImageUrl,
      uploadedImageKey,
      uploadedImageId,
    });

    logger.log('✅ Render record created in database', {
      renderId: render.id,
      chainId: finalChainId,
      chainPosition,
      prompt: render.prompt?.substring(0, 50) + '...',
      status: render.status,
      type: render.type,
      createdAt: render.createdAt
    });

    // Update render status to processing
    await RendersDAL.updateStatus(render.id, 'processing');

    try {
      // Generate image/video
      logger.log('🎨 Starting AI generation');
      
      let result;
      
      // Branch based on type
      if (type === 'video') {
        logger.log('🎬 Using Veo 3.1 for video generation');
        
        // Get video-specific parameters (duration already parsed above for credit calculation)
        const resolution = (formData.get('resolution') as '720p' | '1080p') || '720p';
        
        // Parse keyframes/reference images (up to 3)
        const keyframesData = formData.get('keyframes') as string | null;
        let referenceImages: Array<{ imageData: string; imageType: string }> | undefined;
        if (keyframesData) {
          try {
            const keyframes = JSON.parse(keyframesData);
            referenceImages = keyframes.slice(0, 3); // Max 3 for Veo 3.1
            logger.log('🎬 Video keyframes:', { count: referenceImages.length });
          } catch (error) {
            logger.warn('⚠️ Failed to parse keyframes:', error);
          }
        }
        
        // Parse last frame for interpolation
        const lastFrameData = formData.get('lastFrame') as string | null;
        let lastFrame: { imageData: string; imageType: string } | undefined;
        if (lastFrameData) {
          try {
            lastFrame = JSON.parse(lastFrameData);
            logger.log('🎬 Video last frame provided for interpolation');
          } catch (error) {
            logger.warn('⚠️ Failed to parse last frame:', error);
          }
        }
        
        // Use Veo 3.1 for video generation
        // videoDuration is guaranteed to be a number here since we're in the video type block
        const finalVideoDuration = videoDuration || 8;
        logger.log('🎬 Veo 3.1 parameters:', { 
          duration: finalVideoDuration, 
          aspectRatio, 
          resolution,
          hasFirstFrame: !!uploadedImageData,
          referenceImagesCount: referenceImages?.length || 0,
          hasLastFrame: !!lastFrame
        });
        const videoResult = await aiService.generateVideo({
          prompt: finalPrompt,
          duration: finalVideoDuration as 4 | 6 | 8, // Veo 3.1 supports 4, 6, or 8 seconds
          aspectRatio: (aspectRatio as '16:9' | '9:16' | '1:1') || '16:9',
          uploadedImageData: uploadedImageData || undefined,
          uploadedImageType: uploadedImageType || undefined,
        });
        
        if (!videoResult.success || !videoResult.data) {
          logger.error('❌ Video generation failed:', videoResult.error);
          result = {
            success: false,
            error: videoResult.error || 'Video generation failed'
          };
        } else {
          // Use videoData (base64) if available, otherwise use videoUrl
          const videoData = videoResult.data.videoData || videoResult.data.videoUrl;
          result = {
            success: true,
            data: {
              imageData: videoData, // Store as imageData for compatibility
              imageUrl: videoResult.data.videoUrl, // Also store URL
              processingTime: videoResult.data.processingTime || 60,
              provider: videoResult.data.provider || 'veo-3.1'
            }
          };
        }
        
      } else {
        // Image generation
        logger.log('🎨 Using AISDKService for image generation');
        
        // Parse version context if provided
        let versionContext = undefined;
        if (versionContextData) {
          try {
            versionContext = JSON.parse(versionContextData);
            logger.log('🔍 Using version context for generation');
          } catch (error) {
            logger.log('⚠️ Failed to parse version context, ignoring:', error);
          }
        }

        // Smart image selection logic:
        // 1. If user uploaded a NEW image -> use it (fresh start, no reference context)
        // 2. If NO uploaded image but reference render exists -> use reference render (iterative edit)
        // 3. If neither -> generate from scratch
        const imageDataToUse = uploadedImageData || referenceRenderImageData;
        const imageTypeToUse = uploadedImageType || referenceRenderImageType;
        
        // Enhance prompt with context ONLY when using reference render (iterative edit)
        // Don't add context when user uploaded a new image (fresh start)
        let contextualPrompt = finalPrompt;
        const isUsingReferenceRender = !uploadedImageData && referenceRenderImageData && referenceRenderPrompt;
        
        if (isUsingReferenceRender) {
          // Add context about what we're editing (iterative edit scenario)
          contextualPrompt = `Based on the previous render (${referenceRenderPrompt}), ${finalPrompt}`;
          logger.log('🔗 Using contextual prompt with reference render for iterative edit:', contextualPrompt.substring(0, 100));
        } else if (uploadedImageData) {
          // User uploaded a new image - use fresh prompt without reference context
          logger.log('🆕 Using fresh prompt with new uploaded image (no reference context)');
        } else {
          // No image at all - generate from scratch
          logger.log('🎨 Generating from scratch (no image input)');
        }
        
        result = await aiService.generateImage({
          prompt: contextualPrompt,
          aspectRatio,
          uploadedImageData: imageDataToUse || undefined,
          uploadedImageType: imageTypeToUse || undefined,
          negativePrompt: negativePrompt || undefined,
          seed,
          environment: environment || undefined,
          effect: effect || undefined,
          styleTransferImageData: styleTransferImageData || undefined,
          styleTransferImageType: styleTransferImageType || undefined,
          temperature,
        });
      }

      if (!result.success || !result.data) {
        logger.error('❌ Generation failed:', result.error);
        
        // Determine if this is a Google API error (should always refund)
        const isGoogleError = result.error?.includes('Google') || 
                             result.error?.includes('Gemini') ||
                             result.error?.includes('Veo') ||
                             result.error?.includes('quota') ||
                             result.error?.includes('rate limit') ||
                             result.error?.includes('API');
        
        // Always refund on failure - user should never lose credits due to our errors
        await addCredits(creditsCost, 'refund', 'Refund for failed generation', user.id, 'refund');
        await RendersDAL.updateStatus(render.id, 'failed', result.error);
        
        // Return appropriate status code
        const statusCode = isGoogleError ? 503 : 500; // 503 for service unavailable
        return NextResponse.json({ 
          success: false, 
          error: result.error || 'Generation failed',
          refunded: true // Inform client that credits were refunded
        }, { status: statusCode });
      }

      logger.log('✅ Generation successful, processing and uploading to storage');

      // Process image with watermark for free users, no watermark for paid users
      let processedImageData: string | undefined = undefined;
      
      if (type === 'image' && result.data.imageData) {
        // Only watermark images, not videos
        if (!isPro) {
          // Free users: Add watermark
          logger.log('🎨 Adding watermark for free user');
          const { WatermarkService } = await import('@/lib/services/watermark');
          processedImageData = await WatermarkService.addWatermark(result.data.imageData, {
            text: 'Renderiq',
            position: 'bottom-right',
            opacity: 0.7
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
        logger.log(`📤 Uploading processed ${type} data to storage`);
        const buffer = Buffer.from(processedImageData, 'base64');
        uploadResult = await StorageService.uploadFile(
          buffer,
          'renders',
          user.id,
          `render_${render.id}.${fileExtension}`,
          project.slug
        );
      } else if (result.data.imageData) {
        // Use base64 data directly (for videos or if processing skipped)
        const fileExtension = type === 'video' ? 'mp4' : 'png';
        logger.log(`📤 Uploading base64 ${type} data to storage`);
        const buffer = Buffer.from(result.data.imageData, 'base64');
        uploadResult = await StorageService.uploadFile(
          buffer,
          'renders',
          user.id,
          `render_${render.id}.${fileExtension}`,
          project.slug
        );
      } else if (result.data.imageUrl) {
        // Fallback to URL fetch (for video or other cases)
        logger.log(`📤 Fetching ${type} from URL for storage`);
        const response = await fetch(result.data.imageUrl);
        const blob = await response.blob();
        const fileExtension = type === 'video' ? 'mp4' : 'png';
        const outputFile = new File([blob], `render_${render.id}.${fileExtension}`, {
          type: type === 'video' ? 'video/mp4' : 'image/png'
        });
        uploadResult = await StorageService.uploadFile(
          outputFile,
          'renders',
          user.id,
          undefined,
          project.slug
        );
      } else {
        logger.error('❌ No data available:', { 
          hasImageData: !!result.data.imageData, 
          hasImageUrl: !!result.data.imageUrl,
          dataKeys: Object.keys(result.data)
        });
        throw new Error('No data or URL received from generation service');
      }

      logger.log('✅ File uploaded to storage:', uploadResult.url);

      // Update render with output URL
      await RendersDAL.updateOutput(render.id, uploadResult.url, uploadResult.key, 'completed', Math.round(result.data.processingTime));

      // Add to gallery if public
      if (isPublic) {
        logger.log('📸 Adding render to public gallery');
        await RendersDAL.addToGallery(render.id, user.id, true);
      }

      logger.log('🎉 Render completed successfully');

      return NextResponse.json({
        success: true,
        data: {
          id: render.id,
          renderId: render.id, // Include renderId for frontend use
          status: 'completed',
          outputUrl: uploadResult.url,
          processingTime: result.data.processingTime,
          provider: result.data.provider,
          type: type, // Include type (image/video) for frontend
        },
      });

    } catch (error) {
      logger.error('❌ Generation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isGoogleError = errorMessage.includes('Google') || 
                           errorMessage.includes('Gemini') ||
                           errorMessage.includes('Veo') ||
                           errorMessage.includes('quota') ||
                           errorMessage.includes('API');
      
      // CRITICAL: Always refund credits on failure - user should never lose credits
      try {
        await addCredits(creditsCost, 'refund', 'Refund for failed generation', user.id, 'refund');
        logger.log('✅ Credits refunded after generation failure');
      } catch (refundError) {
        logger.error('❌ CRITICAL: Failed to refund credits after generation failure:', refundError);
        // This is critical - log but don't fail the response
      }
      
      await RendersDAL.updateStatus(render.id, 'failed', errorMessage);
      
      const statusCode = isGoogleError ? 503 : 500;
      return NextResponse.json({ 
        success: false, 
        error: isGoogleError ? 'AI service temporarily unavailable' : 'Generation failed',
        refunded: true
      }, { status: statusCode });
    }

  } catch (error) {
    securityLog('render_api_error', { error: getSafeErrorMessage(error) }, 'error');
    logger.error('❌ API error:', error);
    
    // For top-level errors, try to refund if we have the necessary data
    try {
      if (typeof creditsCost !== 'undefined' && user?.id) {
        await addCredits(creditsCost, 'refund', 'Refund for API error', user.id, 'refund');
        logger.log('✅ Credits refunded after API error');
      }
    } catch (refundError) {
      logger.error('❌ CRITICAL: Failed to refund credits after API error:', refundError);
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      refunded: typeof creditsCost !== 'undefined' && user?.id
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const renders = await RendersDAL.getByUser(user.id, projectId);
    
    return NextResponse.json({ success: true, data: renders });
  } catch (error) {
    logger.error('❌ Get renders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch renders' }, { status: 500 });
  }
}
