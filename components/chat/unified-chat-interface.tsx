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
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  MoreVertical,
  PanelLeft,
  PanelRight,
  Plus,
  Pencil,
  Wand2,
  FileText
} from 'lucide-react';
import { 
  FaSquare,
  FaTv,
  FaTabletAlt,
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
import { useVersionContext } from '@/lib/hooks/use-version-context';
import { VideoPlayer } from '@/components/video/video-player';
import { UploadModal } from './upload-modal';
import { GalleryModal } from './gallery-modal';
import { ProjectRulesModal } from './project-rules-modal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Lock, Globe } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import { MentionTagger } from './mention-tagger';
import type { Render } from '@/lib/types/render';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';
import Image from 'next/image';
import { shouldUseRegularImg } from '@/lib/utils/storage-url';
import { handleImageErrorWithFallback, isCDNUrl } from '@/lib/utils/cdn-fallback';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';
import { getRenderiqMessage } from '@/lib/utils/renderiq-messages';
import { useLocalStorageMessages } from '@/lib/hooks/use-local-storage-messages';
import { useObjectURL } from '@/lib/hooks/use-object-url';
import { useModal } from '@/lib/hooks/use-modal';
import { createRenderFormData } from '@/lib/utils/render-form-data';
import { retryFetch } from '@/lib/utils/retry-fetch';

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

export function UnifiedChatInterface({ 
  projectId, 
  chainId, 
  chain,
  onRenderComplete, 
  onRenderStart,
  onRefreshChain,
  projectName,
  onBackToProjects
}: UnifiedChatInterfaceProps) {
  const router = useRouter();
  
  // React 19: Track initialization per chainId to prevent re-initialization
  const initializedChainIdRef = useRef<string | undefined>(undefined);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Render state
  const [currentRender, setCurrentRender] = useState<Render | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [referenceRenderId, setReferenceRenderId] = useState<string | undefined>();
  
  // Fixed aspect ratio for better quality
  const aspectRatio = DEFAULT_ASPECT_RATIO;
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  // Use custom hook for object URL management
  const previewUrl = useObjectURL(uploadedFile);
  
  
  // Style settings
  const [environment, setEnvironment] = useState<string>('none');
  const [effect, setEffect] = useState<string>('none');
  const [styleTransferImage, setStyleTransferImage] = useState<File | null>(null);
  const [styleTransferPreview, setStyleTransferPreview] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<string>('0.5'); // Default 50% (0.5), options: 0, 0.25, 0.5, 0.75, 1.0
  const [quality, setQuality] = useState<string>('standard'); // Default quality: standard, high, ultra
  
  // Video controls
  const [videoDuration, setVideoDuration] = useState(8); // Veo 3.1 supports 4, 6, or 8 seconds
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [videoKeyframes, setVideoKeyframes] = useState<Array<{ id: string; imageData: string; imageType: string; timestamp?: number }>>([]);
  const [videoLastFrame, setVideoLastFrame] = useState<{ imageData: string; imageType: string } | null>(null);
  
  // Render visibility - Free users default to public, Pro users default to private
  const [isPublic, setIsPublic] = useState(true); // Will be updated based on isPro
  
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
  
  // Mention state
  const [currentMentionPosition, setCurrentMentionPosition] = useState(-1);
  
  // UI state
  const [isLiked, setIsLiked] = useState(false);
  
  // Mobile view state - toggle between chat and render
  const [mobileView, setMobileView] = useState<'chat' | 'render'>('chat');
  
  // Version carousel state
  const [carouselScrollPosition, setCarouselScrollPosition] = useState(0);
  const [mobileCarouselScrollPosition, setMobileCarouselScrollPosition] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreatingChain, setIsCreatingChain] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastChainRenderCountRef = useRef(0); // Track chain render count to detect new renders
  const messagesRef = useRef<Message[]>([]); // Track messages via ref
  const chainRendersRef = useRef(chain?.renders); // Track chain renders via ref to avoid dependency loops
  const hasProcessingRendersRef = useRef(false); // Track if we have processing renders for polling
  
  // Hooks
  const { credits } = useCredits();
  const { rules: projectRules } = useProjectRules(chainId);
  const { profile } = useUserProfile();
  const { data: isPro, loading: proLoading } = useIsPro(profile?.id);
  const { upscaleImage, isUpscaling, upscalingResult, error: upscalingError } = useUpscaling();
  
  // LocalStorage management hook
  const { saveMessages, restoreMessages, getStorageKey } = useLocalStorageMessages(messages, projectId, chainId);
  
  // Update isPublic based on pro status: Free users = public (true), Pro users = private (false)
  useEffect(() => {
    if (!proLoading) {
      setIsPublic(!isPro); // Free users are public, Pro users are private by default
    }
  }, [isPro, proLoading]);
  
  // Find previous render for before/after comparison
  const previousRender = useMemo(() => {
    if (!currentRender || !chain?.renders || currentRender.type === 'video') return null;
    const currentPosition = currentRender.chainPosition ?? 0;
    if (currentPosition === 0) return null; // No previous render if this is the first
    
    const prev = chain.renders.find(
      r => r.chainPosition === currentPosition - 1 && 
      r.status === 'completed' && 
      r.outputUrl &&
      r.type === 'image'
    );
    return prev || null;
  }, [currentRender, chain]);
  
  // Google Generative AI hooks
  const { isGenerating: isImageGenerating } = useImageGeneration();
  const { isGenerating: isVideoGenerating } = useVideoGeneration();
  
  // Version context hook
  const { parsePrompt } = useVersionContext();

  // Update progress during generation - sync with actual generation state
  useEffect(() => {
    if (isGenerating || isImageGenerating || isVideoGenerating) {
      // Reset progress when generation starts
      setProgress(10);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          // Gradually increase progress, but cap at 90% until completion
          if (prev >= 90) return 90;
          // More realistic progress: slower at start, faster in middle
          const increment = prev < 30 ? 2 : prev < 70 ? 5 : 3;
          const newProgress = Math.min(prev + increment, 90);
          
              // Progress updates don't need to update messages array
          // Message content is handled separately to avoid re-renders
          return newProgress;
        });
      }, 500); // Update every 500ms for smoother progress
      
      return () => {
        clearInterval(interval);
        // When generation stops, complete the progress bar
        setProgress(100);
        // Reset after a brief moment
        setTimeout(() => setProgress(0), 300);
      };
    }
  }, [isGenerating, isImageGenerating, isVideoGenerating, isVideoMode]);

  // ✅ SIMPLIFIED: Initialize chain data only when chainId changes (not when chain prop changes)
  useEffect(() => {
    const currentChainId = chainId || chain?.id;
    
    // Only initialize once per chainId
    if (initializedChainIdRef.current === currentChainId) {
      return;
    }

    logger.log('🔍 UnifiedChatInterface: Initializing chain data', {
      chainId: currentChainId,
      rendersCount: chain?.renders?.length || 0
    });
    
    // Try to load from localStorage first as backup
    const storedMessages = restoreMessages();
    
    // Convert renders to messages if chain has renders
    if (chain && chain.renders && chain.renders.length > 0) {
      const chainMessages: Message[] = chain.renders
        .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0))
        .map((render) => {
          const userMessage: Message = {
            id: `user-${render.id}`,
            type: 'user',
            content: render.prompt,
            timestamp: render.createdAt,
            referenceRenderId: render.referenceRenderId || undefined,
            uploadedImage: render.uploadedImageUrl ? {
              previewUrl: render.uploadedImageUrl,
              persistedUrl: render.uploadedImageUrl
            } : undefined
          };

          const assistantMessage: Message = {
            id: `assistant-${render.id}`,
            type: 'assistant',
            content: render.status === 'failed'
              ? 'Sorry, I couldn\'t generate your render. Please try again.'
              : render.status === 'processing' || render.status === 'pending'
              ? 'Generating your render...'
              : '',
            timestamp: render.updatedAt,
            render: render.status === 'completed' ? render : undefined,
            isGenerating: render.status === 'processing' || render.status === 'pending'
          };

          return [userMessage, assistantMessage];
        })
        .flat();
      
      setMessages(chainMessages);
      messagesRef.current = chainMessages;
      saveMessages(chainMessages);

      const latestCompletedRender = chain.renders
        .filter(r => r.status === 'completed')
        .sort((a, b) => (b.chainPosition || 0) - (a.chainPosition || 0))[0];
      
      if (latestCompletedRender) {
        setCurrentRender(latestCompletedRender);
      }
      
      lastChainRenderCountRef.current = chain.renders.length;
    } else if (storedMessages) {
      setMessages(storedMessages);
    } else {
      setMessages([]);
      setCurrentRender(null);
    }
    
    initializedChainIdRef.current = currentChainId;
  }, [chainId]); // ✅ SIMPLIFIED: Only depend on chainId - ignore chain prop changes

  // ✅ FIXED: Update chain renders ref when it changes
  useEffect(() => {
    chainRendersRef.current = chain?.renders;
  }, [chain?.renders]);

  // ✅ FIXED: Update messages when chain renders change - use refs to prevent loops
  useEffect(() => {
    const currentChainRenders = chainRendersRef.current;
    
    // Skip if not initialized or if chainId changed (handled by initialization useEffect)
    if (initializedChainIdRef.current !== (chainId || chain?.id) || !currentChainRenders) {
      return;
    }
    
    const currentRenderCount = currentChainRenders.length;
    const previousRenderCount = lastChainRenderCountRef.current;
    
    // Only update if render count changed (new render added)
    if (currentRenderCount > previousRenderCount) {
      // New render added - add it to messages
      const newRenders = currentChainRenders
        .filter(r => r.chainPosition !== undefined && r.chainPosition >= Math.floor(messagesRef.current.length / 2))
        .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0));
      
      if (newRenders.length > 0) {
        const newMessages: Message[] = newRenders.flatMap(render => {
          const userMessage: Message = {
            id: `user-${render.id}`,
            type: 'user',
            content: render.prompt,
            timestamp: render.createdAt,
            referenceRenderId: render.referenceRenderId || undefined,
            uploadedImage: render.uploadedImageUrl ? {
              previewUrl: render.uploadedImageUrl,
              persistedUrl: render.uploadedImageUrl
            } : undefined
          };

          const assistantMessage: Message = {
            id: `assistant-${render.id}`,
            type: 'assistant',
            content: render.status === 'processing' || render.status === 'pending' ? 'Generating your render...' : '',
            timestamp: render.updatedAt,
            render: render.status === 'completed' ? render : undefined,
            isGenerating: render.status === 'processing' || render.status === 'pending'
          };

          return [userMessage, assistantMessage];
        });
        
        setMessages(prev => {
          const updated = [...prev, ...newMessages];
          messagesRef.current = updated;
          return updated;
        });
      }
      
      lastChainRenderCountRef.current = currentRenderCount;
    } else {
      // Update existing messages if render status changed
      setMessages(prev => {
        const updated = prev.map(msg => {
          if (!msg.render) return msg;
          
          const updatedRender = currentChainRenders.find(r => r.id === msg.render?.id);
          if (!updatedRender) return msg;
          
          if (updatedRender.status === 'completed' && msg.isGenerating) {
            return {
              ...msg,
              content: '',
              isGenerating: false,
              render: updatedRender
            };
          } else if (updatedRender.status === 'failed' && msg.isGenerating) {
            return {
              ...msg,
              content: 'Sorry, I couldn\'t generate your render. Please try again.',
              isGenerating: false,
              render: undefined
            };
          }
          
          return msg;
        });
        
        messagesRef.current = updated;
        return updated;
      });
    }
  }, [chainId]); // ✅ FIXED: Only depend on chainId - use refs for chain.renders

  // ✅ FIXED: Update processing renders ref when messages change
  useEffect(() => {
    hasProcessingRendersRef.current = messages.some(m => m.isGenerating === true);
  }, [messages]);

  // ✅ FIXED: Poll for processing renders - use refs to avoid dependency loops
  useEffect(() => {
    if (!chainId || !onRefreshChain) return;
    
    // Check if we have processing renders using ref
    if (!hasProcessingRendersRef.current) {
      return;
    }
    
    // Poll every 5 seconds
    const pollInterval = setInterval(() => {
      // Check again using ref to avoid dependency on messages
      if (hasProcessingRendersRef.current) {
        onRefreshChain();
      } else {
        // No more processing renders - stop polling
        clearInterval(pollInterval);
      }
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [chainId, onRefreshChain]); // ✅ FIXED: Removed messages dependency - use ref instead

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
    // Calculate credits cost based on type and quality
    // Updated conversion rate: 1 USD = 100 INR
    if (isVideoMode) {
      // Video: 30 credits per second (2x markup, 100 INR/USD conversion)
      const creditsPerSecond = 30;
      return creditsPerSecond * videoDuration;
    } else {
      // Image: 5 credits base, multiplied by quality (2x markup, 100 INR/USD conversion)
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

    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = inputValue;
    setInputValue('');
    
    // Clear uploaded file after adding to message
    if (uploadedFile) {
      setUploadedFile(null);
      // previewUrl is automatically cleared by useObjectURL hook when file is null
    }
    
    setIsGenerating(true);
    setProgress(0); // Reset progress when starting new generation
    onRenderStart?.();

    // Add assistant message with generating state and Dominique's message
    const assistantMessage: Message = {
      id: `assistant-${crypto.randomUUID()}`,
      type: 'assistant',
      content: getRenderiqMessage(0, isVideoMode),
      timestamp: new Date(),
      isGenerating: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Define generationType outside try block so it's accessible in catch
    const generationType = isVideoMode ? 'video' : 'image';

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
          error: apiResult.error,
          status: response.status
        });
        
        if (apiResult.success && apiResult.data) {
          result = {
            success: true,
            data: {
              outputUrl: apiResult.data.outputUrl || '',
              processingTime: apiResult.data.processingTime || 0,
              provider: apiResult.data.provider || 'google-generative-ai'
            }
          };
        } else {
          // Check if it's a Google API error (should refund)
          const isGoogleError = apiResult.error?.includes('Google') || 
                                apiResult.error?.includes('Gemini') ||
                                apiResult.error?.includes('Veo') ||
                                apiResult.error?.includes('quota') ||
                                apiResult.error?.includes('rate limit');
          
          result = {
            success: false,
            error: apiResult.error || 'Image generation failed',
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
          uploadedImageUrl: null,
          uploadedImageKey: null,
          uploadedImageId: null,
          status: 'completed',
          errorMessage: null,
          processingTime: result.processingTime,
          chainId: chainId || null,
          chainPosition: Math.floor(messages.length / 2), // Position in chain (every 2 messages = 1 render)
          referenceRenderId: currentRender?.id || null, // Reference to previous version
          creditsCost: getCreditsCost(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        setCurrentRender(newRender);
        onRenderComplete?.(newRender);
        
        // Update the assistant message with the result and render (no constant text)
        setMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { 
                  ...msg, 
                  content: '', // Empty content - just show the render
                  isGenerating: false, 
                  render: newRender 
                }
              : msg
          );
          messagesRef.current = updated; // Update ref
          return updated;
        });
        
        // ✅ REMOVED: Don't call onRefreshChain() here - it causes page reload loops
        // The polling useEffect will handle checking for completion
        // The local state update above is sufficient for immediate UI feedback

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
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: isNetworkError 
                ? 'Network error. Please check your connection and try again.' 
                : isGoogleError
                ? 'Google AI service temporarily unavailable. Please try again in a moment.'
                : getRenderiqMessage(0, isVideoMode, true), 
              isGenerating: false 
            }
          : msg
      ));
      
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
      setProgress(0); // Reset progress when generation completes or fails
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
      setMessages(prev => {
        // Check if already added to prevent duplicates
        const alreadyExists = prev.some(msg => 
          msg.render?.outputUrl === upscalingResult.outputUrl
        );
        if (alreadyExists) {
          return prev;
        }
        return [...prev, userMessage, assistantMessage];
      });
      
      // Update current render to the upscaled version
      setCurrentRender(upscaledRender);
      onRenderComplete?.(upscaledRender);
      
      // Scroll to bottom to show new upscaled version
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [upscalingResult, projectId, chainId, currentRender, aspectRatio, onRenderComplete]);



  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Mobile View Toggle - Only visible on mobile/tablet */}
      <div className="lg:hidden border-b border-border bg-background sticky top-0 z-10">
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
                  {messages
                    .filter(m => m.render && (m.render.type === 'image' || m.render.type === 'video'))
                    .map((message, index) => (
                      <div
                        key={message.id}
                        className={cn(
                          "relative w-8 h-8 rounded border-2 cursor-pointer transition-all shrink-0 overflow-hidden",
                          currentRender?.id === message.render?.id
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setCurrentRender(message.render!)}
                      >
                        {message.render!.type === 'video' ? (
                          message.render!.outputUrl ? (
                            <video
                              src={message.render!.outputUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                              <Video className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )
                        ) : message.render!.outputUrl ? (
                          // Use regular img tag for external storage URLs to avoid Next.js 16 private IP blocking
                          shouldUseRegularImg(message.render!.outputUrl) ? (
                            <img
                              src={message.render!.outputUrl}
                              alt={`Version ${message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}`}
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
                              alt={`Version ${message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                console.error('Image load error:', message.render!.outputUrl);
                                logger.error('Failed to load image:', message.render!.outputUrl);
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
        "border-r border-border flex flex-col overflow-hidden transition-all duration-300",
        "w-full h-full",
        isSidebarCollapsed ? "lg:w-0 lg:border-r-0 lg:overflow-hidden" : "lg:w-1/4",
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
              <div className="text-right flex-1 min-w-0">
                <h1 className="text-sm font-semibold truncate">{projectName}</h1>
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
                      .map((message, index) => (
                        <div
                          key={message.id}
                          className={cn(
                            "relative w-8 h-8 rounded border-2 cursor-pointer transition-all shrink-0 overflow-hidden",
                            currentRender?.id === message.render?.id
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => setCurrentRender(message.render!)}
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
                              alt={`Version ${message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}`}
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
                                alt={`Version ${message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}`}
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
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 min-h-0 max-h-[calc(100vh-16rem)]">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8">
              <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-muted-foreground/50" />
              <p className="text-xs sm:text-sm mb-2">No chats yet</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground/70 mb-4">Start a conversation to generate renders</p>
              <Button
                onClick={async () => {
                  if (isCreatingChain) return;
                  setIsCreatingChain(true);
                  try {
                    const { createRenderChain } = await import('@/lib/actions/projects.actions');
                    const chainName = projectName ? `${projectName} - Render 1` : 'New Render Chain';
                    
                    const result = await createRenderChain(
                      projectId,
                      chainName,
                      'Render chain'
                    );

                    if (result.success && result.data) {
                      // Get project slug from the current URL or use a fallback
                      const currentPath = window.location.pathname;
                      const projectSlugMatch = currentPath.match(/\/project\/([^/]+)/);
                      const projectSlug = projectSlugMatch ? projectSlugMatch[1] : 'project';
                      
                      router.push(`/project/${projectSlug}/chain/${result.data.id}`);
                      // ✅ REMOVED: router.refresh() causes page reload - navigation is enough
                    } else {
                      toast.error(result.error || 'Failed to create chat');
                    }
                  } catch (error) {
                    console.error('Failed to create chain:', error);
                    toast.error('Failed to create chat');
                  } finally {
                    setIsCreatingChain(false);
                  }
                }}
                disabled={isCreatingChain}
                className="mt-2"
              >
                {isCreatingChain ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Make a new chat
                  </>
                )}
                </Button>
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
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Version {message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}</span>
                      </div>
                      <div className="relative w-full max-w-full aspect-video rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-muted animate-in fade-in-0 zoom-in-95 duration-500"
                        onClick={() => {
                          setCurrentRender(message.render!);
                          setMobileView('render');
                          
                          // If it's a video, switch to video mode on render tab
                          if (message.render?.type === 'video') {
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
              {/* Video Mode Badge and Private/Public Toggle - Above prompt box */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {isVideoMode && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      Video Mode
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="privacy-toggle" className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                    {isPublic ? (
                      <>
                        <Globe className="h-3 w-3" />
                        <span className="hidden sm:inline">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
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
                  className="h-8 sm:h-9 w-8 sm:w-9 shrink-0"
                  size="sm"
                >
                  {credits && credits.balance < getCreditsCost() ? (
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <>
                       {isGenerating ? (
                         <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                       ) : (
                         <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                       )}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadModalOpen}
                  className="h-8 sm:h-9 w-8 sm:w-9 shrink-0"
                  disabled={isGenerating}
                >
                  <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                                     setVideoKeyframes(prev => prev.filter(kf => kf.id !== keyframe.id));
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

            {!isPro && (
              <>
                <div className="border-t border-primary my-2" />
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
                  {/* Get Pro - 25% space */}
                  <Button
                    variant="default"
                    size="sm"
                    className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 flex-1"
                    onClick={() => window.open('/pricing', '_blank')}
                  >
                    Get Pro
                  </Button>
                  {/* Project Rules - 25% space */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 flex-1"
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
            )}
          </div>
        </div>
      </div>

      {/* Render Output Area - Responsive width */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden",
        // Mobile: show/hide based on mobileView - ONLY show in output area, never in chat
        mobileView === 'render' ? 'flex' : 'hidden lg:flex'
      )}>
        {/* Header with Toolbar - ONLY in output area, never in chat */}
        <div className="border-b border-border sticky top-0 z-10">
          <div className="px-4 py-1.5 h-11 flex items-center">
            {/* Toolbar - Only show when there's a render AND we're in output area (not chat) */}
            {currentRender && (() => {
              const versionNumber = currentRender.chainPosition !== undefined 
                ? currentRender.chainPosition + 1 
                : messages.findIndex(m => m.render?.id === currentRender.id) + 1;
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
                        const render = messages.find(m => m.render?.id === value)?.render;
                        if (render) setCurrentRender(render);
                      }}
                    >
                      <SelectTrigger className="h-7 px-2 text-[10px] sm:text-xs w-auto min-w-[80px] sm:min-w-[100px] shrink-0">
                        <SelectValue>
                          Version {versionNumber}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {messages
                          .filter(m => m.render)
                          .map((message, index) => {
                            const msgVersionNumber = message.render?.chainPosition !== undefined 
                              ? message.render.chainPosition + 1 
                              : index + 1;
                            return (
                              <SelectItem key={message.id} value={message.render!.id} className="text-xs">
                                Version {msgVersionNumber} - {message.content.substring(0, 30)}...
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Separator */}
                  <div className="h-4 w-px bg-border shrink-0"></div>
                  
                  {/* Tools - Spread evenly */}
                  <div className="flex items-center justify-between gap-2 flex-1">
                    {/* Upscale */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 px-2 text-[10px] flex-1 flex items-center justify-center gap-1.5"
                          disabled={isUpscaling}
                        >
                          {isUpscaling ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin shrink-0" />
                              <span>Upscaling...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3 shrink-0" />
                              <span>Upscale</span>
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
                            setInputValue('Animate this image with smooth, cinematic motion');
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
                      className="h-7 px-2 text-[10px] flex-1 flex items-center justify-center gap-1.5" 
                      disabled={!currentRender || currentRender.type === 'video' || isGenerating}
                    >
                      <Video className="h-3 w-3 shrink-0" />
                      <span>Video</span>
                    </Button>
                    {/* Download */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownload} 
                      className="h-7 px-1.5 sm:px-2 text-[10px] flex-1 flex items-center justify-center gap-1 sm:gap-1.5"
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
                      className="h-7 px-1.5 sm:px-2 text-[10px] flex-1 flex items-center justify-center gap-1 sm:gap-1.5"
                      title="Share"
                    >
                      <Share2 className="h-3 w-3 shrink-0" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                    {/* More Tools - Placeholder */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {}} 
                      className="h-7 px-1.5 sm:px-2 text-[10px] flex-1 flex items-center justify-center gap-1 sm:gap-1.5" 
                      disabled
                      title="More"
                    >
                      <MoreVertical className="h-3 w-3 shrink-0" />
                      <span className="hidden sm:inline">More</span>
                    </Button>
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
                        {currentRender.type === 'video' ? (
                          <video
                            src={currentRender.outputUrl}
                            className="w-full h-full object-contain cursor-pointer"
                            controls
                            loop
                            muted
                            playsInline
                            onClick={() => setIsFullscreen(true)}
                          />
                        ) : previousRender && previousRender.outputUrl ? (
                          // Before/After Comparison Slider
                          <div className="w-full h-full relative">
                            <ReactBeforeSliderComponent
                              firstImage={{ imageUrl: previousRender.outputUrl }}
                              secondImage={{ imageUrl: currentRender.outputUrl }}
                              currentPercentPosition={75} // 3/4 shows new (75% = new image visible)
                            />
                            {/* Labels */}
                            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                              Previous
                            </div>
                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                              Current
                            </div>
                            {/* Fullscreen Toggle */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsFullscreen(true)}
                              className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white h-7 w-7 sm:h-auto sm:w-auto sm:px-3"
                            >
                              <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            {/* Use regular img tag for external storage URLs to avoid Next.js 16 private IP blocking */}
                            {shouldUseRegularImg(currentRender.outputUrl) ? (
                              <img
                                src={currentRender.outputUrl}
                                alt={currentRender.prompt}
                                className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                                onClick={() => setIsFullscreen(true)}
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
                                src={currentRender.outputUrl || '/placeholder-image.jpg'}
                                alt={currentRender.prompt}
                                fill
                                className="object-contain cursor-pointer"
                                sizes="100vw"
                                onClick={() => setIsFullscreen(true)}
                                onError={(e) => {
                                  console.error('Image load error:', currentRender.outputUrl);
                                  logger.error('Failed to load image:', currentRender.outputUrl);
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
                        )}
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
}
