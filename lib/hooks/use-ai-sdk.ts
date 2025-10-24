import { useState, useCallback } from 'react';
import { useChat, useCompletion } from '@ai-sdk/react';
import { AISDKService, PromptEnhancementResult, ImageGenerationResult, VideoGenerationResult } from '@/lib/services/ai-sdk-service';

/**
 * Vercel AI SDK Hook for Prompt Enhancement
 * Replaces manual usePromptEnhancement hook
 */
export function usePromptEnhancement() {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<PromptEnhancementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalPrompt, setOriginalPrompt] = useState<string | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);

  const enhancePrompt = useCallback(async (prompt: string): Promise<PromptEnhancementResult | null> => {
    if (!prompt.trim()) {
      setError('Please provide a prompt to enhance');
      return null;
    }

    try {
      console.log('🚀 Starting prompt enhancement via Vercel AI SDK');
      setIsEnhancing(true);
      setError(null);
      setResult(null);
      setOriginalPrompt(prompt);

      const aiService = AISDKService.getInstance();
      const enhancementResult = await aiService.enhancePrompt(prompt);

      setResult(enhancementResult);
      setIsEnhanced(true);
      console.log('✅ Enhancement successful via Vercel AI SDK');
      return enhancementResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('❌ Enhancement error:', errorMessage);
      return null;
    } finally {
      setIsEnhancing(false);
    }
  }, []);

  const restoreOriginal = useCallback((): string | null => {
    if (originalPrompt) {
      setResult(null);
      setIsEnhanced(false);
      setError(null);
      return originalPrompt;
    }
    return null;
  }, [originalPrompt]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setOriginalPrompt(null);
    setIsEnhanced(false);
    setIsEnhancing(false);
  }, []);

  return {
    enhancePrompt,
    restoreOriginal,
    reset,
    isEnhancing,
    result,
    error,
    originalPrompt,
    isEnhanced,
  };
}

/**
 * Vercel AI SDK Hook for Image Generation
 * Replaces manual useImageGeneration hook
 */
export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (params: {
    prompt: string;
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    negativePrompt?: string;
    seed?: number;
  }): Promise<ImageGenerationResult | null> => {
    if (!params.prompt.trim()) {
      setError('Please provide a prompt for image generation');
      return null;
    }

    try {
      console.log('🎨 Starting image generation via Vercel AI SDK');
      setIsGenerating(true);
      setError(null);
      setResult(null);

      const aiService = AISDKService.getInstance();
      const generationResult = await aiService.generateImage(params);

      setResult(generationResult);
      console.log('✅ Image generation successful via Vercel AI SDK');
      return generationResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('❌ Image generation error:', errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    generateImage,
    reset,
    isGenerating,
    result,
    error,
  };
}

/**
 * Vercel AI SDK Hook for Video Generation
 * Replaces manual useVideoGeneration hook
 */
export function useVideoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<VideoGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = useCallback(async (params: {
    prompt: string;
    duration?: number;
    style?: string;
    aspectRatio?: string;
  }): Promise<VideoGenerationResult | null> => {
    if (!params.prompt.trim()) {
      setError('Please provide a prompt for video generation');
      return null;
    }

    try {
      console.log('🎬 Starting video generation via Vercel AI SDK');
      setIsGenerating(true);
      setError(null);
      setResult(null);

      const aiService = AISDKService.getInstance();
      const generationResult = await aiService.generateVideo(params);

      setResult(generationResult);
      console.log('✅ Video generation successful via Vercel AI SDK');
      return generationResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('❌ Video generation error:', errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    generateVideo,
    reset,
    isGenerating,
    result,
    error,
  };
}

/**
 * Vercel AI SDK Chat Hook
 * Uses built-in useChat from Vercel AI SDK
 */
export function useAIChat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setMessages,
    setInput,
  } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('❌ Chat error:', error);
    },
    onFinish: (message) => {
      console.log('✅ Chat message finished:', message);
    },
  });

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setMessages,
    setInput,
  };
}

/**
 * Vercel AI SDK Completion Hook
 * Uses built-in useCompletion from Vercel AI SDK
 */
export function useAICompletion() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setInput,
  } = useCompletion({
    api: '/api/completion',
    onError: (error) => {
      console.error('❌ Completion error:', error);
    },
    onFinish: (completion) => {
      console.log('✅ Completion finished:', completion);
    },
  });

  return {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setInput,
  };
}

/**
 * Vercel AI SDK Streaming Hook
 * For real-time text generation
 */
export function useAIStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const streamText = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      setError('Please provide a prompt for streaming');
      return;
    }

    try {
      console.log('📝 Starting text streaming via Vercel AI SDK');
      setIsStreaming(true);
      setError(null);
      setStreamedText('');

      const aiService = AISDKService.getInstance();
      const stream = aiService.streamTextGeneration(prompt);

      for await (const delta of stream) {
        setStreamedText(prev => prev + delta);
      }

      console.log('✅ Text streaming completed via Vercel AI SDK');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('❌ Streaming error:', errorMessage);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStreamedText('');
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    streamText,
    reset,
    isStreaming,
    streamedText,
    error,
  };
}
