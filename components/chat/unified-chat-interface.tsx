'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  Image as ImageIcon, 
  Video, 
  Edit3, 
  Wand2, 
  Download, 
  Share2,
  Loader2,
  Sparkles,
  Upload,
  X,
  AlertCircle,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  Maximize,
  MessageSquare,
  ArrowLeft,
  Copy,
  Play,
  RotateCcw,
  Zap
} from 'lucide-react';
import { 
  FaSquare,
  FaTv,
  FaTabletAlt
} from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCredits } from '@/lib/hooks/use-credits';
import { useUpscaling } from '@/lib/hooks/use-upscaling';
import { usePromptEnhancement, useImageGeneration, useVideoGeneration, useAIChat } from '@/lib/hooks/use-ai-sdk';
import { useVersionContext } from '@/lib/hooks/use-version-context';
import { VideoPlayer } from '@/components/video/video-player';
import { UploadModal } from './upload-modal';
import { GalleryModal } from './gallery-modal';
import { MentionTagger } from './mention-tagger';
import type { Render } from '@/lib/types/render';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';
import Image from 'next/image';

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
  projectName,
  onBackToProjects
}: UnifiedChatInterfaceProps) {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'prompt-to-image' | 'image-to-video' | 'canvas-editor'>('prompt-to-image');
  
  // Render state
  const [currentRender, setCurrentRender] = useState<Render | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [referenceRenderId, setReferenceRenderId] = useState<string | undefined>();
  
  // Fixed aspect ratio for better quality
  const aspectRatio = DEFAULT_ASPECT_RATIO;
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Simplified video controls
  const [videoDuration, setVideoDuration] = useState(5);
  
  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isMentionTaggerOpen, setIsMentionTaggerOpen] = useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = useState('');
  
  // Mention state
  const [currentMentionPosition, setCurrentMentionPosition] = useState(-1);
  
  // UI state
  const [isLiked, setIsLiked] = useState(false);
  
  // Mobile view state - toggle between chat and render
  const [mobileView, setMobileView] = useState<'chat' | 'render'>('chat');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hooks
  const { credits } = useCredits();
  const { upscaleImage, isUpscaling, upscalingResult, error: upscalingError } = useUpscaling();
  
  // Vercel AI SDK hooks
  const { generateImage, isGenerating: isImageGenerating } = useImageGeneration();
  const { generateVideo, isGenerating: isVideoGenerating } = useVideoGeneration();
  const { enhancePrompt, isEnhancing, error: enhancementError, isEnhanced, restoreOriginal } = usePromptEnhancement();
  
  // Version context hook
  const { parsePrompt } = useVersionContext();

  // Update progress during generation
  useEffect(() => {
    if (isImageGenerating || isVideoGenerating) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isImageGenerating, isVideoGenerating]);

  // Load chain data when component mounts or chain changes
  useEffect(() => {
    console.log('🔍 UnifiedChatInterface: Loading chain data', {
      hasChain: !!chain,
      rendersCount: chain?.renders?.length || 0,
      chainId: chain?.id,
      chainName: chain?.name
    });

    if (chain && chain.renders) {
      console.log('✅ UnifiedChatInterface: Chain has renders, converting to messages');
      
      // Convert renders to messages
      const chainMessages: Message[] = chain.renders
        .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0))
        .map((render) => {
          // Create user message for the prompt
          const userMessage: Message = {
            id: `user-${render.id}`,
            type: 'user',
            content: render.prompt,
            timestamp: render.createdAt,
            referenceRenderId: render.referenceRenderId || undefined,
            // Add uploaded image if it exists in the database
            uploadedImage: render.uploadedImageUrl ? {
              previewUrl: render.uploadedImageUrl,
              persistedUrl: render.uploadedImageUrl
            } : undefined
          };

          // Create assistant message with the render (no constant text)
          const contextMessage = render.status === 'failed'
            ? 'Sorry, I couldn\'t generate your render. Please try again.'
            : render.status === 'processing'
            ? 'Generating your render...'
            : ''; // Empty for completed renders - just show the render
            
          const assistantMessage: Message = {
            id: `assistant-${render.id}`,
            type: 'assistant',
            content: contextMessage,
            timestamp: render.updatedAt,
            render: render.status === 'completed' ? render : undefined,
            isGenerating: render.status === 'processing' || render.status === 'pending'
          };

          return [userMessage, assistantMessage];
        })
        .flat();

      console.log('📝 UnifiedChatInterface: Created messages:', {
        totalMessages: chainMessages.length,
        userMessages: chainMessages.filter(m => m.type === 'user').length,
        assistantMessages: chainMessages.filter(m => m.type === 'assistant').length,
        withRenders: chainMessages.filter(m => m.render).length
      });

      setMessages(chainMessages);

      // Set the latest completed render as current
      const latestCompletedRender = chain.renders
        .filter(r => r.status === 'completed')
        .sort((a, b) => (b.chainPosition || 0) - (a.chainPosition || 0))[0];
      
      if (latestCompletedRender) {
        console.log('✅ UnifiedChatInterface: Set current render:', latestCompletedRender.id);
        setCurrentRender(latestCompletedRender);
      } else {
        console.log('⚠️ UnifiedChatInterface: No completed renders found');
      }
    } else {
      console.log('⚠️ UnifiedChatInterface: No chain data, resetting messages');
      // Reset messages if no chain data
      setMessages([]);
      setCurrentRender(null);
    }
  }, [chain]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Create preview URL for uploaded file
  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadedFile]);

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
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, [activeTab]);

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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedFile(null);
    setPreviewUrl(null);
  };

  const getCreditsCost = () => {
    if (activeTab === 'image-to-video') {
      // Video generation costs
      const baseCost = 5;
      const durationMultiplier = videoDuration / 5;
      return Math.ceil(baseCost * durationMultiplier);
    } else {
      // Image generation costs
      return 1;
    }
  };

  const handleEnhancePrompt = async () => {
    if (!inputValue.trim() || isEnhancing) return;

    console.log('🔍 Enhancing prompt:', inputValue);
    const result = await enhancePrompt(inputValue);
    
    if (result) {
      setInputValue(result.enhancedPrompt);
      console.log('✅ Prompt enhanced successfully');
    }
  };

  const handleRestorePrompt = () => {
    const original = restoreOriginal();
    if (original) {
      setInputValue(original);
    }
  };

  // Upload modal handlers
  const handleUploadModalOpen = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
  };

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
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
      const url = URL.createObjectURL(image.file);
      setPreviewUrl(url);
    } else if (image.url) {
      // For gallery images, we'll use the URL directly
      // Create a placeholder file object
      const file = new File([''], 'gallery-image.png', { type: 'image/png' });
      setUploadedFile(file);
      setPreviewUrl(image.url);
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
    if (!inputValue.trim() || isGenerating || isImageGenerating) return;

    console.log('🔍 Processing message with potential mentions:', inputValue);

    // Parse the prompt for version mentions and extract context
    let versionContext = undefined;
    let finalPrompt = inputValue;
    let referenceRenderId: string | undefined = undefined;

    // Check if the prompt contains mentions
    if (inputValue.includes('@')) {
      console.log('🔍 Prompt contains mentions, parsing version context...');
      
      const parsedPrompt = await parsePrompt(inputValue, projectId, chainId);
      
      if (parsedPrompt) {
        console.log('✅ Parsed prompt:', {
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

          // Use the most recent mentioned version as reference if available
          const mentionedVersionWithRender = parsedPrompt.mentionedVersions
            .find(v => v.renderId);
          if (mentionedVersionWithRender?.renderId) {
            referenceRenderId = mentionedVersionWithRender.renderId;
          }

          console.log('🎯 Using version context:', {
            finalPrompt: finalPrompt.substring(0, 100) + '...',
            referenceRenderId,
            mentionedVersionsCount: versionContext.mentionedVersions.length
          });
        }
      } else {
        console.log('⚠️ Failed to parse prompt, falling back to original');
      }
    } else {
      // No mentions, use standard reference logic
      if (chain && chain.renders && chain.renders.length > 0) {
        const completedRenders = chain.renders.filter(render => render.status === 'completed');
        const latestCompletedRender = completedRenders
          .sort((a, b) => (b.chainPosition || 0) - (a.chainPosition || 0))[0];
        
        if (latestCompletedRender) {
          referenceRenderId = latestCompletedRender.id;
          console.log('🔗 Using latest completed render from chain as reference:', referenceRenderId);
        }
      } else if (currentRender && currentRender.status === 'completed') {
        referenceRenderId = currentRender.id;
        console.log('🔗 Using currentRender as fallback reference:', referenceRenderId);
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
      setPreviewUrl(null);
    }
    
    setIsGenerating(true);
    onRenderStart?.();

    // Add assistant message with generating state
    const assistantMessage: Message = {
      id: `assistant-${crypto.randomUUID()}`,
      type: 'assistant',
      content: 'Generating your render...',
      timestamp: new Date(),
      isGenerating: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Use the final prompt directly - Vercel AI SDK handles optimization
      const enhancedPrompt = finalPrompt;

      // Log generation parameters before sending
      console.log('🎯 Chat: Sending generation request with parameters:', {
        aspectRatio,
        videoDuration: activeTab === 'image-to-video' ? videoDuration : undefined,
        type: activeTab === 'image-to-video' ? 'video' : 'image'
      });

      // Branch between image and video generation
      let result;
      
      if (activeTab === 'image-to-video') {
        // Automatically determine video generation type based on what's uploaded
        console.log('🎬 Initiating video generation:', {
          hasUploadedImage: !!userMessage.uploadedImage?.file,
          duration: videoDuration
        });
        
        result = await generateVideo({
          prompt: enhancedPrompt,
          duration: videoDuration,
          aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1',
          projectId: projectId || '',
          chainId: chainId || undefined,
          referenceRenderId: referenceRenderId,
        });
      } else {
        // Use image generation hook
        result = await generateImage({
          prompt: enhancedPrompt,
          aspectRatio,
          projectId: projectId || undefined,
          chainId: chainId || undefined,
          referenceRenderId: referenceRenderId,
          versionContext: versionContext, // Pass the version context
          isPublic: true, // Add to public gallery
        });
      }
      
      // Check if generation was successful
      if (result && (result.imageUrl || result.videoUrl || (result.success && result.data))) {
        // Create a new render version for this chat message
        // Note: The actual render will be created by the API with a proper database ID
        const newRender: Render = {
          id: 'temp-' + Date.now(), // Temporary ID for frontend display
          projectId,
          userId: '',
          type: activeTab === 'image-to-video' ? 'video' : 'image',
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
        
        // Don't refresh chain data - this causes full page reload
        // onRefreshChain?.(); // Removed to prevent page reload

        // Update the assistant message with the result and render (no constant text)
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { 
                ...msg, 
                content: '', // Empty content - just show the render
                isGenerating: false, 
                render: newRender 
              }
            : msg
        ));

        // Clear uploaded file after successful generation
        if (uploadedFile) {
          setUploadedFile(null);
        }
      } else {
        throw new Error('Failed to generate image - no result returned');
      }

    } catch (error) {
      console.error('Failed to generate render:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: 'Sorry, I couldn\'t generate your render. Please try again.', isGenerating: false }
          : msg
      ));
    } finally {
      setIsGenerating(false);
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
      link.download = `render-${currentRender.id}.png`;
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
    
    await upscaleImage({
      imageUrl: currentRender.outputUrl,
      scale,
      quality: 'high'
    });
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'prompt-to-image':
        return <ImageIcon className="h-4 w-4" />;
      case 'image-to-video':
        return <Video className="h-4 w-4" />;
      case 'canvas-editor':
        return <Edit3 className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };


  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2.75rem)] overflow-hidden">
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
          <div className="flex bg-muted rounded-lg p-0.5">
            <Button
              variant={mobileView === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMobileView('chat')}
              className="h-7 px-3 flex-1 text-xs"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Chat
            </Button>
            <Button
              variant={mobileView === 'render' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMobileView('render')}
              className="h-7 px-3 flex-1 text-xs"
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              Render
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Area - Responsive width */}
      <div className={cn(
        "border-r border-border flex flex-col overflow-hidden",
        "w-full lg:w-1/4 h-full",
        // Mobile: show/hide based on mobileView
        mobileView === 'chat' ? 'flex' : 'hidden lg:flex'
      )}>
        {/* Header - Desktop only */}
        <div className="hidden lg:block px-4 py-1.5 border-b border-border h-11 flex items-center">
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 min-h-0 max-h-[calc(100vh-16rem)]">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8">
              <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-muted-foreground/50" />
              <p className="text-xs sm:text-sm">Start a conversation to generate renders</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">Each message creates a new version</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.id}-${message.timestamp.getTime()}`}
                className={cn(
                  'flex',
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3',
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground animate-in slide-in-from-right-5 duration-300'
                      : 'bg-muted animate-in slide-in-from-left-5 duration-300',
                    // Allow assistant messages with renders to be wider
                    message.type === 'assistant' && message.render && 'max-w-[98%] sm:max-w-[95%]'
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
                          <Edit3 className="h-3 w-3" />
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
                  {message.uploadedImage && (
                    <div className="mt-2">
                      <div className="relative w-24 h-16 sm:w-32 sm:h-20 bg-muted/20 rounded-lg overflow-hidden border border-white/20">
                        <Image
                          src={message.uploadedImage.previewUrl}
                          alt="Uploaded image"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-white/70 mt-1">
                        {message.uploadedImage.persistedUrl ? 'Using uploaded image' : 'Working with uploaded image'}
                      </p>
                    </div>
                  )}
                  
                  {message.isGenerating && (
                    <div className="flex items-center mt-2">
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                      <span className="text-[10px] sm:text-xs">Generating...</span>
                    </div>
                  )}
                  {message.render && (
                    <div className="mt-2">
                      <div className="mb-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Version {message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}</span>
                      </div>
                      <div className="relative w-full aspect-video rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-muted animate-in fade-in-0 zoom-in-95 duration-500"
                        onClick={() => {
                          setCurrentRender(message.render!);
                          setMobileView('render');
                        }}
                        style={{ minWidth: '400px', width: '100%' }}
                      >
                        {message.render.type === 'video' ? (
                          <VideoPlayer
                            videoUrl={message.render.outputUrl}
                            title={`Generated Video - Version ${message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}`}
                            duration={message.render.settings?.duration}
                            status="completed"
                            processingTime={message.render.processingTime}
                            className="w-full h-full"
                          />
                        ) : (
                          <Image
                            src={message.render.outputUrl}
                            alt="Generated render"
                            fill
                            className="object-cover"
                            sizes="100vw"
                          />
                        )}
                      </div>
                      {/* Action buttons below image - always visible */}
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = message.render!.outputUrl;
                            link.download = `render-${message.render!.id}.${message.render!.type === 'video' ? 'mp4' : 'png'}`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast.success('Download started');
                          }}
                          className="h-7 w-7 p-0"
                          title="Download"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info('Upscale feature coming soon');
                          }}
                          className="h-7 w-7 p-0"
                          title="Upscale"
                        >
                          <Zap className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReferenceRenderId(message.render!.id);
                            setInputValue(message.render!.prompt);
                            toast.info('Prompt loaded. Modify and send to regenerate with context.');
                          }}
                          className="h-7 w-7 p-0"
                          title="Regenerate"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-2 sm:p-2 border-t border-border flex-shrink-0 bg-background">
          <div className="space-y-1">
            {/* Uploaded Image Attachment */}
            {uploadedFile && previewUrl && (
              <div className="relative inline-block mb-1 sm:mb-2">
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 bg-muted rounded-lg overflow-hidden border border-border">
                  <Image
                    src={previewUrl}
                    alt="Uploaded attachment"
                    fill
                    className="object-cover"
                  />
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
              {/* Detected Mentions */}
              {inputValue.includes('@') && (
                <div className="flex flex-wrap gap-1">
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
              
              <div className="flex gap-1 sm:gap-2">
                <div className="relative flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={isEnhancing ? "Enhancing your prompt..." : activeTab === 'image-to-video' ? "Describe the video you want to create..." : "Describe your vision..."}
                    className={cn(
                      "h-[104px] sm:h-[116px] resize-none w-full text-xs sm:text-sm",
                      isEnhancing && "animate-pulse bg-muted/50"
                    )}
                    disabled={isGenerating || isEnhancing}
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
                      ) : activeTab === 'image-to-video' ? (
                        <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </>
                  )}
                </Button>
                <Button
                  onClick={isEnhanced ? handleRestorePrompt : handleEnhancePrompt}
                  disabled={!inputValue.trim() || isEnhancing || isGenerating}
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 w-8 sm:w-9 shrink-0"
                >
                  {isEnhancing ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : isEnhanced ? (
                    <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
            
            {/* Enhancement Error */}
            {enhancementError && (
              <Alert variant="destructive" className="py-1">
                <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <AlertDescription className="text-[10px] sm:text-xs">
                  {enhancementError}
                </AlertDescription>
              </Alert>
            )}
            
              {/* Simplified Controls */}
              <div>
                {/* Aspect Ratio - Only essential setting */}
                {/* Aspect ratio is now fixed at 16:9 for better quality */}

                {/* Video Duration - Only for video generation */}
                {activeTab === 'image-to-video' && (
                  <div className="space-y-0.5 sm:space-y-1">
                    <Label className="text-[10px] sm:text-xs font-medium">Duration</Label>
                    <Select value={videoDuration.toString()} onValueChange={(value) => setVideoDuration(parseInt(value))}>
                      <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3" className="text-[10px] sm:text-xs">3s</SelectItem>
                        <SelectItem value="5" className="text-[10px] sm:text-xs">5s</SelectItem>
                        <SelectItem value="10" className="text-[10px] sm:text-xs">10s</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

              {/* File Upload - Hidden, triggered by + button */}
              <div className="hidden">
                <div {...getRootProps()}>
                  <input {...getInputProps()} ref={fileInputRef} />
                </div>
              </div>


              {/* Insufficient Credits Alert */}
              {credits && credits.balance < getCreditsCost() && inputValue.trim() && (
                <Alert variant="destructive" className="py-1">
                  <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <AlertDescription className="text-[10px] sm:text-xs">
                    Insufficient credits. Need {getCreditsCost()}, have {credits.balance}
                  </AlertDescription>
                </Alert>
              )}

              {credits && credits.balance < getCreditsCost() && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-5 sm:h-6 text-[10px] sm:text-xs"
                  onClick={() => window.open('/plans', '_blank')}
                >
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Render Output Area - Responsive width */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden",
        // Mobile: show/hide based on mobileView
        mobileView === 'render' ? 'flex' : 'hidden lg:flex'
      )}>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'prompt-to-image' | 'image-to-video' | 'canvas-editor')} className="flex flex-col h-full">
          <div className="border-b border-border flex-shrink-0 h-11 flex items-center">
            <TabsList className="w-full justify-start rounded-none h-full">
              <TabsTrigger 
                value="prompt-to-image" 
                className={cn(
                  "flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-4",
                  activeTab === 'prompt-to-image' && "!border-primary !text-primary data-[state=active]:!text-primary dark:data-[state=active]:!text-primary"
                )}
              >
                {getTabIcon('prompt-to-image')}
                <span className="hidden sm:inline">Prompt to Image</span>
                <span className="sm:hidden">Prompt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="image-to-video" 
                className={cn(
                  "flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-4",
                  activeTab === 'image-to-video' && "!border-primary !text-primary data-[state=active]:!text-primary dark:data-[state=active]:!text-primary"
                )}
              >
                {getTabIcon('image-to-video')}
                <span className="hidden sm:inline">Image to Video</span>
                <span className="sm:hidden">Video</span>
              </TabsTrigger>
              <TabsTrigger 
                value="canvas-editor" 
                className={cn(
                  "flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-4",
                  activeTab === 'canvas-editor' && "!border-primary !text-primary data-[state=active]:!text-primary dark:data-[state=active]:!text-primary"
                )}
              >
                {getTabIcon('canvas-editor')}
                <span className="hidden sm:inline">Canvas Editor</span>
                <span className="sm:hidden">Canvas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Render Content */}
          <div className="flex-1 p-1 sm:p-2 overflow-hidden min-h-0">
          <TabsContent value="prompt-to-image" className="h-full">
            <div className="h-full flex flex-col lg:flex-row items-center justify-center max-h-[calc(100vh-8rem)]">
              {/* Mobile Version Selector */}
              {messages.some(m => m.render) && (
                <div className="lg:hidden w-full mb-2">
                  <Select 
                    value={currentRender?.id} 
                    onValueChange={(value) => {
                      const render = messages.find(m => m.render?.id === value)?.render;
                      if (render) setCurrentRender(render);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {messages
                        .filter(m => m.render)
                        .map((message, index) => (
                          <SelectItem key={message.id} value={message.render!.id} className="text-xs">
                            Version {message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1} - {message.content.substring(0, 30)}...
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex-1 overflow-hidden w-full max-h-[calc(100vh-8rem)]">
              {isGenerating || isImageGenerating || isVideoGenerating ? (
                <Card className="w-full h-full py-0 gap-0">
                  <CardContent className="p-0 h-full">
                    <div className="h-full flex flex-col">
                      {/* Loading Display */}
                      <div className="flex-1 bg-muted rounded-t-lg overflow-hidden relative min-h-[200px] sm:min-h-[300px]">
                        <div className="w-full h-full flex items-center justify-center relative p-1">
                          <div className="text-center space-y-3 sm:space-y-6">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                              <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-spin" />
                            </div>
                            <h3 className="text-sm sm:text-lg font-semibold">Generating your render...</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">This may take a few moments</p>
                            
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
                <Card className="w-full h-full py-0 gap-0">
                  <CardContent className="p-0 h-full">
                    <div className="h-full flex flex-col">
                      {/* Image Display */}
                      <div className="flex-1 bg-muted rounded-t-lg overflow-hidden relative min-h-[200px] sm:min-h-[300px]">
                        <div className="w-full h-full flex items-center justify-center relative p-0.5 sm:p-1">
                        <Image
                          src={currentRender.outputUrl}
                          alt={currentRender.prompt}
                          width={800}
                          height={600}
                          className="max-w-full max-h-full object-contain rounded-lg cursor-pointer"
                          onClick={() => setIsFullscreen(true)}
                        />
                          
                          
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
                      </div>

                      {/* Result Info and Actions */}
                      <div className="p-1.5 sm:p-2 border-t border-border bg-background flex-shrink-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 sm:mb-2">
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                              {currentRender.settings?.style}
                            </Badge>
                            <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                              {currentRender.settings?.aspectRatio}
                            </Badge>
                            <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                              {currentRender.settings?.quality}
                            </Badge>
                            <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {currentRender.processingTime?.toFixed(1)}s
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto">
                            <Button variant="outline" size="sm" onClick={handleDownload} title="Download" className="h-7 w-7 sm:h-8 sm:w-8 p-0 sm:px-3 sm:w-auto">
                              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline ml-2">Download</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleShare} title="Share" className="h-7 w-7 sm:h-8 sm:w-8 p-0 sm:px-3 sm:w-auto">
                              <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline ml-2">Share</span>
                            </Button>
                            
                            {/* Upscaling Options */}
                            <div className="flex items-center space-x-1 sm:space-x-2 flex-1 sm:flex-initial">
                              <Select onValueChange={(value: string) => handleUpscale(parseInt(value) as 2 | 4 | 10)} disabled={isUpscaling}>
                                <SelectTrigger className="w-full sm:w-20 h-7 sm:h-8 text-[10px] sm:text-xs">
                                  <SelectValue placeholder="Upscale" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="2" className="text-xs">2x</SelectItem>
                                  <SelectItem value="4" className="text-xs">4x</SelectItem>
                                  <SelectItem value="10" className="text-xs">10x</SelectItem>
                                </SelectContent>
                              </Select>
                              {isUpscaling && (
                                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Upscaling Result */}
                        {upscalingResult && (
                          <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
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
                        )}

                        {/* Upscaling Error */}
                        {upscalingError && (
                          <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <div className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                              ❌ Upscaling Failed
                            </div>
                            <div className="text-[10px] sm:text-xs text-red-700 dark:text-red-300">
                              {upscalingError}
                            </div>
                          </div>
                        )}

                      </div>
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
                    Describe your vision in the chat to create amazing renders
                  </p>
                </div>
              )}
              </div>
              
              {/* Version History Sidebar - Right side, Desktop only */}
              {messages.some(m => m.render) && (
                <div className="hidden lg:flex lg:flex-col w-32 xl:w-48 border-l border-border pl-2 xl:pl-4 ml-2 xl:ml-4 max-h-[calc(100vh-8rem)]">
                  <h3 className="text-xs xl:text-sm font-medium mb-2 xl:mb-3 flex-shrink-0">Versions</h3>
                  <div className="space-y-1.5 xl:space-y-2 flex-1 overflow-y-auto min-h-0">
                    {messages
                      .filter(m => m.render)
                      .map((message, index) => (
                        <div
                          key={message.id}
                          className={cn(
                            "p-1.5 xl:p-2 rounded border cursor-pointer transition-colors",
                            currentRender?.id === message.render?.id
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted"
                          )}
                          onClick={() => setCurrentRender(message.render!)}
                        >
                          <div className="text-[10px] xl:text-xs text-muted-foreground mb-1">
                            V{message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}
                          </div>
                          {message.render!.type === 'video' ? (
                            <div className="w-full h-12 xl:h-16 bg-muted rounded flex items-center justify-center">
                              <Video className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ) : (
                            <Image
                              src={message.render!.outputUrl}
                              alt={`Version ${message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}`}
                              width={100}
                              height={60}
                              className="w-full h-12 xl:h-16 object-cover rounded"
                            />
                          )}
                          <div className="text-[10px] xl:text-xs text-muted-foreground mt-1 truncate">
                            {message.content}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="image-to-video" className="h-full">
            <div className="h-full flex flex-col lg:flex-row items-center justify-center max-h-[calc(100vh-8rem)]">
              {/* Mobile Version Selector */}
              {messages.some(m => m.render) && (
                <div className="lg:hidden w-full mb-2">
                  <Select
                    value={currentRender?.id || ''}
                    onValueChange={(value) => {
                      const render = messages.find(m => m.render?.id === value)?.render;
                      if (render) setCurrentRender(render);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a version" />
                    </SelectTrigger>
                    <SelectContent>
                      {messages
                        .filter(m => m.render)
                        .map((message, index) => (
                          <SelectItem key={message.render!.id} value={message.render!.id}>
                            Version {message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Desktop Layout */}
              <div className="hidden lg:flex h-full w-full">
                {/* Left Sidebar - Versions */}
                {messages.some(m => m.render) && (
                  <div className="w-48 p-2 border-r bg-muted/30 overflow-y-auto">
                    <h3 className="text-sm font-semibold mb-2">Versions</h3>
                    {messages
                      .filter(m => m.render)
                      .map((message, index) => (
                        <div
                          key={message.id}
                          className="p-1.5 xl:p-2 rounded border cursor-pointer transition-colors mb-2"
                          onClick={() => setCurrentRender(message.render!)}
                        >
                          <div className="text-[10px] xl:text-xs text-muted-foreground mb-1">
                            V{message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}
                          </div>
                          {message.render!.type === 'video' ? (
                            <div className="w-full h-12 xl:h-16 bg-muted rounded flex items-center justify-center">
                              <Video className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ) : (
                            <Image
                              src={message.render!.outputUrl}
                              alt={`Version ${message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}`}
                              width={100}
                              height={60}
                              className="w-full h-12 xl:h-16 object-cover rounded"
                            />
                          )}
                          <div className="text-[10px] xl:text-xs text-muted-foreground mt-1 truncate">
                            {message.content}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">
                  {/* Render Display */}
                  {currentRender ? (
                    <div className="flex-1 p-4 flex items-center justify-center">
                      <div className="max-w-full max-h-full">
                        {currentRender.type === 'video' ? (
                          <VideoPlayer
                            videoUrl={currentRender.outputUrl}
                            title={`Generated Video - Version ${currentRender.chainPosition !== undefined ? currentRender.chainPosition + 1 : 1}`}
                            duration={currentRender.settings?.duration}
                            status="completed"
                            processingTime={currentRender.processingTime}
                            className="max-w-full max-h-full"
                          />
                        ) : (
                          <Image
                            src={currentRender.outputUrl}
                            alt="Generated render"
                            width={800}
                            height={600}
                            className="max-w-full max-h-full object-contain"
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Play className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2">Ready to Generate Video</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Describe your vision in the chat to create amazing videos
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chat Interface */}
                  <div className="border-t p-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Textarea
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Describe the video you want to create..."
                          className="min-h-[2.5rem] max-h-32 resize-none text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
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
                                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              )}
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={isEnhanced ? handleRestorePrompt : handleEnhancePrompt}
                          disabled={!inputValue.trim() || isEnhancing}
                          variant="outline"
                          className="h-8 sm:h-9 w-8 sm:w-9 shrink-0"
                          size="sm"
                          title={isEnhanced ? "Restore original prompt" : "Enhance prompt"}
                        >
                          {isEnhancing ? (
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          ) : isEnhanced ? (
                            <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          ) : (
                            <Wand2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden w-full h-full flex flex-col">
                {mobileView === 'chat' ? (
                  <div className="flex-1 flex flex-col">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-2",
                            message.type === 'user' ? "justify-end" : "justify-start"
                          )}
                        >
                          <div className={cn(
                            "max-w-[80%] rounded-lg p-3 text-sm",
                            message.type === 'user' 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          )}>
                            {message.uploadedImage && (
                              <div className="mb-2">
                                <img
                                  src={message.uploadedImage.previewUrl}
                                  alt="Uploaded"
                                  className="w-20 h-20 object-cover rounded"
                                />
                              </div>
                            )}
                            <div className="whitespace-pre-wrap">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input */}
                    <div className="border-t p-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Describe the video you want to create..."
                            className="min-h-[2.5rem] max-h-32 resize-none text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
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
                                  <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                )}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 p-4 flex items-center justify-center">
                    {currentRender && (
                      <div className="max-w-full max-h-full">
                        {currentRender.type === 'video' ? (
                          <VideoPlayer
                            videoUrl={currentRender.outputUrl}
                            title={`Generated Video - Version ${currentRender.chainPosition !== undefined ? currentRender.chainPosition + 1 : 1}`}
                            duration={currentRender.settings?.duration}
                            status="completed"
                            processingTime={currentRender.processingTime}
                            className="max-w-full max-h-full"
                          />
                        ) : (
                          <Image
                            src={currentRender.outputUrl}
                            alt="Generated render"
                            width={800}
                            height={600}
                            className="max-w-full max-h-full object-contain"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="canvas-editor" className="h-full">
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Edit3 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground" />
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2">Canvas Editor</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  Select and edit specific portions of your images
                </p>
                <Button className="h-8 sm:h-9 lg:h-10 text-xs sm:text-sm">
                  <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Open Editor
                </Button>
              </div>
            </div>
          </TabsContent>
          </div>
        </Tabs>
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

      {/* Fullscreen Image Dialog */}
      {isFullscreen && currentRender && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Image
              src={currentRender.outputUrl}
              alt={currentRender.prompt}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
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
