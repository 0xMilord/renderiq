import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GoogleAIImageRequest {
  prompt: string;
  style: string;
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: string;
  uploadedImage?: File;
}

export interface GoogleAIImageResponse {
  success: boolean;
  data?: {
    url: string;
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

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  }

  static getInstance(): GoogleAIService {
    if (!GoogleAIService.instance) {
      GoogleAIService.instance = new GoogleAIService();
    }
    return GoogleAIService.instance;
  }

  async generateImage(request: GoogleAIImageRequest): Promise<GoogleAIImageResponse> {
    try {
      const startTime = Date.now();
      
      // Enhanced prompt for architectural visualization
      const enhancedPrompt = this.buildImagePrompt(request.prompt, request.style);
      
      console.log('Starting image generation with prompt:', enhancedPrompt);
      
      // Use Gemini 2.5 Flash Image for image generation
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-image' 
      });

      // Configure aspect ratio based on request
      const aspectRatioConfig = this.getAspectRatioConfig(request.aspectRatio);
      
      console.log('Generating image with aspect ratio:', aspectRatioConfig);
      
      const result = await model.generateContent(enhancedPrompt);
      
      console.log('Received response from Gemini');
      const response = await result.response;
      
      // Extract image data from response
      const imageData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!imageData) {
        console.error('No image data in response:', response);
        throw new Error('No image data received from Gemini');
      }

      console.log('Image data received, creating blob URL');
      
      // Convert base64 to blob URL for display
      const imageBlob = new Blob([Buffer.from(imageData, 'base64')], { type: 'image/png' });
      const imageUrl = URL.createObjectURL(imageBlob);

      const processingTime = (Date.now() - startTime) / 1000;
      console.log(`Image generation completed in ${processingTime}s`);

      return {
        success: true,
        data: {
          url: imageUrl,
          id: `gemini_${Date.now()}`,
          prompt: request.prompt,
          style: request.style,
          quality: request.quality,
          aspectRatio: request.aspectRatio,
          processingTime,
          provider: 'gemini-2.5-flash-image',
        },
      };
    } catch (error) {
      console.error('Google AI image generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image with Gemini',
      };
    }
  }

  async generateVideo(request: GoogleAIVideoRequest): Promise<GoogleAIVideoResponse> {
    try {
      const startTime = Date.now();
      
      // Enhanced prompt for architectural video
      const enhancedPrompt = this.buildVideoPrompt(request.prompt, request.style, request.duration);
      
      // Use Veo 3 for video generation
      const model = this.genAI.getGenerativeModel({ 
        model: 'veo-3' 
      });

      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      
      // Extract video data from response
      const videoData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!videoData) {
        throw new Error('No video data received from Veo 3');
      }

      // Convert base64 to blob URL for display
      const videoBlob = new Blob([Buffer.from(videoData, 'base64')], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);

      const processingTime = (Date.now() - startTime) / 1000;

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
      console.error('Google AI video generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate video with Veo 3',
      };
    }
  }

  private buildImagePrompt(userPrompt: string, style: string): string {
    const basePrompt = `Create a photorealistic architectural image of: ${userPrompt}`;

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

    return `${basePrompt}, ${styleModifier}. Professional architectural visualization, high quality, detailed, realistic lighting and materials, suitable for architectural presentation.`;
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
