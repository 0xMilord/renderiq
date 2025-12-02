import { useState, useCallback, useEffect, useRef } from 'react';
import { AISDKService, PromptEnhancementResult, ImageGenerationResult, VideoGenerationResult } from '@/lib/services/ai-sdk-service';
import { logger } from '@/lib/utils/logger';

/**
 * Google Generative AI Hook for Prompt Enhancement
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
      logger.log('🚀 Starting prompt enhancement via Google Generative AI');
      setIsEnhancing(true);
      setError(null);
      setResult(null);
      setOriginalPrompt(prompt);

      const aiService = AISDKService.getInstance();
      const enhancementResult = await aiService.enhancePrompt(prompt);

      setResult(enhancementResult);
      setIsEnhanced(true);
      logger.log('✅ Enhancement successful via Google Generative AI');
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
 * Google Generative AI Hook for Image Generation
 */
export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; data?: ImageGenerationResult; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (params: {
    prompt: string;
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    negativePrompt?: string;
    seed?: number;
  }): Promise<{ success: boolean; data?: ImageGenerationResult; error?: string } | null> => {
    if (!params.prompt.trim()) {
      setError('Please provide a prompt for image generation');
      return null;
    }

    try {
      logger.log('🎨 Starting image generation via Google Generative AI');
      setIsGenerating(true);
      setError(null);
      setResult(null);

      const aiService = AISDKService.getInstance();
      const generationResult = await aiService.generateImage({
        prompt: params.prompt,
        aspectRatio: params.aspectRatio,
        negativePrompt: params.negativePrompt,
        seed: params.seed,
      });

      setResult(generationResult);
      if (!generationResult.success) {
        setError(generationResult.error || 'Image generation failed');
      }
      logger.log('✅ Image generation completed via Google Generative AI');
      return generationResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('❌ Image generation error:', errorMessage);
      return { success: false, error: errorMessage };
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
 * Google Generative AI Hook for Video Generation
 */
export function useVideoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; data?: VideoGenerationResult; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = useCallback(async (params: {
    prompt: string;
    duration?: number;
    style?: string;
    aspectRatio?: string;
  }): Promise<{ success: boolean; data?: VideoGenerationResult; error?: string } | null> => {
    if (!params.prompt.trim()) {
      setError('Please provide a prompt for video generation');
      return null;
    }

    try {
      logger.log('🎬 Starting video generation via Google Generative AI');
      setIsGenerating(true);
      setError(null);
      setResult(null);

      const aiService = AISDKService.getInstance();
      const generationResult = await aiService.generateVideo({
        prompt: params.prompt,
        duration: params.duration || 5,
        aspectRatio: (params.aspectRatio || '16:9') as '16:9' | '9:16' | '1:1',
      });

      setResult(generationResult);
      if (!generationResult.success) {
        setError(generationResult.error || 'Video generation failed');
      }
      logger.log('✅ Video generation completed via Google Generative AI');
      return generationResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('❌ Video generation error:', errorMessage);
      return { success: false, error: errorMessage };
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Custom Chat Hook compatible with Google Generative AI
 */
export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantMessageId = (Date.now() + 1).toString();
      let assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (updated[lastIndex]?.id === assistantMessageId) {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: updated[lastIndex].content + parsed.content,
                    };
                  }
                  return updated;
                });
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              // Ignore JSON parse errors for partial chunks
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was aborted
      }
      const errorMessage = err instanceof Error ? err : new Error('Unknown error');
      setError(errorMessage);
      console.error('❌ Chat error:', errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, messages, isLoading]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const reload = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
      if (lastUserMessage) {
        setMessages(prev => prev.filter(msg => msg.id !== lastUserMessage.id));
        setInput(lastUserMessage.content);
        handleSubmit();
      }
    }
  }, [messages, handleSubmit]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

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
 * Custom Completion Hook compatible with Google Generative AI
 */
export function useAICompletion() {
  const [completion, setCompletion] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }

    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setCompletion('');

    try {
      const response = await fetch('/api/ai/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data?.text) {
        setCompletion(data.data.text);
      } else {
        throw new Error(data.error || 'Completion failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Unknown error');
      setError(errorMessage);
      console.error('❌ Completion error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const stop = useCallback(() => {
    setIsLoading(false);
  }, []);

  const reload = useCallback(() => {
    if (input.trim()) {
      handleSubmit();
    }
  }, [input, handleSubmit]);

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
 * Google Generative AI Streaming Hook
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
      logger.log('📝 Starting text streaming via Google Generative AI');
      setIsStreaming(true);
      setError(null);
      setStreamedText('');

      const aiService = AISDKService.getInstance();
      const stream = aiService.streamTextGeneration(prompt);

      for await (const delta of stream) {
        setStreamedText(prev => prev + delta);
      }

      logger.log('✅ Text streaming completed via Google Generative AI');

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