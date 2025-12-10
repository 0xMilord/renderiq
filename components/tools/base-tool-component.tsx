'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Sparkles, 
  FileImage, 
  X, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  Settings,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Eye,
  HelpCircle,
  Maximize2,
  Upload
} from 'lucide-react';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';
import { ToolConfig } from '@/lib/tools/registry';
import { TOOL_CONTENT } from '@/lib/tools/tool-content';
import { createRenderAction } from '@/lib/actions/render.actions';
import { useCredits } from '@/lib/hooks/use-credits';
import { useToolRenders } from '@/lib/hooks/use-tool-renders';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from 'sonner';
import { LimitReachedDialog } from '@/components/billing/limit-reached-dialog';
import type { LimitType } from '@/lib/services/plan-limits.service';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileUpload } from '@/components/ui/file-upload';
import { UploadModal } from '@/components/chat/upload-modal';
import { GalleryModal } from '@/components/chat/gallery-modal';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Image from 'next/image';
import { shouldUseRegularImg } from '@/lib/utils/storage-url';
import { handleImageErrorWithFallback } from '@/lib/utils/cdn-fallback';
import { ModelSelector } from '@/components/ui/model-selector';
import { getModelConfig, getDefaultModel, ModelId, modelSupportsQuality, getMaxQuality, getSupportedResolutions } from '@/lib/config/models';
import { useWakeLock } from '@/lib/hooks/use-wake-lock';
import { trackRenderStarted, trackRenderCompleted, trackRenderFailed, trackRenderCreditsCost } from '@/lib/utils/sentry-metrics';

interface BaseToolComponentProps {
  tool: ToolConfig;
  children?: React.ReactNode;
  customSettings?: React.ReactNode;
  multipleImages?: boolean;
  maxImages?: number;
  onGenerate?: (formData: FormData) => Promise<{ success: boolean; data?: { renderId: string; outputUrl: string; label?: string } | Array<{ renderId: string; outputUrl: string; label?: string }>; error?: string } | void>;
  projectId?: string | null;
  onHintChange?: (hint: string | null) => void;
  additionalButtonContent?: React.ReactNode;
  hintMessage?: string | null;
  customCreditsCost?: number | ((quality: 'standard' | 'high' | 'ultra') => number);
  expectedOutputCount?: number | (() => number); // Expected number of output images (for smart placeholders)
}

export function BaseToolComponent({
  tool,
  children,
  customSettings,
  multipleImages = false,
  maxImages = 1,
  onGenerate,
  projectId: propProjectId,
  onHintChange,
  additionalButtonContent,
  hintMessage,
  customCreditsCost,
  expectedOutputCount,
  hideQualitySelector = false,
}: BaseToolComponentProps) {
  // Get rich content for this tool, or use defaults
  const toolContent = TOOL_CONTENT[tool.id];
  const router = useRouter();
  const { credits, loading: creditsLoading, refreshCredits } = useCredits();
  const user = useAuthStore((state) => state.user);
  
  // Use prop projectId only - no automatic project selection
  const projectId = propProjectId;
  const projectLoading = false; // No longer loading projects automatically
  
  // Declare polling state before useToolRenders hook
  const [pollingRenderIds, setPollingRenderIds] = useState<Set<string>>(new Set());
  const pollingActiveRef = useRef(false);
  const pollingIdsRef = useRef<Set<string>>(new Set());
  
  // ✅ UPDATED: Use tool_executions instead of filtering renders
  // This uses the new dedicated infrastructure for tools
  // Include processing renders when we're actively polling
  const { toolRenders, loading: rendersLoading, refetch: refetchRenders } = useToolRenders(tool, projectId, pollingRenderIds.size > 0);
  
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  // ✅ FIX CORS: Store gallery image URL (fetched server-side to avoid CORS)
  const [galleryImageUrl, setGalleryImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ renderId: string; outputUrl: string; label?: string } | null>(null);
  const [results, setResults] = useState<Array<{ renderId: string; outputUrl: string; label?: string }>>([]);
  const [activeTab, setActiveTab] = useState<'tool' | 'output'>('tool');
  const [selectedRenderIndex, setSelectedRenderIndex] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; label?: string } | null>(null);
  // ✅ Limit dialog state
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [limitDialogData, setLimitDialogData] = useState<{
    limitType: LimitType;
    current: number;
    limit: number | null;
    planName: string;
    message?: string;
  } | null>(null);
  
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('standard');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [style, setStyle] = useState<string>('realistic'); // ✅ FIXED: Add style state with default value
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined); // Model ID for image/video generation
  
  // Video-specific state
  const [videoDuration, setVideoDuration] = useState<4 | 6 | 8>(8);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [videoModel, setVideoModel] = useState<string>('veo-3.1-generate-preview'); // Default to Veo 3.1 Standard
  const [enableAudio, setEnableAudio] = useState<boolean>(true); // Audio for Veo 3.1 models
  
  // Screen Wake Lock - Keep screen on during render generation
  useWakeLock(loading || pollingRenderIds.size > 0);

  // Auto-adjust quality when model changes if current quality is unsupported
  useEffect(() => {
    if (selectedModel) {
      const modelId = selectedModel as ModelId;
      if (!modelSupportsQuality(modelId, quality)) {
        // Current quality not supported, adjust to max supported quality
        const maxQuality = getMaxQuality(modelId);
        setQuality(maxQuality);
        toast.info(`Quality adjusted to ${maxQuality} (maximum supported by selected model)`);
      }
    }
  }, [selectedModel, quality]);
  
  // Poll for render updates
  const pollForRenderUpdates = useCallback(async (renderIds: string[]) => {
    if (!projectId || renderIds.length === 0) {
      pollingActiveRef.current = false;
      pollingIdsRef.current = new Set();
      setPollingRenderIds(new Set());
      return;
    }
    
    if (pollingActiveRef.current) {
      // Already polling, just update the refs and state
      pollingIdsRef.current = new Set(renderIds);
      setPollingRenderIds(new Set(renderIds));
      return;
    }
    
    pollingActiveRef.current = true;
    pollingIdsRef.current = new Set(renderIds);
    setPollingRenderIds(new Set(renderIds));
    const pollInterval = 2000; // Poll every 2 seconds
    const maxPollTime = 5 * 60 * 1000; // Max 5 minutes
    const startTime = Date.now();
    let pollTimeout: NodeJS.Timeout | null = null;
    
    const poll = async () => {
      // Check if we should stop polling
      const currentIds = Array.from(pollingIdsRef.current);
      if (currentIds.length === 0 || Date.now() - startTime > maxPollTime) {
        pollingActiveRef.current = false;
        pollingIdsRef.current = new Set();
        setPollingRenderIds(new Set());
        if (pollTimeout) {
          clearTimeout(pollTimeout);
        }
        return;
      }
      
      try {
        // Refresh renders to get latest status
        await refetchRenders();
        
        // Get current polling IDs from ref
        const currentPollingIds = Array.from(pollingIdsRef.current);
        
        // Get updated renders from the hook (will include processing renders now)
        const updatedRenders = toolRenders.filter(r => {
          const renderId = r.renderId || r.id;
          return currentPollingIds.includes(renderId) && 
                 r.status === 'completed' && 
                 r.outputUrl;
        });
        
        if (updatedRenders.length > 0) {
          // Update results with completed renders individually
          setResults(prev => {
            const updated = prev.map(result => {
              const render = updatedRenders.find(r => (r.renderId || r.id) === result.renderId);
              if (render && render.outputUrl) {
                // Show toast for each completed render
                if (result.isPolling && !result.outputUrl) {
                  toast.success(`${result.label || 'Render'} completed!`);
                }
                return {
                  ...result,
                  outputUrl: render.outputUrl,
                  isPolling: false
                };
              }
              return result;
            });
            return updated;
          });
          
          // Remove completed renders from polling set
          const remainingIds = currentPollingIds.filter(id => 
            !updatedRenders.some(r => (r.renderId || r.id) === id)
          );
          
          if (remainingIds.length === 0) {
            // All renders completed
            pollingActiveRef.current = false;
            pollingIdsRef.current = new Set();
            setPollingRenderIds(new Set());
            await refreshCredits();
            toast.success(`All ${currentPollingIds.length} renders generated successfully!`);
            refetchRenders();
            setActiveTab('output');
            if (pollTimeout) {
              clearTimeout(pollTimeout);
            }
            return;
          } else {
            pollingIdsRef.current = new Set(remainingIds);
            setPollingRenderIds(new Set(remainingIds));
            // Continue polling for remaining renders
            pollTimeout = setTimeout(poll, pollInterval);
          }
        } else {
          // No renders completed yet, continue polling
          pollTimeout = setTimeout(poll, pollInterval);
        }
      } catch (error) {
        console.error('Error polling for renders:', error);
        pollingActiveRef.current = false;
        pollingIdsRef.current = new Set();
        setPollingRenderIds(new Set());
        if (pollTimeout) {
          clearTimeout(pollTimeout);
        }
      }
    };
    
    // Start polling
    pollTimeout = setTimeout(poll, pollInterval);
  }, [projectId, toolRenders, refetchRenders, refreshCredits]);
  
  // Trigger polling when pollingRenderIds changes (but only if not already polling)
  useEffect(() => {
    if (pollingRenderIds.size > 0 && !pollingActiveRef.current) {
      const renderIds = Array.from(pollingRenderIds);
      pollForRenderUpdates(renderIds);
    }
  }, [pollingRenderIds.size, pollForRenderUpdates]); // Only trigger when size changes

  // Calculate credits cost - use model-based pricing if model is selected, otherwise use custom or default
  const isVideo = tool.outputType === 'video';
  const imageSize = quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K';
  
  // For video, use video model; for image, use image model
  const modelConfig = isVideo 
    ? (videoModel ? getModelConfig(videoModel as ModelId) : getDefaultModel('video'))
    : (selectedModel ? getModelConfig(selectedModel as ModelId) : getDefaultModel('image'));
  
  const creditsCost = customCreditsCost 
    ? (typeof customCreditsCost === 'function' ? customCreditsCost(quality) : customCreditsCost)
    : isVideo
      ? (modelConfig ? modelConfig.calculateCredits({ duration: videoDuration }) : videoDuration * 16) // Default 16 credits/second
      : (modelConfig ? modelConfig.calculateCredits({ quality, imageSize }) : (quality === 'high' ? 10 : quality === 'ultra' ? 15 : 5));

  // Handle file changes from FileUpload component
  const handleFilesChange = useCallback((files: File[]) => {
    setImages(files);
    // Generate previews
    if (files.length > 0) {
      const previewPromises = files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            resolve(''); // Resolve with empty string on error
          };
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(previewPromises).then((newPreviews) => {
        setPreviews(newPreviews.filter(p => p !== ''));
      });
    } else {
      setPreviews([]);
    }
  }, []);

  // Handle file selection from UploadModal
  const handleUploadModalFileSelect = useCallback((file: File) => {
    setGalleryImageUrl(null); // ✅ FIX CORS: Clear gallery URL when selecting a new file
    if (multipleImages) {
      const newFiles = [...images, file].slice(0, maxImages);
      handleFilesChange(newFiles);
    } else {
      handleFilesChange([file]);
    }
    setIsUploadModalOpen(false);
  }, [images, multipleImages, maxImages, handleFilesChange]);

  // Handle image selection from GalleryModal
  const handleGalleryImageSelect = useCallback(async (image: { url: string; file?: File; render?: any }) => {
    try {
      if (image.file) {
        // If file is provided, use it directly
        setGalleryImageUrl(null); // Clear gallery URL when using file
        if (multipleImages) {
          const newFiles = [...images, image.file].slice(0, maxImages);
          handleFilesChange(newFiles);
        } else {
          handleFilesChange([image.file]);
        }
      } else if (image.url) {
        // ✅ FIX CORS: Store URL to pass to API (fetched server-side to avoid CORS)
        setGalleryImageUrl(image.url);
        // Create a placeholder file for preview (useObjectURL needs a File)
        const placeholderFile = new File([''], 'gallery-image.png', { type: 'image/png' });
        if (multipleImages) {
          const newFiles = [...images, placeholderFile].slice(0, maxImages);
          handleFilesChange(newFiles);
        } else {
          handleFilesChange([placeholderFile]);
        }
      }
      setIsGalleryModalOpen(false);
    } catch (error) {
      console.error('Error loading gallery image:', error);
      toast.error('Failed to load image from gallery');
    }
  }, [images, multipleImages, maxImages, handleFilesChange]);

  const handleGenerate = async () => {
    // For video tools, check input requirements based on inputType
    if (isVideo) {
      if (tool.inputType === 'image' && images.length === 0) {
        setError('Please upload an image to animate');
        return;
      }
      if (tool.inputType === 'multiple' && images.length < 2) {
        setError('Please upload at least 2 images for keyframe sequence');
        return;
      }
      // text-to-video (inputType: 'image+text') doesn't require images
    } else {
      if (images.length === 0) {
        setError('Please upload at least one image');
        return;
      }
    }

    if (!projectId) {
      setError('Please select a project first');
      toast.error('Please select a project before generating');
      return;
    }

    if (credits && credits.balance < creditsCost) {
      setError(`Insufficient credits. You need ${creditsCost} credits but have ${credits.balance}.`);
      toast.error('Insufficient credits');
      return;
    }

    setError(null);
    setLoading(true);
    setProgress(0);
    
    // Track render started
    const renderType = isVideo ? 'video' : 'image';
    const startTime = Date.now();
    trackRenderStarted(renderType, style, quality);
    if (creditsCost) {
      trackRenderCreditsCost(renderType, quality, creditsCost);
    }

    try {
      // Build prompt from system prompt and tool settings
      const prompt = tool.systemPrompt;

      // Create FormData
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('projectId', projectId);
      formData.append('imageType', tool.id);
      
      if (isVideo) {
        // Video generation parameters
        formData.append('type', 'video');
        formData.append('duration', videoDuration.toString());
        formData.append('aspectRatio', aspectRatio);
        formData.append('model', videoModel);
        
        // Determine generation type based on tool input
        if (tool.inputType === 'multiple') {
          // Keyframe sequence - handle multiple images
          if (images.length > 1) {
            formData.append('generationType', 'keyframe-sequence');
            // Add keyframes (up to 3)
            const keyframes = await Promise.all(images.slice(0, 3).map(async (img) => {
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64 = reader.result as string;
                  resolve(base64.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(img);
              });
              return { imageData: base64, imageType: img.type };
            }));
            formData.append('keyframes', JSON.stringify(keyframes));
          } else if (images.length === 1) {
            // Single image, treat as image-to-video
            formData.append('generationType', 'image-to-video');
            const imageFile = images[0];
            const imageBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = reader.result as string;
                resolve(base64.split(',')[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(imageFile);
            });
            formData.append('uploadedImageData', imageBase64);
            formData.append('uploadedImageType', imageFile.type);
          } else {
            // No images, treat as text-to-video
            formData.append('generationType', 'text-to-video');
          }
        } else if (tool.inputType === 'image') {
          // Image-to-video
          const imageFile = images[0];
          const imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              resolve(base64.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });
          formData.append('generationType', 'image-to-video');
          formData.append('uploadedImageData', imageBase64);
          formData.append('uploadedImageType', imageFile.type);
        } else {
          // Text-to-video (image+text or just text)
          formData.append('generationType', 'text-to-video');
          // If image provided, include it
          if (images.length > 0) {
            const imageFile = images[0];
            const imageBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = reader.result as string;
                resolve(base64.split(',')[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(imageFile);
            });
            formData.append('uploadedImageData', imageBase64);
            formData.append('uploadedImageType', imageFile.type);
          }
        }
      } else {
        // Image generation
        // ✅ FIX CORS: If gallery URL is available, pass it to API (fetched server-side to avoid CORS)
        if (galleryImageUrl && images.length > 0) {
          // Use gallery URL instead of converting to base64
          formData.append('uploadedImageUrl', galleryImageUrl);
        } else if (images.length > 0) {
          // Convert first image to base64
          const imageFile = images[0];
          const imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              // Remove data:image/...;base64, prefix
              const base64Data = base64.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });
          formData.append('uploadedImageData', imageBase64);
          formData.append('uploadedImageType', imageFile.type);
        }
        // Image generation parameters
        formData.append('style', style);
        formData.append('quality', quality);
        formData.append('aspectRatio', aspectRatio);
        formData.append('type', 'image');
        if (selectedModel) {
          formData.append('model', selectedModel);
        }
      }
      
      // Pass userId from store to avoid DB call in server action
      if (user?.id) {
        formData.append('userId', user.id);
      }

      // If custom handler provided, use it
      if (onGenerate) {
        setProgress(30);
        try {
          const result = await onGenerate(formData);
          setProgress(70);
          
          // If result is returned, handle it
          if (result && result.success && result.data) {
            setProgress(100);
            // Check if result.data is an array (batch results) or single result
            if (Array.isArray(result.data)) {
              // Check if any items need polling (have isPolling flag or empty outputUrl)
              const needsPolling = result.data.some((r: any) => r.isPolling || !r.outputUrl);
              
              // Initialize results immediately (with or without URLs)
              setResults(result.data.map((r: any) => ({
                renderId: r.renderId,
                outputUrl: r.outputUrl || '',
                label: r.label || `Result ${result.data.indexOf(r) + 1}`,
                isPolling: needsPolling && !r.outputUrl
              })));
              setResult(null);
              
              // Switch to output tab immediately to show placeholders
              setActiveTab('output');
              
              if (needsPolling) {
                // Start polling for render updates - this will trigger the useEffect
                const renderIds = result.data.map((r: any) => r.renderId).filter((id: string) => id);
                setPollingRenderIds(new Set(renderIds));
              } else {
                // All renders are complete, show them immediately
                await refreshCredits();
                toast.success(`${result.data.length} renders generated successfully!`);
                refetchRenders();
              }
            } else {
              setResult({
                renderId: result.data.renderId,
                outputUrl: result.data.outputUrl,
                label: result.data.label
              });
              setResults([]);
              
              // Track render completed
              const duration = Date.now() - startTime;
              trackRenderCompleted(renderType, style, quality, duration);
              
              await refreshCredits();
              toast.success('Render generated successfully!');
              refetchRenders();
              setActiveTab('output');
            }
          } else if (result && !result.success) {
            throw new Error(result.error || 'Failed to generate render');
          } else {
            // If no result returned, assume success was handled by custom handler
            await refreshCredits();
            setProgress(100);
          }
        } catch (err) {
          throw err; // Re-throw to be caught by outer catch
        }
        return;
      }

      // Otherwise use default createRenderAction
      setProgress(30);
      const result = await createRenderAction(formData);
      setProgress(70);

      if (result.success && result.data) {
        setProgress(100);
        // Check if result.data is an array (batch results) or single result
        if (Array.isArray(result.data)) {
          setResults(result.data.map((r: any, idx: number) => ({
            renderId: ('renderId' in r ? r.renderId : ('id' in r ? String(r.id) : '')) as string,
            outputUrl: (r.outputUrl || '') as string,
            label: (r.label as string | undefined) || `Result ${idx + 1}`
          })));
          setResult(null);
        } else {
          const data = result.data as { renderId?: string; id?: string; outputUrl?: string; label?: string };
          setResult({
            renderId: (data.renderId || (data.id ? String(data.id) : '')) as string,
            outputUrl: (data.outputUrl || '') as string,
            label: data.label
          });
          setResults([]);
        }
        // Track render completed
        const duration = Date.now() - startTime;
        trackRenderCompleted(renderType, style, quality, duration);
        
        await refreshCredits();
        toast.success(Array.isArray(result.data)
          ? `${result.data.length} renders generated successfully!`
          : 'Render generated successfully!');
        
        // Refresh renders list
        refetchRenders();
        
        // Switch to output tab to show result
        setActiveTab('output');
      } else {
        // ✅ CHECK: Handle limit errors
        if ((result as any).limitReached) {
          const limitData = result as any;
          setLimitDialogData({
            limitType: limitData.limitType || 'credits',
            current: limitData.current || 0,
            limit: limitData.limit ?? null,
            planName: limitData.planName || 'Free',
            message: result.error,
          });
          setLimitDialogOpen(true);
          return; // Exit early - don't show error toast
        }
        throw new Error(result.error || 'Failed to generate render');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate render';
      
      // Track render failed
      trackRenderFailed(renderType, style, quality, errorMessage);
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const canGenerate = images.length > 0 && !loading && !!projectId && (!credits || credits.balance >= creditsCost);

  // Get the reason why Generate button is disabled
  const getDisabledReason = (): string | null => {
    if (loading) return 'Generation in progress...';
    if (projectLoading) return 'Loading projects...';
    if (creditsLoading) return 'Loading credits...';
    
    // Check image requirements based on tool type
    if (isVideo) {
      if (tool.inputType === 'image' && images.length === 0) return 'Please upload an image to animate';
      if (tool.inputType === 'multiple' && images.length < 2) return 'Please upload at least 2 images for keyframe sequence';
      // text-to-video doesn't require images
    } else {
      if (images.length === 0) return 'Please upload at least one image';
    }
    
    if (!projectId) return 'Please select a project first';
    if (credits && credits.balance < creditsCost) {
      return `Insufficient credits. You need ${creditsCost} credits but have ${credits.balance}`;
    }
    return null;
  };

  const disabledReason = getDisabledReason();
  const isButtonDisabled = disabledReason !== null;

  // Notify parent of hint changes
  useEffect(() => {
    onHintChange?.(disabledReason);
  }, [disabledReason, onHintChange]);

  // Shimmer placeholder component
  const ShimmerPlaceholder = () => (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted/50 relative">
      {/* Shimmer effect */}
      <div 
        className="absolute inset-0 animate-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          backgroundPosition: '-200% 0',
        }}
      />
      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center space-y-4 p-6">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Generating your render...</p>
            <div className="space-y-2">
              <Progress value={progress} className="w-full max-w-md mx-auto h-2" />
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This may take 10-10 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Tool Panel Content
  const ToolPanelContent = () => (
    <Card className="w-full min-h-[90vh] lg:sticky lg:top-20 overflow-y-auto overflow-x-hidden custom-scrollbar">
      <CardContent className="space-y-6 pt-3 pb-3 px-3">
            {/* Upload Area - Using FileUpload component with UploadModal integration */}
            <div className="space-y-4">
              <FileUpload
                multiple={multipleImages}
                maxFiles={maxImages}
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                onFilesChange={handleFilesChange}
                previews={previews}
                aspectRatio="16/9"
              />
              {previews.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload, Capture, or Reuse Image
                </Button>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Progress - Only show in tool panel, not in output tab */}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Generating render...</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Processing your image... This may take 10-10 seconds
                </p>
              </div>
            )}

            {/* Success Alert */}
            {result && !loading && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Render generated successfully! Check the Output tab to view your result.
                </AlertDescription>
              </Alert>
            )}

            {/* Settings */}
            <div className="space-y-6">
              {/* Custom Tool Settings - Moved to top */}
              {customSettings && (
                <div className="space-y-4">
                  {customSettings}
                </div>
              )}

              {/* Render Settings - Moved below tool settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border"></div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Render Settings</span>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <div className="space-y-3">
                  {isVideo ? (
                    // Video-specific settings - 2 columns
                    <div className="grid gap-3 grid-cols-2">
                      <div className="w-full">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Label htmlFor="duration" className="text-sm">Duration</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Video duration in seconds. Veo API supports 4, 6, or 8 seconds. Longer videos use more credits.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select 
                          value={videoDuration.toString()} 
                          onValueChange={(v) => setVideoDuration(parseInt(v) as 4 | 6 | 8)}
                        >
                          <SelectTrigger id="duration" className="h-10 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">4 seconds</SelectItem>
                            <SelectItem value="6">6 seconds</SelectItem>
                            <SelectItem value="8">8 seconds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Label htmlFor="video-model" className="text-sm">Video Model</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Choose a video generation model. Veo 3.1 includes audio synchronization. Fast models generate quicker but may have slightly lower quality.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select 
                          value={videoModel} 
                          onValueChange={(v) => {
                            setVideoModel(v);
                            // Update audio toggle based on model
                            setEnableAudio(v.startsWith('veo-3.1'));
                          }}
                        >
                          <SelectTrigger id="video-model" className="h-10 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="veo-3.1-generate-preview">Veo 3.1 Standard (with audio)</SelectItem>
                            <SelectItem value="veo-3.1-fast-generate-preview">Veo 3.1 Fast (with audio)</SelectItem>
                            <SelectItem value="veo-3.0-generate-001">Veo 3.0 Standard</SelectItem>
                            <SelectItem value="veo-3.0-fast-generate-001">Veo 3.0 Fast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    // Image-specific settings - 3 columns (AI Model, Quality, Aspect Ratio)
                    !hideQualitySelector && (
                      <div className="grid gap-3 grid-cols-3">
                        <div className="w-full">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Label htmlFor="model" className="text-sm">AI Model</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Choose the AI model for generation. Different models offer different quality, speed, and cost options.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <ModelSelector
                            type="image"
                            value={selectedModel as ModelId | undefined}
                            onValueChange={(modelId) => setSelectedModel(modelId)}
                            quality={quality}
                            imageSize={imageSize}
                            variant="compact"
                            showCredits={false}
                          />
                        </div>
                        <div className="w-full">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Label htmlFor="quality" className="text-sm">Quality</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Output quality affects resolution and detail. Higher quality uses more credits but produces better results.
                                  {selectedModel && (
                                    <span className="block mt-1 text-xs">
                                      Selected model supports: {getSupportedResolutions(selectedModel as ModelId).join(', ')}
                                    </span>
                                  )}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select 
                            value={quality} 
                            onValueChange={(v: 'standard' | 'high' | 'ultra') => {
                              // Validate quality is supported by selected model
                              if (selectedModel) {
                                const modelId = selectedModel as ModelId;
                                if (modelSupportsQuality(modelId, v)) {
                                  setQuality(v);
                                } else {
                                  toast.error(`This quality is not supported by the selected model. Maximum quality: ${getMaxQuality(modelId)}`);
                                }
                              } else {
                                setQuality(v);
                              }
                            }}
                          >
                            <SelectTrigger id="quality" className="h-10 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem 
                                value="standard" 
                                disabled={selectedModel ? !modelSupportsQuality(selectedModel as ModelId, 'standard') : false}
                              >
                                1080p (1K)
                              </SelectItem>
                              <SelectItem 
                                value="high" 
                                disabled={selectedModel ? !modelSupportsQuality(selectedModel as ModelId, 'high') : false}
                              >
                                2160p (2K)
                              </SelectItem>
                              <SelectItem 
                                value="ultra" 
                                disabled={selectedModel ? !modelSupportsQuality(selectedModel as ModelId, 'ultra') : false}
                              >
                                4320p (4K)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-full">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Label htmlFor="aspect-ratio" className="text-sm">Aspect Ratio</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Choose the output image proportions. 16:9 for widescreen, 4:3 for traditional, 1:1 for square, or 9:16 for portrait orientation.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select value={aspectRatio} onValueChange={setAspectRatio}>
                            <SelectTrigger id="aspect-ratio" className="h-10 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="16:9">16:9</SelectItem>
                              <SelectItem value="4:3">4:3</SelectItem>
                              <SelectItem value="1:1">1:1</SelectItem>
                              <SelectItem value="9:16">9:16</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )
                  )}
                </div>
                {/* Generate Button - Own Row */}
                <div className="pt-2">
                  <div className="flex items-center gap-3">
                    {additionalButtonContent && (
                      <div className="flex-shrink-0">
                        {additionalButtonContent}
                      </div>
                    )}
                    <div className="flex-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <Button
                              className="w-full"
                              size="lg"
                              disabled={isButtonDisabled}
                              onClick={handleGenerate}
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Generate
                                </>
                              )}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {isButtonDisabled && disabledReason && (
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">{disabledReason}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </div>
                  {!isButtonDisabled && (
                    <p className="text-xs text-center text-muted-foreground px-2 mt-2">
                      This generation will consume {creditsCost} credits
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
  );

  // Shimmer placeholder for grid items
  const ShimmerGridItem = () => (
    <div className="aspect-video rounded-lg overflow-hidden bg-muted/50 relative">
      <div 
        className="absolute inset-0 animate-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          backgroundPosition: '-200% 0',
        }}
      />
    </div>
  );

  // Output Panel Content
  const OutputPanelContent = () => {
    const hasMultipleResults = results.length > 1;
    const displayResults = hasMultipleResults ? results.slice(0, 8) : (result ? [result] : []);
    
    // Calculate expected count for placeholders
    // Priority: 1) actual results count, 2) expectedOutputCount prop, 3) fallback to 1
    const getExpectedCount = (): number => {
      if (results.length > 0) {
        return results.length; // Use actual results if available
      }
      if (loading && expectedOutputCount !== undefined) {
        // Use expectedOutputCount if provided (can be number or function)
        return typeof expectedOutputCount === 'function' 
          ? expectedOutputCount() 
          : expectedOutputCount;
      }
      // Fallback: try to infer from customCreditsCost if it's a function
      if (loading && typeof customCreditsCost === 'function') {
        // For Render to CAD: credits = count * 5 * quality, so count = credits / (5 * quality)
        const credits = customCreditsCost(quality);
        const qualityMultiplier = quality === 'high' ? 2 : quality === 'ultra' ? 3 : 1;
        const inferredCount = Math.floor(credits / (5 * qualityMultiplier));
        return Math.max(1, Math.min(8, inferredCount)); // Clamp between 1 and 8
      }
      return 1; // Default to 1 placeholder
    };
    
    const expectedCount = getExpectedCount();
    
    return (
      <div className="p-[3px] bg-muted/30 border border-border/60 rounded-lg">
        <Card className="w-full min-h-[90vh] rounded-[5px]">
          <CardContent className="p-6 lg:p-12 w-full min-h-[90vh]">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
              {Array.from({ length: Math.min(8, Math.max(1, expectedCount)) }).map((_, idx) => (
                <ShimmerGridItem key={idx} />
              ))}
            </div>
          ) : displayResults.length > 0 ? (
            <div className="space-y-6">
              {hasMultipleResults ? (
                <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {displayResults.map((res, idx) => (
                    <div key={res.renderId || idx} className="space-y-2">
                      <div 
                        className="relative aspect-video rounded-lg overflow-hidden border bg-muted cursor-pointer group"
                        onClick={() => res.outputUrl && setFullscreenImage({ url: res.outputUrl, label: res.label })}
                      >
                        {res.outputUrl ? (
                          <>
                            {isVideo || res.outputUrl.match(/\.(mp4|webm|mov)$/i) ? (
                              <video 
                                src={res.outputUrl} 
                                className="w-full h-full object-contain"
                                controls
                                loop
                                playsInline
                              >
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <img 
                                src={res.outputUrl} 
                                alt={res.label || `Generated result ${idx + 1}`}
                                className="w-full h-full object-contain"
                              />
                            )}
                            {res.label && (
                              <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm border border-border text-foreground px-2 py-1 rounded text-xs font-medium z-10">
                                {res.label}
                              </div>
                            )}
                            {!isVideo && !res.outputUrl.match(/\.(mp4|webm|mov)$/i) && (
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Maximize2 className="h-8 w-8 text-white" />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Generating...</p>
                            {res.label && (
                              <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm border border-border text-foreground px-2 py-1 rounded text-xs font-medium z-10">
                                {res.label}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setFullscreenImage({ url: res.outputUrl, label: res.label })}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={async () => {
                            try {
                              const response = await fetch(res.outputUrl);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              const isVideoFile = isVideo || res.outputUrl.match(/\.(mp4|webm|mov)$/i);
                              link.download = `render-${res.renderId || idx}.${isVideoFile ? 'mp4' : 'png'}`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error('Download failed:', error);
                              toast.error(`Failed to download ${isVideo ? 'video' : 'image'}`);
                            }
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div 
                    className={cn(
                      "relative max-w-full max-h-[calc(100vh-300px)] mx-auto rounded-lg",
                      !isVideo && !displayResults[0].outputUrl.match(/\.(mp4|webm|mov)$/i) && "cursor-pointer group"
                    )}
                    onClick={() => !isVideo && !displayResults[0].outputUrl.match(/\.(mp4|webm|mov)$/i) && setFullscreenImage({ url: displayResults[0].outputUrl })}
                  >
                    {isVideo || displayResults[0].outputUrl.match(/\.(mp4|webm|mov)$/i) ? (
                      <video 
                        src={displayResults[0].outputUrl} 
                        className="max-w-full max-h-[calc(100vh-300px)] mx-auto rounded-lg"
                        controls
                        loop
                        playsInline
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img 
                        src={displayResults[0].outputUrl} 
                        alt="Generated result" 
                        className="max-w-full max-h-[calc(100vh-300px)] mx-auto rounded-lg"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Maximize2 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => setFullscreenImage({ url: displayResults[0].outputUrl })}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                    <Button variant="outline" onClick={async () => {
                      try {
                        const response = await fetch(displayResults[0].outputUrl);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        const isVideoFile = isVideo || displayResults[0].outputUrl.match(/\.(mp4|webm|mov)$/i);
                        link.download = `render-${displayResults[0].renderId}.${isVideoFile ? 'mp4' : 'png'}`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error('Download failed:', error);
                        toast.error('Failed to download image');
                      }
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[calc(90vh-200px)] text-muted-foreground">
              <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg text-center">Your generated render will appear here</p>
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto overflow-x-hidden min-h-[90vh]">
      {/* Desktop: Resizable Panels Layout */}
      <div className="hidden lg:block min-h-[90vh]">
        <PanelGroup direction="horizontal" className="gap-6 min-h-[90vh]">
          <Panel defaultSize={30} minSize={30} maxSize={40} className="min-w-0 min-h-[90vh]">
            <ToolPanelContent />
          </Panel>
          <PanelResizeHandle className="w-4 group relative flex items-center justify-center cursor-col-resize min-h-[90vh]">
            {/* Vertical line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-border" />
            {/* Resize handle icon - Centered */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-muted-foreground/40 group-hover:bg-primary rounded-sm transition-colors" />
                <div className="w-1 h-3 bg-muted-foreground/40 group-hover:bg-primary rounded-sm transition-colors" />
                <div className="w-1 h-3 bg-muted-foreground/40 group-hover:bg-primary rounded-sm transition-colors" />
              </div>
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-muted-foreground/40 group-hover:bg-primary rounded-sm transition-colors" />
                <div className="w-1 h-3 bg-muted-foreground/40 group-hover:bg-primary rounded-sm transition-colors" />
                <div className="w-1 h-3 bg-muted-foreground/40 group-hover:bg-primary rounded-sm transition-colors" />
              </div>
            </div>
          </PanelResizeHandle>
          <Panel defaultSize={70} minSize={60} maxSize={70} className="min-w-0 min-h-[90vh]">
            <div className="space-y-6 overflow-x-hidden min-h-[90vh]">
              <OutputPanelContent />
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Mobile/Tablet: Tabs layout - Hidden below header */}
      <div className={cn("block lg:hidden min-h-[90vh]", hintMessage ? "pt-20" : "pt-12")}>
        <Tabs 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as 'tool' | 'output')} 
          className="w-full min-h-[90vh]"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tool" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Tool Panel
            </TabsTrigger>
            <TabsTrigger value="output" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Output
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tool" className="mt-0">
            <ToolPanelContent />
          </TabsContent>
          <TabsContent value="output" className="mt-0">
            <OutputPanelContent />
          </TabsContent>
        </Tabs>
      </div>

      {/* Rendered Images Bar */}
      {projectId && (
        <div className="mt-12">
          <Card className="border">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-center relative">
                <CardTitle className="text-lg font-semibold">Your Renders from This Tool</CardTitle>
                {toolRenders.length > 0 && (
                  <span className="absolute right-0 text-xs text-muted-foreground">{toolRenders.length} render{toolRenders.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </CardHeader>
            <div className="h-px bg-border mx-4"></div>
            <CardContent className="px-4 pt-3 pb-4">
              {rendersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : toolRenders.length > 0 ? (
                <ScrollArea className="w-full custom-scrollbar">
                  <div className="flex gap-3 pb-2">
                    {toolRenders.map((render, index) => (
                      <div key={render.id} className="flex items-center gap-3">
                        <div
                          className="group relative flex-shrink-0 w-64 aspect-[4/3] rounded-md overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (render.outputUrl) {
                              window.open(render.outputUrl, '_blank');
                            }
                          }}
                        >
                          <img
                            src={render.outputUrl || ''}
                            alt={`Render ${render.id}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRenderIndex(index);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (render.outputUrl) {
                                  try {
                                    const response = await fetch(render.outputUrl);
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `render-${render.id}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                  } catch (error) {
                                    console.error('Download failed:', error);
                                    toast.error('Failed to download image');
                                  }
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {index < toolRenders.length - 1 && (
                          <div className="h-48 w-px bg-border flex-shrink-0"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No renders yet. Generate your first render to see it here!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Render Dialog */}
      {selectedRenderIndex !== null && toolRenders[selectedRenderIndex] && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="!w-[80vw] !h-[90vh] !max-w-[80vw] sm:!max-w-[80vw] lg:!max-w-[80vw] !max-h-none overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-lg font-semibold">
                Render {selectedRenderIndex + 1} of {toolRenders.length}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Image Display - Takes available space */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Before/After Comparison with Tabs */}
                  {toolRenders[selectedRenderIndex].uploadedImageUrl ? (
                    <Tabs defaultValue="before" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="before">Before</TabsTrigger>
                        <TabsTrigger value="after">After</TabsTrigger>
                      </TabsList>
                      <TabsContent value="before" className="mt-0">
                        <div className="relative w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                          {shouldUseRegularImg(toolRenders[selectedRenderIndex].uploadedImageUrl) ? (
                            <img
                              src={toolRenders[selectedRenderIndex].uploadedImageUrl || ''}
                              alt="Before"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const originalUrl = toolRenders[selectedRenderIndex].uploadedImageUrl;
                                if (originalUrl) {
                                  const fallbackUrl = handleImageErrorWithFallback(originalUrl, e);
                                  if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                                    img.src = fallbackUrl;
                                  } else {
                                    img.src = '/placeholder-image.jpg';
                                  }
                                }
                              }}
                            />
                          ) : (
                            <Image
                              src={toolRenders[selectedRenderIndex].uploadedImageUrl || '/placeholder-image.jpg'}
                              alt="Before"
                              fill
                              className="object-contain"
                            />
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="after" className="mt-0">
                        <div className="relative w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                          {shouldUseRegularImg(toolRenders[selectedRenderIndex].outputUrl) ? (
                            <img
                              src={toolRenders[selectedRenderIndex].outputUrl || ''}
                              alt="After"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const originalUrl = toolRenders[selectedRenderIndex].outputUrl;
                                if (originalUrl) {
                                  const fallbackUrl = handleImageErrorWithFallback(originalUrl, e);
                                  if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                                    img.src = fallbackUrl;
                                  } else {
                                    img.src = '/placeholder-image.jpg';
                                  }
                                }
                              }}
                            />
                          ) : (
                            <Image
                              src={toolRenders[selectedRenderIndex].outputUrl || '/placeholder-image.jpg'}
                              alt="After"
                              fill
                              className="object-contain"
                            />
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="relative w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                      <img
                        src={toolRenders[selectedRenderIndex].outputUrl || ''}
                        alt={`Render ${toolRenders[selectedRenderIndex].id}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Settings & Tags - Fixed width */}
                <div className="lg:w-80 flex-shrink-0 space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Settings</h3>
                    <div className="space-y-2 text-sm">
                      {toolRenders[selectedRenderIndex].settings && typeof toolRenders[selectedRenderIndex].settings === 'object' && (
                        <>
                          {'style' in toolRenders[selectedRenderIndex].settings && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Style:</span>
                              <span className="font-medium">
                                {(toolRenders[selectedRenderIndex].settings as { style?: string }).style || 'N/A'}
                              </span>
                            </div>
                          )}
                          {'quality' in toolRenders[selectedRenderIndex].settings && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Quality:</span>
                              <span className="font-medium">
                                {(toolRenders[selectedRenderIndex].settings as { quality?: string }).quality || 'N/A'}
                              </span>
                            </div>
                          )}
                          {'aspectRatio' in toolRenders[selectedRenderIndex].settings && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Aspect Ratio:</span>
                              <span className="font-medium">
                                {(toolRenders[selectedRenderIndex].settings as { aspectRatio?: string }).aspectRatio || 'N/A'}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {toolRenders[selectedRenderIndex].createdAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium">
                            {new Date(toolRenders[selectedRenderIndex].createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {toolRenders[selectedRenderIndex].status && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium capitalize">{toolRenders[selectedRenderIndex].status}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t">
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (toolRenders[selectedRenderIndex].outputUrl) {
                          window.open(toolRenders[selectedRenderIndex].outputUrl, '_blank');
                        }
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        if (toolRenders[selectedRenderIndex].outputUrl) {
                          try {
                            const response = await fetch(toolRenders[selectedRenderIndex].outputUrl || '');
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `render-${toolRenders[selectedRenderIndex].id}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Download failed:', error);
                            toast.error('Failed to download image');
                          }
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Info Sections - 2x2 Grid */}
      <div className="mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Row 1, Col 1: About This Tool */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">About This Tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Input</p>
                  <p className="text-sm font-medium">
                    {tool.inputType === 'multiple' ? 'Multiple Images' : tool.inputType === 'image+text' ? 'Image + Text' : 'Single Image'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Output</p>
                  <p className="text-sm font-medium">{tool.outputType === 'video' ? 'Video' : 'Image'}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {toolContent?.about.description || tool.description}
                </p>
                {toolContent?.about.benefits && toolContent.about.benefits.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {toolContent.about.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Row 1, Col 2: How It Works */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2.5">
                {(toolContent?.howItWorks.steps || [
                  { step: `Upload your ${tool.inputType === 'multiple' ? 'images' : 'image'}`, detail: `Upload your ${tool.inputType === 'multiple' ? 'images' : 'image'} in JPG, PNG, or WebP format` },
                  { step: 'Configure settings', detail: 'Adjust quality, aspect ratio, and tool-specific settings to match your project needs' },
                  { step: 'Generate', detail: 'Click Generate and wait for AI processing (typically 10-10 seconds)' },
                  { step: 'Download', detail: `Download your ${tool.outputType === 'video' ? 'video' : 'high-resolution image'} result` }
                ]).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 pt-0.5">
                      <span className="font-medium text-foreground">{typeof item === 'string' ? item : item.step}:</span>
                      {typeof item === 'object' && item.detail && (
                        <span className="text-muted-foreground ml-1">{item.detail}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Row 2, Col 1: Key Features */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {(toolContent?.keyFeatures || [
                  'AI-powered processing',
                  'High-quality output',
                  'Fast generation',
                  'Easy to use'
                ]).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mt-0.5">
                      ✓
                    </span>
                    <span className="flex-1 pt-0.5 leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Row 2, Col 2: Frequently Asked Questions */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {(toolContent?.faq || [
                { q: 'What file formats are supported?', a: 'We support JPG, PNG, and WebP formats for input images.' },
                { q: 'How long does processing take?', a: 'Processing typically takes 10-10 seconds depending on the complexity of your image.' },
                { q: 'What is the output quality?', a: 'Output images are generated at high resolution suitable for professional use.' }
              ]).map((faq, idx) => (
                <div key={idx} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                  <h3 className="font-semibold text-sm text-foreground leading-snug">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tool-specific content sections - rendered via children prop */}
      {children && (
        <div className="mt-12">
          {children}
        </div>
      )}

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": tool.name,
            "description": tool.seo.description,
            "applicationCategory": "DesignApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "100"
            },
            "featureList": [
              `Transform ${tool.inputType === 'multiple' ? 'multiple images' : tool.inputType === 'image+text' ? 'images with text' : 'images'}`,
              `Generate ${tool.outputType === 'video' ? 'videos' : 'images'}`,
              "AI-powered processing",
              "High-quality output"
            ]
          })
        }}
      />

      {/* Fullscreen Image Dialog */}
      <Dialog open={!!fullscreenImage} onOpenChange={(open) => !open && setFullscreenImage(null)}>
        <DialogContent className="!w-[95vw] !h-[95vh] !max-w-[95vw] !max-h-[95vh] p-0 overflow-hidden flex flex-col">
          {fullscreenImage && (
            <>
              <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
                <DialogTitle>{fullscreenImage.label || (isVideo || fullscreenImage.url.match(/\.(mp4|webm|mov)$/i) ? 'Generated Video' : 'Generated Image')}</DialogTitle>
              </DialogHeader>
              <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                {isVideo || fullscreenImage.url.match(/\.(mp4|webm|mov)$/i) ? (
                  <video 
                    src={fullscreenImage.url} 
                    className="max-w-full max-h-full object-contain"
                    controls
                    loop
                    playsInline
                    autoPlay
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img 
                    src={fullscreenImage.url} 
                    alt={fullscreenImage.label || 'Fullscreen image'}
                    className="max-w-full max-h-full object-contain"
                    style={{ aspectRatio: 'auto' }}
                  />
                )}
              </div>
              <div className="flex gap-4 justify-end px-6 pb-6 flex-shrink-0">
                <Button 
                  variant="outline"
                  onClick={async () => {
                    if (!fullscreenImage) return;
                    try {
                      const response = await fetch(fullscreenImage.url);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      const isVideoFile = isVideo || fullscreenImage.url.match(/\.(mp4|webm|mov)$/i);
                      link.download = `render-${Date.now()}.${isVideoFile ? 'mp4' : 'png'}`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Download failed:', error);
                      toast.error('Failed to download image');
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => setFullscreenImage(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* ✅ Limit Reached Dialog */}
      {limitDialogData && (
        <LimitReachedDialog
          isOpen={limitDialogOpen}
          onClose={() => {
            setLimitDialogOpen(false);
            setLimitDialogData(null);
          }}
          limitType={limitDialogData.limitType}
          current={limitDialogData.current}
          limit={limitDialogData.limit}
          planName={limitDialogData.planName}
          message={limitDialogData.message}
        />
      )}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileSelect={handleUploadModalFileSelect}
        onGalleryOpen={() => {
          setIsUploadModalOpen(false);
          setIsGalleryModalOpen(true);
        }}
      />
      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onImageSelect={handleGalleryImageSelect}
      />
    </div>
  );
}

