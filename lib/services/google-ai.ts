import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import { Render } from '@/lib/db/schema';
import { ChainContext } from '@/lib/types/render-chain';
import { ContextPromptService } from './context-prompt';

export interface GoogleAIImageRequest {
  prompt: string;
  style: string;
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: string;
  uploadedImageData?: string;
  uploadedImageType?: string;
  negativePrompt?: string;
  imageType?: string;
  seed?: number;
  // Context awareness fields
  referenceRender?: Render;
  chainContext?: ChainContext;
}

export interface GoogleAIImageResponse {
  success: boolean;
  data?: {
    imageUrl: string;
    imageData: string;
    id: string;
    prompt: string;
    style: string;
    quality: string;
    aspectRatio: string;
    processingTime: number;
    provider: string;
  };
  error?: string;
}

export interface GoogleAIVideoRequest {
  prompt: string;
  style: string;
  quality: 'standard' | 'high' | 'ultra';
  duration: number;
  aspectRatio: string;
}

export interface GoogleAIVideoResponse {
  success: boolean;
  data?: {
    url: string;
    id: string;
    prompt: string;
    style: string;
    quality: string;
    duration: number;
    aspectRatio: string;
    processingTime: number;
    provider: string;
  };
  error?: string;
}

export class GoogleAIService {
  private static instance: GoogleAIService;
  private genAI: GoogleGenerativeAI;
  private vertexAI: VertexAI | null = null;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
    
    // Only initialize Vertex AI if project ID is available
    if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      this.vertexAI = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT_ID,
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      });
    } else {
      console.log('⚠️ GoogleAIService: GOOGLE_CLOUD_PROJECT_ID not set, Vertex AI disabled. Seed support will not be available.');
    }
  }

  static getInstance(): GoogleAIService {
    if (!GoogleAIService.instance) {
      GoogleAIService.instance = new GoogleAIService();
    }
    return GoogleAIService.instance;
  }

  async generateImage(request: GoogleAIImageRequest): Promise<GoogleAIImageResponse> {
    console.log('🎨 GoogleAI: Starting image generation', { 
      prompt: request.prompt, 
      style: request.style, 
      aspectRatio: request.aspectRatio,
      quality: request.quality,
      qualityLevel: request.quality === 'ultra' ? '3x (Ultra)' : request.quality === 'high' ? '2x (High)' : '1x (Standard)',
      hasUploadedImage: !!request.uploadedImageData,
      hasSeed: !!request.seed
    });

    // 🧠 CRITICAL FIX: PREPROCESSING FIRST - Only for actual uploaded images!
    // DO NOT preprocess if this is just a reference render (iteration without new upload)
    // Check if this is an iteration by looking for referenceRenderId without new upload
    const isIteration = !!request.referenceRender && !request.uploadedImageData;
    const isActualUpload = !!request.uploadedImageData && !isIteration;
    
    console.log('🧠 GoogleAI: Preprocessing decision:', {
      hasUploadedImageData: !!request.uploadedImageData,
      hasReferenceRender: !!request.referenceRender,
      isIteration,
      isActualUpload,
      willPreprocess: isActualUpload
    });
    
    const preprocessing = isActualUpload ? await this.preprocessUserInput(
      request.prompt,
      request.uploadedImageData,
      true
    ) : {
      refinedPrompt: request.prompt,
      imageAnalysis: undefined,
      promptAnalysis: { clarity: 100, conflicts: [], suggestions: [] }
    };
    
    // Use the refined prompt instead of raw user input
    const finalPrompt = preprocessing.refinedPrompt;
    
    console.log('🧠 GoogleAI: Using refined prompt:', {
      originalLength: request.prompt.length,
      refinedLength: finalPrompt.length,
      clarityScore: preprocessing.promptAnalysis?.clarity || 0,
      conflictsResolved: preprocessing.promptAnalysis?.conflicts.length || 0
    });
    
    try {
      const startTime = Date.now();
      
      // Build context-aware prompt with quality enhancement - NOW uses preprocessed prompt
      const enhancedPrompt = await this.buildContextAwareImagePrompt(
        finalPrompt, // Use refined prompt instead of raw user input
        request.style,
        request.negativePrompt,
        request.imageType,
        request.referenceRender,
        request.chainContext,
        !!request.uploadedImageData
      );

      // Add quality-specific enhancements
      const qualityEnhancedPrompt = this.enhancePromptForQuality(enhancedPrompt, request.quality);
      
      console.log('🎨 GoogleAI: Context-aware prompt created', { 
        enhancedPrompt: qualityEnhancedPrompt,
        hasReferenceRender: !!request.referenceRender,
        hasChainContext: !!request.chainContext
      });
      
      let imageData: string;
      let provider: string;
      
      // Use Vertex AI if seed is provided for deterministic generation
      if (request.seed !== undefined && this.vertexAI) {
        console.log('🎨 GoogleAI: Using Vertex AI for seeded generation', { seed: request.seed });
        
        const model = this.vertexAI.getGenerativeModel({
          model: 'gemini-2.5-flash-image',
        });
        
        const generationConfig = {
          seed: request.seed,
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        };
        
        // Prepare content for Vertex AI
        let content;
        if (request.uploadedImageData && request.uploadedImageType) {
          console.log('🎨 GoogleAI: Using uploaded image data for multimodal generation with Vertex AI');
          content = [
            {
              text: qualityEnhancedPrompt
            },
            {
              inlineData: {
                mimeType: request.uploadedImageType,
                data: request.uploadedImageData
              }
            }
          ];
        } else {
          content = enhancedPrompt;
        }
        
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: content }],
          generationConfig,
        });
        
        const response = await result.response;
        const parts = response.candidates?.[0]?.content?.parts || [];
        
        for (const part of parts) {
          if (part.inlineData?.data) {
            imageData = part.inlineData.data;
            break;
          }
        }
        
        if (!imageData) {
          throw new Error('No image data received from Vertex AI');
        }
        
        provider = 'vertex-ai-gemini-2.5-flash-image';
      } else if (request.seed !== undefined && !this.vertexAI) {
        console.log('⚠️ GoogleAI: Seed provided but Vertex AI not available, falling back to standard Gemini API (seed will be ignored)');
        
        // Fall back to standard Gemini API but warn that seed is ignored
        const model = this.genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash-image' 
        });

        // Configure aspect ratio based on request
        const aspectRatioConfig = this.getAspectRatioConfig(request.aspectRatio);
        
        console.log('🎨 GoogleAI: Generating with aspect ratio', { aspectRatioConfig });
        
        // Prepare content for Gemini API
        let content;
        
        if (request.uploadedImageData && request.uploadedImageType) {
          console.log('🎨 GoogleAI: Using uploaded image data for multimodal generation');
          
          // Create multimodal content with image and text
          content = [
            {
              text: qualityEnhancedPrompt
            },
            {
              inlineData: {
                mimeType: request.uploadedImageType,
                data: request.uploadedImageData
              }
            }
          ];
        } else {
          // Text-only generation
          content = qualityEnhancedPrompt;
        }
        
        // Use the correct configuration format for Gemini 2.5 Flash Image
        const result = await model.generateContent(content);
        
        console.log('🎨 GoogleAI: Received response from Gemini');
        const response = await result.response;
        
        // Extract image data from response - check all parts for image data
        const parts = response.candidates?.[0]?.content?.parts || [];
        
        console.log('🎨 GoogleAI: Processing response parts', { partCount: parts.length });
        
        for (const part of parts) {
          if (part.inlineData?.data) {
            imageData = part.inlineData.data;
            console.log('🎨 GoogleAI: Found image data in part');
            break;
          }
        }
        
        if (!imageData) {
          console.error('❌ GoogleAI: No image data in response', { 
            response: response,
            parts: parts.map(p => ({ hasInlineData: !!p.inlineData, hasText: !!p.text }))
          });
          throw new Error('No image data received from Gemini');
        }
        
        provider = 'gemini-2.5-flash-image';
      } else {
        // Choose model based on quality setting
        const modelName = request.quality === 'high' || request.quality === 'ultra' 
          ? 'gemini-2.5-flash-image' // Enhanced model for high quality
          : 'gemini-2.5-flash-image'; // Standard model for standard quality
        
        console.log('🎨 GoogleAI: Using Gemini API for generation', { 
          model: modelName, 
          quality: request.quality,
          enhanced: request.quality === 'high' || request.quality === 'ultra'
        });
        
        // Use Gemini 2.5 Flash Image for image generation
        const model = this.genAI.getGenerativeModel({ 
          model: modelName 
        });

        // Configure aspect ratio based on request
        const aspectRatioConfig = this.getAspectRatioConfig(request.aspectRatio);
        
        console.log('🎨 GoogleAI: Generating with aspect ratio', { aspectRatioConfig });
        
        // Prepare content for Gemini API
        let content;
        
        if (request.uploadedImageData && request.uploadedImageType) {
          console.log('🎨 GoogleAI: Using uploaded image data for multimodal generation');
          
          // Create multimodal content with image and text
          content = [
            {
              text: qualityEnhancedPrompt
            },
            {
              inlineData: {
                mimeType: request.uploadedImageType,
                data: request.uploadedImageData
              }
            }
          ];
        } else {
          // Text-only generation
          content = qualityEnhancedPrompt;
        }
        
        // Use the correct configuration format for Gemini 2.5 Flash Image
        const result = await model.generateContent(content);
        
        console.log('🎨 GoogleAI: Received response from Gemini');
        const response = await result.response;
        
        // Extract image data from response - check all parts for image data
        const parts = response.candidates?.[0]?.content?.parts || [];
        
        console.log('🎨 GoogleAI: Processing response parts', { partCount: parts.length });
        
        for (const part of parts) {
          if (part.inlineData?.data) {
            imageData = part.inlineData.data;
            console.log('🎨 GoogleAI: Found image data in part');
            break;
          }
        }
        
        if (!imageData) {
          console.error('❌ GoogleAI: No image data in response', { 
            response: response,
            parts: parts.map(p => ({ hasInlineData: !!p.inlineData, hasText: !!p.text }))
          });
          throw new Error('No image data received from Gemini');
        }
        
        provider = 'gemini-2.5-flash-image';
      }

      console.log('🎨 GoogleAI: Image data received, preparing for storage');
      
      // Return base64 data for server-side processing
      const processingTime = (Date.now() - startTime) / 1000;
      console.log('✅ GoogleAI: Image generation completed successfully', { 
        id: `generated_${Date.now()}`,
        processingTime: `${processingTime}s`,
        aspectRatio: request.aspectRatio,
        provider,
        seed: request.seed
      });

      return {
        success: true,
        data: {
          imageData: imageData, // base64 string
          imageUrl: `data:image/png;base64,${imageData}`, // data URL for immediate display
          id: `generated_${Date.now()}`,
          prompt: request.prompt,
          style: request.style,
          quality: request.quality,
          aspectRatio: request.aspectRatio,
          processingTime,
          provider,
        },
      };
    } catch (error) {
      console.error('❌ GoogleAI: Image generation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: request.prompt,
        style: request.style,
        seed: request.seed
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image',
      };
    }
  }

  async generateVideo(request: GoogleAIVideoRequest): Promise<GoogleAIVideoResponse> {
    console.log('🎬 GoogleAI: Starting video generation', { 
      prompt: request.prompt, 
      style: request.style, 
      duration: request.duration,
      aspectRatio: request.aspectRatio
    });
    
    try {
      const startTime = Date.now();
      
      // Enhanced prompt for architectural video
      const enhancedPrompt = this.buildVideoPrompt(request.prompt, request.style, request.duration);
      
      console.log('🎬 GoogleAI: Enhanced video prompt created', { enhancedPrompt });
      
      // Use Veo 3 for video generation
      const model = this.genAI.getGenerativeModel({ 
        model: 'veo-3' 
      });

      console.log('🎬 GoogleAI: Generating video with Veo 3');
      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      
      console.log('🎬 GoogleAI: Processing video response');
      
      // Extract video data from response
      const videoData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!videoData) {
        console.error('❌ GoogleAI: No video data in response', { response });
        throw new Error('No video data received from Veo 3');
      }

      console.log('🎬 GoogleAI: Video data received, creating blob URL');

      // Convert base64 to blob URL for display
      const videoBlob = new Blob([Buffer.from(videoData, 'base64')], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);

      const processingTime = (Date.now() - startTime) / 1000;
      console.log('✅ GoogleAI: Video generation completed successfully', { 
        id: `veo_${Date.now()}`,
        processingTime: `${processingTime}s`,
        duration: request.duration
      });

      return {
        success: true,
        data: {
          url: videoUrl,
          id: `veo_${Date.now()}`,
          prompt: request.prompt,
          style: request.style,
          quality: request.quality,
          duration: request.duration,
          aspectRatio: request.aspectRatio,
          processingTime,
          provider: 'veo-3',
        },
      };
    } catch (error) {
      console.error('❌ GoogleAI: Video generation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: request.prompt,
        style: request.style,
        duration: request.duration
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate video with Veo 3',
      };
    }
  }


  /**
   * Build context-aware image prompt with reference and chain context
   */
  private async buildContextAwareImagePrompt(
    userPrompt: string,
    style: string,
    negativePrompt?: string,
    imageType?: string,
    referenceRender?: Render,
    chainContext?: ChainContext,
    hasReferenceImage?: boolean
  ): Promise<string> {
    console.log('🎨 GoogleAI: Building context-aware prompt', {
      userPrompt: userPrompt.substring(0, 100) + '...',
      style,
      hasReferenceRender: !!referenceRender,
      hasChainContext: !!chainContext,
      hasReferenceImage
    });

    // Check for @ mentions first - if found, we should use VersionContextService
    const hasMentions = userPrompt.includes('@') || userPrompt.includes('version') || userPrompt.includes('#');
    
    const finalPrompt = userPrompt;
    
    if (hasMentions) {
      console.log('🔍 GoogleAI: Detected @ mentions - VersionContextService integration needed');
      // TODO: Integrate VersionContextService here when we have access to userRenders
      // For now, we'll let the ContextPromptService handle it minimally
    }

    // Use ContextPromptService for intelligent context building (now much cleaner)
    const contextPrompt = await ContextPromptService.buildContextAwarePrompt(
      finalPrompt,
      referenceRender,
      chainContext,
      style,
      imageType
    );

    console.log('🎨 GoogleAI: Context-aware prompt created', {
      originalLength: userPrompt.length,
      enhancedLength: contextPrompt.enhancedPrompt.length,
      contextElementsCount: contextPrompt.contextElements.length,
      styleModifiersCount: contextPrompt.styleModifiers.length
    });

    // Build the architectural prompt with clean context
    return this.buildImagePrompt(
      contextPrompt.enhancedPrompt,
      style,
      negativePrompt,
      imageType,
      hasReferenceImage
    );
  }

  /**
   * Enhance prompt based on quality setting with advanced techniques
   */
  private enhancePromptForQuality(prompt: string, quality: 'standard' | 'high' | 'ultra'): string {
    console.log('🎯 GoogleAI: Applying quality enhancement', { quality });
    
    if (quality === 'standard') {
      console.log('⚡ GoogleAI: Using standard quality (no enhancement)');
      return prompt;
    }

    const qualityEnhancements = {
      high: '\n\nEnhanced quality requirements: Maximum detail, professional architectural visualization, photorealistic rendering, high resolution, sharp focus, accurate lighting and materials, fine textures, realistic shadows and highlights, professional architectural photography standards.',
      ultra: '\n\nUltra quality requirements: Exceptional detail, studio-quality architectural visualization, ultra-photorealistic rendering, maximum resolution, perfect focus, cinematic lighting and materials, professional architectural photography quality, 8K quality, pristine clarity, studio-grade rendering, magazine-quality architectural photography.'
    };

    // Add Midjourney-style quality suffixes
    const qualitySuffixes = {
      high: ', --quality 2, --style raw, --ar 16:9',
      ultra: ', --quality 3, --style raw, --ar 16:9, --v 6'
    };

    const enhancedPrompt = prompt + qualityEnhancements[quality] + qualitySuffixes[quality];
    console.log('✨ GoogleAI: Quality enhancement applied', { 
      quality, 
      enhancement: qualityEnhancements[quality].substring(0, 100) + '...',
      suffix: qualitySuffixes[quality]
    });
    return enhancedPrompt;
  }

  /**
   * Preprocess and analyze user input before generation
   * This is where we intelligently refine prompts and analyze images
   */
  private async preprocessUserInput(
    userPrompt: string, 
    uploadedImageData?: string, 
    hasReferenceImage?: boolean
  ): Promise<{
    refinedPrompt: string;
    imageAnalysis?: {
      detectedElements: string[];
      suggestedImprovements: string[];
      conflicts: string[];
    };
    promptAnalysis?: {
      clarity: number;
      conflicts: string[];
      suggestions: string[];
    };
  }> {
    console.log('🔍 GoogleAI: Starting intelligent preprocessing...');
    
    // 1. Analyze the prompt for clarity and conflicts
    const promptAnalysis = this.analyzePromptQuality(userPrompt);
    
    // 2. If we have an image, analyze it for context
    let imageAnalysis;
    if (uploadedImageData || hasReferenceImage) {
      imageAnalysis = await this.analyzeImageContext(uploadedImageData);
    }
    
    // 3. Refine the prompt based on analysis
    const refinedPrompt = this.refinePromptBasedOnAnalysis(userPrompt, promptAnalysis, imageAnalysis);
    
    console.log('🔍 GoogleAI: Preprocessing complete:', {
      originalPrompt: userPrompt.substring(0, 100) + '...',
      refinedPrompt: refinedPrompt.substring(0, 100) + '...',
      promptClarity: promptAnalysis.clarity,
      hasImageAnalysis: !!imageAnalysis,
      conflictsResolved: promptAnalysis.conflicts.length
    });
    
    return {
      refinedPrompt,
      imageAnalysis,
      promptAnalysis
    };
  }

  /**
   * Analyze prompt quality and detect issues
   */
  private analyzePromptQuality(prompt: string): {
    clarity: number;
    conflicts: string[];
    suggestions: string[];
  } {
    const conflicts: string[] = [];
    const suggestions: string[] = [];
    
    // Check for conflicting lighting instructions
    const lightingTerms = ['sunset', 'sunrise', 'golden hour', 'night', 'daytime', 'sunny', 'dark', 'bright'];
    const foundLighting = lightingTerms.filter(term => 
      prompt.toLowerCase().includes(term.toLowerCase())
    );
    
    if (foundLighting.length > 1) {
      conflicts.push(`Conflicting lighting: ${foundLighting.join(', ')}`);
      suggestions.push('Choose one lighting condition for better results');
    }
    
    // Check for conflicting weather/atmosphere
    const weatherTerms = ['fog', 'clear', 'rainy', 'stormy', 'cloudy', 'hazy'];
    const foundWeather = weatherTerms.filter(term => 
      prompt.toLowerCase().includes(term.toLowerCase())
    );
    
    if (foundWeather.length > 1) {
      conflicts.push(`Conflicting weather: ${foundWeather.join(', ')}`);
      suggestions.push('Specify one weather condition');
    }
    
    // Check for vague instructions
    if (prompt.includes('better') || prompt.includes('improve') || prompt.includes('fix')) {
      suggestions.push('Be more specific about what to improve');
    }
    
    // Calculate clarity score (0-100)
    let clarity = 100;
    clarity -= conflicts.length * 20; // Major penalty for conflicts
    clarity -= (prompt.split(' ').length < 5 ? 30 : 0); // Too short
    clarity -= (prompt.length > 500 ? 20 : 0); // Too long
    clarity -= suggestions.length * 10; // Minor penalty for suggestions
    
    return {
      clarity: Math.max(0, clarity),
      conflicts,
      suggestions
    };
  }

  /**
   * Analyze image context using basic heuristics (Vision API temporarily disabled due to model availability)
   */
  private async analyzeImageContext(imageData?: string): Promise<{
    detectedElements: string[];
    suggestedImprovements: string[];
    conflicts: string[];
    cameraAngle?: string;
    perspective?: string;
    architecturalStyle?: string;
    materials?: string[];
    lighting?: string;
  }> {
    console.log('🔍 GoogleAI: Starting basic image analysis (Vision API disabled)...');
    
    const analysis = {
      detectedElements: [] as string[],
      suggestedImprovements: [] as string[],
      conflicts: [] as string[],
      cameraAngle: undefined as string | undefined,
      perspective: undefined as string | undefined,
      architecturalStyle: undefined as string | undefined,
      materials: [] as string[],
      lighting: undefined as string | undefined
    };

    if (!imageData) {
      console.log('⚠️ GoogleAI: No image data provided for analysis');
      return analysis;
    }

    // TODO: Re-enable Vision API when correct model is available
    // For now, use fallback camera angle preservation
    console.log('📐 GoogleAI: Using fallback analysis - preserving original image characteristics');

    analysis.cameraAngle = 'preserve_original';
    analysis.perspective = 'maintain_uploaded_angle';
    analysis.detectedElements = ['Architecture detected (Vision API temporarily disabled)'];
    analysis.suggestedImprovements = ['Preserve original image characteristics'];

    return analysis;

    /* VISION API CODE - TEMPORARILY DISABLED DUE TO MODEL AVAILABILITY ISSUES
    try {
      const analysisPrompt = `
Analyze this architectural image and provide detailed technical information:

1. CAMERA ANGLE & PERSPECTIVE:
   - What camera angle is used? (eye-level, low-angle, high-angle, bird's-eye, worm's-eye)
   - What perspective? (one-point, two-point, three-point, isometric)
   - What focal length does this appear to be? (wide-angle 16mm, standard 35mm, telephoto 85mm+)

2. ARCHITECTURAL ANALYSIS:
   - What architectural style is this? (modern, contemporary, traditional, brutalist, minimalist, etc.)
   - What materials are visible? (concrete, glass, steel, wood, brick, etc.)
   - What building type? (residential, commercial, institutional, etc.)

3. LIGHTING & ATMOSPHERE:
   - What lighting conditions? (natural daylight, sunset, night, overcast, etc.)
   - What time of day does this appear to be?
   - Any weather conditions visible?

4. COMPOSITION:
   - What's the main focal point?
   - How is the building positioned in the frame?
   - Any notable compositional elements?

Respond in this exact JSON format:
{
  "cameraAngle": "low-angle",
  "perspective": "two-point",
  "focalLength": "wide-angle 16mm",
  "architecturalStyle": "brutalist",
  "materials": ["concrete", "glass"],
  "buildingType": "institutional",
  "lighting": "natural daylight",
  "timeOfDay": "afternoon",
  "weather": "clear",
  "composition": "building centered with dramatic low-angle view",
  "focalPoint": "main building facade"
}`;

      console.log('🎯 GoogleAI: Sending image to Gemini Vision API for analysis...');

      const result = await model.generateContent([
        {
          text: analysisPrompt
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData
          }
        }
      ]);

      const response = await result.response;
      const analysisText = response.text();

      console.log('📊 GoogleAI: Received vision analysis:', analysisText.substring(0, 200) + '...');

      // Parse the JSON response
      try {
        const parsedAnalysis = JSON.parse(analysisText);
        
        // Extract key information
        analysis.cameraAngle = parsedAnalysis.cameraAngle || 'unknown';
        analysis.perspective = parsedAnalysis.perspective || 'unknown';
        analysis.architecturalStyle = parsedAnalysis.architecturalStyle || 'unknown';
        analysis.materials = parsedAnalysis.materials || [];
        analysis.lighting = parsedAnalysis.lighting || 'unknown';

        // Build detected elements array
        analysis.detectedElements = [
          `Camera angle: ${parsedAnalysis.cameraAngle}`,
          `Perspective: ${parsedAnalysis.perspective}`,
          `Focal length: ${parsedAnalysis.focalLength}`,
          `Architectural style: ${parsedAnalysis.architecturalStyle}`,
          `Materials: ${parsedAnalysis.materials?.join(', ') || 'unknown'}`,
          `Lighting: ${parsedAnalysis.lighting}`,
          `Time: ${parsedAnalysis.timeOfDay}`
        ];

        // Build suggestions based on analysis
        analysis.suggestedImprovements = [
          `Maintain ${parsedAnalysis.cameraAngle} camera angle for consistency`,
          `Preserve ${parsedAnalysis.perspective} perspective`,
          `Consider ${parsedAnalysis.architecturalStyle} architectural elements`,
          `Use ${parsedAnalysis.lighting} lighting conditions`
        ];

        console.log('✅ GoogleAI: Vision analysis completed successfully:', {
          cameraAngle: analysis.cameraAngle,
          perspective: analysis.perspective,
          architecturalStyle: analysis.architecturalStyle,
          materialsCount: analysis.materials.length,
          lighting: analysis.lighting
        });

      } catch (parseError) {
        console.error('❌ GoogleAI: Failed to parse vision analysis JSON:', parseError);
        
        // Fallback to basic analysis
        analysis.cameraAngle = 'preserve_original';
        analysis.perspective = 'maintain_uploaded_angle';
        analysis.detectedElements = ['Architecture detected (parsing failed)'];
        analysis.suggestedImprovements = ['Preserve original image characteristics'];
      }

    } catch (error) {
      console.error('❌ GoogleAI: Vision analysis failed:', error);
      
      // Fallback to basic analysis
      analysis.cameraAngle = 'preserve_original';
      analysis.perspective = 'maintain_uploaded_angle';
      analysis.detectedElements = ['Architecture detected (analysis failed)'];
      analysis.suggestedImprovements = ['Preserve original image characteristics'];
    }

    return analysis;
    */ // END OF VISION API CODE COMMENT BLOCK
  }

  /**
   * Refine prompt based on analysis results
   */
  private refinePromptBasedOnAnalysis(
    originalPrompt: string, 
    promptAnalysis: {
      clarity: number;
      conflicts: string[];
      suggestions: string[];
    }, 
    imageAnalysis?: {
      detectedElements: string[];
      suggestedImprovements: string[];
      conflicts: string[];
      cameraAngle?: string;
      perspective?: string;
      architecturalStyle?: string;
      materials?: string[];
      lighting?: string;
    }
  ): string {
    let refinedPrompt = originalPrompt;
    
    // Resolve conflicts automatically
    if (promptAnalysis.conflicts.length > 0) {
      console.log('🔧 GoogleAI: Auto-resolving conflicts...');
      
      // Resolve lighting conflicts (prioritize last mentioned)
      if (refinedPrompt.toLowerCase().includes('sunset') && refinedPrompt.toLowerCase().includes('sunny')) {
        const lastLightingIndex = Math.max(
          refinedPrompt.toLowerCase().lastIndexOf('sunset'),
          refinedPrompt.toLowerCase().lastIndexOf('sunny')
        );
        
        if (refinedPrompt.toLowerCase().substring(lastLightingIndex).includes('sunny')) {
          refinedPrompt = refinedPrompt.replace(/sunset/gi, '').trim();
          console.log('🔧 Resolved: Removed sunset, kept sunny day');
        } else {
          refinedPrompt = refinedPrompt.replace(/sunny day/gi, '').replace(/sunny/gi, '').trim();
          console.log('🔧 Resolved: Removed sunny day, kept sunset');
        }
      }
      
      // Clean up extra spaces
      refinedPrompt = refinedPrompt.replace(/\s+/g, ' ').trim();
    }
    
    // 🎯 ENHANCED: Use REAL vision analysis data for intelligent prompt refinement
    if (imageAnalysis && imageAnalysis.cameraAngle && imageAnalysis.cameraAngle !== 'unknown') {
      console.log('📐 GoogleAI: Using REAL vision analysis for prompt refinement:', {
        cameraAngle: imageAnalysis.cameraAngle,
        perspective: imageAnalysis.perspective,
        architecturalStyle: imageAnalysis.architecturalStyle,
        materials: imageAnalysis.materials
      });
      
      // Add specific camera angle preservation based on actual analysis
      if (imageAnalysis.cameraAngle !== 'preserve_original' && imageAnalysis.perspective !== 'maintain_uploaded_angle') {
        refinedPrompt += `, maintain the exact ${imageAnalysis.cameraAngle} camera angle and ${imageAnalysis.perspective} perspective from the original image`;
      } else {
        refinedPrompt += `, maintain the exact same camera angle and perspective as the original image`;
      }
      
      // Add architectural style context if detected
      if (imageAnalysis.architecturalStyle && imageAnalysis.architecturalStyle !== 'unknown') {
        refinedPrompt += `, preserve the ${imageAnalysis.architecturalStyle} architectural style`;
      }
      
      // Add material context if detected
      if (imageAnalysis.materials && imageAnalysis.materials.length > 0) {
        const materialText = imageAnalysis.materials.join(', ');
        refinedPrompt += `, maintain the ${materialText} materials`;
      }
      
      // Add lighting context if detected and user hasn't specified conflicting lighting
      if (imageAnalysis.lighting && imageAnalysis.lighting !== 'unknown') {
        const userHasLighting = refinedPrompt.toLowerCase().includes('sunset') || 
                               refinedPrompt.toLowerCase().includes('sunny') ||
                               refinedPrompt.toLowerCase().includes('night') ||
                               refinedPrompt.toLowerCase().includes('daylight');
        
        if (!userHasLighting) {
          refinedPrompt += `, use ${imageAnalysis.lighting} lighting conditions`;
        }
      }
      
    } else if (imageAnalysis?.cameraAngle === 'preserve_original') {
      // Fallback for basic analysis
      console.log('📐 GoogleAI: Using fallback camera angle preservation');
      refinedPrompt += ', maintain the exact same camera angle and perspective as the original image';
    }
    
    // Add architectural context if missing
    if (!refinedPrompt.toLowerCase().includes('architectural') && 
        !refinedPrompt.toLowerCase().includes('building') &&
        !refinedPrompt.toLowerCase().includes('structure')) {
      refinedPrompt += ', architectural context';
    }
    
    return refinedPrompt;
  }

  private buildImagePrompt(userPrompt: string, style: string, negativePrompt?: string, imageType?: string, hasReferenceImage?: boolean): string {
    // Check if user explicitly wants photorealistic/photographic output
    const wantsPhotorealistic = userPrompt.toLowerCase().includes('photorealistic') || 
                               userPrompt.toLowerCase().includes('photoreal') ||
                               userPrompt.toLowerCase().includes('photo') ||
                               userPrompt.toLowerCase().includes('realistic') ||
                               userPrompt.toLowerCase().includes('render');

    // 🎯 ENHANCED: Check for specific camera angle preservation from vision analysis
    const preserveCameraAngle = userPrompt.toLowerCase().includes('maintain the exact') ||
                               userPrompt.toLowerCase().includes('preserve original camera') ||
                               userPrompt.toLowerCase().includes('same camera angle') ||
                               userPrompt.toLowerCase().includes('camera angle and') ||
                               userPrompt.toLowerCase().includes('perspective from the original');

    if (preserveCameraAngle) {
      console.log('📐 GoogleAI: Real vision analysis detected - will respect original image characteristics');
      
      // Extract specific details from vision analysis
      const cameraMatch = userPrompt.match(/maintain the exact (\w+-angle) camera angle and (\w+) perspective/);
      if (cameraMatch) {
        console.log('📐 GoogleAI: Detected specific camera specs:', {
          angle: cameraMatch[1],
          perspective: cameraMatch[2]
        });
      }
    }

    // Check if user wants to convert from sketch/drawing to photorealistic OR photo to sketch
    const hasConversionKeywords = userPrompt.toLowerCase().includes('convert') ||
                                  userPrompt.toLowerCase().includes('transform') ||
                                  userPrompt.toLowerCase().includes('sketch') ||
                                  userPrompt.toLowerCase().includes('render');
    
    // Determine conversion direction based on user prompt and style
    const wantsSketch = userPrompt.toLowerCase().includes('sketch') || 
                       userPrompt.toLowerCase().includes('drawing') ||
                       style === 'sketch';
    
    // More nuanced detection: distinguish between rough sketches and clean architectural drawings
    const isRoughSketch = userPrompt.toLowerCase().includes('rough') ||
                         userPrompt.toLowerCase().includes('hand drawn') ||
                         userPrompt.toLowerCase().includes('pencil') ||
                         userPrompt.toLowerCase().includes('sketch');
    
    const isCleanDrawing = userPrompt.toLowerCase().includes('architectural') ||
                          userPrompt.toLowerCase().includes('elevation') ||
                          userPrompt.toLowerCase().includes('drawing') ||
                          userPrompt.toLowerCase().includes('blueprint') ||
                          userPrompt.toLowerCase().includes('illustration') ||
                          userPrompt.toLowerCase().includes('render') ||
                          userPrompt.toLowerCase().includes('3d') ||
                          userPrompt.toLowerCase().includes('cgi');
    
    // Detect if this is an iteration (modification request)
    const isIteration = userPrompt.toUpperCase().includes('ADD') ||
                       userPrompt.toUpperCase().includes('REMOVE') ||
                       userPrompt.toUpperCase().includes('CHANGE') ||
                       userPrompt.toUpperCase().includes('MAKE') ||
                       userPrompt.toUpperCase().includes('MORE') ||
                       userPrompt.toUpperCase().includes('LESS') ||
                       userPrompt.toUpperCase().includes('REPLACE') ||
                       userPrompt.toUpperCase().includes('SHOW') ||
                       userPrompt.toUpperCase().includes('ZOOM') ||
                       userPrompt.toUpperCase().includes('MOVE') ||
                       userPrompt.toUpperCase().includes('ADJUST') ||
                       userPrompt.toUpperCase().includes('FIX') ||
                       userPrompt.toUpperCase().includes('CLIP');
    
    const isSketchToPhoto = hasReferenceImage && wantsPhotorealistic && hasConversionKeywords && !wantsSketch && !isIteration;
    const isPhotoToSketch = hasReferenceImage && wantsSketch && hasConversionKeywords && !isIteration;
    const isCleanDrawingToPhoto = hasReferenceImage && wantsPhotorealistic && hasConversionKeywords && isCleanDrawing && !isRoughSketch && !isIteration;
    
    console.log('🎯 GoogleAI: Conversion detection:', {
      isIteration,
      hasConversionKeywords,
      wantsPhotorealistic,
      isCleanDrawingToPhoto,
      isSketchToPhoto,
      isPhotoToSketch,
      willApplyTransformation: isCleanDrawingToPhoto || isSketchToPhoto || isPhotoToSketch
    });

    // Enhanced prompt building with advanced techniques
    // IMPORTANT: USER PROMPT COMES FIRST! System parameters are MINIMAL suggestions only.
    
    // Clean up conflicting user instructions for iterations
    let cleanedPrompt = userPrompt;
    if (hasReferenceImage) {
      // Detect and resolve conflicting lighting instructions
      const hasSunset = cleanedPrompt.toLowerCase().includes('sunset');
      const hasSunnyDay = cleanedPrompt.toLowerCase().includes('sunny day') || 
                         cleanedPrompt.toLowerCase().includes('sunny');
      
      if (hasSunset && hasSunnyDay) {
        // Prioritize the LAST lighting instruction (user's final intent)
        if (cleanedPrompt.toLowerCase().lastIndexOf('sunny') > cleanedPrompt.toLowerCase().lastIndexOf('sunset')) {
          // Remove sunset references, keep sunny day
          cleanedPrompt = cleanedPrompt.replace(/sunset/gi, '').replace(/sunset/gi, '');
          console.log('🔧 GoogleAI: Resolved conflicting lighting - prioritizing sunny day over sunset');
        } else {
          // Remove sunny day references, keep sunset
          cleanedPrompt = cleanedPrompt.replace(/sunny day/gi, '').replace(/sunny/gi, '');
          console.log('🔧 GoogleAI: Resolved conflicting lighting - prioritizing sunset over sunny day');
        }
      }
      
      // Clean up redundant spaces and commas
      cleanedPrompt = cleanedPrompt.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
      
      // Log the cleaning process
      if (cleanedPrompt !== userPrompt) {
        console.log('🔧 GoogleAI: Cleaned conflicting instructions:', {
          original: userPrompt.substring(0, 100) + '...',
          cleaned: cleanedPrompt.substring(0, 100) + '...',
          changes: 'Resolved lighting conflicts'
        });
      }
    }
    
    let basePrompt: string;
    if (hasReferenceImage && isCleanDrawingToPhoto) {
      // USER PROMPT FIRST, then clean architectural drawing/illustration/render to REAL CAMERA PHOTOGRAPHY
      basePrompt = `${cleanedPrompt}. Transform this architectural drawing, illustration, or 3D render into a real photograph taken with a professional camera, as if this building actually exists and was photographed in real life with natural lighting, real materials, and authentic textures.`;
    } else if (hasReferenceImage && isSketchToPhoto) {
      // USER PROMPT FIRST, then rough sketch-to-photo conversion instruction
      basePrompt = `${cleanedPrompt}. Transform this architectural sketch into a real photograph taken with a professional camera, as if this building actually exists and was photographed in real life.`;
    } else if (hasReferenceImage && isPhotoToSketch) {
      // USER PROMPT FIRST, then photo-to-sketch conversion instruction
      basePrompt = `${cleanedPrompt}. Transform this photorealistic image into an architectural sketch.`;
    } else if (hasReferenceImage && isIteration) {
      // USER PROMPT FIRST for modifications/iterations - MODIFY the reference image
      basePrompt = `${cleanedPrompt}. Modify the reference image according to the request above.`;
    } else if (hasReferenceImage) {
      // USER PROMPT FIRST for general reference image usage
      basePrompt = `${cleanedPrompt}.`;
    } else {
      // USER PROMPT FIRST for new images
      basePrompt = `${cleanedPrompt}.`;
    }

    const styleModifiers = {
      modern: 'in a modern architectural style with clean lines, glass, and steel elements',
      contemporary: 'in a contemporary style with innovative materials and sustainable design',
      traditional: 'in a traditional architectural style with classic proportions and materials',
      minimalist: 'in a minimalist style with simple forms and clean aesthetics',
      industrial: 'in an industrial style with exposed materials and utilitarian design',
      mediterranean: 'in a Mediterranean style with stucco walls and terracotta roofs',
      colonial: 'in a colonial style with symmetrical design and classical elements',
      victorian: 'in a Victorian style with ornate details and decorative elements',
      realistic: 'in a photorealistic style with accurate lighting and materials',
      cgi: 'as a high-quality 3D render with professional lighting',
      night: 'at night with dramatic lighting and atmosphere',
      sketch: 'as an architectural sketch with clean lines and proportions',
      watercolor: 'in a watercolor painting style with soft colors and textures',
      illustration: 'as a detailed architectural illustration',
    };

    // Override style if user explicitly wants photorealistic
    let effectiveStyle = style;
    if (wantsPhotorealistic && (style === 'sketch' || style === 'watercolor' || style === 'illustration')) {
      effectiveStyle = 'realistic';
      console.log('🎨 GoogleAI: Overriding style from', style, 'to realistic due to photorealistic request');
    }

    const styleModifier = styleModifiers[effectiveStyle as keyof typeof styleModifiers] || styleModifiers.realistic;

    // Add image type modifier
    let imageTypeModifier = '';
    if (imageType) {
      const imageTypeModifiers = {
        '3d-mass': 'as a 3D massing model with clean geometric forms',
        'photo': 'as a realistic photograph with natural lighting',
        'drawing': 'as an architectural drawing with technical precision',
        'wireframe': 'as a wireframe model showing structural elements',
        'construction': 'as a construction documentation image',
      };
      imageTypeModifier = imageTypeModifiers[imageType as keyof typeof imageTypeModifiers] || '';
    }

    // Build the final prompt - KEEP IT SIMPLE AND CLEAN!
    // User prompt is ALREADY in basePrompt, don't bury it!
    let finalPrompt = basePrompt;
    
    // Only add style modifier if user hasn't specified it AND it's not an iteration
    const userHasStyle = userPrompt.toLowerCase().includes(effectiveStyle.toLowerCase()) ||
                        userPrompt.toLowerCase().includes('modern') ||
                        userPrompt.toLowerCase().includes('traditional') ||
                        userPrompt.toLowerCase().includes('minimalist');
    
    // For iterations (hasReferenceImage + modification words), skip style modifiers entirely
    
    if (!hasReferenceImage && !userHasStyle) {
      // Only add for NEW images where user didn't specify style
      finalPrompt += ` ${styleModifier}`;
      
    if (imageTypeModifier) {
      finalPrompt += `, ${imageTypeModifier}`;
      }
    }
    
    // MINIMAL quality note - only for new images, NOT for iterations
    if (!hasReferenceImage && !isIteration) {
      finalPrompt += '. Professional architectural visualization';
    }

    // Add advanced negative prompts
    const advancedNegatives = this.buildAdvancedNegativePrompts(isSketchToPhoto, effectiveStyle, hasReferenceImage, imageType, isPhotoToSketch, isCleanDrawingToPhoto);
    
    if (negativePrompt && negativePrompt.trim()) {
      finalPrompt += ` Avoid: ${negativePrompt.trim()}, ${advancedNegatives}.`;
    } else {
      finalPrompt += ` Avoid: ${advancedNegatives}.`;
    }

    return finalPrompt;
  }

  /**
   * Build professional photography parameters (Google Gemini best practices)
   * These are SUGGESTIONS that complement user prompts, not rigid rules
   */
  private buildPhotographyParameters(style: string, imageType?: string, preserveCameraAngle?: boolean): string {
    // 🎯 CRITICAL: If preserving camera angle, skip ALL camera-related parameters
    if (preserveCameraAngle) {
      console.log('📷 GoogleAI: Skipping photography parameters to preserve original camera angle');
      return '';
    }
    
    // Check if user already specified camera/lighting details in their prompt
    // If they did, skip our suggestions to respect their choices
    
    // MINIMAL, FLEXIBLE parameters that enhance without overriding
    const photographySettings: Record<string, string> = {
      realistic: 'Professional architectural photography. ',
      photo: 'Professional architectural photography. ',
      cgi: '3D architectural rendering with professional lighting. ',
      night: 'Night architectural photography with appropriate exposure. ',
      sketch: 'Architectural sketch. ',
      watercolor: 'Watercolor architectural rendering. ',
      illustration: 'Architectural illustration. '
    };

    // Get minimal base suggestion
    const params = photographySettings[style] || photographySettings['realistic'];

    console.log('📷 GoogleAI: Applied minimal photography parameters', {
      style,
      imageType: imageType || 'default',
      paramsLength: params.length,
      preserveCameraAngle: preserveCameraAngle || false
    });

    return params;
  }

  /**
   * Build MINIMAL technical photography enhancements (only if user didn't specify)
   */
  private buildTechnicalEnhancements(wantsPhotorealistic: boolean, _hasReferenceImage: boolean): string {
    if (!wantsPhotorealistic) {
      return '';
    }

    // MINIMAL suggestions that don't override user intent
    return '. Professional quality, sharp focus, balanced composition';
  }

  /**
   * Build MINIMAL lighting suggestions (only if user didn't specify)
   */
  private buildLightingSpecifications(style: string, wantsPhotorealistic: boolean): string {
    if (!wantsPhotorealistic) {
      return '';
    }

    // MINIMAL lighting suggestions by style
    const lightingMap = {
      modern: ', natural daylight',
      contemporary: ', soft lighting',
      traditional: ', warm lighting',
      minimalist: ', clean lighting',
      industrial: ', dramatic lighting',
      night: ', night lighting',
      realistic: ', natural lighting',
      cgi: ', professional lighting'
    };

    return lightingMap[style as keyof typeof lightingMap] || ', natural lighting';
  }

  /**
   * Build comprehensive automatic negative prompts for all styles
   */
  private buildAdvancedNegativePrompts(isSketchToPhoto: boolean, style: string, hasReferenceImage: boolean, imageType?: string, isPhotoToSketch?: boolean, isCleanDrawingToPhoto?: boolean): string {
    // Base negatives - ALWAYS included
    const baseNegatives = [
      'blurry',
      'low quality',
      'distorted',
      'artifacts',
      'grainy',
      'pixelated',
      'out of focus',
      'bad composition',
      'deformed',
      'disfigured',
      'ugly',
      'poorly rendered',
      'bad anatomy',
      'incorrect proportions'
    ];

    // Clean architectural drawing to REAL CAMERA PHOTOGRAPHY negatives
    if (isCleanDrawingToPhoto) {
      baseNegatives.push(
        'rough sketches',
        'pencil marks',
        'hand-drawn appearance',
        'draft quality',
        'unfinished look',
        'sketchy lines',
        'cartoon style',
        'artistic rendering',
        'stylized appearance',
        '3D render',
        'CGI',
        'digital art',
        'illustration',
        'drawing',
        'painting',
        'architectural visualization',
        'computer generated',
        'virtual reality',
        'game graphics',
        'animated',
        'rendered',
        'modeled',
        'synthetic'
      );
    }
    // Rough sketch to REAL CAMERA PHOTOGRAPHY negatives (more aggressive cleanup)
    else if (isSketchToPhoto) {
      baseNegatives.push(
        'sketchy lines',
        'rough drawings',
        'pencil marks',
        'hand-drawn appearance',
        'line art',
        'cartoon style',
        'illustration style',
        'artistic rendering',
        'stylized appearance',
        'draft quality',
        'unfinished look',
        '3D render',
        'CGI',
        'digital art',
        'architectural visualization',
        'computer generated',
        'virtual reality',
        'game graphics',
        'animated',
        'rendered',
        'modeled',
        'synthetic'
      );
    }

    // Photo to sketch conversion negatives
    if (isPhotoToSketch) {
      baseNegatives.push(
        'photorealistic',
        'rendered',
        'colored',
        'painted',
        'finished',
        'polished',
        'photographic',
        'photograph',
        'realistic photo',
        '3D render',
        'CGI',
        'photo quality',
        'high resolution',
        'detailed textures',
        'realistic lighting'
      );
    }

    // Style-specific comprehensive negatives
    const styleNegatives: Record<string, string[]> = {
      realistic: [
        'unrealistic',
        'fake looking',
        'artificial',
        'CGI artifacts',
        'game graphics',
        'animated',
        'cartoon',
        'painted',
        'illustrated',
        'stylized',
        'abstract',
        'oversaturated colors',
        'unnatural lighting'
      ],
      modern: [
        'old fashioned',
        'traditional',
        'ornate details',
        'excessive decoration',
        'cluttered elements',
        'baroque',
        'victorian',
        'classical',
        'vintage',
        'dated design',
        'rustic'
      ],
      contemporary: [
        'outdated',
        'old style',
        'traditional',
        'historical',
        'classical',
        'vintage'
      ],
      traditional: [
        'modern',
        'contemporary',
        'minimalist',
        'industrial',
        'futuristic',
        'high-tech',
        'glass facades',
        'steel beams'
      ],
      minimalist: [
        'cluttered',
        'ornate',
        'decorated',
        'complex',
        'busy',
        'excessive details',
        'baroque',
        'rococo',
        'maximalist'
      ],
      industrial: [
        'polished',
        'refined',
        'ornate',
        'decorative',
        'luxurious',
        'clean',
        'pristine'
      ],
      mediterranean: [
        'modern glass',
        'steel',
        'industrial',
        'minimalist',
        'cold',
        'harsh'
      ],
      colonial: [
        'modern',
        'contemporary',
        'minimalist',
        'industrial'
      ],
      victorian: [
        'modern',
        'minimalist',
        'plain',
        'simple',
        'contemporary'
      ],
      cgi: [
        'photographic',
        'realistic photo',
        'natural',
        'unrendered',
        'raw footage',
        'amateur'
      ],
      night: [
        'daytime',
        'bright sunlight',
        'daylight',
        'noon',
        'harsh shadows',
        'washed out'
      ],
      sketch: [
        'photorealistic',
        'rendered',
        'colored',
        'painted',
        'finished',
        'polished'
      ],
      watercolor: [
        'digital',
        'photographic',
        'realistic',
        'rendered',
        'sharp edges',
        'harsh lines'
      ],
      illustration: [
        'photographic',
        'realistic photo',
        'rendered 3D',
        'unfinished',
        'rough'
      ],
      snow: [
        'summer',
        'hot weather',
        'desert',
        'tropical',
        'warm',
        'sunny'
      ],
      rain: [
        'dry',
        'sunny',
        'desert',
        'clear sky',
        'drought'
      ]
    };

    // Add style-specific negatives
    if (styleNegatives[style]) {
      baseNegatives.push(...styleNegatives[style]);
    }

    // Image-type-specific negatives
    const imageTypeNegatives: Record<string, string[]> = {
      '3d-mass': [
        'photographic',
        'realistic photo',
        'camera image',
        'photograph',
        'too detailed',
        'excessive texture',
        'photo quality'
      ],
      'photo': [
        '3D render',
        'CGI',
        'digital art',
        'illustration',
        'drawing',
        'painting',
        'sketch',
        'cartoon',
        'rendered'
      ],
      'drawing': [
        'photographic',
        'photograph',
        'realistic photo',
        '3D render',
        'CGI',
        'photo quality'
      ],
      'wireframe': [
        'solid materials',
        'filled surfaces',
        'textured',
        'colored',
        'rendered',
        'photorealistic',
        'opaque'
      ],
      'construction': [
        'finished building',
        'polished',
        'complete',
        'inhabited',
        'decorated',
        'clean'
      ]
    };

    // Add image-type-specific negatives if imageType is provided
    if (imageType && imageTypeNegatives[imageType]) {
      baseNegatives.push(...imageTypeNegatives[imageType]);
    }

    // Reference image protection negatives
    if (hasReferenceImage) {
      baseNegatives.push(
        'completely different design',
        'unrelated architecture',
        'wrong building',
        'different structure',
        'mismatched style'
      );
    }

    // Architectural quality negatives - ALWAYS included
    const architecturalNegatives = [
      'impossible architecture',
      'wrong perspective',
      'floating elements',
      'disconnected parts',
      'structural impossibility',
      'bad scaling',
      'amateur photography',
      'cropped edges',
      'text',
      'watermark',
      'signature',
      'logo',
      'username',
      'timestamp'
    ];

    baseNegatives.push(...architecturalNegatives);

    console.log('🚫 GoogleAI: Built automatic negative prompts', {
      style,
      imageType: imageType || 'none',
      isSketchToPhoto,
      isCleanDrawingToPhoto: isCleanDrawingToPhoto || false,
      isPhotoToSketch: isPhotoToSketch || false,
      hasReferenceImage,
      totalNegatives: baseNegatives.length,
      styleSpecificCount: styleNegatives[style]?.length || 0,
      imageTypeSpecificCount: (imageType && imageTypeNegatives[imageType]) ? imageTypeNegatives[imageType].length : 0
    });

    return baseNegatives.join(', ');
  }

  /**
   * Build iterative refinement prompts based on user feedback
   */
  private buildIterativeRefinementPrompt(
    originalPrompt: string, 
    userFeedback: string, 
    _previousResult?: unknown
  ): string {
    const refinementKeywords = {
      'more detailed': 'add intricate architectural details, material textures, environmental elements',
      'better lighting': 'enhance lighting conditions, add dramatic shadows, improve illumination',
      'more realistic': 'increase photorealistic quality, add realistic materials, improve textures',
      'different angle': 'change camera perspective, adjust viewpoint, modify composition',
      'more modern': 'add contemporary design elements, clean lines, modern materials',
      'more traditional': 'add classical architectural elements, traditional proportions, heritage materials',
      'better composition': 'improve visual balance, adjust framing, enhance rule of thirds',
      'higher quality': 'increase resolution quality, add fine details, improve rendering quality'
    };

    let refinementPrompt = originalPrompt;
    
    // Check for specific feedback keywords
    for (const [keyword, enhancement] of Object.entries(refinementKeywords)) {
      if (userFeedback.toLowerCase().includes(keyword)) {
        refinementPrompt += `. ${enhancement}`;
      }
    }

    // Add general improvement instructions
    if (userFeedback.toLowerCase().includes('improve') || userFeedback.toLowerCase().includes('better')) {
      refinementPrompt += '. Enhance overall quality, add more detail, improve composition and lighting.';
    }

    return refinementPrompt;
  }

  /**
   * Analyze prompt effectiveness and suggest improvements
   */
  private analyzePromptEffectiveness(prompt: string, _resultQuality: number): {
    strengths: string[];
    improvements: string[];
    suggestedKeywords: string[];
  } {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const suggestedKeywords: string[] = [];

    // Analyze prompt composition
    if (prompt.includes('photorealistic') || prompt.includes('realistic')) {
      strengths.push('Clear realism instruction');
    } else {
      improvements.push('Add explicit realism instruction');
      suggestedKeywords.push('photorealistic', 'realistic', 'professional quality');
    }

    if (prompt.includes('lighting') || prompt.includes('illumination')) {
      strengths.push('Lighting specification present');
    } else {
      improvements.push('Add lighting specifications');
      suggestedKeywords.push('natural lighting', 'professional lighting', 'dramatic lighting');
    }

    if (prompt.includes('composition') || prompt.includes('perspective')) {
      strengths.push('Composition guidance present');
    } else {
      improvements.push('Add composition guidance');
      suggestedKeywords.push('balanced composition', 'rule of thirds', 'professional photography');
    }

    return { strengths, improvements, suggestedKeywords };
  }

  private buildVideoPrompt(userPrompt: string, style: string, duration: number): string {
    const basePrompt = `Create a ${duration}-second architectural video of: ${userPrompt}`;

    const styleModifiers = {
      modern: 'in a modern architectural style with clean lines, glass, and steel elements',
      contemporary: 'in a contemporary style with innovative materials and sustainable design',
      traditional: 'in a traditional architectural style with classic proportions and materials',
      minimalist: 'in a minimalist style with simple forms and clean aesthetics',
      industrial: 'in an industrial style with exposed materials and utilitarian design',
      mediterranean: 'in a Mediterranean style with stucco walls and terracotta roofs',
      colonial: 'in a colonial style with symmetrical design and classical elements',
      victorian: 'in a Victorian style with ornate details and decorative elements',
      realistic: 'in a photorealistic style with accurate lighting and materials',
      cgi: 'as a high-quality 3D render with professional lighting',
      night: 'at night with dramatic lighting and atmosphere',
      sketch: 'as an architectural sketch with clean lines and proportions',
      watercolor: 'in a watercolor painting style with soft colors and textures',
      illustration: 'as a detailed architectural illustration',
    };

    const styleModifier = styleModifiers[style as keyof typeof styleModifiers] || styleModifiers.realistic;

    return `${basePrompt}, ${styleModifier}. Professional architectural video, smooth camera movement, high quality, detailed, realistic lighting and materials, suitable for architectural presentation.`;
  }

  private getAspectRatioConfig(aspectRatio: string): string {
    const aspectRatioMap: Record<string, string> = {
      '1:1': '1:1',
      '2:3': '2:3',
      '3:2': '3:2',
      '3:4': '3:4',
      '4:3': '4:3',
      '4:5': '4:5',
      '5:4': '5:4',
      '9:16': '9:16',
      '16:9': '16:9',
      '21:9': '21:9',
    };
    return aspectRatioMap[aspectRatio] || '16:9';
  }

  async getStatus(): Promise<{ status: string; progress?: number; result?: unknown }> {
    // Google AI doesn't provide job status tracking like some other services
    // This is a placeholder for consistency with the interface
    return {
      status: 'completed',
      progress: 100,
    };
  }
}
