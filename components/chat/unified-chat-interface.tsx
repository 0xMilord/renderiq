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
  Download, 
  Share2,
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
  CheckCircle
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
import { useVersionContext } from '@/lib/hooks/use-version-context';
import { UploadModal } from './upload-modal';
import { GalleryModal } from './gallery-modal';
import { ProjectRulesModal } from './project-rules-modal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Lock, Globe } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import { MentionTagger } from './mention-tagger';
import { PromptGalleryModal } from './prompt-gallery-modal';
import { PromptBuilderModal } from './prompt-builder-modal';
import type { Render } from '@/lib/types/render';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';
import Image from 'next/image';
import { shouldUseRegularImg } from '@/lib/utils/storage-url';
import { handleImageErrorWithFallback, isCDNUrl } from '@/lib/utils/cdn-fallback';

import { getRenderiqMessage } from '@/lib/utils/renderiq-messages';
import { useLocalStorageMessages } from '@/lib/hooks/use-local-storage-messages';
import { useObjectURL } from '@/lib/hooks/use-object-url';
import { useModal } from '@/lib/hooks/use-modal';
import { createRenderFormData } from '@/lib/utils/render-form-data';
import { useWakeLock } from '@/lib/hooks/use-wake-lock';
import { useDynamicTitle } from '@/lib/hooks/use-dynamic-title';
import { retryFetch } from '@/lib/utils/retry-fetch';
import { convertRendersToMessages, convertRenderToMessages } from '@/lib/utils/render-to-messages';
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
import React, { useReducer } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'video';
  content: string;
  timestamp: Date;
  render?: Render;
  isGenerating?: boolean;
  uploadedImage?: {
    file?: File; // Optional for persisted images
    previewUrl: string;
    persistedUrl?: string; // URL from database/storage
  };
  referenceRenderId?: string; // Which render this message is referring to
}

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
  const router = useRouter();
  
  // React 19: Track initialization per chainId to prevent re-initialization
  const initializedChainIdRef = useRef<string | undefined>(undefined);
  
  // ✅ FIXED: Network recovery state (declared early to avoid hoisting issues)
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryRenderId, setRecoveryRenderId] = useState<string | null>(null);
  const isVisibleRef = useRef(true);
  const lastRefreshTimeRef = useRef<number>(0);
  const hasProcessingRendersRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userSelectedRenderIdRef = useRef<string | null>(null);
  const recentGenerationRef = useRef<{ timestamp: number; renderId?: string } | null>(null);
  
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
  
  // ✅ FIXED: Consolidated state using useReducer for better performance
  type ChatState = {
    messages: Message[];
    inputValue: string;
    currentRender: Render | null;
    isGenerating: boolean;
    progress: number;
  };
  
  type ChatAction =
    | { type: 'SET_MESSAGES'; payload: Message[] }
    | { type: 'ADD_MESSAGE'; payload: Message }
    | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<Message> } }
    | { type: 'SET_INPUT_VALUE'; payload: string }
    | { type: 'SET_CURRENT_RENDER'; payload: Render | null }
    | { type: 'SET_IS_GENERATING'; payload: boolean }
    | { type: 'SET_PROGRESS'; payload: number };
  
  const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
    switch (action.type) {
      case 'SET_MESSAGES':
        return { ...state, messages: action.payload };
      case 'ADD_MESSAGE':
        return { ...state, messages: [...state.messages, action.payload] };
      case 'UPDATE_MESSAGE':
        return {
          ...state,
          messages: state.messages.map(msg =>
            msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
          )
        };
      case 'SET_INPUT_VALUE':
        return { ...state, inputValue: action.payload };
      case 'SET_CURRENT_RENDER':
        return { ...state, currentRender: action.payload };
      case 'SET_IS_GENERATING':
        return { ...state, isGenerating: action.payload };
      case 'SET_PROGRESS':
        return { ...state, progress: action.payload };
      default:
        return state;
    }
  };
  
  const [chatState, dispatchChat] = useReducer(chatReducer, {
    messages: [],
    inputValue: '',
    currentRender: null,
    isGenerating: false,
    progress: 0,
  });
  
  // Extract for easier access (backward compatibility)
  const messages = chatState.messages;
  const inputValue = chatState.inputValue;
  const currentRender = chatState.currentRender;
  const isGenerating = chatState.isGenerating;
  const progress = chatState.progress;
  
  // Wrapper functions for backward compatibility
  const setMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    const newMessages = typeof updater === 'function' ? updater(chatState.messages) : updater;
    dispatchChat({ type: 'SET_MESSAGES', payload: newMessages });
    messagesRef.current = newMessages; // Keep ref in sync
  }, [chatState.messages]);
  
  const setInputValue = useCallback((value: string) => {
    dispatchChat({ type: 'SET_INPUT_VALUE', payload: value });
  }, []);
  
  const setCurrentRender = useCallback((updater: Render | null | ((prev: Render | null) => Render | null)) => {
    const newRender = typeof updater === 'function' ? updater(chatState.currentRender) : updater;
    dispatchChat({ type: 'SET_CURRENT_RENDER', payload: newRender });
  }, [chatState.currentRender]);
  
  const setIsGenerating = useCallback((value: boolean) => {
    dispatchChat({ type: 'SET_IS_GENERATING', payload: value });
  }, []);
  
  const setProgress = useCallback((value: number) => {
    dispatchChat({ type: 'SET_PROGRESS', payload: value });
  }, []);

  // Dynamic title updates based on project/chain - using new hook
  const chainName = chain?.name;
  useDynamicTitle(undefined, projectName, chainName);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [beforeAfterView, setBeforeAfterView] = useState<'before' | 'after'>('after');
  
  // Fixed aspect ratio for better quality
  const aspectRatio = DEFAULT_ASPECT_RATIO;
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  // Use custom hook for object URL management
  const previewUrl = useObjectURL(uploadedFile);
  
  
  // ✅ FIXED: Consolidated settings state
  type SettingsState = {
    environment: string;
    effect: string;
    styleTransferImage: File | null;
    styleTransferPreview: string | null;
    temperature: string;
    quality: string;
    selectedImageModel: ModelId | undefined;
    selectedVideoModel: ModelId | undefined;
    videoDuration: number;
    isVideoMode: boolean;
    videoKeyframes: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }>;
    videoLastFrame: { imageData: string; imageType: string } | null;
    isPublic: boolean;
  };
  
  type SettingsAction =
    | { type: 'SET_ENVIRONMENT'; payload: string }
    | { type: 'SET_EFFECT'; payload: string }
    | { type: 'SET_STYLE_TRANSFER_IMAGE'; payload: File | null }
    | { type: 'SET_STYLE_TRANSFER_PREVIEW'; payload: string | null }
    | { type: 'SET_TEMPERATURE'; payload: string }
    | { type: 'SET_QUALITY'; payload: string }
    | { type: 'SET_SELECTED_IMAGE_MODEL'; payload: ModelId | undefined }
    | { type: 'SET_SELECTED_VIDEO_MODEL'; payload: ModelId | undefined }
    | { type: 'SET_VIDEO_DURATION'; payload: number }
    | { type: 'SET_IS_VIDEO_MODE'; payload: boolean }
    | { type: 'SET_VIDEO_KEYFRAMES'; payload: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }> }
    | { type: 'SET_VIDEO_LAST_FRAME'; payload: { imageData: string; imageType: string } | null }
    | { type: 'SET_IS_PUBLIC'; payload: boolean };
  
  const settingsReducer = (state: SettingsState, action: SettingsAction): SettingsState => {
    switch (action.type) {
      case 'SET_ENVIRONMENT':
        return { ...state, environment: action.payload };
      case 'SET_EFFECT':
        return { ...state, effect: action.payload };
      case 'SET_STYLE_TRANSFER_IMAGE':
        return { ...state, styleTransferImage: action.payload };
      case 'SET_STYLE_TRANSFER_PREVIEW':
        return { ...state, styleTransferPreview: action.payload };
      case 'SET_TEMPERATURE':
        return { ...state, temperature: action.payload };
      case 'SET_QUALITY':
        return { ...state, quality: action.payload };
      case 'SET_SELECTED_IMAGE_MODEL':
        return { ...state, selectedImageModel: action.payload };
      case 'SET_SELECTED_VIDEO_MODEL':
        return { ...state, selectedVideoModel: action.payload };
      case 'SET_VIDEO_DURATION':
        return { ...state, videoDuration: action.payload };
      case 'SET_IS_VIDEO_MODE':
        return { ...state, isVideoMode: action.payload };
      case 'SET_VIDEO_KEYFRAMES':
        return { ...state, videoKeyframes: action.payload };
      case 'SET_VIDEO_LAST_FRAME':
        return { ...state, videoLastFrame: action.payload };
      case 'SET_IS_PUBLIC':
        return { ...state, isPublic: action.payload };
      default:
        return state;
    }
  };
  
  const [settingsState, dispatchSettings] = useReducer(settingsReducer, {
    environment: 'none',
    effect: 'none',
    styleTransferImage: null,
    styleTransferPreview: null,
    temperature: '0.5',
    quality: 'standard',
    selectedImageModel: undefined,
    selectedVideoModel: undefined,
    videoDuration: 8,
    isVideoMode: false,
    videoKeyframes: [],
    videoLastFrame: null,
    isPublic: true,
  });
  
  // Extract for easier access
  const environment = settingsState.environment;
  const effect = settingsState.effect;
  const styleTransferImage = settingsState.styleTransferImage;
  const styleTransferPreview = settingsState.styleTransferPreview;
  const temperature = settingsState.temperature;
  const quality = settingsState.quality;
  const selectedImageModel = settingsState.selectedImageModel;
  const selectedVideoModel = settingsState.selectedVideoModel;
  const videoDuration = settingsState.videoDuration;
  const isVideoMode = settingsState.isVideoMode;
  const videoKeyframes = settingsState.videoKeyframes;
  const videoLastFrame = settingsState.videoLastFrame;
  const isPublic = settingsState.isPublic;
  
  // Wrapper functions
  const setEnvironment = useCallback((value: string) => dispatchSettings({ type: 'SET_ENVIRONMENT', payload: value }), []);
  const setEffect = useCallback((value: string) => dispatchSettings({ type: 'SET_EFFECT', payload: value }), []);
  const setStyleTransferImage = useCallback((value: File | null) => dispatchSettings({ type: 'SET_STYLE_TRANSFER_IMAGE', payload: value }), []);
  const setStyleTransferPreview = useCallback((value: string | null) => dispatchSettings({ type: 'SET_STYLE_TRANSFER_PREVIEW', payload: value }), []);
  const setTemperature = useCallback((value: string) => dispatchSettings({ type: 'SET_TEMPERATURE', payload: value }), []);
  const setQuality = useCallback((value: string) => dispatchSettings({ type: 'SET_QUALITY', payload: value }), []);
  const setSelectedImageModel = useCallback((value: ModelId | undefined) => dispatchSettings({ type: 'SET_SELECTED_IMAGE_MODEL', payload: value }), []);
  const setSelectedVideoModel = useCallback((value: ModelId | undefined) => dispatchSettings({ type: 'SET_SELECTED_VIDEO_MODEL', payload: value }), []);
  const setVideoDuration = useCallback((value: number) => dispatchSettings({ type: 'SET_VIDEO_DURATION', payload: value }), []);
  const setIsVideoMode = useCallback((value: boolean) => dispatchSettings({ type: 'SET_IS_VIDEO_MODE', payload: value }), []);
  const setVideoKeyframes = useCallback((value: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }> | ((prev: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }>) => Array<{ id: string; imageData: string; imageType: string; timestamp?: number }>)) => {
    const newValue = typeof value === 'function' ? value(videoKeyframes) : value;
    dispatchSettings({ type: 'SET_VIDEO_KEYFRAMES', payload: newValue });
  }, [videoKeyframes]);
  const setVideoLastFrame = useCallback((value: { imageData: string; imageType: string } | null) => dispatchSettings({ type: 'SET_VIDEO_LAST_FRAME', payload: value }), []);
  const setIsPublic = useCallback((value: boolean) => dispatchSettings({ type: 'SET_IS_PUBLIC', payload: value }), []);
  
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
  const [isPromptGalleryOpen, setIsPromptGalleryOpen] = useState(false);
  const [isPromptBuilderOpen, setIsPromptBuilderOpen] = useState(false);
  
  // Mention state
  const [currentMentionPosition, setCurrentMentionPosition] = useState(-1);
  
  // Mobile view state - toggle between chat and render
  const [mobileView, setMobileView] = useState<'chat' | 'render'>('chat');
  
  // Version carousel state
  const [carouselScrollPosition, setCarouselScrollPosition] = useState(0);
  const [mobileCarouselScrollPosition, setMobileCarouselScrollPosition] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  
  // Refs (messagesEndRef, hasProcessingRendersRef, userSelectedRenderIdRef, lastRefreshTimeRef declared above)
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<Message[]>([]); // Track messages via ref
  
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
      dispatchSettings({ type: 'SET_IS_PUBLIC', payload: !isPro }); // Free users are public, Pro users are private by default
    }
  }, [isPro, proLoading]);

  // ✅ FIXED: Auto-adjust quality when image model changes (consolidated effect)
  useEffect(() => {
    if (selectedImageModel && !isVideoMode) {
      const modelId = selectedImageModel as ModelId;
      if (!modelSupportsQuality(modelId, quality as 'standard' | 'high' | 'ultra')) {
        const maxQuality = getMaxQuality(modelId);
        dispatchSettings({ type: 'SET_QUALITY', payload: maxQuality });
        toast.info(`Quality adjusted to ${maxQuality} (maximum supported by selected model)`);
      }
    }
  }, [selectedImageModel, isVideoMode, quality]);

  // ✅ FIXED: Reset before/after view (consolidated with other UI effects)
  useEffect(() => {
    setBeforeAfterView('after');
  }, [currentRender?.id]);
  
  // Find previous render for before/after comparison
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
  
  // Version context hook
  const { parsePrompt } = useVersionContext();

  // ✅ FIXED: Progress based on actual render status from DB, not local state
  // Derive progress from render status in chain.renders
  const progressFromStatus = useMemo(() => {
    // Check if we have any processing renders
    const processingRenders = chain?.renders?.filter(r => 
      r.status === 'processing' || r.status === 'pending'
    ) || [];
    
    if (processingRenders.length > 0) {
      // Show progress based on render status
      // If render exists in DB, show 50-90% (processing)
      // If render is completed, show 100%
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

  const displayVersion = useMemo(() => {
    return getVersionNumber(renderWithLatestData, chain?.renders) || 1;
  }, [renderWithLatestData, chain?.renders]);

  // Memoize messages from chain.renders
  const chainMessages = useMemo(() => {
    if (!chain?.renders || chain.renders.length === 0) return null;
    return convertRendersToMessages(chain.renders);
  }, [chain?.renders]);

  // ✅ FIXED: Initialize messages when chainId changes (with visibility check and generation check)
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

    logger.log('🔍 UnifiedChatInterface: Initializing chain data', {
      chainId: currentChainId,
      rendersCount: chain?.renders?.length || 0
    });
    
    const storedMessages = restoreMessages();
    
    if (chainMessages) {
      dispatchChat({ type: 'SET_MESSAGES', payload: chainMessages });
      messagesRef.current = chainMessages;
      saveMessages(chainMessages);
      
      // Set latest render on initialization
      if (latestRender) {
        logger.log('🔍 UnifiedChatInterface: Setting latest render on initialization', {
          renderId: latestRender.id,
          chainPosition: latestRender.chainPosition,
          versionNumber: getVersionNumber(latestRender, chain?.renders)
        });
        dispatchChat({ type: 'SET_CURRENT_RENDER', payload: latestRender });
        userSelectedRenderIdRef.current = null;
      } else {
        logger.log('⚠️ UnifiedChatInterface: No latest render found on initialization');
      }
    } else if (storedMessages) {
      dispatchChat({ type: 'SET_MESSAGES', payload: storedMessages });
    } else {
      dispatchChat({ type: 'SET_MESSAGES', payload: [] });
      dispatchChat({ type: 'SET_CURRENT_RENDER', payload: null });
    }
    
    initializedChainIdRef.current = currentChainId;
  }, [chainId, chainMessages, latestRender, isGenerating, isImageGenerating, isVideoGenerating, isRecovering]);

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

  // ✅ FIXED: Consolidated chain.renders updates - merge instead of replace to preserve local messages
  useEffect(() => {
    if (!chain?.renders) {
      if (chain?.renders?.length === 0) {
        // Only clear if we're not generating
        if (!isGenerating && !isImageGenerating && !isVideoGenerating) {
          dispatchChat({ type: 'SET_CURRENT_RENDER', payload: null });
          dispatchChat({ type: 'SET_MESSAGES', payload: [] });
          messagesRef.current = [];
        }
      }
      return;
    }
    
    // ✅ CRITICAL FIX: Don't reset messages if we're currently generating
    // During generation, we have local messages (user + generating assistant) that aren't in chain.renders yet
    const isCurrentlyGenerating = isGenerating || isImageGenerating || isVideoGenerating || isRecovering;
    
    if (isCurrentlyGenerating) {
      // Only update existing messages with latest render data, don't replace
      const newMessagesFromChain = convertRendersToMessages(chain.renders);
      
      // Merge: keep local generating messages, update completed renders
      const prevMessages = messages;
      const mergedMessages: Message[] = [];
      const chainMessageMap = new Map(newMessagesFromChain.map(m => [m.render?.id, m]));
      
      // Keep local messages that don't have renders yet (generating state)
      for (const prevMsg of prevMessages) {
        if (prevMsg.isGenerating || !prevMsg.render) {
          // Keep generating messages or user messages without renders
          mergedMessages.push(prevMsg);
        } else if (prevMsg.render?.id) {
          // Update with latest render data from chain
          const chainMsg = chainMessageMap.get(prevMsg.render.id);
          if (chainMsg) {
            mergedMessages.push(chainMsg);
          } else {
            // Render was removed, keep old message
            mergedMessages.push(prevMsg);
          }
        } else {
          mergedMessages.push(prevMsg);
        }
      }
      
      // Add any new renders from chain that aren't in local messages
      for (const chainMsg of newMessagesFromChain) {
        if (chainMsg.render && !mergedMessages.some(m => m.render?.id === chainMsg.render?.id)) {
          mergedMessages.push(chainMsg);
        }
      }
      
      dispatchChat({ type: 'SET_MESSAGES', payload: mergedMessages });
      messagesRef.current = mergedMessages;
      saveMessages(mergedMessages);
    } else {
      // Not generating - safe to replace with chain.renders (single source of truth)
      const newMessages = convertRendersToMessages(chain.renders);
      dispatchChat({ type: 'SET_MESSAGES', payload: newMessages });
      messagesRef.current = newMessages;
      saveMessages(newMessages);
    }
    
    // Update currentRender
    setCurrentRender(prevRender => {
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
  }, [chain?.renders, latestRender, isGenerating, isImageGenerating, isVideoGenerating, isRecovering]);

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

  // ✅ FIXED: Consolidated polling logic - throttle to prevent excessive refreshes
  useEffect(() => {
    if (!chainId || !onRefreshChain || !isVisibleRef.current) return;
    
    // Check if we have processing renders in database OR recent local generation
    const hasProcessingInDB = chain?.renders?.some(r => 
      r.status === 'processing' || r.status === 'pending'
    ) || false;
    
    const hasLocalGeneration = isGenerating || isImageGenerating || isVideoGenerating || isRecovering;
    
    // ✅ FIXED: Continue polling for 30 seconds after local generation completes
    // This ensures we catch renders that complete on the server after local state clears
    const recentGeneration = recentGenerationRef.current;
    const shouldContinuePolling = recentGeneration && 
      (Date.now() - recentGeneration.timestamp < 30000); // 30 seconds grace period
    
    const hasProcessing = hasProcessingInDB || hasLocalGeneration || shouldContinuePolling;
    
    hasProcessingRendersRef.current = hasProcessing;
    
    if (!hasProcessing) {
      return;
    }
    
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
        
        // ✅ FIXED: Re-check processing state on each poll
        // This allows polling to continue even after local generation completes
        const currentChain = chain; // Get latest chain from closure
        const hasProcessingInDB = currentChain?.renders?.some(r => 
          r.status === 'processing' || r.status === 'pending'
        ) || false;
        
        const recentGen = recentGenerationRef.current;
        const shouldContinue = recentGen && 
          (Date.now() - recentGen.timestamp < 30000);
        
        // Check if the recent generation render is now in the database
        if (recentGen?.renderId && currentChain?.renders) {
          const renderInDB = currentChain.renders.find(r => r.id === recentGen.renderId);
          if (renderInDB && renderInDB.status === 'completed') {
            // Render is now in DB, clear recent generation tracking
            recentGenerationRef.current = null;
          }
        }
        
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
    
    startPolling();
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  }, [chainId, throttledRefresh, chain?.renders]); // ✅ FIXED: Include chain.renders to restart polling when it changes
  
  // ✅ FIXED: Update processing ref when state changes (separate effect)
  useEffect(() => {
    const hasProcessing = chain?.renders?.some(r => 
      r.status === 'processing' || r.status === 'pending'
    ) || isGenerating || isImageGenerating || isVideoGenerating || isRecovering;
    
    hasProcessingRendersRef.current = hasProcessing;
  }, [chain?.renders, isGenerating, isImageGenerating, isVideoGenerating, isRecovering]);

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
    // Convert URL to File if needed
    if (image.file) {
      setUploadedFile(image.file);
      // previewUrl is automatically managed by useObjectURL hook
    } else if (image.url) {
      // For gallery images, we'll use the URL directly
      // Create a placeholder file object
      const file = new File([''], 'gallery-image.png', { type: 'image/png' });
      setUploadedFile(file);
      // Note: For external URLs, we might need to handle differently
      // But useObjectURL will handle File objects automatically
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


  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating || isImageGenerating || isVideoGenerating) return;

    // Check credits BEFORE proceeding
    const requiredCredits = getCreditsCost();
    if (credits && credits.balance < requiredCredits) {
      setIsLowBalanceModalOpen(true);
      return;
    }

    logger.log('🔍 Processing message with potential mentions:', inputValue);

    // Parse the prompt for version mentions and extract context
    let versionContext = undefined;
    let finalPrompt = inputValue;
    let referenceRenderId: string | undefined = undefined;

    // Check if the prompt contains mentions
    const hasNewUploadedImage = uploadedFile && previewUrl;
    
    if (inputValue.includes('@')) {
      logger.log('🔍 Prompt contains mentions, parsing version context...');
      
      const parsedPrompt = await parsePrompt(inputValue, projectId, chainId);
      
      if (parsedPrompt) {
        logger.log('✅ Parsed prompt:', {
          userIntent: parsedPrompt.userIntent,
          mentionsCount: parsedPrompt.mentionedVersions.length,
          hasMentions: parsedPrompt.hasMentions
        });

        if (parsedPrompt.hasMentions) {
          // Use the version context for generation
          versionContext = {
            userIntent: parsedPrompt.userIntent,
            mentionedVersions: parsedPrompt.mentionedVersions.map(mv => ({
              renderId: mv.renderId,
              context: mv.context ? {
                prompt: mv.context.prompt,
                settings: mv.context.settings,
                imageData: mv.context.imageData,
                metadata: mv.context.metadata
              } : undefined
            }))
          };

          // Create contextual prompt for better AI understanding
          const versionContextService = await import('@/lib/services/version-context');
          const service = versionContextService.VersionContextService.getInstance();
          const contextualPrompt = service.createContextualPrompt(parsedPrompt);
          finalPrompt = contextualPrompt;

          // Use the most recent mentioned version as reference ONLY if no new image is uploaded
          // If user uploads a new image, mentions are for style/material reference, not image reference
          if (!hasNewUploadedImage) {
            const mentionedVersionWithRender = parsedPrompt.mentionedVersions
              .find(v => v.renderId);
            if (mentionedVersionWithRender?.renderId) {
              referenceRenderId = mentionedVersionWithRender.renderId;
              logger.log('🔗 Using mentioned version as reference render:', referenceRenderId);
            }
          } else {
            logger.log('🆕 New image uploaded with mentions - mentions used for style/material reference only');
          }

          logger.log('🎯 Using version context:', {
            finalPrompt: finalPrompt.substring(0, 100) + '...',
            referenceRenderId,
            hasNewImage: hasNewUploadedImage,
            mentionedVersionsCount: versionContext.mentionedVersions.length
          });
        }
      } else {
        logger.log('⚠️ Failed to parse prompt, falling back to original');
      }
    } else {
      // No mentions, use smart reference logic
      // CRITICAL: If user uploads a NEW image, don't use reference render (fresh start)
      // Only use reference render for iterative edits when NO new image is uploaded
      if (hasNewUploadedImage) {
        // User uploaded a new image - this is a fresh start, don't use reference render
        logger.log('🆕 New image uploaded - using fresh context (no reference render)');
        referenceRenderId = undefined;
      } else {
        // No new image uploaded - use reference render for iterative editing
        if (chain && chain.renders && chain.renders.length > 0) {
          const completedRenders = chain.renders.filter(render => render.status === 'completed');
          const latestCompletedRender = completedRenders
            .sort((a, b) => (b.chainPosition || 0) - (a.chainPosition || 0))[0];
          
          if (latestCompletedRender) {
            referenceRenderId = latestCompletedRender.id;
            logger.log('🔗 Using latest completed render from chain as reference for iterative edit:', referenceRenderId);
          }
        } else if (currentRender && currentRender.status === 'completed') {
          referenceRenderId = currentRender.id;
          logger.log('🔗 Using currentRender as fallback reference:', referenceRenderId);
        }
      }
    }

    // Create user message with image context
    const userMessage: Message = {
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

    dispatchChat({ type: 'ADD_MESSAGE', payload: userMessage });
    const currentPrompt = inputValue;
    dispatchChat({ type: 'SET_INPUT_VALUE', payload: '' });
    
    // ✅ PRESERVE: Store uploaded image URL before clearing file (needed for before/after tab)
    const preservedUploadedImageUrl = uploadedFile && previewUrl ? previewUrl : null;
    
    // Clear uploaded file after adding to message
    if (uploadedFile) {
      setUploadedFile(null);
      // previewUrl is automatically cleared by useObjectURL hook when file is null
    }
    
    dispatchChat({ type: 'SET_IS_GENERATING', payload: true });
    dispatchChat({ type: 'SET_PROGRESS', payload: 0 });
    onRenderStart?.();

    // Add assistant message with generating state
    const assistantMessage: Message = {
      id: `assistant-${crypto.randomUUID()}`,
      type: 'assistant',
      content: getRenderiqMessage(0, isVideoMode),
      timestamp: new Date(),
      isGenerating: true
    };

    dispatchChat({ type: 'ADD_MESSAGE', payload: assistantMessage });

    // Define generationType outside try block so it's accessible in catch
    const generationType = isVideoMode ? 'video' : 'image';
    
    // Store API error for catch block
    let apiError: string | undefined = undefined;

    try {
      // Use the final prompt directly - Google Generative AI handles optimization
      const enhancedPrompt = finalPrompt;

       // Log generation parameters before sending
       logger.log('🎯 Chat: Sending generation request with parameters:', {
         aspectRatio,
         type: generationType,
         hasUploadedImage: !!userMessage.uploadedImage?.file,
         isVideoMode
       });

       // Generate image or video based on mode
       let result;
       
       // Prepare form data for generation
       // Store base64 data separately for retry recreation
       let uploadedImageBase64: string | null = null;
       let styleTransferBase64: string | null = null;
       
       // Pre-process images to base64 (needed for retry logic)
       if (userMessage.uploadedImage?.file) {
         const reader = new FileReader();
         uploadedImageBase64 = await new Promise<string>((resolve) => {
           reader.onload = (e) => {
             const result = e.target?.result as string;
             resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
           };
           reader.readAsDataURL(userMessage.uploadedImage!.file!);
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
           uploadedImageType: userMessage.uploadedImage?.file?.type,
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
          hasImage: !!userMessage.uploadedImage?.file,
          hasKeyframes: videoKeyframes.length > 0
        });
        
        // Use retryFetch utility with FormData recreation for each attempt
        let response: Response | null = null;
        let apiResult: any = null;
        
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
          result = {
            success: true,
            data: {
              outputUrl: apiResult.data.outputUrl || '',
              processingTime: apiResult.data.processingTime || 0,
              provider: apiResult.data.provider || 'google-generative-ai',
              uploadedImageUrl: apiResult.data.uploadedImageUrl || null,
              uploadedImageKey: apiResult.data.uploadedImageKey || null,
              uploadedImageId: apiResult.data.uploadedImageId || null
            }
          };
        } else {
          // Store error message for catch block
          apiError = apiResult.error || 'Image generation failed';
          
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
         // ✅ FIX: Preserve uploadedImageUrl from API response or use preserved URL
         // API response has the persisted URL, but if not available, use the preserved previewUrl
         const uploadedImageUrl = apiResult.data?.uploadedImageUrl || preservedUploadedImageUrl || null;
         const newRender: Render = {
           id: renderId, // Use actual render ID from API
           projectId,
           userId: '',
           type: result.videoUrl ? 'video' : 'image',
          prompt: currentPrompt,
          settings: {
            aspectRatio,
          },
          outputUrl: result.imageUrl || result.videoUrl || result.data?.outputUrl || '',
          outputKey: '',
          uploadedImageUrl: uploadedImageUrl,
          uploadedImageKey: apiResult.data?.uploadedImageKey || null,
          uploadedImageId: apiResult.data?.uploadedImageId || null,
          status: 'completed',
          errorMessage: null,
          processingTime: result.processingTime,
          chainId: chainId || null,
          chainPosition: apiResult.data?.chainPosition ?? Math.floor(messages.length / 2), // Use chainPosition from API if available
          referenceRenderId: currentRender?.id || null, // Reference to previous version
          creditsCost: getCreditsCost(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        dispatchChat({ type: 'SET_CURRENT_RENDER', payload: newRender });
        onRenderComplete?.(newRender);
        
        // ✅ FIXED: Track recent generation to continue polling after local completion
        // This ensures we catch the render when it appears in the database
        recentGenerationRef.current = {
          timestamp: Date.now(),
          renderId: renderId
        };
        
        // Update the assistant message with the result and render
        dispatchChat({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: assistantMessage.id,
            updates: {
              content: '',
              isGenerating: false,
              render: newRender
            }
          }
        });
        messagesRef.current = messages.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: '', isGenerating: false, render: newRender }
            : msg
        );
        
        // ✅ FIXED: Trigger immediate refresh to sync with database
        // Use setTimeout to avoid blocking the UI update
        setTimeout(() => {
          throttledRefresh();
        }, 1000); // Wait 1 second for render to be saved to DB

        // Clear uploaded file after successful generation (but keep video mode)
        if (uploadedFile && !isVideoMode) {
          setUploadedFile(null);
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
      
      // Determine error type for better user messaging
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('network') ||
                            errorMessage.includes('timeout') ||
                            errorMessage.includes('aborted');
      const isGoogleError = errorMessage.includes('Google') || 
                            errorMessage.includes('Gemini') ||
                            errorMessage.includes('Veo') ||
                            errorMessage.includes('quota');
      
      // Update assistant message with error state
      dispatchChat({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: assistantMessage.id,
          updates: {
            content: isNetworkError
              ? 'Network error. Please check your connection and try again.'
              : isGoogleError
              ? 'Google AI service temporarily unavailable. Please try again in a moment.'
              : getRenderiqMessage(0, isVideoMode, true),
            isGenerating: false
          }
        }
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
      dispatchChat({ type: 'SET_IS_GENERATING', payload: false });
      dispatchChat({ type: 'SET_PROGRESS', payload: 0 });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  const handleDownload = () => {
    if (currentRender?.outputUrl) {
      const link = document.createElement('a');
      link.href = currentRender.outputUrl;
      const fileExtension = currentRender.type === 'video' ? 'mp4' : 'png';
      link.download = `render-${currentRender.id}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (navigator.share && currentRender?.outputUrl) {
      try {
        await navigator.share({
          title: `AI Render - ${currentRender.prompt}`,
          text: `Check out this AI-generated ${currentRender.type}: ${currentRender.prompt}`,
          url: currentRender.outputUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(currentRender?.outputUrl || '');
    }
  };

  const handleUpscale = async (scale: 2 | 4 | 10) => {
    if (!currentRender?.outputUrl) return;
    
    // Get aspect ratio from current render settings or default
    const renderAspectRatio = currentRender.settings?.aspectRatio || aspectRatio;
    
    await upscaleImage({
      imageUrl: currentRender.outputUrl,
      scale,
      quality: 'high',
      projectId: projectId || '',
      chainId: chainId || undefined,
      referenceRenderId: currentRender.id || undefined,
      aspectRatio: renderAspectRatio
    });
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
        dispatchChat({ type: 'ADD_MESSAGE', payload: userMessage });
        dispatchChat({ type: 'ADD_MESSAGE', payload: assistantMessage });
      }
      
      // Update current render to the upscaled version
      dispatchChat({ type: 'SET_CURRENT_RENDER', payload: upscaledRender });
      onRenderComplete?.(upscaledRender);
      
      // Scroll to bottom to show new upscaled version
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [upscalingResult, projectId, chainId, currentRender, aspectRatio, onRenderComplete]);



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
        
        {/* Version Carousel - Mobile */}
        {messages.some(m => m.render && (m.render.type === 'image' || m.render.type === 'video')) && (
          <div className="relative px-4 py-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Button
                variant={mobileCarouselScrollPosition > 0 ? "ghost" : "outline"}
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                disabled={mobileCarouselScrollPosition <= 0}
                onClick={() => {
                  if (mobileCarouselRef.current && mobileCarouselScrollPosition > 0) {
                    mobileCarouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div
                ref={mobileCarouselRef}
                className="flex-1 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
                onScroll={(e) => {
                  setMobileCarouselScrollPosition(e.currentTarget.scrollLeft);
                }}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex gap-2">
                  {/* ✅ SIMPLIFIED: Use completedRenders directly (already sorted by chainPosition) */}
                  {(() => {
                    const carouselRenders = completedRenders.filter(r => r.type === 'image' || r.type === 'video');
                    logger.log('🖼️ [CAROUSEL DEBUG] Rendering carousel thumbnails', {
                      totalCompleted: completedRenders.length,
                      carouselRendersCount: carouselRenders.length,
                      currentRenderId: currentRender?.id,
                      currentRenderVersion: getVersionNumber(currentRender, chain?.renders),
                      carouselRenders: carouselRenders.map((r, idx) => ({
                        index: idx,
                        id: r.id,
                        chainPosition: r.chainPosition,
                        version: getVersionNumber(r, chain?.renders),
                        isSelected: r.id === currentRender?.id,
                        outputUrl: r.outputUrl?.substring(0, 30) + '...'
                      }))
                    });
                    return carouselRenders.map((render, index) => {
                      const versionNumber = getVersionNumber(render, chain?.renders) || (index + 1);
                      const isSelected = currentRender?.id === render.id;
                      return (
                      <div
                        key={render.id}
                        className={cn(
                          "relative w-8 h-8 rounded border-2 cursor-pointer transition-all shrink-0 overflow-hidden",
                          isSelected
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => {
                          logger.log('🖼️ [CAROUSEL DEBUG] Thumbnail clicked', {
                            renderId: render.id,
                            chainPosition: render.chainPosition,
                            version: versionNumber,
                            previousCurrentRenderId: currentRender?.id,
                            previousCurrentRenderVersion: getVersionNumber(currentRender, chain?.renders)
                          });
                          // ✅ SIMPLIFIED: Use render directly from completedRenders
                          userSelectedRenderIdRef.current = render.id;
                          setCurrentRender(render);
                        }}
                      >
                        {render.type === 'video' ? (
                          render.outputUrl ? (
                            <video
                              src={render.outputUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                              <Video className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )
                        ) : render.outputUrl ? (
                          shouldUseRegularImg(render.outputUrl) ? (
                            <img
                              src={render.outputUrl}
                              alt={`Version ${versionNumber}`}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const fallbackUrl = handleImageErrorWithFallback(render.outputUrl!, e);
                                if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                                  img.src = fallbackUrl;
                                } else {
                                  img.src = '/placeholder-image.jpg';
                                }
                              }}
                            />
                          ) : (
                            <Image
                              src={render.outputUrl}
                              alt={`Version ${versionNumber}`}
                              fill
                              className="object-cover"
                            />
                          )
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      );
                    });
                  })()}
                </div>
              </div>
              <Button
                variant={mobileCarouselRef.current && mobileCarouselScrollPosition < (mobileCarouselRef.current.scrollWidth - mobileCarouselRef.current.clientWidth - 10) ? "ghost" : "outline"}
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                disabled={mobileCarouselRef.current ? mobileCarouselScrollPosition >= (mobileCarouselRef.current.scrollWidth - mobileCarouselRef.current.clientWidth - 10) : true}
                onClick={() => {
                  if (mobileCarouselRef.current) {
                    const canScroll = mobileCarouselScrollPosition < (mobileCarouselRef.current.scrollWidth - mobileCarouselRef.current.clientWidth - 10);
                    if (canScroll) {
                      mobileCarouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                    }
                  }
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
                          No chains available
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
          
          {/* Version Carousel - Desktop */}
          {messages.some(m => m.render && (m.render.type === 'image' || m.render.type === 'video')) && (
            <div className="relative px-4 py-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Button
                  variant={carouselScrollPosition > 0 ? "ghost" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  disabled={carouselScrollPosition <= 0}
                  onClick={() => {
                    if (carouselRef.current && carouselScrollPosition > 0) {
                      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div
                  ref={carouselRef}
                  className="flex-1 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
                  onScroll={(e) => {
                    setCarouselScrollPosition(e.currentTarget.scrollLeft);
                  }}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex gap-2">
                    {messages
                      .filter(m => m.render && (m.render.type === 'image' || m.render.type === 'video'))
                      // ✅ FIXED: Sort by chainPosition to ensure correct order
                      .sort((a, b) => {
                        const aPos = a.render?.chainPosition ?? -1;
                        const bPos = b.render?.chainPosition ?? -1;
                        return aPos - bPos;
                      })
                      .map((message, index) => (
                        <div
                          key={message.id}
                          className={cn(
                            "relative w-8 h-8 rounded border-2 cursor-pointer transition-all shrink-0 overflow-hidden",
                            currentRender?.id === message.render?.id
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => {
                            // ✅ SIMPLIFIED: Get render from chain.renders (single source of truth)
                            const render = getRenderById(chain?.renders, message.render!.id) || message.render!;
                            userSelectedRenderIdRef.current = render.id;
                            setCurrentRender(render);
                          }}
                        >
                          {message.render!.type === 'video' ? (
                            <video
                              src={message.render!.outputUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : message.render!.outputUrl ? (
                            // Use regular img tag for external storage URLs to avoid Next.js 16 private IP blocking
                          shouldUseRegularImg(message.render!.outputUrl) ? (
                            <img
                              src={message.render!.outputUrl}
                              alt={`Version ${getVersionNumber(message.render, chain?.renders) || index + 1}`}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const originalUrl = message.render!.outputUrl;
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
                                src={message.render!.outputUrl}
                                alt={`Version ${getVersionNumber(message.render, chain?.renders) || index + 1}`}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  console.error('Image load error:', message.render!.outputUrl);
                                  logger.error('Failed to load image:', message.render!.outputUrl);
                                  // Note: Next.js Image component doesn't support dynamic src changes
                                  // Fallback is handled by using regular img tags for CDN URLs
                                }}
                              />
                            )
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
                <Button
                  variant={carouselRef.current && carouselScrollPosition < (carouselRef.current.scrollWidth - carouselRef.current.clientWidth - 10) ? "ghost" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  disabled={carouselRef.current ? carouselScrollPosition >= (carouselRef.current.scrollWidth - carouselRef.current.clientWidth - 10) : true}
                  onClick={() => {
                    if (carouselRef.current) {
                      const canScroll = carouselScrollPosition < (carouselRef.current.scrollWidth - carouselRef.current.clientWidth - 10);
                      if (canScroll) {
                        carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                      }
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-1 sm:p-1 space-y-1 sm:space-y-1 min-h-0">
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
                logger.log('🎨 UnifiedChatInterface: Rendering messages list', {
                  totalMessages: messages.length,
                  userMessages: messages.filter(m => m.type === 'user').length,
                  assistantMessages: messages.filter(m => m.type === 'assistant').length,
                  messageIds: messages.map(m => ({ id: m.id, type: m.type, hasRender: !!m.render })),
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
                
                if (messages.length === 0) {
                  logger.warn('⚠️ UnifiedChatInterface: Messages array is EMPTY - nothing to render!');
                  return <div className="text-center text-muted-foreground mt-8">No messages to display</div>;
                }
                
                return messages.map((message, index) => {
                // Removed verbose per-message logging for performance
                // Logger is production-safe, but too many logs slow down rendering
              
                return (
                <div
                  key={`${message.id}-${message.timestamp.getTime()}`}
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
                        <TruncatedMessage 
                          content={message.content} 
                          className="text-xs sm:text-sm" 
                          maxLines={4}
                        />
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
                            dispatchChat({ type: 'SET_INPUT_VALUE', payload: message.content });
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
                  
                  {/* Show uploaded image in user message */}
                  {message.uploadedImage && message.uploadedImage.previewUrl && (
                    <div className="mt-2">
                      <div className="relative w-24 h-16 sm:w-32 sm:h-20 bg-muted/20 rounded-lg overflow-hidden border border-white/20">
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
                      </div>
                      <p className="text-[10px] sm:text-xs text-white/70 mt-1">
                        {message.uploadedImage.persistedUrl ? 'Using uploaded image' : 'Working with uploaded image'}
                      </p>
                    </div>
                  )}
                  
                  {message.isGenerating && (
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
                      <div className="relative w-full max-w-full aspect-video rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-muted animate-in fade-in-0 zoom-in-95 duration-500"
                        onClick={() => {
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
              {/* Video Mode Badge, Model Selector, and Private/Public Toggle - Above prompt box */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  {isVideoMode && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 sm:px-2 py-0.5 flex items-center gap-1 shrink-0">
                      <Video className="h-3 w-3" />
                      <span className="hidden xs:inline">Video Mode</span>
                      <span className="xs:hidden">Video</span>
                    </Badge>
                  )}
                  {/* Model Selector - Responsive container */}
                  <div className="flex-1 min-w-0 max-w-full border border-muted-foreground/20 rounded-md h-7 sm:h-8 flex items-center">
                    <ModelSelector
                      type={isVideoMode ? 'video' : 'image'}
                      value={(isVideoMode ? selectedVideoModel : selectedImageModel) as ModelId | undefined}
                      onValueChange={(modelId) => {
                        if (isVideoMode) {
                          setSelectedVideoModel(modelId);
                        } else {
                          setSelectedImageModel(modelId);
                          // Auto-adjust quality if current quality is not supported
                          const modelConfig = getModelConfig(modelId);
                          if (modelConfig && modelConfig.type === 'image') {
                            if (!modelSupportsQuality(modelId, quality as 'standard' | 'high' | 'ultra')) {
                              const maxQuality = getMaxQuality(modelId);
                              setQuality(maxQuality);
                              toast.info(`Quality adjusted to ${maxQuality} (maximum supported by selected model)`);
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
                  {/* Gallery and Builder Buttons - Same column as Model Selector */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPromptGalleryOpen(true)}
                      className="h-7 sm:h-8 px-2 text-[10px] sm:text-xs border border-muted-foreground/20 hover:border-transparent active:border-transparent focus-visible:border-transparent"
                      disabled={isGenerating}
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      Prompts
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPromptBuilderOpen(true)}
                      className="h-7 sm:h-8 px-2 text-[10px] sm:text-xs border border-muted-foreground/20 hover:border-transparent active:border-transparent focus-visible:border-transparent"
                      disabled={isGenerating}
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Builder
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 border border-muted-foreground/20 rounded-md px-2 h-7 sm:h-8">
                  <Label htmlFor="privacy-toggle" className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-1.5 cursor-pointer">
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
                    id="privacy-toggle"
                    checked={!isPublic}
                    onCheckedChange={(checked) => {
                      if (!isPro && checked) {
                        // Free user trying to make private - show upgrade dialog
                        setIsUpgradeDialogOpen(true);
                      } else {
                        // Pro user or making public - allow toggle
                        setIsPublic(!checked);
                      }
                    }}
                    disabled={!isPro && !isPublic} // Free users can't turn off public
                    className="shrink-0"
                  />
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
                                  setQuality(v);
                                } else {
                                  toast.error(`This quality is not supported by the selected model. Maximum quality: ${getMaxQuality(modelId)}`);
                                }
                              } else {
                                setQuality(v);
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
                                     setVideoKeyframes(prev => [...prev, {
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

            {/* Credit Usage, Get Pro, and Project Rules - Show for all users */}
            <>
              <div className="border-t border-border my-2" />
              <div className="flex gap-1.5 mt-2">
                {/* Credit Usage - 50% space */}
                <div className={cn(
                  "flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md border h-6 sm:h-7 flex-[2]",
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
                        <span className="text-muted-foreground"> needed / </span>
                        <span className="text-destructive font-semibold">{credits.balance}</span>
                        <span className="text-muted-foreground"> left</span>
                      </div>
                    </>
                  ) : credits && credits.balance < getCreditsCost() * 2 ? (
                    <>
                      <FaExclamationTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                      <div className="text-[11px] sm:text-sm text-center leading-tight">
                        <span className="text-yellow-600 dark:text-yellow-500 font-semibold">{getCreditsCost()}</span>
                        <span className="text-muted-foreground"> needed / </span>
                        <span className="text-yellow-600 dark:text-yellow-500 font-semibold">{credits.balance}</span>
                        <span className="text-muted-foreground"> left</span>
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
                {/* Get Pro - 25% space (only show for non-Pro users) */}
                {!isPro && (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 flex-1"
                    onClick={() => window.open('/pricing', '_blank')}
                  >
                    Get Pro
                  </Button>
                )}
                {/* Project Rules - 25% space */}
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-6 sm:h-7 text-[10px] sm:text-xs px-2", !isPro ? "flex-1" : "flex-[2]")}
                  onClick={() => setIsProjectRulesModalOpen(true)}
                  title="Project Rules"
                >
                  <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />
                  <span>Rules</span>
                  {projectRules && projectRules.length > 0 && (
                    <span className="ml-0.5 sm:ml-1 px-1 py-0.5 bg-primary/10 text-primary rounded text-[8px] sm:text-[9px] font-medium">
                      {projectRules.length}
                    </span>
                  )}
                </Button>
              </div>
            </>
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
        {/* Header with Toolbar - ONLY in output area, never in chat */}
        <div className="border-b border-border shrink-0 z-10">
          <div className="px-4 py-1.5 h-11 flex items-center">
            {/* Toolbar - Only show when there's a render AND we're in output area (not chat) */}
            {currentRender && (() => {
              // ✅ SIMPLIFIED: Always use index in completed renders array for version number
              // Get the latest data from chain.renders to ensure we have the correct data
              const renderWithLatestData = getRenderById(chain?.renders, currentRender.id) || currentRender;
              const versionNumber = getVersionNumber(renderWithLatestData, chain?.renders) || 1;
              
              // Debug logging
              if (process.env.NODE_ENV === 'development') {
                logger.log('🔍 UnifiedChatInterface: Displaying render', {
                  renderId: renderWithLatestData.id,
                  chainPosition: renderWithLatestData.chainPosition,
                  versionNumber,
                  latestRenderChainPosition: latestRender?.chainPosition,
                  latestRenderVersion: getVersionNumber(latestRender, chain?.renders),
                  completedRendersCount: completedRenders.length
                });
              }
              
              return (
                <div className="flex items-center gap-3 w-full">
                  {/* Sidebar Toggle Button - Only show on desktop when sidebar is visible */}
                  {mobileView !== 'render' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="h-7 w-7 p-0 shrink-0 hidden lg:flex"
                        title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                      >
                        {isSidebarCollapsed ? (
                          <PanelRight className="h-3 w-3" />
                        ) : (
                          <PanelLeft className="h-3 w-3" />
                        )}
                      </Button>
                      
                      {/* Separator */}
                      <div className="h-4 w-px bg-border shrink-0 hidden lg:block"></div>
                    </>
                  )}
                  
                  {/* Version Control Dropdown */}
                  {messages.some(m => m.render) && (
                    <Select 
                      value={currentRender?.id} 
                      onValueChange={(value) => {
                        // ✅ SIMPLIFIED: Get render from chain.renders (single source of truth)
                        const render = getRenderById(chain?.renders, value);
                        if (render) {
                          userSelectedRenderIdRef.current = render.id;
                          setCurrentRender(render);
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 px-2 text-[10px] sm:text-xs w-auto min-w-[50px] sm:min-w-[100px] shrink-0">
                        <SelectValue>
                          {/* Mobile: Show v1, v2 | Desktop: Show Version 1, Version 2 */}
                          <span className="sm:hidden">v{versionNumber}</span>
                          <span className="hidden sm:inline">Version {versionNumber}</span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {/* ✅ SIMPLIFIED: Use completedRenders directly (already sorted by chainPosition) */}
                        {completedRenders.map((render, index) => {
                          const versionNumber = getVersionNumber(render, chain?.renders) || (index + 1);
                          // Find corresponding message for content
                          const message = messages.find(m => m.render?.id === render.id);
                          return (
                            <SelectItem key={render.id} value={render.id} className="text-xs">
                              {/* Mobile: Show v1, v2 | Desktop: Show full text */}
                              <span className="sm:hidden">v{versionNumber}</span>
                              <span className="hidden sm:inline">
                                Version {versionNumber} - {message?.content?.substring(0, 30) || render.prompt.substring(0, 30)}...
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Separator */}
                  <div className="h-4 w-px bg-border shrink-0"></div>
                  
                  {/* Tools - Icon-only buttons as square on mobile */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                    {/* Upscale */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 w-7 sm:h-7 sm:w-auto sm:px-2 text-[10px] p-0 flex items-center justify-center gap-0 sm:gap-1.5 shrink-0"
                          disabled={isUpscaling}
                        >
                          {isUpscaling ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin shrink-0" />
                              <span className="hidden sm:inline">Upscaling...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3 shrink-0" />
                              <span className="hidden sm:inline">Upscale</span>
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => handleUpscale(2)} disabled={isUpscaling}>
                          2x
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpscale(4)} disabled={isUpscaling}>
                          4x
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpscale(10)} disabled={isUpscaling}>
                          10x
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {/* Convert to Video */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        if (!currentRender?.outputUrl) return;
                        
                        try {
                          // Fetch the image and convert to File
                          const response = await fetch(currentRender.outputUrl);
                          const blob = await response.blob();
                          const file = new File([blob], `image-to-video-${Date.now()}.png`, { type: 'image/png' });
                          
                          // Set as uploaded file
                          setUploadedFile(file);
                          // previewUrl is automatically managed by useObjectURL hook
                          
                          // Enable video mode
                          setIsVideoMode(true);
                          
                          // Set a default prompt if input is empty
                          if (!inputValue.trim()) {
                            dispatchChat({ type: 'SET_INPUT_VALUE', payload: 'Animate this image with smooth, cinematic motion' });
                          }
                          
                          // Focus the input
                          setTimeout(() => {
                            textareaRef.current?.focus();
                          }, 100);
                          
                          toast.success('Image loaded for video generation! Add your animation prompt and click send.');
                        } catch (error) {
                          logger.error('Failed to load image for video conversion:', error);
                          toast.error('Failed to load image. Please try again.');
                        }
                      }} 
                      className="h-7 w-7 sm:h-7 sm:w-auto sm:px-2 text-[10px] p-0 flex items-center justify-center gap-0 sm:gap-1.5 shrink-0" 
                      disabled={!currentRender || currentRender.type === 'video' || isGenerating}
                      title="Convert to Video"
                    >
                      <Video className="h-3 w-3 shrink-0" />
                      <span className="hidden sm:inline">Video</span>
                    </Button>
                    {/* Download */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownload} 
                      className="h-7 w-7 sm:h-7 sm:w-auto sm:px-2 text-[10px] p-0 flex items-center justify-center gap-0 sm:gap-1.5 shrink-0"
                      title="Download"
                    >
                      <Download className="h-3 w-3 shrink-0" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                    {/* Share */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleShare} 
                      className="h-7 w-7 sm:h-7 sm:w-auto sm:px-2 text-[10px] p-0 flex items-center justify-center gap-0 sm:gap-1.5 shrink-0"
                      title="Share"
                    >
                      <Share2 className="h-3 w-3 shrink-0" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                    {/* Before/After Toggle - Show when there's uploaded image OR when no upload but previous version exists */}
                    {/* ✅ FIX: Check both renderWithLatestData AND currentRender for uploadedImageUrl */}
                    {currentRender && currentRender.type === 'image' && renderWithLatestData && (
                      ((renderWithLatestData.uploadedImageUrl || currentRender.uploadedImageUrl) || 
                       (!renderWithLatestData.uploadedImageUrl && !currentRender.uploadedImageUrl && previousRender && previousRender.outputUrl)) && (
                        <div className="flex items-center gap-1 h-7 px-2 sm:px-3 border border-input bg-background rounded-md flex-1">
                          <Button
                            variant={beforeAfterView === 'before' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setBeforeAfterView('before')}
                            className="h-5 sm:h-6 px-2 sm:px-3 text-[10px] sm:text-xs flex-1"
                            title="Before"
                          >
                            Before
                          </Button>
                          <div className="h-3 w-px bg-border"></div>
                          <Button
                            variant={beforeAfterView === 'after' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setBeforeAfterView('after')}
                            className="h-5 sm:h-6 px-2 sm:px-3 text-[10px] sm:text-xs flex-1"
                            title="After"
                          >
                            After
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        {/* Render Content */}
        <div className="flex-1 p-1 sm:p-2 overflow-hidden min-h-0">
            <div className="h-full w-full flex flex-col lg:flex-row items-center justify-center overflow-hidden">
              <div className="flex-1 overflow-hidden w-full h-full min-w-0 min-h-0">
              {isGenerating || isImageGenerating || isVideoGenerating ? (
                <Card className="w-full h-full py-0 gap-0 overflow-hidden">
                  <CardContent className="p-0 h-full overflow-hidden">
                    <div className="h-full w-full flex flex-col overflow-hidden">
                      {/* Loading Display */}
                      <div className="flex-1 bg-muted rounded-t-lg overflow-hidden relative min-h-[200px] sm:min-h-[300px] min-w-0">
                        <div className="w-full h-full flex items-center justify-center relative p-1 overflow-hidden min-w-0">
                          <div className="text-center space-y-3 sm:space-y-6">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                              <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-spin" />
                            </div>
                            
                            <div className="w-48 sm:w-64 space-y-2">
                              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                                <span>Progress</span>
                                <span>{Math.round(Math.min(progress, 100))}%</span>
                              </div>
                              <Progress value={Math.min(progress, 100)} className="h-1.5 sm:h-2" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : currentRender ? (
                <Card className="w-full h-full py-0 gap-0 overflow-hidden">
                  <CardContent className="p-0 h-full overflow-hidden">
                    <div className="h-full w-full flex flex-col overflow-hidden">
                      {/* Image/Video Display */}
                      <div className="flex-1 bg-muted rounded-t-lg overflow-hidden relative min-h-[200px] sm:min-h-[300px] min-w-0">
                        <div className="w-full h-full flex items-center justify-center relative p-0 overflow-hidden min-w-0">
                        {renderWithLatestData?.type === 'video' ? (
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
                        ) : renderWithLatestData && ((renderWithLatestData.uploadedImageUrl || currentRender.uploadedImageUrl) || (previousRender && previousRender.outputUrl)) ? (
                          // Before/After Comparison - Show uploaded vs rendered OR previous version vs current
                          <div className="w-full h-full">
                              {beforeAfterView === 'before' ? (
                                <div className="w-full h-full flex items-center justify-center relative">
                                  {/* Show uploaded image if available, otherwise show previous version */}
                                  {renderWithLatestData.uploadedImageUrl ? (
                                    // Before = Uploaded Image
                                    shouldUseRegularImg(renderWithLatestData.uploadedImageUrl) ? (
                                      <img
                                        src={renderWithLatestData.uploadedImageUrl}
                                        alt="Uploaded image"
                                        className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                                        onClick={() => setIsFullscreen(true)}
                                        onError={(e) => {
                                          const img = e.target as HTMLImageElement;
                                          const originalUrl = renderWithLatestData.uploadedImageUrl;
                                          logger.error('🖼️ [MAIN RENDER DEBUG] Uploaded image load error', {
                                            originalUrl: originalUrl?.substring(0, 50) + '...'
                                          });
                                          const fallbackUrl = handleImageErrorWithFallback(originalUrl || '', e);
                                          if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                                            img.src = fallbackUrl;
                                          } else {
                                            img.src = '/placeholder-image.jpg';
                                          }
                                        }}
                                      />
                                    ) : (
                                      <Image
                                        src={renderWithLatestData.uploadedImageUrl || '/placeholder-image.jpg'}
                                        alt="Uploaded image"
                                        fill
                                        className="object-contain cursor-pointer"
                                        sizes="100vw"
                                        onClick={() => setIsFullscreen(true)}
                                        onError={(e) => {
                                          logger.error('🖼️ [MAIN RENDER DEBUG] Uploaded Next.js Image load error', {
                                            uploadedImageUrl: renderWithLatestData.uploadedImageUrl?.substring(0, 50) + '...'
                                          });
                                        }}
                                      />
                                    )
                                  ) : previousRender && previousRender.outputUrl ? (
                                    // Before = Previous Version (only when no uploaded image)
                                    shouldUseRegularImg(previousRender.outputUrl) ? (
                                      <img
                                        src={previousRender.outputUrl}
                                        alt="Previous render"
                                        className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                                        onClick={() => setIsFullscreen(true)}
                                        onError={(e) => {
                                          const img = e.target as HTMLImageElement;
                                          const originalUrl = previousRender.outputUrl;
                                          logger.error('🖼️ [MAIN RENDER DEBUG] Previous image load error', {
                                            originalUrl: originalUrl?.substring(0, 50) + '...'
                                          });
                                          const fallbackUrl = handleImageErrorWithFallback(originalUrl || '', e);
                                          if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                                            img.src = fallbackUrl;
                                          } else {
                                            img.src = '/placeholder-image.jpg';
                                          }
                                        }}
                                      />
                                    ) : (
                                      <Image
                                        src={previousRender.outputUrl || '/placeholder-image.jpg'}
                                        alt="Previous render"
                                        fill
                                        className="object-contain cursor-pointer"
                                        sizes="100vw"
                                        onClick={() => setIsFullscreen(true)}
                                        onError={(e) => {
                                          logger.error('🖼️ [MAIN RENDER DEBUG] Previous Next.js Image load error', {
                                            outputUrl: previousRender.outputUrl?.substring(0, 50) + '...'
                                          });
                                        }}
                                      />
                                    )
                                  ) : null}
                                  {/* Fullscreen Toggle */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsFullscreen(true)}
                                    className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/50 hover:bg-black/70 text-white h-7 w-7 sm:h-auto sm:w-auto sm:px-3"
                                  >
                                    <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              ) : (
                              <div className="w-full h-full flex items-center justify-center relative">
                                {shouldUseRegularImg(renderWithLatestData.outputUrl || '') ? (
                                  <img
                                    src={renderWithLatestData.outputUrl || ''}
                                    alt={renderWithLatestData.prompt}
                                    className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                                    onClick={() => setIsFullscreen(true)}
                                    onLoad={() => {
                                      logger.log('🖼️ [MAIN RENDER DEBUG] Image loaded successfully', {
                                        renderId: renderWithLatestData.id,
                                        version: displayVersion,
                                        outputUrl: renderWithLatestData.outputUrl?.substring(0, 50) + '...'
                                      });
                                    }}
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      const originalUrl = renderWithLatestData.outputUrl;
                                      logger.error('🖼️ [MAIN RENDER DEBUG] Image load error', {
                                        renderId: renderWithLatestData.id,
                                        version: displayVersion,
                                        originalUrl: originalUrl?.substring(0, 50) + '...'
                                      });
                                      const fallbackUrl = handleImageErrorWithFallback(originalUrl || '', e);
                                      if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                                        logger.log('🖼️ [MAIN RENDER DEBUG] Trying fallback URL', {
                                          fallbackUrl: fallbackUrl.substring(0, 50) + '...'
                                        });
                                        img.src = fallbackUrl;
                                      } else {
                                        img.src = '/placeholder-image.jpg';
                                      }
                                    }}
                                  />
                                ) : (
                                  <Image
                                    src={renderWithLatestData.outputUrl || '/placeholder-image.jpg'}
                                    alt={renderWithLatestData.prompt}
                                    fill
                                    className="object-contain cursor-pointer"
                                    sizes="100vw"
                                    onClick={() => setIsFullscreen(true)}
                                    onLoad={() => {
                                      logger.log('🖼️ [MAIN RENDER DEBUG] Next.js Image loaded successfully', {
                                        renderId: renderWithLatestData.id,
                                        version: displayVersion
                                      });
                                    }}
                                    onError={(e) => {
                                      logger.error('🖼️ [MAIN RENDER DEBUG] Next.js Image load error', {
                                        renderId: renderWithLatestData.id,
                                        version: displayVersion,
                                        outputUrl: renderWithLatestData.outputUrl?.substring(0, 50) + '...'
                                      });
                                    }}
                                  />
                                )}
                                {/* Fullscreen Toggle */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setIsFullscreen(true)}
                                  className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/50 hover:bg-black/70 text-white h-7 w-7 sm:h-auto sm:w-auto sm:px-3"
                                >
                                  <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : renderWithLatestData ? (
                          <>
                            {/* Use regular img tag for external storage URLs to avoid Next.js 16 private IP blocking */}
                            {shouldUseRegularImg(renderWithLatestData.outputUrl || '') ? (
                              <img
                                src={renderWithLatestData.outputUrl || ''}
                                alt={renderWithLatestData.prompt}
                                className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                                onClick={() => setIsFullscreen(true)}
                                onLoad={() => {
                                  logger.log('🖼️ [MAIN RENDER DEBUG] Image loaded successfully', {
                                    renderId: renderWithLatestData.id,
                                    version: displayVersion,
                                    outputUrl: renderWithLatestData.outputUrl?.substring(0, 50) + '...'
                                  });
                                }}
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  const originalUrl = renderWithLatestData.outputUrl;
                                  logger.error('🖼️ [MAIN RENDER DEBUG] Image load error', {
                                    renderId: renderWithLatestData.id,
                                    version: displayVersion,
                                    originalUrl: originalUrl?.substring(0, 50) + '...'
                                  });
                                  
                                  // Try CDN fallback to direct GCS URL
                                  const fallbackUrl = handleImageErrorWithFallback(originalUrl || '', e);
                                  if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                                    logger.log('🖼️ [MAIN RENDER DEBUG] Trying fallback URL', {
                                      fallbackUrl: fallbackUrl.substring(0, 50) + '...'
                                    });
                                    img.src = fallbackUrl;
                                  } else {
                                    // No fallback available, use placeholder
                                    img.src = '/placeholder-image.jpg';
                                  }
                                }}
                              />
                            ) : (
                              <Image
                                src={renderWithLatestData.outputUrl || '/placeholder-image.jpg'}
                                alt={renderWithLatestData.prompt}
                                fill
                                className="object-contain cursor-pointer"
                                sizes="100vw"
                                onClick={() => setIsFullscreen(true)}
                                onLoad={() => {
                                  logger.log('🖼️ [MAIN RENDER DEBUG] Next.js Image loaded successfully', {
                                    renderId: renderWithLatestData.id,
                                    version: displayVersion
                                  });
                                }}
                                onError={(e) => {
                                  logger.error('🖼️ [MAIN RENDER DEBUG] Next.js Image load error', {
                                    renderId: renderWithLatestData.id,
                                    version: displayVersion,
                                    outputUrl: renderWithLatestData.outputUrl?.substring(0, 50) + '...'
                                  });
                                }}
                              />
                            )}
                            {/* Fullscreen Toggle */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsFullscreen(true)}
                              className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/50 hover:bg-black/70 text-white h-7 w-7 sm:h-auto sm:w-auto sm:px-3"
                            >
                              <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </>
                        ) : null}
                        </div>
                      </div>

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
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center p-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Wand2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2">Ready to Generate</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Describe your vision to create amazing renders
                  </p>
                </div>
              )}
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
        onClose={() => setIsPromptGalleryOpen(false)}
        onSelectPrompt={(prompt) => {
          dispatchChat({ type: 'SET_INPUT_VALUE', payload: prompt });
          setIsPromptGalleryOpen(false);
        }}
        type={isVideoMode ? 'video' : 'image'}
      />
      <PromptBuilderModal
        isOpen={isPromptBuilderOpen}
        onClose={() => setIsPromptBuilderOpen(false)}
        onSelectPrompt={(prompt) => {
          dispatchChat({ type: 'SET_INPUT_VALUE', payload: prompt });
          setIsPromptBuilderOpen(false);
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

      {/* Fullscreen Image Dialog */}
      {isFullscreen && currentRender && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {currentRender.type === 'video' ? (
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
            )}
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white h-10 w-10 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
            
            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                {currentRender.prompt}
              </p>
            </div>
          </div>
        </div>
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
