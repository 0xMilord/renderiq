'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Send, 
  Image as ImageIcon, 
  Video,
  Loader2,
  Sparkles,
  Upload,
  X,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Maximize,
  MessageSquare,
  ArrowLeft,
  Copy,
  Zap,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  PanelRight,
  Plus,
  Pencil,
  Wand2,
  FileText,
  BookOpen,
  CheckCircle,
  AtSign
} from 'lucide-react';
import { 
  FaCheckCircle,
  FaExclamationTriangle,
  FaExclamationCircle
} from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCredits } from '@/lib/hooks/use-credits';
import { useIsPro } from '@/lib/hooks/use-subscription';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useProjectRules } from '@/lib/hooks/use-project-rules';
import { useUpscaling } from '@/lib/hooks/use-upscaling';
import { useImageGeneration, useVideoGeneration } from '@/lib/hooks/use-ai-sdk';
import { ModelSelector } from '@/components/ui/model-selector';
import { ModelId, getModelConfig, getDefaultModel, modelSupportsQuality, getMaxQuality, getSupportedResolutions } from '@/lib/config/models';
import { buildUnifiedContextAction } from '@/lib/actions/centralized-context.actions';
import type { UnifiedContext } from '@/lib/types/context';
import { UploadModal } from './upload-modal';
import { GalleryModal } from './gallery-modal';
import { ProjectRulesModal } from './project-rules-modal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Lock, Globe } from 'lucide-react';
import { LimitReachedDialog } from '@/components/billing/limit-reached-dialog';
import type { LimitType } from '@/lib/services/plan-limits.service';
import { logger } from '@/lib/utils/logger';
import { captureErrorWithContext } from '@/lib/hooks/use-sentry';
import { MentionTagger } from './mention-tagger';
import { PromptGalleryModal } from './prompt-gallery-modal';
import { PromptBuilderModal } from './prompt-builder-modal';
import type { Render } from '@/lib/types/render';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';
import Image from 'next/image';
import { shouldUseRegularImg } from '@/lib/utils/storage-url';
import { handleImageErrorWithFallback, isCDNUrl } from '@/lib/utils/cdn-fallback';
import { RenderiqCanvas, type VariantGenerationConfig } from '@/components/canvas/renderiq-canvas';
import { buildVariantBatchRequests } from '@/lib/utils/variant-prompt-builder';
import { buildDrawingBatchRequests } from '@/lib/utils/drawing-prompt-builder';
import type { DrawingGenerationConfig } from '@/components/canvas/generate-drawing-dialog';
import type { ImageToVideoConfig } from '@/components/canvas/image-to-video-dialog';

import { getRenderiqMessage } from '@/lib/utils/renderiq-messages';
import { useLocalStorageMessages } from '@/lib/hooks/use-local-storage-messages';
import { useObjectURL } from '@/lib/hooks/use-object-url';
import { useModal } from '@/lib/hooks/use-modal';
import { createRenderFormData } from '@/lib/utils/render-form-data';
import { useWakeLock } from '@/lib/hooks/use-wake-lock';
import { useDynamicTitle } from '@/lib/hooks/use-dynamic-title';
import { retryFetch } from '@/lib/utils/retry-fetch';
import { convertRendersToMessages, convertRenderToMessages } from '@/lib/utils/render-to-messages';
import { mergeMessagesWithRenders, shouldPreserveMessages } from '@/lib/utils/merge-messages';
import { trackRenderStarted, trackRenderCompleted, trackRenderFailed, trackRenderCreditsCost } from '@/lib/utils/sentry-metrics';
import {
  POLLING_INTERVAL,
} from '@/lib/constants/chat-constants';
import {
  getCompletedRenders,
  getLatestRender,
  getRenderByVersion,
  getVersionNumber,
  getRenderById,
} from '@/lib/utils/chain-helpers';
import React from 'react';
import { useChatStore, type Message as ChatMessage } from '@/lib/stores/chat-store';
import { useChatSettingsStore } from '@/lib/stores/chat-settings-store';
import { useUIPreferencesStore } from '@/lib/stores/ui-preferences-store';
import { useModalStore } from '@/lib/stores/modal-store';
import { useProjectChainStore } from '@/lib/stores/project-chain-store';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { saveChatMessage } from '@/lib/utils/save-chat-message';
import { loadChatMessages, mergeChatMessages } from '@/lib/utils/load-chat-messages';

// Message type is now imported from chat-store
type Message = ChatMessage;

interface UnifiedChatInterfaceProps {
  projectId: string;
  chainId?: string;
  chain?: RenderChainWithRenders;
  onRenderComplete?: (render: Render) => void;
  onRenderStart?: () => void;
  onRefreshChain?: () => void;
  projectName?: string;
  chainName?: string;
  onBackToProjects?: () => void;
  projects?: Array<{ id: string; name: string; slug: string }>;
  chains?: Array<{ id: string; name: string; projectId: string }>;
}

// Fixed aspect ratio for better quality - using 16:9 as default
const DEFAULT_ASPECT_RATIO = '16:9';

// Component for truncated messages with expand/collapse functionality
function TruncatedMessage({ 
  content, 
  maxLines = 4, 
  className = "" 
}: { 
  content: string; 
  maxLines?: number; 
  className?: string; 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      // Simple approach: check if content has more than 4 lines worth of characters
      const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight) || 20;
      const elementHeight = textRef.current.offsetHeight;
      const maxHeight = lineHeight * maxLines;
      
      setShouldTruncate(elementHeight > maxHeight);
    }
  }, [content, maxLines]);

  // Simple character-based truncation as fallback
  const shouldTruncateByLength = content.length > 200; // Roughly 4 lines
  const needsTruncation = shouldTruncate || shouldTruncateByLength;

  if (!needsTruncation) {
    return <p className={className}>{content}</p>;
  }

  return (
    <div>
      <p 
        ref={textRef}
        className={className}
        style={!isExpanded ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        } : {}}
      >
        {content}
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-1 h-6 px-2 text-xs"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3 mr-1" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3 mr-1" />
            Show more
          </>
        )}
      </Button>
    </div>
  );
}

// ✅ Export Message type for use in utility functions
export type { Message };

// ✅ Memoize component to prevent unnecessary re-renders (React 19 best practice)
export const UnifiedChatInterface = React.memo(function UnifiedChatInterface({ 
  projectId, 
  chainId, 
  chain,
  onRenderComplete, 
  onRenderStart,
  onRefreshChain,
  projectName,
  onBackToProjects,
  projects = [],
  chains = []
}: UnifiedChatInterfaceProps) {
  // ✅ FIX: Ensure we're on the client side (prevent SSR errors)
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const router = useRouter();
  
  // React 19: Track initialization per chainId to prevent re-initialization
  const initializedChainIdRef = useRef<string | undefined>(undefined);
  
  // ✅ FIXED: Network recovery state (declared early to avoid hoisting issues)
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryRenderId, setRecoveryRenderId] = useState<string | null>(null);
  // Pipeline stage events for progress display
  const [stageEvents, setStageEvents] = useState<Array<{ stage: string; status: 'success' | 'failed'; durationMs: number }>>([]);
  // ✅ MIGRATED: Using Modal Store for limit dialog and prompt modals
  const { 
    limitDialogOpen, 
    limitDialogData, 
    openLimitDialog, 
    closeLimitDialog,
    isPromptGalleryOpen,
    isPromptBuilderOpen,
    openPromptGallery,
    closePromptGallery,
    openPromptBuilder,
    closePromptBuilder
  } = useModalStore();
  const isVisibleRef = useRef(true);
  const lastRefreshTimeRef = useRef<number>(0);
  const hasProcessingRendersRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userSelectedRenderIdRef = useRef<string | null>(null);
  // ✅ FIXED: Store selected render IDs from canvas for reference
  const canvasSelectedRenderIdsRef = useRef<string[]>([]);
  const recentGenerationRef = useRef<{ timestamp: number; renderId?: string; render?: Render } | null>(null);
  
  // ✅ FIXED: Window visibility handling - prevent re-initialization on tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    isVisibleRef.current = document.visibilityState === 'visible';
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // ✅ FIXED: Network recovery - check for processing renders on mount (only once per chainId)
  useEffect(() => {
    if (!chainId || !onRefreshChain || !isVisibleRef.current) return;
    
    // Only check on mount or when chainId changes, not on every chain.renders update
    const currentChainId = chainId || chain?.id;
    if (initializedChainIdRef.current !== currentChainId) {
      return; // Will be handled by initialization effect
    }
    
    // Check for processing renders that might have been interrupted
    const processingRenders = chain?.renders?.filter(r => 
      (r.status === 'processing' || r.status === 'pending') && 
      r.chainId === chainId
    ) || [];
    
    if (processingRenders.length > 0) {
      const latestProcessing = processingRenders[processingRenders.length - 1];
      logger.log('🔄 Network recovery: Found processing render', {
        renderId: latestProcessing.id,
        status: latestProcessing.status
      });
      
      setIsRecovering(true);
      setRecoveryRenderId(latestProcessing.id);
    } else {
      setIsRecovering(false);
      setRecoveryRenderId(null);
    }
  }, [chainId, chain?.renders, onRefreshChain]);
  
  // ✅ FIXED: Clear recovery state when render completes
  useEffect(() => {
    if (recoveryRenderId && chain?.renders) {
      const recoveredRender = chain.renders.find(r => r.id === recoveryRenderId);
      if (recoveredRender && recoveredRender.status === 'completed') {
        logger.log('✅ Network recovery: Render completed', {
          renderId: recoveryRenderId
        });
        setIsRecovering(false);
        setRecoveryRenderId(null);
        toast.success('Render completed successfully!');
      } else if (recoveredRender && recoveredRender.status === 'failed') {
        logger.log('❌ Network recovery: Render failed', {
          renderId: recoveryRenderId
        });
        setIsRecovering(false);
        setRecoveryRenderId(null);
      }
    }
  }, [recoveryRenderId, chain?.renders]);
  
  // ✅ MIGRATED: Using Zustand store for chat state management
  // Use selective subscriptions for better performance
  const messages = useChatStore((state) => state.messages);
  const inputValue = useChatStore((state) => state.inputValue);
  const currentRender = useChatStore((state) => state.currentRender);
  const isGenerating = useChatStore((state) => state.isGenerating);
  const progress = useChatStore((state) => state.progress);
  
  // ✅ NEW: Get chainId and chain from store (primary source, props as fallback)
  const { selectedChainId, chains: storeChains } = useProjectChainStore();
  // Use store values as primary, fallback to props for backward compatibility
  const effectiveChainId = selectedChainId || chainId;
  const effectiveChain = storeChains.find(c => c.id === effectiveChainId) || chain;
  const effectiveChainRenders = effectiveChain?.renders || [];
  
  // Get actions from store
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const setInputValue = useChatStore((state) => state.setInputValue);
  const setCurrentRender = useChatStore((state) => state.setCurrentRender);
  const setIsGenerating = useChatStore((state) => state.setIsGenerating);
  const setProgress = useChatStore((state) => state.setProgress);
  const clearMessages = useChatStore((state) => state.clearMessages);
  const resetChat = useChatStore((state) => state.resetChat);
  
  // ✅ REFACTORED: Simplified message update - React 19 best practice: use store directly
  const setMessagesWithRef = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    const currentMessages = useChatStore.getState().messages;
    const newMessages = typeof updater === 'function' ? updater(currentMessages) : updater;
    setMessages(newMessages);
  }, [setMessages]);
  
  // Wrapper for setCurrentRender to support function updater (backward compatibility)
  const setCurrentRenderWithUpdater = useCallback((updater: Render | null | ((prev: Render | null) => Render | null)) => {
    const currentRenderValue = useChatStore.getState().currentRender;
    const newRender = typeof updater === 'function' ? updater(currentRenderValue) : updater;
    setCurrentRender(newRender);
  }, [setCurrentRender]);

  // Dynamic title updates based on project/chain - using new hook
  const chainName = chain?.name;
  useDynamicTitle(undefined, projectName, chainName);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  
  // Fixed aspect ratio for better quality
  const aspectRatio = DEFAULT_ASPECT_RATIO;
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  // ✅ FIX CORS: Store gallery image URL separately (fetched server-side to avoid CORS)
  const [galleryImageUrl, setGalleryImageUrl] = useState<string | null>(null);
  // Use custom hook for object URL management
  const previewUrl = useObjectURL(uploadedFile);
  
  
  // ✅ MIGRATED: Using Zustand store for settings state management
  // Use selective subscriptions for better performance
  const environment = useChatSettingsStore((state) => state.environment);
  const effect = useChatSettingsStore((state) => state.effect);
  const styleTransferImage = useChatSettingsStore((state) => state.styleTransferImage);
  const styleTransferPreview = useChatSettingsStore((state) => state.styleTransferPreview);
  const temperature = useChatSettingsStore((state) => state.temperature);
  const quality = useChatSettingsStore((state) => state.quality);
  const selectedImageModel = useChatSettingsStore((state) => state.selectedImageModel);
  const selectedVideoModel = useChatSettingsStore((state) => state.selectedVideoModel);
  const videoDuration = useChatSettingsStore((state) => state.videoDuration);
  const isVideoMode = useChatSettingsStore((state) => state.isVideoMode);
  const videoKeyframes = useChatSettingsStore((state) => state.videoKeyframes);
  const videoLastFrame = useChatSettingsStore((state) => state.videoLastFrame);
  const isPublic = useChatSettingsStore((state) => state.isPublic);
  
  // Get actions from store
  const setEnvironment = useChatSettingsStore((state) => state.setEnvironment);
  const setEffect = useChatSettingsStore((state) => state.setEffect);
  const setStyleTransferImage = useChatSettingsStore((state) => state.setStyleTransferImage);
  const setStyleTransferPreview = useChatSettingsStore((state) => state.setStyleTransferPreview);
  const setTemperature = useChatSettingsStore((state) => state.setTemperature);
  const setQuality = useChatSettingsStore((state) => state.setQuality);
  const setSelectedImageModel = useChatSettingsStore((state) => state.setSelectedImageModel);
  const setSelectedVideoModel = useChatSettingsStore((state) => state.setSelectedVideoModel);
  const setVideoDuration = useChatSettingsStore((state) => state.setVideoDuration);
  const setIsVideoMode = useChatSettingsStore((state) => state.setIsVideoMode);
  const setVideoLastFrame = useChatSettingsStore((state) => state.setVideoLastFrame);
  const setIsPublic = useChatSettingsStore((state) => state.setIsPublic);
  const resetSettings = useChatSettingsStore((state) => state.resetSettings);
  
  // Get original setVideoKeyframes from store
  const setVideoKeyframesStore = useChatSettingsStore((state) => state.setVideoKeyframes);
  
  // Wrapper for setVideoKeyframes to support function updater (backward compatibility)
  const setVideoKeyframes = useCallback((value: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }> | ((prev: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }>) => Array<{ id: string; imageData: string; imageType: string; timestamp?: number }>)) => {
    const currentKeyframes = useChatSettingsStore.getState().videoKeyframes;
    const newValue = typeof value === 'function' ? value(currentKeyframes) : value;
    setVideoKeyframesStore(newValue);
  }, [setVideoKeyframesStore]);
  
  // Modal state management (extracted to custom hook)
  const {
    isUploadModalOpen,
    isGalleryModalOpen,
    isLowBalanceModalOpen,
    isProjectRulesModalOpen,
    isMentionTaggerOpen,
    isUpgradeDialogOpen,
    setIsUploadModalOpen,
    setIsGalleryModalOpen,
    setIsLowBalanceModalOpen,
    setIsProjectRulesModalOpen,
    setIsMentionTaggerOpen,
    setIsUpgradeDialogOpen,
  } = useModal();
  const [mentionSearchTerm, setMentionSearchTerm] = useState('');
  // ✅ MIGRATED: Using Modal Store for prompt modals (declared above with limitDialog)
  
  // Mention state
  const [currentMentionPosition, setCurrentMentionPosition] = useState(-1);
  
  // Mobile view state - toggle between chat and render
  const [mobileView, setMobileView] = useState<'chat' | 'render'>('chat');
  
  // ✅ MIGRATED: Using UI Preferences Store for sidebar state
  const { isSidebarCollapsed, setSidebarCollapsed } = useUIPreferencesStore();
  
  // Refs (messagesEndRef, hasProcessingRendersRef, userSelectedRenderIdRef, lastRefreshTimeRef declared above)
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // ✅ REMOVED: messagesRef - using Zustand store directly for React 19 best practices
  
  // ✅ FIXED: Memoize hooks to prevent excessive re-renders
  // Only re-fetch when chainId or profile.id actually changes
  const { credits } = useCredits();
  const { rules: projectRules } = useProjectRules(chainId);
  const { profile } = useUserProfile();
  // ✅ FIXED: Only check pro status when profile.id changes, not on every render
  const profileId = profile?.id;
  const { data: isPro, loading: proLoading } = useIsPro(profileId);
  const { upscaleImage, isUpscaling, upscalingResult, error: upscalingError } = useUpscaling();
  
  // LocalStorage management hook
  const { saveMessages, restoreMessages } = useLocalStorageMessages(messages, projectId, chainId);
  
  // ✅ FIXED: Update isPublic based on pro status (consolidated with settings)
  useEffect(() => {
    if (!proLoading) {
      setIsPublic(!isPro); // Free users are public, Pro users are private by default
    }
  }, [isPro, proLoading]);

  // ✅ FIXED: Auto-adjust quality when image model changes (consolidated effect)
  useEffect(() => {
    if (selectedImageModel && !isVideoMode) {
      const modelId = selectedImageModel as ModelId;
      if (!modelSupportsQuality(modelId, quality as 'standard' | 'high' | 'ultra')) {
        const maxQuality = getMaxQuality(modelId);
        setQuality(maxQuality);
        toast.info(`Quality adjusted to ${maxQuality} (maximum supported by selected model)`);
      }
    }
  }, [selectedImageModel, isVideoMode, quality]);

  // Find previous render for reference (if needed for other features)
  // ✅ FIX: Also check currentRender's referenceRenderId as fallback
  const previousRender = useMemo(() => {
    if (!currentRender || currentRender.type === 'video') return null;
    
    // First, try to find previous render from chain.renders
    if (chain?.renders) {
      const currentPosition = currentRender.chainPosition ?? 0;
      if (currentPosition > 0) {
        const prev = chain.renders.find(
          r => r.chainPosition === currentPosition - 1 && 
          r.status === 'completed' && 
          r.outputUrl &&
          r.type === 'image'
        );
        if (prev) return prev;
      }
    }
    
    // ✅ FALLBACK: If not found in chain.renders, try to find by referenceRenderId
    // This handles the case when a new render is created but chain.renders hasn't updated yet
    if (currentRender.referenceRenderId && chain?.renders) {
      const referencedRender = chain.renders.find(
        r => r.id === currentRender.referenceRenderId &&
        r.status === 'completed' &&
        r.outputUrl &&
        r.type === 'image'
      );
      if (referencedRender) return referencedRender;
    }
    
    return null;
  }, [currentRender, chain]);
  
  // Google Generative AI hooks
  const { isGenerating: isImageGenerating } = useImageGeneration();
  const { isGenerating: isVideoGenerating } = useVideoGeneration();
  
  // Screen Wake Lock - Keep screen on during render generation
  // Must be after isImageGenerating and isVideoGenerating are defined
  useWakeLock(isGenerating || isImageGenerating || isVideoGenerating);

  // ✅ FIXED: Progress based on actual render status from DB, with batch support
  // Derive progress from render status in chain.renders
  const progressFromStatus = useMemo(() => {
    // Check if we have any processing renders
    const processingRenders = chain?.renders?.filter(r => 
      r.status === 'processing' || r.status === 'pending'
    ) || [];
    
    const completedRenders = chain?.renders?.filter(r => 
      r.status === 'completed' && r.outputUrl
    ) || [];
    
    if (processingRenders.length > 0) {
      // ✅ FIXED: For batch operations, calculate progress based on completion ratio
      // If we have multiple processing renders, it's likely a batch operation
      const totalRenders = processingRenders.length + completedRenders.length;
      
      if (totalRenders > 1) {
        // Batch operation: progress = (completed / total) * 100
        // Add 10% base + (completed ratio * 80%) + (processing status * 10%)
        const completedRatio = completedRenders.length / totalRenders;
        const baseProgress = 10; // Initial 10%
        const completionProgress = completedRatio * 80; // 80% for completion
        const statusProgress = processingRenders.some(r => r.status === 'processing') ? 10 : 5; // 10% if processing, 5% if pending
        
        const calculatedProgress = Math.min(baseProgress + completionProgress + statusProgress, 100);
        
        logger.log('📊 Progress calculation (batch):', {
          totalRenders,
          completedRenders: completedRenders.length,
          processingRenders: processingRenders.length,
          completedRatio,
          calculatedProgress,
        });
        
        return Math.round(calculatedProgress);
      }
      
      // Single render: show progress based on render status
      const latestProcessing = processingRenders[processingRenders.length - 1];
      if (latestProcessing.status === 'completed') {
        return 100;
      }
      // Show 50% for pending, 75% for processing
      return latestProcessing.status === 'pending' ? 50 : 75;
    }
    
    // If we're generating locally but no render in DB yet, show 10%
    if (isGenerating || isImageGenerating || isVideoGenerating) {
      return 10;
    }
    
    return 0;
  }, [chain?.renders, isGenerating, isImageGenerating, isVideoGenerating]);
  
  // Update progress state when status changes (throttled to avoid excessive re-renders)
  useEffect(() => {
    if (progressFromStatus !== progress) {
      setProgress(progressFromStatus);
    }
  }, [progressFromStatus]);

  // ✅ SIMPLIFIED: Single source of truth - chain.renders
  // Derive everything from chain.renders directly
  
  // Memoize completed renders (sorted by chainPosition)
  const completedRenders = useMemo(() => {
    return getCompletedRenders(chain?.renders);
  }, [chain?.renders]);

  // Memoize latest render
  const latestRender = useMemo(() => {
    return getLatestRender(chain?.renders);
  }, [chain?.renders]);

  // ✅ Memoize current render with latest data for main display area
  const renderWithLatestData = useMemo(() => {
    if (!currentRender) return null;
    const latest = getRenderById(chain?.renders, currentRender.id) || currentRender;
    logger.log('🖼️ [MAIN RENDER DEBUG] Computing renderWithLatestData', {
      currentRenderId: currentRender.id,
      renderWithLatestDataId: latest.id,
      chainPosition: latest.chainPosition,
      version: getVersionNumber(latest, chain?.renders),
      type: latest.type,
      outputUrl: latest.outputUrl?.substring(0, 50) + '...',
      hasOutputUrl: !!latest.outputUrl,
      status: latest.status,
      latestRenderId: latestRender?.id,
      latestRenderVersion: getVersionNumber(latestRender, chain?.renders),
      isLatest: latest.id === latestRender?.id,
      completedRendersCount: completedRenders.length
    });
    return latest;
  }, [currentRender, chain?.renders, latestRender, completedRenders.length]);

  // ✅ Extract stage events from render metadata when render is loaded
  useEffect(() => {
    if (renderWithLatestData && renderWithLatestData.status === 'completed') {
      // ✅ FIXED: Proper type handling for render metadata
      const metadata = renderWithLatestData.metadata as Record<string, unknown> | undefined;
      const contextData = renderWithLatestData.contextData as Record<string, unknown> | undefined;
      
      if (metadata?.stageEvents && Array.isArray(metadata.stageEvents)) {
        setStageEvents(metadata.stageEvents);
      } else if (contextData?.stageEvents && Array.isArray(contextData.stageEvents)) {
        setStageEvents(contextData.stageEvents);
      }
    }
  }, [renderWithLatestData?.id, renderWithLatestData?.status]);

  const displayVersion = useMemo(() => {
    return getVersionNumber(renderWithLatestData, chain?.renders) || 1;
  }, [renderWithLatestData, chain?.renders]);

  // Memoize messages from chain.renders
  const chainMessages = useMemo(() => {
    if (!chain?.renders || chain.renders.length === 0) return null;
    return convertRendersToMessages(chain.renders);
  }, [chain?.renders]);

  // ✅ FIXED: Initialize messages when chainId changes (with visibility check and generation check)
  // ✅ NEW: Load messages from database and merge with chain.renders
  useEffect(() => {
    const currentChainId = chainId || chain?.id;
    
    // Don't re-initialize if already initialized, tab is hidden, or we're generating
    if (initializedChainIdRef.current === currentChainId || !isVisibleRef.current) {
      return;
    }
    
    // ✅ CRITICAL: Don't re-initialize if we're currently generating (preserves local state)
    if (isGenerating || isImageGenerating || isVideoGenerating || isRecovering) {
      logger.log('⚠️ UnifiedChatInterface: Skipping initialization - generation in progress');
      return;
    }

    if (!currentChainId || !projectId) {
      logger.log('⚠️ UnifiedChatInterface: Missing chainId or projectId, skipping initialization');
      return;
    }

    logger.log('🔍 UnifiedChatInterface: Initializing chain data', {
      chainId: currentChainId,
      projectId,
      rendersCount: chain?.renders?.length || 0
    });
    
    // Load messages from chain.renders (chat_messages API removed)
    let isMounted = true;
    
    loadChatMessages(currentChainId, projectId)
      .then((dbMessages) => {
        if (!isMounted) return;
        
        // Merge database messages with render messages (dbMessages is now always empty)
        const renderMessages = chainMessages || [];
        const mergedMessages = mergeChatMessages(dbMessages, renderMessages);
        
        logger.log('✅ UnifiedChatInterface: Loaded and merged messages', {
          dbCount: dbMessages.length,
          renderCount: renderMessages.length,
          mergedCount: mergedMessages.length,
          sortedByTimestamp: true,
        });
        
        // Set merged messages (sorted by timestamp - oldest first, newest at bottom)
        setMessagesWithRef(mergedMessages);
        saveMessages(mergedMessages);
      
      // Set latest render on initialization
      if (latestRender) {
        logger.log('🔍 UnifiedChatInterface: Setting latest render on initialization', {
          renderId: latestRender.id,
          chainPosition: latestRender.chainPosition,
          versionNumber: getVersionNumber(latestRender, chain?.renders)
        });
        setCurrentRender(latestRender);
        userSelectedRenderIdRef.current = null;
      } else {
        logger.log('⚠️ UnifiedChatInterface: No latest render found on initialization');
        }
        
        initializedChainIdRef.current = currentChainId;
      })
      .catch((error) => {
        if (!isMounted) return;
        
        logger.error('❌ UnifiedChatInterface: Failed to load messages from database, falling back to localStorage', error);
        
        // Fallback to localStorage and chain.renders
        const storedMessages = restoreMessages();
        
        if (chainMessages) {
          setMessagesWithRef(chainMessages);
          saveMessages(chainMessages);
          
          if (latestRender) {
            setCurrentRender(latestRender);
            userSelectedRenderIdRef.current = null;
      }
    } else if (storedMessages) {
      setMessagesWithRef(storedMessages);
    } else {
      setMessagesWithRef([]);
      setCurrentRender(null);
    }
    
    initializedChainIdRef.current = currentChainId;
      });
    
    return () => {
      isMounted = false;
    };
  }, [chainId, projectId, chainMessages, latestRender, isGenerating, isImageGenerating, isVideoGenerating, isRecovering, chain?.renders]);

  // ✅ FIXED: Update messages when chain.renders changes (consolidated with currentRender update)
  // This is now handled in the combined chain.renders effect below

  // ✅ Debug: Log when currentRender changes
  useEffect(() => {
    logger.log('🔄 [SYNC DEBUG] currentRender state changed', {
      currentRenderId: currentRender?.id,
      currentRenderChainPosition: currentRender?.chainPosition,
      currentRenderVersion: getVersionNumber(currentRender, chain?.renders),
      currentRenderOutputUrl: currentRender?.outputUrl?.substring(0, 50) + '...',
      latestRenderId: latestRender?.id,
      latestRenderVersion: getVersionNumber(latestRender, chain?.renders),
      isLatest: currentRender?.id === latestRender?.id,
      userSelectedRenderId: userSelectedRenderIdRef.current
    });
  }, [currentRender?.id, chain?.renders]);

  /**
   * Effect: Syncs messages with chain.renders updates.
   * Preserves user messages without renders and generating messages.
   * Uses shared merge function to eliminate duplication.
   * 
   * ✅ CRITICAL: Always reads latest messages from store to avoid stale closures
   */
  useEffect(() => {
    // ✅ FIX: Always get latest messages from store, not from closure
    const currentMessages = useChatStore.getState().messages;
    
    // ✅ CRITICAL: If we have user messages without renders, always preserve them
    const hasUserMessagesWithoutRenders = currentMessages.some(m => m.type === 'user' && !m.render);
    if (hasUserMessagesWithoutRenders) {
      logger.log('✅ Chat: User messages without renders detected, ensuring preservation', {
        count: currentMessages.filter(m => m.type === 'user' && !m.render).length
      });
    }
    
    if (!chain?.renders) {
      if (chain?.renders?.length === 0) {
        // ✅ CRITICAL FIX: Only clear if we're not generating AND no user messages exist
        if (!shouldPreserveMessages(currentMessages, isGenerating, isImageGenerating, isVideoGenerating)) {
          setCurrentRender(null);
          setMessagesWithRef([]);
        }
      }
      return;
    }
    
    const isCurrentlyGenerating = isGenerating || isImageGenerating || isVideoGenerating || isRecovering;
    const recentGen = recentGenerationRef.current;
    const hasRecentGeneration = recentGen && (Date.now() - recentGen.timestamp < 60000);
    
    let mergedMessages: Message[];
    
    if (isCurrentlyGenerating || hasUserMessagesWithoutRenders) {
      // ✅ CRITICAL: When generating OR when we have user messages, preserve ALL messages
      // This ensures user messages appear immediately and aren't lost
      mergedMessages = mergeMessagesWithRenders(currentMessages, chain.renders, {
        preserveGenerating: isCurrentlyGenerating
      });
      
      // ✅ SAFEGUARD: Ensure all user messages without renders are preserved
      const userMessagesWithoutRenders = currentMessages.filter(m => m.type === 'user' && !m.render);
      for (const userMsg of userMessagesWithoutRenders) {
        if (!mergedMessages.some(m => m.id === userMsg.id)) {
          logger.log('⚠️ Merge: Re-adding user message that was lost during merge', {
            id: userMsg.id,
            content: userMsg.content.substring(0, 50)
          });
          mergedMessages.push(userMsg);
        }
      }
    } else if (hasRecentGeneration && recentGen.renderId) {
        const renderInDB = chain.renders.find(r => r.id === recentGen.renderId);
        
        if (!renderInDB || renderInDB.status !== 'completed') {
        // Preserve recent generation until DB sync
          logger.log('🔄 Chat: Preserving local render until DB sync', {
            renderId: recentGen.renderId,
            inDB: !!renderInDB,
          status: renderInDB?.status
        });
        
        mergedMessages = mergeMessagesWithRenders(currentMessages, chain.renders, {
          recentGenerationId: recentGen.renderId,
          recentGenerationRender: recentGen.render
        });
              } else {
        // Render now in DB - use chain as source of truth
        logger.log('✅ Chat: Render now in DB, switching to DB source', {
          renderId: recentGen.renderId
        });
        recentGenerationRef.current = null;
        mergedMessages = mergeMessagesWithRenders(currentMessages, chain.renders);
              }
            } else {
      // No recent generation - merge preserving user messages without renders
      if (recentGen && !hasRecentGeneration) {
        logger.log('⏰ Chat: Recent generation grace period expired');
        recentGenerationRef.current = null;
      }
      
      mergedMessages = mergeMessagesWithRenders(currentMessages, chain.renders);
      
      // ✅ SAFEGUARD: Always ensure user messages without renders are preserved
      const userMessagesWithoutRenders = currentMessages.filter(m => m.type === 'user' && !m.render);
      for (const userMsg of userMessagesWithoutRenders) {
        if (!mergedMessages.some(m => m.id === userMsg.id)) {
          logger.log('⚠️ Merge: Re-adding user message that was lost during non-generating merge', {
            id: userMsg.id,
            content: userMsg.content.substring(0, 50)
          });
          mergedMessages.push(userMsg);
        }
      }
    }
    
    // ✅ CRITICAL: Only update if messages actually changed to prevent infinite loops
    // Compare message IDs and counts to detect changes efficiently
    const currentIds = currentMessages.map(m => m.id).sort().join(',');
    const mergedIds = mergedMessages.map(m => m.id).sort().join(',');
    const messagesChanged = currentIds !== mergedIds || currentMessages.length !== mergedMessages.length;
    
    if (messagesChanged) {
      logger.log('🔄 Chat: Messages changed, updating', {
        currentCount: currentMessages.length,
        mergedCount: mergedMessages.length,
        userMessagesWithoutRenders: currentMessages.filter(m => m.type === 'user' && !m.render).length,
        mergedUserMessagesWithoutRenders: mergedMessages.filter(m => m.type === 'user' && !m.render).length
      });
          setMessagesWithRef(mergedMessages);
          saveMessages(mergedMessages);
        } else {
      logger.log('✅ Chat: Messages unchanged, skipping update', {
        count: currentMessages.length
      });
    }
    
    // Update currentRender
    setCurrentRenderWithUpdater((prevRender) => {
      // ✅ FIX: Preserve recently created render even if it hasn't appeared in chain.renders yet
      // This prevents renders from disappearing immediately after creation
      if (recentGenerationRef.current && prevRender) {
        const timeSinceGeneration = Date.now() - recentGenerationRef.current.timestamp;
        // ✅ FIXED: Increased grace period to 60 seconds for production
        const isRecentGeneration = timeSinceGeneration < 60000; // 60 seconds grace period
        
        if (isRecentGeneration && prevRender.id === recentGenerationRef.current.renderId) {
          // Check if render has appeared in chain.renders yet
          const renderInChain = getRenderById(chain.renders, prevRender.id);
          if (renderInChain && renderInChain.status === 'completed') {
            // Render has appeared in chain with completed status, update with latest data
            logger.log('✅ CurrentRender: Render confirmed in chain, updating', {
              renderId: prevRender.id
            });
            recentGenerationRef.current = null; // Clear ref since render is now in chain
            return renderInChain;
          }
          // Render hasn't appeared in chain yet or not completed, use stored render from ref if available
          const storedRender = recentGenerationRef.current.render;
          if (storedRender) {
            logger.log('🔄 CurrentRender: Using stored render from ref', {
              renderId: prevRender.id,
              timeSinceGeneration
            });
            return storedRender;
          }
          // Fallback to prevRender
          return prevRender;
        }
      }
      
      // If user manually selected a render, keep it (but update with latest data)
      if (userSelectedRenderIdRef.current) {
        const selectedRender = getRenderById(chain.renders, userSelectedRenderIdRef.current);
        if (selectedRender && selectedRender.status === 'completed') {
          return selectedRender;
        }
        userSelectedRenderIdRef.current = null;
      }
      
      // Auto-update to latest render if no manual selection
      if (!userSelectedRenderIdRef.current && latestRender) {
        if (!prevRender || (latestRender.chainPosition || 0) > (prevRender.chainPosition || 0)) {
          return latestRender;
        }
      }
      
      // Update current render with latest data from chain
      if (prevRender) {
        const updatedRender = getRenderById(chain.renders, prevRender.id);
        if (updatedRender && updatedRender.status === 'completed') {
          return updatedRender;
        }
      }
      
      return latestRender || prevRender;
    });
  }, [chain?.renders, latestRender, isGenerating, isImageGenerating, isVideoGenerating, isRecovering, messages.length]); // ✅ FIX: Include messages.length to detect when new messages are added

  // ✅ FIXED: Throttled refresh function to prevent excessive calls
  const refreshThrottleMs = 3000; // Minimum 3 seconds between refreshes
  
  const throttledRefresh = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    
    if (timeSinceLastRefresh >= refreshThrottleMs) {
      lastRefreshTimeRef.current = now;
      onRefreshChain?.();
    }
  }, [onRefreshChain]);

  // ✅ FIXED: Use ref to track chain to avoid dependency on chain?.renders (prevents infinite loop)
  const chainRef = useRef(chain);
  useEffect(() => {
    chainRef.current = chain;
  }, [chain]);

  // ✅ FIXED: Consolidated polling logic - throttle to prevent excessive refreshes
  // CRITICAL: Do NOT include chain?.renders in dependencies - it causes infinite loops
  useEffect(() => {
    if (!chainId || !onRefreshChain) return;
    
    // ✅ FIXED: Use a single interval that checks refs, not closure values
    // This prevents recreating the interval on every chain.renders change
    let pollInterval: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      if (pollInterval) return; // Already polling
      
      pollInterval = setInterval(() => {
        // Check refs to avoid stale closures
        if (!isVisibleRef.current) {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          return;
        }
        
        // ✅ FIXED: Get latest chain from ref, not closure
        const currentChain = chainRef.current;
        const hasProcessingInDB = currentChain?.renders?.some(r => 
          r.status === 'processing' || r.status === 'pending'
        ) || false;
        
        const recentGen = recentGenerationRef.current;
        // ✅ FIXED: Increased grace period to 60 seconds for production
        const shouldContinue = recentGen && 
          (Date.now() - recentGen.timestamp < 60000);
        
        // Check if the recent generation render is now in the database
        if (recentGen?.renderId && currentChain?.renders) {
          const renderInDB = currentChain.renders.find(r => r.id === recentGen.renderId);
          if (renderInDB && renderInDB.status === 'completed') {
            // Render is now in DB, clear recent generation tracking
            logger.log('✅ Polling: Render confirmed in DB, stopping tracking', {
              renderId: recentGen.renderId
            });
            recentGenerationRef.current = null;
          } else if (recentGen && Date.now() - recentGen.timestamp > 60000) {
            // Grace period expired, clear tracking
            logger.log('⏰ Polling: Grace period expired, clearing tracking', {
              renderId: recentGen.renderId,
              timeSinceGeneration: Date.now() - recentGen.timestamp
            });
            recentGenerationRef.current = null;
          }
        }
        
        // Check if we should continue polling
        if (!hasProcessingInDB && !shouldContinue && !hasProcessingRendersRef.current) {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          return;
        }
        
        // ✅ FIXED: Use throttled refresh to prevent excessive calls
        throttledRefresh();
      }, POLLING_INTERVAL);
    };
    
    // Start polling if we have processing renders
    const currentChain = chainRef.current;
    const hasProcessingInDB = currentChain?.renders?.some(r => 
      r.status === 'processing' || r.status === 'pending'
    ) || false;
    
    const hasLocalGeneration = isGenerating || isImageGenerating || isVideoGenerating || isRecovering;
    const recentGeneration = recentGenerationRef.current;
    // ✅ FIXED: Increased grace period to 60 seconds for production
    const shouldContinuePolling = recentGeneration && 
      (Date.now() - recentGeneration.timestamp < 60000);
    
    const hasProcessing = hasProcessingInDB || hasLocalGeneration || shouldContinuePolling;
    hasProcessingRendersRef.current = hasProcessing;
    
    if (hasProcessing) {
      startPolling();
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  }, [chainId, throttledRefresh]); // ✅ CRITICAL: Removed chain?.renders to prevent infinite loop
  
  // ✅ FIXED: Update processing ref when state changes (separate effect)
  useEffect(() => {
    const hasProcessing = chain?.renders?.some(r => 
      r.status === 'processing' || r.status === 'pending'
    ) || isGenerating || isImageGenerating || isVideoGenerating || isRecovering;
    
    hasProcessingRendersRef.current = hasProcessing;
    
    // ✅ NEW: Clear isGenerating when all renders are complete
    if (isGenerating && !isImageGenerating && !isVideoGenerating && !isRecovering) {
      const hasProcessingRenders = chain?.renders?.some(r => 
        r.status === 'processing' || r.status === 'pending'
      ) || false;
      
      if (!hasProcessingRenders) {
        // All renders are complete, clear generating state
        logger.log('✅ Clearing isGenerating - all renders complete', {
          totalRenders: chain?.renders?.length || 0,
          completedRenders: chain?.renders?.filter(r => r.status === 'completed').length || 0
        });
        setIsGenerating(false);
      }
    }
  }, [chain?.renders, isGenerating, isImageGenerating, isVideoGenerating, isRecovering, setIsGenerating]);

  // ✅ REFACTORED: Update variant messages as renders complete - using store directly
  useEffect(() => {
    if (!chain?.renders || messages.length === 0) return;

    const currentMessages = messages;

    // Find messages with variant renders that are still generating
    const variantMessages = currentMessages.filter(msg => 
      msg.type === 'assistant' && 
      msg.render && 
      msg.isGenerating &&
      msg.render.id
    );

    if (variantMessages.length === 0) return;

    let hasUpdates = false;
    const updatedMessages = currentMessages.map(msg => {
      if (!msg.render?.id) return msg;

      // Find corresponding render in chain
      const chainRender = chain.renders.find(r => r.id === msg.render.id);
      
      if (!chainRender) return msg;

      // Check if render is now completed
      const isNowCompleted = chainRender.status === 'completed' && chainRender.outputUrl;
      const wasGenerating = msg.isGenerating;

      if (isNowCompleted && wasGenerating) {
        hasUpdates = true;
        logger.log('✅ Variant completed, updating message', {
          renderId: chainRender.id,
          outputUrl: chainRender.outputUrl?.substring(0, 50),
        });

        return {
          ...msg,
          content: msg.content.replace('...', ''), // Remove ellipsis
          isGenerating: false,
          render: {
            ...msg.render,
            outputUrl: chainRender.outputUrl,
            status: 'completed',
          } as Render,
        };
      }

      return msg;
    });

    if (hasUpdates) {
      logger.log('🔄 Updating variant messages with completed renders', {
        updatedCount: updatedMessages.filter(m => !m.isGenerating && m.render?.outputUrl).length,
      });
      setMessagesWithRef(updatedMessages);
    }
  }, [chain?.renders]); // ✅ FIXED: Only depend on chain.renders, not messages

  // localStorage save is now handled by useLocalStorageMessages hook

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Preview URL is now managed by useObjectURL hook

  // Dropzone for file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    // Check if all files are images and within size limit
    const validFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );
    
    if (validFiles.length === 0) return;
    
    // Single image upload
    const file = validFiles[0];
    setUploadedFile(file);
    // previewUrl is automatically managed by useObjectURL hook
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const removeFile = () => {
    setUploadedFile(null);
    setGalleryImageUrl(null); // ✅ FIX CORS: Clear gallery URL when removing file
    // previewUrl cleanup is automatically handled by useObjectURL hook
  };

  const getCreditsCost = () => {
    // Calculate credits cost based on type, quality, and selected model
    if (isVideoMode) {
      // Video: Use model-based pricing
      const modelId = selectedVideoModel || getDefaultModel('video').id;
      const modelConfig = getModelConfig(modelId);
      if (modelConfig && modelConfig.type === 'video') {
        return modelConfig.calculateCredits({ duration: videoDuration });
      }
      // Fallback to default: 30 credits per second
      return 30 * videoDuration;
    } else {
      // Image: Use model-based pricing
      const modelId = selectedImageModel || getDefaultModel('image').id;
      const modelConfig = getModelConfig(modelId);
      if (modelConfig && modelConfig.type === 'image') {
        const imageSize = quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K';
        return modelConfig.calculateCredits({ quality: quality as 'standard' | 'high' | 'ultra', imageSize });
      }
      // Fallback to default: 5 credits base, multiplied by quality
      const baseCreditsPerImage = 5;
      const qualityMultiplier = quality === 'high' ? 2 : quality === 'ultra' ? 3 : 1;
      return baseCreditsPerImage * qualityMultiplier;
    }
  };
  
  const getCreditsCostText = () => {
    const cost = getCreditsCost();
    return `${cost} credit${cost !== 1 ? 's' : ''}`;
  };

  // getRenderiqMessage is now imported from lib/utils/renderiq-messages.ts


  // Upload modal handlers
  const handleUploadModalOpen = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
  };

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setGalleryImageUrl(null); // ✅ FIX CORS: Clear gallery URL when selecting a new file
    // previewUrl is automatically managed by useObjectURL hook
  };


  // Gallery modal handlers
  const handleGalleryModalOpen = () => {
    setIsGalleryModalOpen(true);
  };

  const handleGalleryModalClose = () => {
    setIsGalleryModalOpen(false);
  };

  const handleGalleryImageSelect = (image: { url: string; file?: File; render?: Render }) => {
    // ✅ FIX CORS: Store gallery image URL to pass to API (fetched server-side to avoid CORS)
    if (image.file) {
      // If file is provided, use it directly
      setUploadedFile(image.file);
      setGalleryImageUrl(null); // Clear gallery URL when using file
      // previewUrl is automatically managed by useObjectURL hook
    } else if (image.url) {
      // For gallery images, store the URL and create a placeholder for preview
      setGalleryImageUrl(image.url);
      // Create a placeholder file object for preview (useObjectURL needs a File)
      // The actual image will be fetched server-side using the URL
      const file = new File([''], 'gallery-image.png', { type: 'image/png' });
      setUploadedFile(file);
      // Note: Preview won't work with placeholder, but that's okay - the image will load from URL
    }
  };

  // Mention tagger handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setInputValue(value);

    // Check for @ mentions
    const beforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const afterAt = beforeCursor.substring(lastAtIndex + 1);
      // Check if it's a version mention (allow spaces after @)
      if (afterAt.match(/^\s*version\s*\d*$/i) || (!afterAt.includes(' ') && !afterAt.includes('\n'))) {
        setMentionSearchTerm(afterAt.trim());
        setIsMentionTaggerOpen(true);
        setCurrentMentionPosition(lastAtIndex);
      } else {
        setIsMentionTaggerOpen(false);
        setCurrentMentionPosition(-1);
      }
    } else {
      setIsMentionTaggerOpen(false);
      setCurrentMentionPosition(-1);
    }
  };

  const handleMentionSelect = (mention: { text: string; render?: Render }) => {
    if (currentMentionPosition === -1) return;

    const beforeMention = inputValue.substring(0, currentMentionPosition);
    const afterMention = inputValue.substring(currentMentionPosition + mentionSearchTerm.length + 1);
    
    // Add a space after the mention for better UX
    const newValue = `${beforeMention}@${mention.text} ${afterMention}`;
    setInputValue(newValue);
    
    // Mention is now integrated into the input text
    
    setIsMentionTaggerOpen(false);
    setCurrentMentionPosition(-1);
    setMentionSearchTerm('');
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleMentionTaggerClose = () => {
    setIsMentionTaggerOpen(false);
    setCurrentMentionPosition(-1);
    setMentionSearchTerm('');
  };

  // Handle variant generation from canvas
  const handleGenerateVariants = async (config: VariantGenerationConfig, selectedRenderIds: string[]) => {
    if (selectedRenderIds.length === 0 || isGenerating || isImageGenerating || isVideoGenerating) return;

    // Check credits BEFORE proceeding
    const requiredCredits = getCreditsCost() * config.variantCount;
    if (credits && credits.balance < requiredCredits) {
      setIsLowBalanceModalOpen(true);
      return;
    }

    logger.log('🎨 Generating variants from canvas selection', {
      variantCount: config.variantCount,
      variantType: config.variantType,
      selectedRenderIds,
    });

    // Use first selected render as reference
    const referenceRenderId = selectedRenderIds[0];
    
    // Get base prompt from reference render or use default
    const referenceRender = chain?.renders.find(r => r.id === referenceRenderId);
    const basePrompt = referenceRender?.prompt || inputValue || 'Generate architectural variant';

    // Build batch requests for variants
    const batchRequests = buildVariantBatchRequests(basePrompt, config);

    try {
      // Set generating state
      setIsGenerating(true);

      // Create FormData with batch requests
      const formData = createRenderFormData({
        prompt: `Generate ${config.variantCount} variants`,
        quality,
        aspectRatio,
        type: 'image',
        projectId: projectId || '',
        chainId,
        referenceRenderId,
        isPublic,
        environment,
        effect,
        temperature,
        model: selectedImageModel || undefined,
      });

      // Add batch API flags
      formData.append('useBatchAPI', 'true');
      formData.append('batchRequests', JSON.stringify(batchRequests));
      formData.append('variantCount', config.variantCount.toString());
      formData.append('variantType', config.variantType);
      if (config.viewType) formData.append('viewType', config.viewType);
      if (config.cameraAngles !== undefined) formData.append('cameraAngles', config.cameraAngles.toString());
      if (config.lightingVariation !== undefined) formData.append('lightingVariation', config.lightingVariation.toString());
      if (config.rotationCoverage !== undefined) formData.append('rotationCoverage', config.rotationCoverage.toString());

      // Call API
      const apiUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/renders`
        : '/api/renders';

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate variants');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate variants');
      }

      logger.log('✅ Variants generated successfully', {
        variantCount: config.variantCount,
        batchResults: result.data,
      });

      // ✅ FIXED: Track pending render IDs for polling
      const pendingRenderIds: string[] = [];
      const completedRenderIds: string[] = [];

      // Add message to chat
      if (Array.isArray(result.data)) {
        // Batch results - create messages for each variant with correct status
        interface VariantResult {
          renderId: string;
          status: string;
          outputUrl?: string | null;
        }
        const variantMessages: Message[] = (result.data as VariantResult[]).map((item, idx: number) => {
          const renderId = item.renderId;
          const isCompleted = item.status === 'completed' && item.outputUrl;
          
          if (isCompleted) {
            completedRenderIds.push(renderId);
          } else {
            pendingRenderIds.push(renderId);
          }

          return {
          id: `variant-${Date.now()}-${idx}`,
          type: 'assistant' as const,
            content: isCompleted 
              ? `Generated variant ${idx + 1} of ${config.variantCount}`
              : `Generating variant ${idx + 1} of ${config.variantCount}...`,
          timestamp: new Date(),
          render: {
              id: renderId,
              outputUrl: item.outputUrl || null,
              status: isCompleted ? 'completed' : (item.status || 'processing'),
          } as Render,
            isGenerating: !isCompleted,
          };
        });

        setMessagesWithRef([...messages, ...variantMessages]);

        // ✅ FIXED: Track pending renders for polling
        if (pendingRenderIds.length > 0) {
          recentGenerationRef.current = {
            renderId: pendingRenderIds[0], // Track first pending render
            timestamp: Date.now(),
            render: {
              id: pendingRenderIds[0],
              status: 'processing',
            } as Render,
          };
          
          logger.log('🔄 Variants: Tracking pending renders for polling', {
            pendingCount: pendingRenderIds.length,
            completedCount: completedRenderIds.length,
            pendingRenderIds,
          });
        }

        // ✅ FIXED: Trigger immediate refresh to sync with database
        // Use multiple staggered refreshes to ensure we catch all renders
        const refreshDelays = [500, 2000, 5000, 10000];
        refreshDelays.forEach((delay, index) => {
          setTimeout(() => {
            logger.log(`🔄 Variants: Refresh attempt ${index + 1}/${refreshDelays.length} for render sync`, {
              delay,
              pendingCount: pendingRenderIds.length,
            });
            throttledRefresh();
          }, delay);
        });

        // ✅ FIXED: If all are already completed, trigger single refresh
        if (pendingRenderIds.length === 0 && completedRenderIds.length > 0) {
          logger.log('✅ Variants: All renders already completed, triggering refresh');
          throttledRefresh();
        }
      }

      logger.log('✅ Variants generation initiated', {
        totalVariants: config.variantCount,
        pendingCount: pendingRenderIds.length,
        completedCount: completedRenderIds.length,
      });
      
      // ✅ FIXED: Only clear isGenerating if all renders are already completed
      // Otherwise, polling will clear it when all renders complete
      if (pendingRenderIds.length === 0) {
        setIsGenerating(false);
      } else {
        // Keep isGenerating true - polling will clear it when all renders complete
        logger.log('🔄 Variants: Keeping isGenerating=true, waiting for renders to complete', {
          pendingCount: pendingRenderIds.length
        });
      }
    } catch (error) {
      logger.error('❌ Failed to generate variants:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate variants');
      setIsGenerating(false); // Only clear on error
    }
  };

  // Handle drawing generation from canvas
  const handleGenerateDrawing = async (config: DrawingGenerationConfig, selectedRenderIds: string[]) => {
    if (selectedRenderIds.length === 0 || isGenerating || isImageGenerating || isVideoGenerating) return;

    const totalDrawings = config.selectedFloorPlans.size + config.selectedElevationSides.size + config.selectedSectionCuts.size;
    if (totalDrawings === 0) {
      toast.error('Please select at least one drawing type');
      return;
    }

    // Check credits (estimated 5 credits per drawing)
    const baseCreditsPerDrawing = 5;
    const qualityMultiplier = quality === 'high' ? 2 : quality === 'ultra' ? 3 : 1;
    const requiredCredits = totalDrawings * baseCreditsPerDrawing * qualityMultiplier;
    if (credits && credits.balance < requiredCredits) {
      setIsLowBalanceModalOpen(true);
      return;
    }

    logger.log('🎨 Generating drawings from canvas selection', {
      totalDrawings,
      config,
      selectedRenderIds,
    });

    // Use first selected render as reference
    const referenceRenderId = selectedRenderIds[0];
    
    try {
      setIsGenerating(true);

      // Build batch requests
      const batchRequests = buildDrawingBatchRequests(config);

      // Create FormData
      const formData = createRenderFormData({
        prompt: `Generate ${totalDrawings} CAD drawings`,
        quality,
        aspectRatio,
        type: 'image',
        projectId: projectId || '',
        chainId,
        referenceRenderId,
        isPublic,
        environment,
        effect: 'technical', // Use technical style for CAD drawings
        temperature,
        model: selectedImageModel || undefined,
      });

      // Add batch API flags
      formData.append('useBatchAPI', 'true');
      formData.append('batchRequests', JSON.stringify(batchRequests));
      formData.append('includeText', config.includeText.toString());
      formData.append('style', config.style);
      formData.append('selectedFloorPlans', JSON.stringify(Array.from(config.selectedFloorPlans)));
      formData.append('selectedElevationSides', JSON.stringify(Array.from(config.selectedElevationSides)));
      formData.append('selectedSectionCuts', JSON.stringify(Array.from(config.selectedSectionCuts)));

      // Call API
      const apiUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/renders`
        : '/api/renders';

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate drawings');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate drawings');
      }

      logger.log('✅ Drawings generated successfully', {
        totalDrawings,
        batchResults: result.data,
      });

      // Add message to chat
      if (Array.isArray(result.data)) {
        interface DrawingResult {
          renderId: string;
          outputUrl?: string | null;
          status?: string;
        }
        const drawingMessages: Message[] = (result.data as DrawingResult[]).map((item, idx: number) => ({
          id: `drawing-${Date.now()}-${idx}`,
          type: 'assistant' as const,
          content: `Generated drawing ${idx + 1} of ${totalDrawings}`,
          timestamp: new Date(),
          render: {
            id: item.renderId,
            outputUrl: item.outputUrl,
            status: 'completed' as const,
          } as Render,
          isGenerating: false,
        }));

        setMessagesWithRef([...messages, ...drawingMessages]);
      }

      // Refresh chain
      logger.log('✅ Drawing generation completed, chain will refresh automatically');
    } catch (error) {
      logger.error('❌ Failed to generate drawings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate drawings');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle image to video generation from canvas
  const handleImageToVideo = async (config: ImageToVideoConfig, selectedRenderIds: string[]) => {
    if (selectedRenderIds.length === 0 || isGenerating || isImageGenerating || isVideoGenerating) return;

    // Check credits (video costs more)
    const videoCreditsCost = config.quality === 'ultra' ? 50 : config.quality === 'high' ? 30 : 20;
    if (credits && credits.balance < videoCreditsCost) {
      setIsLowBalanceModalOpen(true);
      return;
    }

    logger.log('🎬 Generating video from canvas selection', {
      config,
      selectedRenderIds,
    });

    // Use first selected render as reference
    const referenceRenderId = selectedRenderIds[0];
    const referenceRender = chain?.renders.find(r => r.id === referenceRenderId);
    
    if (!referenceRender?.outputUrl) {
      toast.error('Selected render image not found');
      return;
    }

    try {
      setIsGenerating(true);

      // ✅ FIXED: Convert CDN URL to direct GCS URL to avoid CORS issues
      const { cdnToDirectGCS, isCDNUrl } = await import('@/lib/utils/cdn-fallback');
      const fetchUrl = isCDNUrl(referenceRender.outputUrl) 
        ? cdnToDirectGCS(referenceRender.outputUrl) 
        : referenceRender.outputUrl;
      
      logger.log('🔄 handleImageToVideo: Fetching image', { 
        original: referenceRender.outputUrl, 
        fetchUrl,
        isCDN: isCDNUrl(referenceRender.outputUrl)
      });
      
      // Fetch the reference image
      const imageResponse = await fetch(fetchUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      const imageBlob = await imageResponse.blob();
      const imageArrayBuffer = await imageBlob.arrayBuffer();
      // Convert ArrayBuffer to base64 in browser (not Node.js Buffer)
      const bytes = new Uint8Array(imageArrayBuffer);
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
      const imageBase64 = btoa(binary);

      // Build video prompt (similar to render-to-video)
      const cameraPathConfigs: Record<string, { description: string }> = {
        'zoom': { description: 'zoom camera movement with smooth zoom in or out' },
        'pan': { description: 'pan camera movement with horizontal or vertical panning' },
        'orbit': { description: 'orbit camera movement circling around the subject' },
        'fly-through': { description: 'fly-through camera movement moving through the space' },
        'arc': { description: 'arc camera movement with curved path' },
      };

      const videoPrompt = `Animate this architectural render with ${cameraPathConfigs[config.cameraPathStyle].description}, using ${config.focalLength === 'as-per-render' ? 'focal length as per the original render' : config.focalLength} focal length, applying ${config.sceneType} scene characteristics, to create a professional walkthrough video.`;

      // Create FormData for video API
      const formData = new FormData();
      formData.append('prompt', videoPrompt);
      formData.append('duration', config.duration.toString());
      formData.append('aspectRatio', config.aspectRatio);
      formData.append('generationType', 'image-to-video');
      formData.append('projectId', projectId || '');
      if (chainId) formData.append('chainId', chainId);
      if (referenceRenderId) formData.append('referenceRenderId', referenceRenderId);
      
      // Add image as uploadedImage (video API expects this for image-to-video)
      const imageFile = new File([imageBlob], 'reference.png', { type: 'image/png' });
      formData.append('uploadedImage', imageFile);

      // Call video API
      const apiUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/video`
        : '/api/video';

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate video');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate video');
      }

      logger.log('✅ Video generated successfully', {
        videoId: result.data?.renderId,
      });

      // Add message to chat
      const videoMessage: Message = {
        id: `video-${Date.now()}`,
        type: 'video',
        content: 'Generated video from image',
        timestamp: new Date(),
        render: result.data?.renderId ? {
          id: result.data.renderId,
          outputUrl: result.data?.outputUrl || '',
          status: 'completed',
        } as Render : undefined,
        isGenerating: false,
      };

      setMessagesWithRef([...messages, videoMessage]);

      // Refresh chain
      logger.log('✅ Video generation completed, chain will refresh automatically');
    } catch (error) {
      logger.error('❌ Failed to generate video:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  // Store routing decision for use in render completion
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating || isImageGenerating || isVideoGenerating) return;

    // ✅ FIXED: Define renderStyle and generationType early so they're accessible throughout the function
    // Use effect as style, or 'realistic' as default (matches createRenderFormData)
    const renderStyle = effect && effect !== 'none' ? effect : 'realistic';
    const generationType = isVideoMode ? 'video' : 'image';

    const effectivePrompt = inputValue;

    // Check credits BEFORE proceeding
    const requiredCredits = getCreditsCost();
    if (credits && credits.balance < requiredCredits) {
      setIsLowBalanceModalOpen(true);
      return;
    }

    logger.log('🔍 Processing message with potential mentions:', effectivePrompt);

    // ✅ CENTRALIZED: Use CentralizedContextService as single source of truth
    const hasNewUploadedImage = !!(uploadedFile && previewUrl);
    const canvasSelectedRenderIds = canvasSelectedRenderIdsRef.current.length > 0 
      ? [...canvasSelectedRenderIdsRef.current] 
      : undefined;
    
    // Clear canvas selection after capturing (will be used by service)
    if (canvasSelectedRenderIds) {
      canvasSelectedRenderIdsRef.current = [];
    }

    // Build unified context using CentralizedContextService
    const contextResult = await buildUnifiedContextAction({
      prompt: effectivePrompt, // Use effective prompt (may be from hybrid routing)
      chainId: chainId || undefined,
      projectId: projectId || undefined,
      canvasSelectedRenderIds,
      useVersionContext: effectivePrompt.includes('@'), // Parse @mentions if present
      useContextPrompt: true, // Enhance with chain context
      usePipelineMemory: true, // Load pipeline memory
    });

    let unifiedContext: UnifiedContext | undefined;
    let finalPrompt = effectivePrompt; // Start with effective prompt from routing
    let referenceRenderId: string | undefined = undefined;
    let versionContext = undefined;

    if (contextResult.success && contextResult.data) {
      unifiedContext = contextResult.data;
      
      // Get final prompt from unified context (client-side helper)
      // Priority: Context prompt > Version context > Effective prompt (from routing) > Original prompt
      if (unifiedContext.contextPrompt?.enhancedPrompt) {
        finalPrompt = unifiedContext.contextPrompt.enhancedPrompt;
      } else if (unifiedContext.versionContext?.parsedPrompt?.userIntent) {
        finalPrompt = unifiedContext.versionContext.parsedPrompt.userIntent;
      } else {
        finalPrompt = effectivePrompt; // Use effective prompt from routing
      }
      
      // Get reference render ID using centralized logic (client-side helper)
      // Priority: Canvas selection > Reference render > Mentioned version > Latest in chain
      if (unifiedContext.canvasContext?.selectedRenderIds?.length > 0) {
        referenceRenderId = unifiedContext.canvasContext.selectedRenderIds[0];
      } else if (unifiedContext.referenceRender?.id) {
        referenceRenderId = unifiedContext.referenceRender.id;
      } else if (!hasNewUploadedImage && unifiedContext.versionContext?.mentionedVersions?.length > 0) {
        const mentionedVersionWithRender = unifiedContext.versionContext.mentionedVersions
          .find(v => v.renderId);
        if (mentionedVersionWithRender?.renderId) {
          referenceRenderId = mentionedVersionWithRender.renderId;
        }
      } else if (!hasNewUploadedImage && chain?.renders && chain.renders.length > 0) {
        const completedRenders = chain.renders.filter(render => render.status === 'completed');
        const latestCompletedRender = completedRenders
          .sort((a, b) => (b.chainPosition || 0) - (a.chainPosition || 0))[0];
        if (latestCompletedRender) {
          referenceRenderId = latestCompletedRender.id;
        }
      }

      // Extract version context for API (backward compatibility)
      if (unifiedContext.versionContext) {
        versionContext = {
          userIntent: unifiedContext.versionContext.parsedPrompt.userIntent,
          mentionedVersions: unifiedContext.versionContext.mentionedVersions.map(v => ({
            renderId: v.renderId,
            context: {
              prompt: v.prompt,
              settings: v.settings,
              imageData: v.imageData,
              metadata: v.metadata
            }
          }))
        };
      }

      logger.log('✅ CentralizedContextService: Unified context built', {
        finalPrompt: finalPrompt.substring(0, 100) + '...',
        referenceRenderId,
        hasVersionContext: !!unifiedContext.versionContext,
        hasContextPrompt: !!unifiedContext.contextPrompt,
        hasPipelineMemory: !!unifiedContext.pipelineMemory,
        hasCanvasContext: !!unifiedContext.canvasContext
      });
    } else {
      logger.warn('⚠️ CentralizedContextService: Failed to build context, using original prompt', contextResult.error);
    }

    // Create user message with image context
    // Declare userMessage outside if block so it's accessible later
    let userMessage: Message | null = null;
    
    {
      userMessage = {
        id: `user-${crypto.randomUUID()}`,
        type: 'user',
        content: inputValue, // Keep original input for display
        timestamp: new Date(),
        uploadedImage: uploadedFile && previewUrl ? {
          file: uploadedFile,
          previewUrl: previewUrl
        } : undefined,
        referenceRenderId: referenceRenderId
      };

      addMessage(userMessage);
      
      // ✅ FIX: Force immediate scroll to show new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 0);
      
      // ✅ NEW: Save render chat message to database (only if content is not empty)
      if (effectiveChainId && projectId && userMessage.content?.trim()) {
        saveChatMessage({
          chainId: effectiveChainId,
          projectId,
          messageType: 'render',
          contentType: 'user',
          content: userMessage.content,
          uploadedImageUrl: userMessage.uploadedImage?.persistedUrl || userMessage.uploadedImage?.previewUrl,
          renderId: referenceRenderId,
        }).catch((error) => {
          // Log but don't block UI - message is already displayed
          logger.error('Failed to save user message to database', error);
        });
      }
      
      setInputValue('');
    }
    
    const currentPrompt = effectivePrompt; // Use effective prompt for image generation
    
    // ✅ PRESERVE: Store uploaded image URL before clearing file (needed for before/after tab)
    const preservedUploadedImageUrl = uploadedFile && previewUrl ? previewUrl : null;
    
    // Clear uploaded file after adding to message
    if (uploadedFile) {
      setUploadedFile(null);
      setGalleryImageUrl(null); // ✅ FIX CORS: Clear gallery URL when clearing file
      // previewUrl is automatically cleared by useObjectURL hook when file is null
    }
    
    setIsGenerating(true);
    setProgress(0);
    onRenderStart?.();

    // Add assistant message with generating state
    const assistantMessage: Message = {
      id: `assistant-${crypto.randomUUID()}`,
      type: 'assistant',
      content: getRenderiqMessage(0, isVideoMode),
      timestamp: new Date(),
      isGenerating: true
    };

    addMessage(assistantMessage);

    // renderStyle and generationType are already defined above (before early returns)
    
    // Track render started
    const startTime = Date.now();
    trackRenderStarted(generationType, renderStyle, quality);
    trackRenderCreditsCost(generationType, quality, requiredCredits);
    
    // Store API error for catch block
    let apiError: string | undefined = undefined;

    try {
      // Use the final prompt directly - Google Generative AI handles optimization
      const enhancedPrompt = finalPrompt;

       // Log generation parameters before sending
       logger.log('🎯 Chat: Sending generation request with parameters:', {
         aspectRatio,
         type: generationType,
         hasUploadedImage: !!(userMessage?.uploadedImage?.file),
         isVideoMode
       });

       // Generate image or video based on mode
       let result;
       
       // Prepare form data for generation
       // Store base64 data separately for retry recreation
       let uploadedImageBase64: string | null = null;
       let styleTransferBase64: string | null = null;
       
       // Pre-process images to base64 (needed for retry logic)
       if (userMessage?.uploadedImage?.file) {
         const reader = new FileReader();
         uploadedImageBase64 = await new Promise<string>((resolve) => {
           reader.onload = (e) => {
             const result = e.target?.result as string;
             resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
           };
           reader.readAsDataURL(userMessage!.uploadedImage!.file!);
         });
       }
       
       if (styleTransferImage) {
         const reader = new FileReader();
         styleTransferBase64 = await new Promise<string>((resolve) => {
           reader.onload = (e) => {
             const result = e.target?.result as string;
             resolve(result.split(',')[1]);
           };
           reader.readAsDataURL(styleTransferImage);
         });
       }
       
       // Helper to create FormData (used for initial request and retries)
       // Note: FormData can only be read once, so we recreate it for retries
       const createFormDataForRequest = () => {
         return createRenderFormData({
           prompt: enhancedPrompt,
           quality,
           aspectRatio,
           type: generationType,
           projectId: projectId || '',
           chainId,
           referenceRenderId,
           versionContext,
           isPublic,
           environment,
           effect,
           temperature,
           model: isVideoMode ? (selectedVideoModel || undefined) : (selectedImageModel || undefined),
           videoDuration: isVideoMode ? videoDuration : undefined,
           videoKeyframes: isVideoMode && videoKeyframes.length > 0 
             ? videoKeyframes.map(kf => ({ imageData: kf.imageData, imageType: kf.imageType }))
             : undefined,
           videoLastFrame: isVideoMode ? videoLastFrame : undefined,
           uploadedImageBase64,
           uploadedImageType: userMessage?.uploadedImage?.file?.type,
           // ✅ FIX CORS: Pass gallery image URL (fetched server-side to avoid CORS)
           uploadedImageUrl: galleryImageUrl || undefined,
           styleTransferBase64,
           styleTransferImageType: styleTransferImage?.type,
         });
       };
        
        // Call the API with absolute URL for mobile compatibility and robust error handling
        const apiUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/renders`
          : '/api/renders';
        
        logger.log('🚀 Chat: Sending render request', {
          url: apiUrl,
          type: generationType,
          hasImage: !!(userMessage?.uploadedImage?.file),
          hasKeyframes: videoKeyframes.length > 0
        });
        
        // Use retryFetch utility with FormData recreation for each attempt
        let response: Response | null = null;
        interface ApiResult {
          success?: boolean;
          data?: Render & { renderId?: string; provider?: string; id?: string };
          error?: string;
          errorJson?: {
            limitReached?: boolean;
            limitType?: string;
            current?: number;
            limit?: number;
            planName?: string;
            error?: string;
          };
          // Limit properties can also be at top level from API
          limitReached?: boolean;
          limitType?: string;
          current?: number;
          limit?: number;
          planName?: string;
        }
        let apiResult: ApiResult | null = null;
        
        try {
          // Retry logic: recreate FormData for each attempt
          let lastError: Error | null = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              logger.log(`🔄 Chat: Attempt ${attempt}/3 to fetch render API`);
              
              // Recreate FormData for each attempt (FormData can only be read once)
              const requestFormData = createFormDataForRequest();
              
              response = await retryFetch(apiUrl, {
                method: 'POST',
                body: requestFormData,
                maxAttempts: 1, // We handle retries manually here
                shouldRetry: () => false, // Disable automatic retry, we handle it manually
              });
              
              // Parse JSON response with error handling
              try {
                apiResult = await response.json();
                break; // Success, exit retry loop
              } catch (jsonError) {
                logger.error('❌ Chat: Failed to parse JSON response:', jsonError);
                const textResponse = await response.text();
                logger.error('❌ Chat: Response text:', textResponse.substring(0, 500));
                throw new Error('Invalid JSON response from server');
              }
              
            } catch (error) {
              lastError = error instanceof Error ? error : new Error(String(error));
              logger.error(`❌ Chat: Fetch attempt ${attempt} failed:`, lastError);
              
              // ✅ FIX: Check for limit errors immediately - don't retry on limit errors
              interface ErrorWithJson extends Error {
                errorJson?: {
                  limitReached?: boolean;
                  limitType?: string;
                  current?: number;
                  limit?: number;
                  planName?: string;
                };
              }
              const errorWithJson = lastError as ErrorWithJson;
              if (errorWithJson.errorJson?.limitReached) {
                // Limit error - don't retry, throw immediately so it's caught by outer catch
                throw lastError;
              }
              
              // If it's a network error and we have attempts left, retry
              const isNetworkError = lastError.message.includes('aborted') || 
                                    lastError.message.includes('timeout') ||
                                    lastError.message.includes('network') ||
                                    lastError.message.includes('Failed to fetch') ||
                                    lastError.message.includes('ERR_');
              
              if (attempt < 3 && isNetworkError) {
                // Wait before retry (exponential backoff)
                logger.log(`⏳ Waiting ${1000 * attempt}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
              } else {
                // Don't retry on other errors or if max attempts reached
                throw lastError;
              }
            }
          }
          
          if (!response || !apiResult) {
            throw new Error('Failed to get response from API');
          }
        } catch (error) {
          // ✅ FIXED: Check if error contains limit error info from retryFetch
          // retryFetch attaches errorJson to the error object when API returns error status
          interface ErrorWithJson extends Error {
            errorJson?: {
              limitReached?: boolean;
              limitType?: string;
              current?: number;
              limit?: number;
              planName?: string;
              error?: string;
            };
            status?: number;
          }
          const errorWithJson = error as ErrorWithJson;
          logger.log('🔍 Chat: Checking error for limit info', {
            hasErrorJson: !!errorWithJson.errorJson,
            limitReached: errorWithJson.errorJson?.limitReached,
            errorMessage: errorWithJson.message,
            status: errorWithJson.status
          });
          
          if (errorWithJson.errorJson?.limitReached) {
            // Extract limit error info and show dialog
            logger.log('⚠️ Chat: Limit reached, opening dialog', {
              limitType: errorWithJson.errorJson.limitType,
              current: errorWithJson.errorJson.current,
              limit: errorWithJson.errorJson.limit,
              planName: errorWithJson.errorJson.planName
            });
            openLimitDialog({
              limitType: (errorWithJson.errorJson.limitType as LimitType) || 'credits',
              current: errorWithJson.errorJson.current || 0,
              limit: errorWithJson.errorJson.limit ?? null,
              planName: errorWithJson.errorJson.planName || 'Free',
              message: errorWithJson.errorJson.error || errorWithJson.message || 'Limit reached',
            });
            // Don't show error toast - dialog handles it
            setIsGenerating(false);
            setProgress(0);
            return; // Exit early - don't proceed with error handling
          }
          
          // Re-throw to be caught by outer catch block
          throw error;
        }
        
        logger.log('🎯 Chat: API response received', {
          success: apiResult.success,
          hasData: !!apiResult.data,
          hasOutputUrl: !!apiResult.data?.outputUrl,
          hasUploadedImageUrl: !!apiResult.data?.uploadedImageUrl,
          error: apiResult.error,
          status: response.status
        });
        
        if (apiResult.success && apiResult.data) {
          // Extract stage events from metadata if available
          if (apiResult.data.metadata?.stageEvents) {
            setStageEvents(apiResult.data.metadata.stageEvents);
          }
          
          result = {
            success: true,
            data: {
              outputUrl: apiResult.data.outputUrl || '',
              processingTime: apiResult.data.processingTime || 0,
              provider: (apiResult.data as Render & { provider?: string }).provider || 'google-generative-ai',
              uploadedImageUrl: apiResult.data.uploadedImageUrl || null,
              uploadedImageKey: apiResult.data.uploadedImageKey || null,
              uploadedImageId: apiResult.data.uploadedImageId || null
            }
          };
        } else {
          // Store error message for catch block
          apiError = apiResult.error || 'Image generation failed';
          
          // ✅ CHECK: Handle limit errors - show limit dialog instead of generic error
          // This handles cases where the API returns OK status but with limitReached in the JSON
          if (apiResult.limitReached) {
            logger.log('⚠️ Chat: Limit reached in API result, opening dialog', {
              limitType: apiResult.limitType,
              current: apiResult.current,
              limit: apiResult.limit,
              planName: apiResult.planName
            });
            openLimitDialog({
              limitType: (apiResult.limitType as LimitType) || 'credits',
              current: apiResult.current || 0,
              limit: apiResult.limit ?? null,
              planName: apiResult.planName || 'Free',
              message: apiError,
            });
            // Don't show error toast for limit errors - dialog handles it
            setIsGenerating(false);
            setProgress(0);
            return; // Exit early - don't proceed with error handling
          }
          
          // Check if it's a Google API error (should refund)
          const isGoogleError = apiError.includes('Google') || 
                                apiError.includes('Gemini') ||
                                apiError.includes('Veo') ||
                                apiError.includes('quota') ||
                                apiError.includes('rate limit');
          
          result = {
            success: false,
            error: apiError,
            isGoogleError // Flag for proper error handling
          };
        }
      
      // Check if generation was successful
      
      // Check if generation was successful
      const resultWithUrls = result as { imageUrl?: string; videoUrl?: string; success?: boolean; data?: { outputUrl?: string } };
      logger.log('🎯 Chat: Checking result', {
        hasResult: !!result,
        hasImageUrl: !!resultWithUrls?.imageUrl,
        hasVideoUrl: !!resultWithUrls?.videoUrl,
        hasSuccess: result?.success,
        hasData: !!result?.data,
        hasOutputUrl: !!result?.data?.outputUrl
      });
      
      if (result && (resultWithUrls.imageUrl || resultWithUrls.videoUrl || (result.success && result.data && result.data.outputUrl))) {
         // Create a new render version for this chat message
         // Use the actual render ID from the API response if available
         const renderId = apiResult.data?.id || apiResult.data?.renderId || `temp-${Date.now()}`;
         
         // ✅ FIX: Validate render ID is not a temp ID (should be real UUID from API)
         if (renderId.startsWith('temp-')) {
           logger.warn('⚠️ Chat: Received temp render ID from API, this may cause sync issues', {
             renderId,
             apiResult: apiResult.data
           });
         }
         
         // ✅ FIX: Preserve uploadedImageUrl from API response or use preserved URL
         // API response has the persisted URL, but if not available, use the preserved previewUrl
         const uploadedImageUrl = apiResult.data?.uploadedImageUrl || preservedUploadedImageUrl || null;
         const outputUrl = result.imageUrl || result.videoUrl || result.data?.outputUrl || '';
         
         // ✅ FIX: Validate outputUrl exists
         if (!outputUrl) {
           logger.error('❌ Chat: No outputUrl in result, render may not display', {
             renderId,
             result,
             apiResult: apiResult.data
           });
         }
         
         const newRender: Render = {
           id: renderId, // Use actual render ID from API
           projectId: projectId || '',
           userId: '',
           type: result.videoUrl ? 'video' : 'image',
          prompt: currentPrompt,
          settings: {
            aspectRatio,
          },
          outputUrl: outputUrl,
          outputKey: apiResult.data?.outputKey || '',
          uploadedImageUrl: uploadedImageUrl,
          uploadedImageKey: apiResult.data?.uploadedImageKey || null,
          uploadedImageId: apiResult.data?.uploadedImageId || null,
          status: 'completed',
          errorMessage: null,
          processingTime: result.processingTime || 0,
          chainId: chainId || null,
          chainPosition: apiResult.data?.chainPosition ?? Math.floor(messages.length / 2), // Use chainPosition from API if available
          referenceRenderId: referenceRenderId || currentRender?.id || null, // Reference to previous version
          creditsCost: getCreditsCost(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
         
         logger.log('✅ Chat: Created render object', {
           renderId: newRender.id,
           outputUrl: newRender.outputUrl ? 'present' : 'missing',
           status: newRender.status,
           chainId: newRender.chainId,
           chainPosition: newRender.chainPosition
         });

        setCurrentRender(newRender);
        onRenderComplete?.(newRender);
        
        // Track render completed
        const duration = Date.now() - startTime;
        trackRenderCompleted(generationType, renderStyle, quality, duration);
        
        // ✅ FIXED: Track recent generation to continue polling after local completion
        // This ensures we catch the render when it appears in the database
        // Store the full render object for better persistence
        recentGenerationRef.current = {
          timestamp: Date.now(),
          renderId: renderId,
          render: newRender // Store render object for persistence
        };
        
        logger.log('✅ Chat: Render created locally, tracking for DB sync', {
          renderId,
          outputUrl: newRender.outputUrl,
          status: newRender.status
        });
        
        // Update the assistant message with the result and render
        updateMessage(assistantMessage.id, {
          content: '',
          isGenerating: false,
          render: newRender
        });
        
        // ✅ FIX: Force immediate scroll to show new render
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
        
        // ✅ NEW: Save assistant message with render to database
        if (effectiveChainId && projectId) {
          saveChatMessage({
            chainId: effectiveChainId,
            projectId,
            messageType: 'render',
            contentType: isVideoMode ? 'video' : 'assistant',
            content: '', // Empty content is allowed for assistant messages with renders
            renderId: newRender.id,
          }).catch((error) => {
            // Log but don't block UI - message is already displayed
            logger.error('Failed to save assistant message to database', error);
          });
        }
        // ✅ REMOVED: messagesRef sync - store is source of truth
        
        // ✅ FIXED: Trigger immediate refresh to sync with database
        // Use multiple staggered refreshes to ensure we catch the render in production
        // Production may have network delays, DB replication lag, or caching issues
        const refreshDelays = [500, 2000, 5000, 10000]; // Progressive delays
        refreshDelays.forEach((delay, index) => {
          setTimeout(() => {
            logger.log(`🔄 Chat: Refresh attempt ${index + 1}/${refreshDelays.length} for render sync`, {
              renderId,
              delay
            });
            throttledRefresh();
          }, delay);
        });

        // Clear uploaded file after successful generation (but keep video mode)
        if (uploadedFile && !isVideoMode) {
          setUploadedFile(null);
          setGalleryImageUrl(null); // ✅ FIX CORS: Clear gallery URL when clearing file
          // previewUrl is automatically cleared by useObjectURL hook when file is null
        }
        // Clear keyframes after successful generation
        if (isVideoMode) {
          setVideoKeyframes([]);
          setVideoLastFrame(null);
        }
      } else {
        throw new Error(`Failed to generate ${generationType} - no result returned`);
      }

    } catch (error) {
      logger.error(`Failed to generate ${generationType}:`, error);
      
      // ✅ FIXED: Check if error contains limit error info from retryFetch
      // retryFetch attaches errorJson to the error object when API returns error status
      const errorWithJson = error as any;
      logger.log('🔍 Chat: Checking outer catch error for limit info', {
        hasErrorJson: !!errorWithJson.errorJson,
        limitReached: errorWithJson.errorJson?.limitReached,
        errorMessage: errorWithJson.message,
        status: errorWithJson.status
      });
      
      if (errorWithJson.errorJson?.limitReached) {
        // Extract limit error info and show dialog
        logger.log('⚠️ Chat: Limit reached in outer catch, opening dialog', {
          limitType: errorWithJson.errorJson.limitType,
          current: errorWithJson.errorJson.current,
          limit: errorWithJson.errorJson.limit,
          planName: errorWithJson.errorJson.planName
        });
        openLimitDialog({
          limitType: errorWithJson.errorJson.limitType || 'credits',
          current: errorWithJson.errorJson.current || 0,
          limit: errorWithJson.errorJson.limit ?? null,
          planName: errorWithJson.errorJson.planName || 'Free',
          message: errorWithJson.errorJson.error || errorWithJson.message || 'Limit reached',
        });
        // Don't show error toast - dialog handles it
        // Update assistant message with error state
        updateMessage(assistantMessage.id, {
          content: getRenderiqMessage(0, isVideoMode, true),
          isGenerating: false
        });
        setIsGenerating(false);
        setProgress(0);
        return; // Exit early - don't proceed with error handling
      }
      
      // Track render failed
      const errorMessage = error instanceof Error ? error.message : String(error);
      trackRenderFailed(generationType, renderStyle, quality, errorMessage);
      
      // Add Sentry context for generation errors
      captureErrorWithContext(error, {
        component: 'UnifiedChatInterface',
        feature: 'generateRender',
        generationType,
        projectId,
        chainId,
        isVideoMode,
      });
      
      // Determine error type for better user messaging
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('network') ||
                            errorMessage.includes('timeout') ||
                            errorMessage.includes('aborted');
      const isGoogleError = errorMessage.includes('Google') || 
                            errorMessage.includes('Gemini') ||
                            errorMessage.includes('Veo') ||
                            errorMessage.includes('quota');
      
      // Update assistant message with error state
      updateMessage(assistantMessage.id, {
        content: isNetworkError
          ? 'Network error. Please check your connection and try again.'
          : isGoogleError
          ? 'Google AI service temporarily unavailable. Please try again in a moment.'
          : getRenderiqMessage(0, isVideoMode, true),
        isGenerating: false
      });
      
      // Show user-friendly error toast
      if (isNetworkError) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (isGoogleError) {
        toast.error('AI service temporarily unavailable. Please try again.');
      } else {
        toast.error(`Failed to generate ${generationType}. Please try again.`);
      }
      
      // Don't reset video mode on error - let user try again
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  
  // Track processed upscaling results to avoid duplicates
  const processedUpscaleResultsRef = useRef<Set<string>>(new Set());
  
  // Handle upscaling result - add as new version in chat
  useEffect(() => {
    if (upscalingResult && upscalingResult.outputUrl) {
      // Check if we've already processed this upscaling result
      if (processedUpscaleResultsRef.current.has(upscalingResult.outputUrl)) {
        logger.log('🎯 Chat: Upscaling result already processed, skipping');
        return;
      }
      
      // Mark as processed
      processedUpscaleResultsRef.current.add(upscalingResult.outputUrl);
      
      logger.log('🎯 Chat: Upscaling completed, adding to chat as new version', upscalingResult);
      
      // Get aspect ratio from current render settings or default
      const renderAspectRatio = currentRender?.settings?.aspectRatio || aspectRatio;
      
      // Create user message for upscale action
      const userMessage: Message = {
        id: `user-upscale-${Date.now()}`,
        type: 'user',
        content: `Upscale ${upscalingResult.scale}x`,
        timestamp: new Date(),
        referenceRenderId: currentRender?.id
      };
      
      // Create assistant message with upscaled render
      const upscaledRender: Render = {
        id: upscalingResult.renderId || `temp-upscale-${Date.now()}`,
        projectId: projectId || '',
        userId: '',
        type: 'image',
        prompt: `Upscale by ${upscalingResult.scale}x`,
        settings: {
          aspectRatio: renderAspectRatio,
          quality: 'high'
        },
        outputUrl: upscalingResult.outputUrl,
        outputKey: '',
        uploadedImageUrl: null,
        uploadedImageKey: null,
        uploadedImageId: null,
        status: 'completed',
        errorMessage: null,
        processingTime: upscalingResult.processingTime,
        chainId: chainId || null,
        chainPosition: 0, // Will be set correctly when chain is refreshed
        referenceRenderId: currentRender?.id || null,
        creditsCost: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const assistantMessage: Message = {
        id: `assistant-upscale-${Date.now()}`,
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        render: upscaledRender,
        isGenerating: false
      };
      
      // Add messages to chat
      const alreadyExists = messages.some(msg =>
        msg.render?.outputUrl === upscalingResult.outputUrl
      );
      if (!alreadyExists) {
        addMessage(userMessage);
        addMessage(assistantMessage);
      }
      
      // Update current render to the upscaled version
      setCurrentRender(upscaledRender);
      onRenderComplete?.(upscaledRender);
      
      // Scroll to bottom to show new upscaled version
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [upscalingResult, projectId, chainId, currentRender, aspectRatio, onRenderComplete]);

  // ✅ FIX: Early return AFTER all hooks are declared (prevents Rules of Hooks violation)
  // Don't render until mounted (prevents SSR hydration mismatches)
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
      {/* Mobile View Toggle - Only visible on mobile/tablet */}
      <div className="lg:hidden border-b border-border bg-background sticky top-0 z-40 shrink-0">
        <div className="px-4 py-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToProjects}
            className="h-8"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
            <div className="text-center flex-1">
            <h1 className="text-sm font-semibold">{projectName}</h1>
          </div>
          <div className="relative">
            {/* Background track */}
            <div className="w-32 h-9 bg-muted rounded-lg p-1 flex">
              <button
                onClick={() => setMobileView('chat')}
                className={cn(
                  "flex-1 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-background/50 relative z-20",
                  mobileView === 'chat' && "bg-background shadow-sm"
                )}
                title="Render"
              >
                <span className={cn(
                  "flex items-center gap-1 transition-colors duration-200 text-xs",
                  mobileView === 'chat' ? "text-primary" : "text-muted-foreground"
                )}>
                  <MessageSquare className="h-3 w-3" />
                  <span>Render</span>
                </span>
              </button>
              <button
                onClick={() => setMobileView('render')}
                className={cn(
                  "flex-1 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-background/50 relative z-20",
                  mobileView === 'render' && "bg-background shadow-sm"
                )}
                title="Result"
              >
                <span className={cn(
                  "flex items-center gap-1 transition-colors duration-200 text-xs",
                  mobileView === 'render' ? "text-primary" : "text-muted-foreground"
                )}>
                  <ImageIcon className="h-3 w-3" />
                  <span>Result</span>
                </span>
              </button>
            </div>
            
            {/* Sliding indicator - positioned behind the selected button */}
            <div 
              className={cn(
                "absolute top-1 w-[calc(50%-0.125rem)] h-7 bg-background/80 border border-border rounded-md shadow-sm transition-all duration-200 pointer-events-none z-0",
                mobileView === 'chat' ? "left-1" : "right-1"
              )}
            />
          </div>
        </div>
      </div>

      {/* Render Area - Responsive width */}
      <div className={cn(
        "border-r border-border flex flex-col overflow-hidden transition-all duration-300 min-h-0",
        "w-full flex-1",
        isSidebarCollapsed ? "lg:w-0 lg:border-r-0 lg:overflow-hidden lg:flex-none lg:flex-shrink-0" : "lg:w-1/4 lg:flex-none lg:flex-shrink-0",
        // Mobile: show/hide based on mobileView
        mobileView === 'chat' ? 'flex' : 'hidden lg:flex'
      )}>
        {/* Header - Desktop only */}
        <div className={cn(
          "hidden lg:block border-b border-border",
          isSidebarCollapsed && "lg:hidden"
        )}>
          <div className="px-4 py-1.5 h-11 flex items-center">
            <div className="flex items-center justify-between gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToProjects}
                className="justify-start h-8 px-2 w-fit shrink-0"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
              <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
                {projects && chains && projects.length > 0 && chains.length > 0 && projects.some(p => chains.some(c => c.projectId === p.id)) ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-sm font-semibold hover:bg-accent"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-right min-w-0">
                            <div className="truncate">{projectName}</div>
                            {chainName && (
                              <div className="text-xs text-muted-foreground truncate">{chainName}</div>
                            )}
                          </div>
                          <ChevronDown className="h-3 w-3 shrink-0" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 max-h-[400px] overflow-y-auto">
                      {projects
                        .filter(project => chains.some(c => c.projectId === project.id))
                        .map((project) => {
                          const projectChains = chains.filter(c => c.projectId === project.id);
                          if (projectChains.length === 0) return null;
                          
                          return (
                            <div key={project.id}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                                {project.name}
                              </div>
                              {projectChains.map((chainItem) => {
                                const isSelected = chainItem.id === chainId && project.id === projectId;
                                return (
                                  <DropdownMenuItem
                                    key={chainItem.id}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      router.push(`/project/${project.slug}/chain/${chainItem.id}`);
                                    }}
                                    className={cn(
                                      "px-2 py-1.5 cursor-pointer",
                                      isSelected && "bg-accent"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                                      <span className="text-sm truncate flex-1">{chainItem.name}</span>
                                      {isSelected && (
                                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                                      )}
                                    </div>
                                  </DropdownMenuItem>
                                );
                              })}
                            </div>
                          );
                        })}
                      {projects.filter(project => chains.some(c => c.projectId === project.id)).length === 0 && (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          No chats available
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="text-right flex-1 min-w-0">
                    <h1 className="text-sm font-semibold truncate">{projectName}</h1>
                    {chainName && (
                      <p className="text-xs text-muted-foreground truncate">{chainName}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages - Unified interface (no tabs) */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-1 sm:p-1 space-y-1 sm:space-y-1 min-h-0 m-0">
          {messages.length === 0 ? (
            <div className="max-w-4xl mx-auto p-4 sm:p-2 space-y-2">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-1 mb-6">
                  <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">Welcome to Renderiq Chat</h2>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Learn about all the powerful settings and controls available to create stunning renders
                </p>
              </div>

              {/* Tutorial Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2">
                {/* Model Selector */}
                <Card className="p-4">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-xs sm:text-sm">Model Selector</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Select AI model for images/videos. Different capabilities, quality, and costs. Auto-filters by mode.
                    </p>
                  </CardContent>
                </Card>

                {/* Mode Toggle */}
                <Card className="p-4">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-xs sm:text-sm">Mode Toggle</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Toggle between Image (static) and Video (animated) modes.
                    </p>
                  </CardContent>
                </Card>

                {/* Environment */}
                <Card className="p-4">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-xs sm:text-sm">Environment</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Set weather/lighting: Sunny, Overcast, Rainy, Sunset, Sunrise, Night, Foggy, Cloudy.
                    </p>
                  </CardContent>
                </Card>

                {/* Effect */}
                <Card className="p-4">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-xs sm:text-sm">Effect</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Visual style: Wireframe, Photoreal, Illustration, Sketch, Watercolor, Line Art, Concept Art, Architectural, Technical.
                    </p>
                  </CardContent>
                </Card>

                {/* Temperature */}
                <Card className="p-4">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-xs sm:text-sm">Temperature</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Creativity: 0 = consistent, 1 = varied. Default 0.5.
                    </p>
                  </CardContent>
                </Card>

                {/* Quality */}
                <Card className="p-4">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-xs sm:text-sm">Quality</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Standard (1K): 5 credits | High (2K): 10 credits | Ultra (4K): 15 credits. Options vary by model.
                    </p>
                  </CardContent>
                </Card>

                {/* Style Transfer */}
                <Card className="p-4">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-xs sm:text-sm">Style Reference</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Upload image to transfer its style to your render.
                    </p>
                  </CardContent>
                </Card>

                {/* Privacy Toggle */}
                <Card className="p-4">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-xs sm:text-sm">Privacy Toggle</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Public: Visible to others (Free default). Private: Only you (Pro feature).
                    </p>
                  </CardContent>
                </Card>

                {/* Gallery & Builder */}
                <Card className="p-4">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-xs sm:text-sm">Gallery & Builder</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Prompts: Browse examples. Builder: Create structured prompts.
                    </p>
                  </CardContent>
                </Card>

                {/* Upload & Mentions */}
                <Card className="p-4">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-xs sm:text-sm">Upload & Mentions</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Upload: Attach reference images or animate in video mode. @ Mentions: Type @ to reference previous renders.
                    </p>
                  </CardContent>
                </Card>

                {/* Quick Start */}
                <Card className="p-4 bg-primary/5 border-primary/20 md:col-span-2">
                  <CardContent className="p-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-base sm:text-lg">Ready to Start?</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Type your prompt, adjust settings, and click Generate. Refine renders in the conversation.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            ) : (
              (() => {
                const userMessages = messages.filter(m => m.type === 'user');
                const assistantMessages = messages.filter(m => m.type === 'assistant');
                
                logger.log('🎨 UnifiedChatInterface: Rendering messages list', {
                  totalMessages: messages.length,
                  userMessages: userMessages.length,
                  assistantMessages: assistantMessages.length,
                  messageIds: messages.map(m => ({ id: m.id, type: m.type, hasRender: !!m.render })),
                  userMessageDetails: userMessages.map(m => ({
                    id: m.id,
                    type: m.type,
                    content: m.content?.substring(0, 50) || '(empty)',
                    hasContent: !!m.content && m.content.length > 0,
                    hasRender: !!m.render,
                    referenceRenderId: m.referenceRenderId,
                    timestamp: m.timestamp
                  })),
                  allMessageDetails: messages.map(m => ({
                    id: m.id,
                    type: m.type,
                    content: m.content?.substring(0, 30) + '...',
                    hasContent: !!m.content && m.content.length > 0,
                    hasRender: !!m.render,
                    renderId: m.render?.id,
                    renderStatus: m.render?.status,
                    timestamp: m.timestamp
                  }))
                });
                
                // ✅ DEBUG: Warn if user messages exist but might not render
                if (userMessages.length > 0) {
                  logger.log('✅ UnifiedChatInterface: User messages found, should render', {
                    count: userMessages.length,
                    firstUserMessage: {
                      id: userMessages[0].id,
                      content: userMessages[0].content?.substring(0, 50) || '(empty)',
                      hasContent: !!userMessages[0].content && userMessages[0].content.length > 0,
                    }
                  });
                } else {
                  logger.warn('⚠️ UnifiedChatInterface: NO USER MESSAGES FOUND in messages array!', {
                    totalMessages: messages.length,
                    assistantMessages: assistantMessages.length,
                  });
                }
                
                if (messages.length === 0) {
                  logger.warn('⚠️ UnifiedChatInterface: Messages array is EMPTY - nothing to render!');
                  return <div className="text-center text-muted-foreground mt-8">No messages to display</div>;
                }
                
                return messages.map((message, index) => {
                // Removed verbose per-message logging for performance
                // Logger is production-safe, but too many logs slow down rendering
              
                // ✅ FIX: Ensure timestamp is a Date object (may be string from localStorage/Zustand)
                const messageTimestamp = message.timestamp instanceof Date 
                  ? message.timestamp 
                  : new Date(message.timestamp);
                
                return (
                <div
                  key={`${message.id}-${messageTimestamp.getTime()}`}
                  className={cn(
                    'flex flex-col',
                    message.type === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                {/* Sender name above message */}
                <div className={cn(
                  'text-[10px] sm:text-xs text-muted-foreground mb-1 px-1',
                  message.type === 'user' ? 'text-right' : 'text-left flex items-center gap-1.5'
                )}>
                  {message.type === 'assistant' && (
                    <>
                      <div className="relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src="/logo.svg"
                          alt="Renderiq"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span>Renderiq</span>
                    </>
                  )}
                  {message.type === 'user' && 'You'}
                </div>
                
                <div
                  className={cn(
                    'max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3',
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground animate-in slide-in-from-right-5 duration-300'
                      : 'bg-muted animate-in slide-in-from-left-5 duration-300',
                    // Allow assistant messages with renders to be wider, but ensure no overflow
                    message.type === 'assistant' && message.render && 'max-w-[98%] sm:max-w-[95%]',
                    // Ensure container respects parent width
                    'w-full min-w-0 overflow-hidden'
                  )}
                >
                  {/* Only show copy/edit buttons for user messages */}
                  {message.type === 'user' ? (
                    <div className="flex items-start justify-between gap-2 group">
                      <div className="flex-1">
                        {/* ✅ FIX: Ensure user message content is displayed, even if empty */}
                        {message.content && message.content.trim() ? (
                        <TruncatedMessage 
                          content={message.content} 
                          className="text-xs sm:text-sm" 
                          maxLines={4}
                        />
                        ) : (
                          <p className="text-xs sm:text-sm italic text-muted-foreground">
                            (Empty message)
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(message.content);
                            toast.success('Message copied to clipboard');
                          }}
                          className="h-6 w-6 p-0"
                          title="Copy message"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setInputValue(message.content);
                            toast.info('Message loaded into input. Modify and send.');
                          }}
                          className="h-6 w-6 p-0"
                          title="Edit and resend"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <TruncatedMessage 
                      content={message.content} 
                      className="text-xs sm:text-sm" 
                      maxLines={4}
                    />
                  )}
                  
                  {/* Show uploaded image in user message - same size as generated image */}
                  {message.uploadedImage && message.uploadedImage.previewUrl && (
                    <div className="mt-2 w-full max-w-full overflow-hidden">
                      <div className="relative w-full max-w-full aspect-video rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-muted/20 border border-white/20 group"
                        onClick={() => {
                          // Open fullscreen dialog
                          setFullscreenImageUrl(message.uploadedImage!.previewUrl);
                          setIsFullscreen(true);
                        }}
                      >
                        {shouldUseRegularImg(message.uploadedImage.previewUrl) ? (
                          <img
                            src={message.uploadedImage.previewUrl}
                            alt="Uploaded image"
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const originalUrl = message.uploadedImage!.previewUrl;
                              console.error('Uploaded image load error:', originalUrl);
                              logger.error('Failed to load uploaded image:', originalUrl);
                              
                              // Try CDN fallback to direct GCS URL
                              const fallbackUrl = handleImageErrorWithFallback(originalUrl, e);
                              if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                                console.log('Trying fallback to direct GCS URL:', fallbackUrl);
                                img.src = fallbackUrl;
                              } else {
                                // No fallback available, use placeholder
                                img.src = '/placeholder-image.jpg';
                              }
                            }}
                          />
                        ) : (
                          <Image
                            src={message.uploadedImage.previewUrl}
                            alt="Uploaded image"
                            fill
                            className="object-cover"
                          />
                        )}
                        {/* Fullscreen indicator on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-white/70 mt-1">
                        {message.uploadedImage.persistedUrl ? 'Using uploaded image' : 'Working with uploaded image'}
                      </p>
                    </div>
                  )}
                  
                  {/* Show image generation placeholder if message has render */}
                  {message.isGenerating && message.render && (
                    <div className="mt-3 space-y-3">
                      {/* Image skeleton with proper aspect ratio */}
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse">
                        {/* Gleaming shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
                          style={{
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2s infinite'
                          }}
                        />
                        {/* Progress indicator overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 backdrop-blur-sm">
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  )}
                  {message.render && (
                    <div className="mt-2 w-full max-w-full overflow-hidden">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Version {getVersionNumber(message.render, chain?.renders) || index + 1}</span>
                      </div>
                      {/* Display thought signatures if available */}
                      {message.render.metadata?.thoughtSummaries && message.render.metadata.thoughtSummaries.length > 0 && (
                        <div className="mb-2 p-2 bg-muted/50 border border-border rounded-md">
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] text-muted-foreground font-medium">💭 Thinking:</span>
                            <div className="flex-1 space-y-1">
                              {message.render.metadata.thoughtSummaries.map((thought, idx) => (
                                <p key={idx} className="text-[10px] text-muted-foreground leading-tight">
                                  {thought}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="relative w-full max-w-full aspect-video rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-muted animate-in fade-in-0 zoom-in-95 duration-500 group"
                        onClick={(e) => {
                          // Open fullscreen on click
                          if (message.render!.outputUrl) {
                            setFullscreenImageUrl(message.render!.outputUrl);
                            setIsFullscreen(true);
                          }
                        }}
                        onDoubleClick={(e) => {
                          // Double-click to open render view
                          e.stopPropagation();
                          // ✅ SIMPLIFIED: Get render from chain.renders (single source of truth)
                          const renderToSet = getRenderById(chain?.renders, message.render!.id) || message.render!;
                          userSelectedRenderIdRef.current = renderToSet.id;
                          setCurrentRender(renderToSet);
                          setMobileView('render');
                          
                          // If it's a video, switch to video mode on render tab
                          if (renderToSet?.type === 'video') {
                            setIsVideoMode(true);
                            // Load the video as uploaded file for further editing
                            if (message.render.outputUrl) {
                              // Fetch video and convert to File object
                              fetch(message.render.outputUrl)
                                .then(response => response.blob())
                                .then(blob => {
                                  const file = new File([blob], `video-${Date.now()}.mp4`, { type: 'video/mp4' });
                                  setUploadedFile(file);
                                  // previewUrl is automatically managed by useObjectURL hook
                                })
                                .catch(error => {
                                  logger.error('Failed to load video for editing:', error);
                                });
                            }
                          }
                        }}
                      >
                        {/* Fullscreen indicator on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none z-10">
                          <Maximize className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {message.render.type === 'video' ? (
                          message.render.outputUrl ? (
                            <video
                              key={message.render.id + '-' + message.render.outputUrl} // ✅ FIXED: Key ensures re-render when URL changes
                              src={message.render.outputUrl}
                              className="w-full h-full object-cover"
                              controls
                              loop
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                              <Video className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )
                        ) : message.render.outputUrl ? (
                          // ✅ FIXED: Use regular img tag for external storage URLs to avoid Next.js 16 private IP blocking
                          // Key prop ensures re-render when outputUrl changes
                          shouldUseRegularImg(message.render.outputUrl) ? (
                            <img
                              key={message.render.id + '-' + message.render.outputUrl} // ✅ FIXED: Key ensures re-render when URL changes
                              src={message.render.outputUrl || '/placeholder-image.jpg'}
                              alt="Generated render"
                              className="absolute inset-0 w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const originalUrl = message.render.outputUrl;
                                console.error('Image load/decode error:', originalUrl);
                                logger.error('Failed to load/decode image:', originalUrl);
                                
                                // Prevent infinite error loop
                                if (img.src.includes('placeholder-image.jpg')) {
                                  return;
                                }
                                
                                // Try CDN fallback to direct GCS URL
                                const fallbackUrl = handleImageErrorWithFallback(originalUrl, e);
                                if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                                  console.log('Trying fallback to direct GCS URL:', fallbackUrl);
                                  img.src = fallbackUrl;
                                } else {
                                  // No fallback available, use placeholder
                                  img.src = '/placeholder-image.jpg';
                                  img.onerror = null; // Prevent infinite loop
                                }
                              }}
                              onLoad={(e) => {
                                // Clear any error state on successful load
                                const img = e.target as HTMLImageElement;
                                img.style.opacity = '1';
                              }}
                            />
                          ) : message.render.outputUrl ? (
                            <Image
                              key={message.render.id + '-' + message.render.outputUrl} // ✅ FIXED: Key ensures re-render when URL changes
                              src={message.render.outputUrl}
                              alt="Generated render"
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 95vw"
                              loading="lazy"
                              onError={(e) => {
                                console.error('Image load error:', message.render.outputUrl);
                                logger.error('Failed to load image:', message.render.outputUrl);
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {/* No action buttons in assistant message bubble - removed per user request */}
                    </div>
                  )}
                </div>
                </div>
                );
              });
              })()
            )}
          <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className={cn(
          "p-2 sm:p-2 border-t border-border flex-shrink-0 bg-background",
          isSidebarCollapsed && "lg:hidden"
        )}>
          <div className="space-y-1">
            {/* Uploaded Image Attachment */}
            {uploadedFile && previewUrl && (
              <div className="relative inline-block mb-1 sm:mb-2">
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 bg-muted rounded-lg overflow-hidden border border-border">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Uploaded attachment"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 p-0 rounded-full"
                    onClick={removeFile}
                  >
                    <X className="h-2 w-2 sm:h-3 sm:w-3" />
                  </Button>
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 text-center truncate max-w-[80px] sm:max-w-none">
                  {uploadedFile.name}
                </div>
              </div>
            )}
            
            <div>
              {/* Video Mode Badge - Above prompt box */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  {isVideoMode && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 sm:px-2 py-0.5 flex items-center gap-1 shrink-0">
                      <Video className="h-3 w-3" />
                      <span className="hidden xs:inline">Video Mode</span>
                      <span className="xs:hidden">Video</span>
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-1 sm:gap-2">
                <div className="relative flex-1 flex flex-col">
                  {/* Detected Mentions - Inside textarea container */}
                  {inputValue.includes('@') && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {inputValue.match(/@[\w\s]+/g)?.map((mention, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 bg-primary/10 text-primary border border-primary/20 px-1.5 sm:px-2 py-0.5"
                        >
                          <Sparkles className="h-2 w-2 sm:h-3 sm:w-3" />
                          {mention}
                          <span className="text-[8px] sm:text-[10px] opacity-70">(context)</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      isVideoMode 
                        ? "Describe how you want to animate this image..." 
                        : "Describe your vision..."
                    }
                    className={cn(
                      "h-[60px] sm:h-[70px] resize-none w-full text-xs sm:text-sm",
                      isVideoMode && "border-primary/50 bg-primary/5"
                    )}
                    disabled={isGenerating}
                  />
                  <MentionTagger
                    isOpen={isMentionTaggerOpen}
                    onClose={handleMentionTaggerClose}
                    onMentionSelect={handleMentionSelect}
                    searchTerm={mentionSearchTerm}
                    renders={chain?.renders}
                  />
                </div>
                <div className="flex flex-col gap-1">
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isGenerating || (credits && credits.balance < getCreditsCost())}
                  className="h-8 sm:h-9 shrink-0 px-2 sm:px-3"
                  size="sm"
                >
                  {credits && credits.balance < getCreditsCost() ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                      <span className="text-xs sm:text-sm">Generate</span>
                    </>
                  ) : (
                    <>
                       {isGenerating ? (
                         <>
                           <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-1.5" />
                           <span className="text-xs sm:text-sm">Generating...</span>
                         </>
                       ) : (
                         <>
                           <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                           <span className="text-xs sm:text-sm">Generate</span>
                         </>
                       )}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadModalOpen}
                  className="h-8 sm:h-9 shrink-0 px-2 sm:px-3"
                  disabled={isGenerating}
                  title="Upload image"
                >
                  <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                  <span className="text-xs sm:text-sm">Upload</span>
                </Button>
              </div>
              </div>
            </div>
            
             {/* Style Settings - 2 columns: Environment/Temperature (3/4) and Style Transfer (1/4) */}
             <div>
               <div className="flex gap-1.5 sm:gap-2 items-stretch">
                 {/* Left Column: Environment/Effect and Temperature (3/4 width, 2 rows) */}
                 <div className="flex-[3] flex flex-col gap-1.5 sm:gap-2">
                  {/* Row 1: Video Mode Toggle, Environment and Effect dropdowns */}
                  <div className="flex gap-1.5 sm:gap-2 items-start">
                    {/* Video Mode Toggle - Icon only, compact */}
                    <div className="space-y-0.5 flex flex-col">
                      <div className="flex items-center gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label className="text-[10px] sm:text-xs font-medium cursor-help">Mode</Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Switch between image and video generation modes</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex gap-0.5 border rounded p-0.5">
                        <Button
                          variant={!isVideoMode ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setIsVideoMode(false)}
                          className={cn(
                            "h-6 sm:h-7 w-6 sm:w-7 p-0",
                            !isVideoMode && "bg-primary text-primary-foreground"
                          )}
                          title="Image Mode"
                        >
                          <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant={isVideoMode ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setIsVideoMode(true)}
                          className={cn(
                            "h-6 sm:h-7 w-6 sm:w-7 p-0",
                            isVideoMode && "bg-primary text-primary-foreground"
                          )}
                          title="Video Mode"
                        >
                          <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Environment Dropdown */}
                    <div className="space-y-1 flex flex-col flex-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-[10px] sm:text-xs font-medium">Environment</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Set the weather and lighting conditions (sunny, rainy, sunset, etc.)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select value={environment} onValueChange={setEnvironment}>
                        <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs w-full">
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-[10px] sm:text-xs">None</SelectItem>
                          <SelectItem value="sunny" className="text-[10px] sm:text-xs">Sunny</SelectItem>
                          <SelectItem value="overcast" className="text-[10px] sm:text-xs">Overcast</SelectItem>
                          <SelectItem value="rainy" className="text-[10px] sm:text-xs">Rainy</SelectItem>
                          <SelectItem value="sunset" className="text-[10px] sm:text-xs">Sunset</SelectItem>
                          <SelectItem value="sunrise" className="text-[10px] sm:text-xs">Sunrise</SelectItem>
                          <SelectItem value="night" className="text-[10px] sm:text-xs">Night</SelectItem>
                          <SelectItem value="foggy" className="text-[10px] sm:text-xs">Foggy</SelectItem>
                          <SelectItem value="cloudy" className="text-[10px] sm:text-xs">Cloudy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Effect Dropdown */}
                    <div className="space-y-1 flex flex-col flex-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-[10px] sm:text-xs font-medium">Effect</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Choose visualization style and rendering mode</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select value={effect} onValueChange={setEffect}>
                        <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs w-full">
                          <SelectValue placeholder="Select effect" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-[10px] sm:text-xs">None</SelectItem>
                          <SelectItem value="wireframe" className="text-[10px] sm:text-xs">Wireframe</SelectItem>
                          <SelectItem value="photoreal" className="text-[10px] sm:text-xs">Photoreal</SelectItem>
                          <SelectItem value="illustration" className="text-[10px] sm:text-xs">Illustration</SelectItem>
                          <SelectItem value="sketch" className="text-[10px] sm:text-xs">Sketch</SelectItem>
                          <SelectItem value="watercolor" className="text-[10px] sm:text-xs">Watercolor</SelectItem>
                          <SelectItem value="line-art" className="text-[10px] sm:text-xs">Line Art</SelectItem>
                          <SelectItem value="concept-art" className="text-[10px] sm:text-xs">Concept Art</SelectItem>
                          <SelectItem value="architectural-drawing" className="text-[10px] sm:text-xs">Architectural Drawing</SelectItem>
                          <SelectItem value="technical-drawing" className="text-[10px] sm:text-xs">Technical Drawing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Temperature/Quality or Video Duration/Quality Row */}
                  <div className="space-y-1 flex flex-col">
                    {isVideoMode ? (
                      <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                        {/* Video Duration - 1/2 width */}
                        <div className="flex-1 space-y-0.5 flex flex-col">
                          <div className="flex items-center gap-0.5">
                            <Label className="text-[10px] sm:text-xs font-medium">Duration</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Duration of the generated video (4, 6, or 8 seconds)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select value={videoDuration.toString()} onValueChange={(value) => setVideoDuration(parseInt(value) as 4 | 6 | 8)}>
                            <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4" className="text-[10px] sm:text-xs">4s</SelectItem>
                              <SelectItem value="6" className="text-[10px] sm:text-xs">6s</SelectItem>
                              <SelectItem value="8" className="text-[10px] sm:text-xs">8s</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Quality - 1/2 width */}
                        <div className="flex-1 space-y-0.5 flex flex-col">
                          <div className="flex items-center gap-0.5">
                            <Label className="text-[10px] sm:text-xs font-medium">Quality</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-medium">Video Quality</p>
                                  <p className="text-xs">30 credits/second</p>
                                  <p className="text-xs">4s: 120 | 5s: 150 | 8s: 240 credits</p>
                                  <p className="text-xs mt-2 pt-2 border-t">
                                    Current cost: {getCreditsCostText()} ({videoDuration}s)
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select value={quality} onValueChange={setQuality}>
                            <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard" className="text-[10px] sm:text-xs">Standard</SelectItem>
                              <SelectItem value="high" className="text-[10px] sm:text-xs">High</SelectItem>
                              <SelectItem value="ultra" className="text-[10px] sm:text-xs">Ultra</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                        {/* Temperature - 3/4 width */}
                        <div className="flex-[3] space-y-0.5 flex flex-col">
                          <div className="flex items-center gap-0.5">
                            <Label className="text-[10px] sm:text-xs font-medium">Temperature</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Control creativity: 0 = strict/deterministic, 1 = creative/random</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <ToggleGroup
                            type="single"
                            value={temperature}
                            onValueChange={(value) => {
                              if (value) setTemperature(value);
                            }}
                            className="h-6 sm:h-7 w-full"
                            variant="outline"
                            size="sm"
                          >
                            <ToggleGroupItem value="0" aria-label="0" className="flex-1 text-[10px] sm:text-xs">
                              0
                            </ToggleGroupItem>
                            <ToggleGroupItem value="0.25" aria-label="0.25" className="flex-1 text-[10px] sm:text-xs">
                              0.25
                            </ToggleGroupItem>
                            <ToggleGroupItem value="0.5" aria-label="0.5" className="flex-1 text-[10px] sm:text-xs">
                              0.5
                            </ToggleGroupItem>
                            <ToggleGroupItem value="0.75" aria-label="0.75" className="flex-1 text-[10px] sm:text-xs">
                              0.75
                            </ToggleGroupItem>
                            <ToggleGroupItem value="1" aria-label="1" className="flex-1 text-[10px] sm:text-xs">
                              1
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                        
                        {/* Quality - 1/4 width */}
                        <div className="flex-[1] space-y-0.5 flex flex-col">
                          <div className="flex items-center gap-0.5">
                            <Label className="text-[10px] sm:text-xs font-medium">Quality</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-medium">Image Quality</p>
                                  <p className="text-xs">Standard: 5 credits (fast)</p>
                                  <p className="text-xs">High: 10 credits (balanced)</p>
                                  <p className="text-xs">Ultra: 15 credits (best quality)</p>
                                  <p className="text-xs mt-2 pt-2 border-t">
                                    Current cost: {getCreditsCostText()}
                                  </p>
                                  {selectedImageModel && (
                                    <p className="text-xs mt-1 pt-1 border-t">
                                      Model supports: {getSupportedResolutions(selectedImageModel as ModelId).join(', ')}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select 
                            value={quality} 
                            onValueChange={(v) => {
                              // Validate quality is supported by selected model
                              if (selectedImageModel) {
                                const modelId = selectedImageModel as ModelId;
                                if (modelSupportsQuality(modelId, v as 'standard' | 'high' | 'ultra')) {
                                  setQuality(v as 'standard' | 'high' | 'ultra');
                                } else {
                                  toast.error(`This quality is not supported by the selected model. Maximum quality: ${getMaxQuality(modelId)}`);
                                }
                              } else {
                                setQuality(v as 'standard' | 'high' | 'ultra');
                              }
                            }}
                          >
                            <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem 
                                value="standard" 
                                className="text-[10px] sm:text-xs"
                                disabled={selectedImageModel ? !modelSupportsQuality(selectedImageModel as ModelId, 'standard') : false}
                              >
                                Standard (1K)
                              </SelectItem>
                              <SelectItem 
                                value="high" 
                                className="text-[10px] sm:text-xs"
                                disabled={selectedImageModel ? !modelSupportsQuality(selectedImageModel as ModelId, 'high') : false}
                              >
                                High (2K)
                              </SelectItem>
                              <SelectItem 
                                value="ultra" 
                                className="text-[10px] sm:text-xs"
                                disabled={selectedImageModel ? !modelSupportsQuality(selectedImageModel as ModelId, 'ultra') : false}
                              >
                                Ultra (4K)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {selectedImageModel && (
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              Supported: {getSupportedResolutions(selectedImageModel as ModelId).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                 {/* Right Column: Style Transfer (1/4 width, matches combined height) */}
                 <div className="flex-[1] flex flex-col">
                   <div className="flex items-center gap-0.5 mb-0.5">
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Label className="text-[10px] sm:text-xs font-medium whitespace-nowrap cursor-help">Style Ref</Label>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>Upload an image to transfer its style to your generated image</p>
                       </TooltipContent>
                     </Tooltip>
                   </div>
                   <div className="relative w-full flex-1 min-h-0">
                    {styleTransferImage ? (
                      <>
                        <div className="h-full w-full rounded border overflow-hidden cursor-pointer relative" onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              setStyleTransferImage(file);
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setStyleTransferPreview(e.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}>
                          {styleTransferPreview ? (
                            <Image
                              src={styleTransferPreview}
                              alt="Style transfer"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-muted">
                              <Upload className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStyleTransferImage(null);
                            setStyleTransferPreview(null);
                          }}
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-full w-full p-0"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              setStyleTransferImage(file);
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setStyleTransferPreview(e.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        title="Upload style reference image"
                      >
                        <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                     </div>
                 </div>
               </div>
             </div>

             {/* Video Keyframe Timeline - Only show in video mode */}
             {isVideoMode && (
               <div className="mt-2 border-t pt-2">
                 <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                   {/* Start Frame (First Frame) */}
                   <div className="flex-1 space-y-0.5 flex flex-col">
                     <div className="flex items-center gap-0.5">
                       <Label className="text-[10px] sm:text-xs font-medium">Start</Label>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <HelpCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground cursor-help" />
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>First frame of the video (from uploaded image)</p>
                         </TooltipContent>
                       </Tooltip>
                     </div>
                     <div className="relative w-full aspect-square rounded border overflow-hidden bg-muted max-w-[75%] mx-auto">
                       {previewUrl ? (
                         <Image
                           src={previewUrl}
                           alt="Start frame"
                           fill
                           className="object-cover"
                         />
                       ) : (
                         <div className="h-full w-full flex items-center justify-center">
                           <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                         </div>
                       )}
                     </div>
                   </div>

                   {/* Keyframes (up to 3) */}
                   {[0, 1, 2].map((index) => {
                     const keyframe = videoKeyframes[index];
                     return (
                       <div key={index} className="flex-1 space-y-0.5 flex flex-col">
                         <div className="flex items-center gap-0.5">
                           <Label className="text-[10px] sm:text-xs font-medium">K{index + 1}</Label>
                           {keyframe && (
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => {
                                     setVideoKeyframes(videoKeyframes.filter(kf => kf.id !== keyframe.id));
                                   }}
                                   className="h-3 w-3 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 >
                                   <X className="h-2 w-2" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>
                                 <p>Remove keyframe {index + 1}</p>
                               </TooltipContent>
                             </Tooltip>
                           )}
                         </div>
                         <div
                           className="relative w-full aspect-square rounded border overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity max-w-[75%] mx-auto"
                           onClick={() => {
                             if (!keyframe && videoKeyframes.length < 3) {
                               const input = document.createElement('input');
                               input.type = 'file';
                               input.accept = 'image/*';
                               input.onchange = async (e) => {
                                 const file = (e.target as HTMLInputElement).files?.[0];
                                 if (file) {
                                   const reader = new FileReader();
                                   reader.onload = async (e) => {
                                     const result = e.target?.result as string;
                                     const base64 = result.split(',')[1];
                                     setVideoKeyframes((prev) => [...prev, {
                                       id: `keyframe-${Date.now()}-${index}`,
                                       imageData: base64,
                                       imageType: file.type,
                                       timestamp: index
                                     }]);
                                   };
                                   reader.readAsDataURL(file);
                                 }
                               };
                               input.click();
                             }
                           }}
                         >
                           {keyframe ? (
                             <Image
                               src={`data:${keyframe.imageType};base64,${keyframe.imageData}`}
                               alt={`Keyframe ${index + 1}`}
                               fill
                               className="object-cover"
                             />
                           ) : (
                             <div className="h-full w-full flex items-center justify-center">
                               <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                             </div>
                           )}
                         </div>
                       </div>
                     );
                   })}

                   {/* Last Frame */}
                   <div className="flex-1 space-y-0.5 flex flex-col">
                     <div className="flex items-center gap-0.5">
                       <Label className="text-[10px] sm:text-xs font-medium">End</Label>
                       {videoLastFrame && (
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => setVideoLastFrame(null)}
                               className="h-3 w-3 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                             >
                               <X className="h-2 w-2" />
                             </Button>
                           </TooltipTrigger>
                           <TooltipContent>
                             <p>Remove last frame</p>
                           </TooltipContent>
                         </Tooltip>
                       )}
                     </div>
                     <div
                       className="relative w-full aspect-square rounded border overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity max-w-[75%] mx-auto"
                       onClick={() => {
                         if (!videoLastFrame) {
                           const input = document.createElement('input');
                           input.type = 'file';
                           input.accept = 'image/*';
                           input.onchange = async (e) => {
                             const file = (e.target as HTMLInputElement).files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onload = async (e) => {
                                 const result = e.target?.result as string;
                                 const base64 = result.split(',')[1];
                                 setVideoLastFrame({
                                   imageData: base64,
                                   imageType: file.type
                                 });
                               };
                               reader.readAsDataURL(file);
                             }
                           };
                           input.click();
                         }
                       }}
                     >
                       {videoLastFrame ? (
                         <Image
                           src={`data:${videoLastFrame.imageType};base64,${videoLastFrame.imageData}`}
                           alt="Last frame"
                           fill
                           className="object-cover"
                         />
                       ) : (
                         <div className="h-full w-full flex items-center justify-center">
                           <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             )}
            
            {/* File Upload - Hidden, triggered by + button */}
            <div className="hidden">
              <div {...getRootProps()}>
                <input {...getInputProps()} ref={fileInputRef} />
              </div>
            </div>

          </div>
        </div>
        </div>

      {/* Render Output Area - 3/4 width on desktop */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden min-h-0 min-w-0",
        "lg:w-3/4 lg:flex-shrink-0",
        // Mobile: show/hide based on mobileView - ONLY show in output area, never in chat
        mobileView === 'render' ? 'flex' : 'hidden lg:flex'
      )}>
        {/* Top Header with Model Selector, Project Rules, Credit Usage, Get Pro */}
        <div className="border-b border-border shrink-0 z-10 bg-background">
          <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3">
            {/* Left Section: Sidebar Toggle, Buttons spread out */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Sidebar Toggle Button - Only show on desktop when sidebar is visible */}
            {mobileView !== 'render' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                  className="h-7 w-7 p-0 shrink-0 hidden lg:flex"
                  title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isSidebarCollapsed ? (
                    <PanelRight className="h-3 w-3" />
                  ) : (
                    <PanelLeft className="h-3 w-3" />
                  )}
                </Button>
                <div className="h-4 w-px bg-border shrink-0 hidden lg:block"></div>
              </>
            )}
            
              {/* Buttons spread out across available width */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-between min-w-0">
            {/* Project Rules */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3 shrink-0"
              onClick={() => setIsProjectRulesModalOpen(true)}
              title="Project Rules"
            >
              <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span>Rules</span>
              {projectRules && projectRules.length > 0 && (
                <span className="ml-1 px-1 py-0.5 bg-primary/10 text-primary rounded text-[8px] sm:text-[9px] font-medium">
                  {projectRules.length}
                </span>
              )}
            </Button>
            
            {/* Prompt Builder and Library Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPromptGallery()}
              className="h-7 sm:h-8 px-2 text-[10px] sm:text-xs shrink-0"
              disabled={isGenerating}
              title="Prompt Library"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Library</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPromptBuilder()}
              className="h-7 sm:h-8 px-2 text-[10px] sm:text-xs shrink-0"
              disabled={isGenerating}
              title="Prompt Builder"
            >
              <Wand2 className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Builder</span>
            </Button>
            
                {/* Credit Usage */}
                <div className={cn(
                  "flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md border h-7 sm:h-8 shrink-0",
                  credits && credits.balance < getCreditsCost()
                    ? "bg-destructive/10 border-destructive/50 animate-pulse"
                    : credits && credits.balance < getCreditsCost() * 2
                    ? "bg-yellow-500/10 border-yellow-500/50"
                    : "bg-muted/50 border-border"
                )}>
                  {credits && credits.balance < getCreditsCost() ? (
                    <>
                      <FaExclamationCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                      <div className="text-[11px] sm:text-sm text-center leading-tight">
                        <span className="text-destructive font-semibold">{getCreditsCost()}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-destructive font-semibold">{credits.balance}</span>
                      </div>
                    </>
                  ) : credits && credits.balance < getCreditsCost() * 2 ? (
                    <>
                      <FaExclamationTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                      <div className="text-[11px] sm:text-sm text-center leading-tight">
                        <span className="text-yellow-600 dark:text-yellow-500 font-semibold">{getCreditsCost()}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-yellow-600 dark:text-yellow-500 font-semibold">{credits.balance}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                      <div className="text-[11px] sm:text-sm text-muted-foreground text-center font-medium leading-tight">
                        {getCreditsCost()} credit{getCreditsCost() !== 1 ? 's' : ''}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Section: Model Selector (extreme right) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Public/Private Toggle */}
            <div className="flex items-center gap-1.5 px-2 shrink-0">
              <Label htmlFor="privacy-toggle-header" className="text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer">
                {isPublic ? (
                  <>
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="hidden sm:inline">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 shrink-0" />
                    <span className="hidden sm:inline">Private</span>
                  </>
                )}
              </Label>
              <Switch
                id="privacy-toggle-header"
                checked={!isPublic}
                onCheckedChange={(checked) => {
                  if (!isPro && checked) {
                    // Free users trying to make private - show upgrade dialog
                    setIsUpgradeDialogOpen(true);
                  } else {
                    setIsPublic(!checked);
                  }
                }}
                disabled={!isPro && !isPublic} // Free users can't turn off public
                className="shrink-0"
              />
            </div>
            
            {/* Separator */}
            <div className="h-4 w-px bg-border shrink-0"></div>
            
              {/* Get Pro - Only show for non-Pro users */}
              {!isPro && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3 shrink-0"
                  onClick={() => window.open('/pricing', '_blank')}
                >
                  Get Pro
                </Button>
              )}
              
              {/* Model Selector - Extreme Right */}
              <div className="min-w-[120px] max-w-[200px] border border-muted-foreground/20 rounded-md h-7 sm:h-8 flex items-center shrink-0">
                <ModelSelector
                  type={isVideoMode ? 'video' : 'image'}
                  value={(isVideoMode ? selectedVideoModel : selectedImageModel) as ModelId | undefined}
                  onValueChange={(modelId) => {
                    if (isVideoMode) {
                      setSelectedVideoModel(modelId);
                    } else {
                      setSelectedImageModel(modelId);
                      // Auto-adjust quality if current quality is not supported (skip for "auto" mode)
                      if (modelId !== 'auto') {
                        const modelConfig = getModelConfig(modelId);
                        if (modelConfig && modelConfig.type === 'image') {
                          if (!modelSupportsQuality(modelId, quality as 'standard' | 'high' | 'ultra')) {
                            const maxQuality = getMaxQuality(modelId);
                            setQuality(maxQuality);
                            toast.info(`Quality adjusted to ${maxQuality} (maximum supported by selected model)`);
                          }
                        }
                      }
                    }
                  }}
                  quality={quality as 'standard' | 'high' | 'ultra'}
                  duration={videoDuration}
                  imageSize={quality === 'ultra' ? '4K' : quality === 'high' ? '2K' : '1K'}
                  variant="minimal"
                  showCredits={false}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Render Content */}
        <div className="flex-1 p-1 sm:p-2 overflow-hidden min-h-0">
            <div className="h-full w-full flex flex-col lg:flex-row items-center justify-center overflow-hidden">
              <div className="flex-1 overflow-hidden w-full h-full min-w-0 min-h-0">
                {/* Canvas always visible - works like Figma, shows generating frame on canvas when generating */}
                <Card className="w-full h-full py-0 gap-0 overflow-hidden">
                  <CardContent className="p-0 h-full overflow-hidden">
                    <div className="h-full w-full flex flex-col overflow-hidden">
                      {/* Canvas - Always visible, allows free work without AI */}
                      <div className="flex-1 bg-background overflow-hidden relative min-h-[200px] sm:min-h-[300px] min-w-0">
                        {renderWithLatestData?.type === 'video' ? (
                          // Keep video display for video renders (canvas doesn't support video yet)
                          <div className="w-full h-full flex items-center justify-center relative p-0 overflow-hidden min-w-0">
                            <video
                              src={renderWithLatestData.outputUrl || ''}
                              className="w-full h-full object-contain cursor-pointer"
                              controls
                              loop
                              muted
                              playsInline
                              onClick={() => setIsFullscreen(true)}
                              onLoadStart={() => {
                                logger.log('🖼️ [MAIN RENDER DEBUG] Video loading', {
                                  renderId: renderWithLatestData.id,
                                  outputUrl: renderWithLatestData.outputUrl?.substring(0, 50) + '...'
                                });
                              }}
                            />
                          </div>
                        ) : (
                          // Canvas always visible - works like Figma, users can freely work without AI
                          // When generating, a frame appears on the canvas showing "Generating your render..."
                          <RenderiqCanvas
                            currentRender={renderWithLatestData || null}
                            chainId={effectiveChainId}
                            chainRenders={effectiveChainRenders} // ✅ Use store values instead of props
                            onRenderAdded={(newRender) => {
                              // Handle new render added to canvas
                              if (onRenderComplete) {
                                onRenderComplete(newRender);
                              }
                            }}
                            isGenerating={isGenerating || isImageGenerating || isVideoGenerating}
                            generatingPrompt={inputValue}
                            onGenerateFromSelection={(prompt, selectedRenderIds) => {
                              // ✅ FIXED: Store selected render IDs from canvas for reference
                              // Use the first selected render ID as reference for generation
                              canvasSelectedRenderIdsRef.current = selectedRenderIds;
                              logger.log('🎨 Canvas selection sync:', {
                                selectedRenderIds,
                                prompt: prompt || inputValue,
                                willUseAsReference: selectedRenderIds.length > 0 ? selectedRenderIds[0] : 'none'
                              });
                              // Set input value and trigger generation
                              setInputValue(prompt || inputValue);
                              // Small delay to ensure input is set, then trigger send
                              setTimeout(() => {
                                handleSendMessage();
                              }, 100);
                            }}
                            onGenerateVariants={(config, selectedRenderIds) => {
                              // Handle variant generation with batch API
                              handleGenerateVariants(config, selectedRenderIds);
                            }}
                            onGenerateDrawing={(config, selectedRenderIds) => {
                              // Handle drawing generation with batch API
                              handleGenerateDrawing(config, selectedRenderIds);
                            }}
                            onImageToVideo={(config, selectedRenderIds) => {
                              // Handle image to video generation
                              handleImageToVideo(config, selectedRenderIds);
                            }}
                            className="w-full h-full"
                          />
                        )}
                      </div>
                      
                      {/* Pipeline Stage Events & Progress - Show below canvas when generating */}
                      {(isGenerating || isImageGenerating || isVideoGenerating) && (
                        <div className="p-2 border-t border-border bg-background flex-shrink-0">
                          <div className="w-full space-y-2">
                            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                              <span>Progress</span>
                              <span>{Math.round(Math.min(progress, 100))}%</span>
                            </div>
                            <Progress value={Math.min(progress, 100)} className="h-1.5 sm:h-2" />
                            {/* Pipeline Stage Events */}
                            {stageEvents.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  Pipeline Stages
                                </div>
                                {stageEvents.map((event, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                      event.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                                    }`} />
                                    <span className="capitalize flex-1">{event.stage.replace(/_/g, ' ')}</span>
                                    <span className="text-[10px] text-muted-foreground/70">{(event.durationMs / 1000).toFixed(1)}s</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pipeline Stage Events - Show below canvas */}
                      {stageEvents.length > 0 && (
                        <div className="p-2 border-t border-border bg-background flex-shrink-0">
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Pipeline Stages
                            </div>
                            {stageEvents.map((event, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  event.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                                <span className="capitalize flex-1">{event.stage.replace(/_/g, ' ')}</span>
                                <span className="text-[10px] text-muted-foreground/70">{(event.durationMs / 1000).toFixed(1)}s</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upscaling Result */}
                      {upscalingResult && (
                        <div className="p-1.5 sm:p-2 border-t border-border bg-background flex-shrink-0">
                          <div className="p-1.5 sm:p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                              <span className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200">
                                ✅ Upscaling Complete ({upscalingResult.scale}x)
                              </span>
                              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                                {upscalingResult.processingTime}s
                              </Badge>
                            </div>
                            <div className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 space-y-0.5 sm:space-y-1">
                              <div>• Image upscaled by {upscalingResult.scale}x successfully</div>
                              <div>• Processing time: {upscalingResult.processingTime}s</div>
                              <div>• Provider: {upscalingResult.provider}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Upscaling Error */}
                      {upscalingError && (
                        <div className="p-1.5 sm:p-2 border-t border-border bg-background flex-shrink-0">
                          <div className="p-1.5 sm:p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <div className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                              ❌ Upscaling Failed
                            </div>
                            <div className="text-[10px] sm:text-xs text-red-700 dark:text-red-300">
                              {upscalingError}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pipeline Stage Events - Show when NOT generating (completed renders) */}
                      {!(isGenerating || isImageGenerating || isVideoGenerating) && stageEvents.length > 0 && (
                        <div className="p-2 border-t border-border bg-background flex-shrink-0">
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Pipeline Stages
                            </div>
                            {stageEvents.map((event, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  event.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                                <span className="capitalize flex-1">{event.stage.replace(/_/g, ' ')}</span>
                                <span className="text-[10px] text-muted-foreground/70">{(event.durationMs / 1000).toFixed(1)}s</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
             </div>
           </div>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={handleUploadModalClose}
        onFileSelect={handleFileSelect}
        onGalleryOpen={handleGalleryModalOpen}
      />

      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={handleGalleryModalClose}
        onImageSelect={handleGalleryImageSelect}
      />
      <ProjectRulesModal
        isOpen={isProjectRulesModalOpen}
        onClose={() => setIsProjectRulesModalOpen(false)}
        chainId={chainId}
      />
      <PromptGalleryModal
        isOpen={isPromptGalleryOpen}
        onClose={() => closePromptGallery()}
        onSelectPrompt={(prompt) => {
          setInputValue(prompt);
          closePromptGallery();
        }}
        type={isVideoMode ? 'video' : 'image'}
      />
      <PromptBuilderModal
        isOpen={isPromptBuilderOpen}
        onClose={() => closePromptBuilder()}
        onSelectPrompt={(prompt) => {
          setInputValue(prompt);
          closePromptBuilder();
        }}
        type={isVideoMode ? 'video' : 'image'}
      />
      <Dialog open={isLowBalanceModalOpen} onOpenChange={setIsLowBalanceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insufficient Credits</DialogTitle>
            <DialogDescription>
              You need {getCreditsCost()} credits to generate this {isVideoMode ? 'video' : 'image'}, but you only have {credits?.balance || 0} credits.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {!isPro && (
              <Button
                variant="default"
                className="w-full sm:w-auto"
                onClick={() => {
                  setIsLowBalanceModalOpen(false);
                  window.open('/pricing', '_blank');
                }}
              >
                Get Pro
              </Button>
            )}
            <Button
              variant={isPro ? "default" : "outline"}
              className="w-full sm:w-auto"
              onClick={() => {
                setIsLowBalanceModalOpen(false);
                window.open('/pricing', '_blank');
              }}
            >
              Top up Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade to Premium Dialog for Private Renders */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>Upgrade to Premium</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Private renders are a premium feature. Upgrade to Pro to keep your renders private and exclusive.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                <Lock className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Private Renders</p>
                <p className="text-xs text-muted-foreground">Keep your renders exclusive and not visible in the public gallery</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                <Zap className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">More Credits</p>
                <p className="text-xs text-muted-foreground">Get 100 credits per month with Pro subscription</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsUpgradeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={() => {
                setIsUpgradeDialogOpen(false);
                window.open('/pricing', '_blank');
              }}
            >
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Dialog - Supports both render images and uploaded images */}
      {isFullscreen && (currentRender || fullscreenImageUrl) && (
        <div 
          data-slot="fullscreen-chat-overlay"
          className="fixed inset-0 bg-black flex items-center justify-center"
          onClick={() => {
            setIsFullscreen(false);
            setFullscreenImageUrl(null);
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {fullscreenImageUrl ? (
              // Fullscreen for uploaded image
              shouldUseRegularImg(fullscreenImageUrl) ? (
                <img
                  src={fullscreenImageUrl}
                  alt="Uploaded image"
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    const originalUrl = fullscreenImageUrl;
                    console.error('Image load error:', originalUrl);
                    logger.error('Failed to load image:', originalUrl);
                    
                    // Try CDN fallback to direct GCS URL
                    const fallbackUrl = handleImageErrorWithFallback(originalUrl, e);
                    if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                      console.log('Trying fallback to direct GCS URL:', fallbackUrl);
                      img.src = fallbackUrl;
                    } else {
                      // No fallback available, use placeholder
                      img.src = '/placeholder-image.jpg';
                    }
                  }}
                />
              ) : (
                <Image
                  src={fullscreenImageUrl}
                  alt="Uploaded image"
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                  onError={(e) => {
                    console.error('Image load error:', fullscreenImageUrl);
                    logger.error('Failed to load image:', fullscreenImageUrl);
                  }}
                />
              )
            ) : currentRender ? (
              // Fullscreen for render image
              currentRender.type === 'video' ? (
                <video
                  src={currentRender.outputUrl}
                  className="max-w-full max-h-full object-contain"
                  controls
                  loop
                  muted
                  playsInline
                  autoPlay
                  onClick={(e) => e.stopPropagation()}
                />
              ) : currentRender.outputUrl ? (
                // Use regular img tag for external storage URLs to avoid Next.js 16 private IP blocking
                shouldUseRegularImg(currentRender.outputUrl) ? (
                  <img
                    src={currentRender.outputUrl}
                    alt={currentRender.prompt}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const originalUrl = currentRender.outputUrl;
                      console.error('Image load error:', originalUrl);
                      logger.error('Failed to load image:', originalUrl);
                      
                      // Try CDN fallback to direct GCS URL
                      const fallbackUrl = handleImageErrorWithFallback(originalUrl, e);
                      if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                        console.log('Trying fallback to direct GCS URL:', fallbackUrl);
                        img.src = fallbackUrl;
                      } else {
                        // No fallback available, use placeholder
                        img.src = '/placeholder-image.jpg';
                      }
                    }}
                  />
                ) : (
                  <Image
                    src={currentRender.outputUrl}
                    alt={currentRender.prompt}
                    width={1200}
                    height={800}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                    onError={(e) => {
                      console.error('Image load error:', currentRender.outputUrl);
                      logger.error('Failed to load image:', currentRender.outputUrl);
                    }}
                  />
                )
              ) : (
                <div className="flex items-center justify-center text-white">
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              )
            ) : null}
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsFullscreen(false);
                setFullscreenImageUrl(null);
              }}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white h-10 w-10 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
            
            {/* Image Info */}
            {currentRender && (
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                  {currentRender.prompt}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* ✅ Limit Reached Dialog */}
      {limitDialogData && (
        <LimitReachedDialog
          isOpen={limitDialogOpen}
          onClose={() => {
            closeLimitDialog();
          }}
          limitType={limitDialogData.limitType}
          current={limitDialogData.current}
          limit={limitDialogData.limit}
          planName={limitDialogData.planName}
          message={limitDialogData.message}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // ✅ Custom comparison function for React.memo
  // Only re-render if these props actually change
  const projectsEqual = 
    prevProps.projects?.length === nextProps.projects?.length &&
    prevProps.projects?.every((p, i) => 
      p.id === nextProps.projects?.[i]?.id && 
      p.name === nextProps.projects?.[i]?.name &&
      p.slug === nextProps.projects?.[i]?.slug
    );
  
  const chainsEqual = 
    prevProps.chains?.length === nextProps.chains?.length &&
    prevProps.chains?.every((c, i) => 
      c.id === nextProps.chains?.[i]?.id && 
      c.name === nextProps.chains?.[i]?.name &&
      c.projectId === nextProps.chains?.[i]?.projectId
    );
  
  return (
    prevProps.projectId === nextProps.projectId &&
    prevProps.chainId === nextProps.chainId &&
    prevProps.chain?.id === nextProps.chain?.id &&
    prevProps.chain?.renders?.length === nextProps.chain?.renders?.length &&
    prevProps.projectName === nextProps.projectName &&
    prevProps.chainName === nextProps.chainName &&
    projectsEqual &&
    chainsEqual
  );
});
