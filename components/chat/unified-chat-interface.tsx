'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  Wand2, 
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
  Plus
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
import { usePromptEnhancement, useImageGeneration, useVideoGeneration } from '@/lib/hooks/use-ai-sdk';
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
  const router = useRouter();
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  
  // Style settings
  const [environment, setEnvironment] = useState<string>('none');
  const [effect, setEffect] = useState<string>('none');
  const [styleTransferImage, setStyleTransferImage] = useState<File | null>(null);
  const [styleTransferPreview, setStyleTransferPreview] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<string>('0.5'); // Default 50% (0.5), options: 0, 0.25, 0.5, 0.75, 1.0
  
  // Video controls
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
  
  // Hooks
  const { credits } = useCredits();
  const { upscaleImage, isUpscaling, upscalingResult, error: upscalingError } = useUpscaling();
  
  // Google Generative AI hooks
  const { isGenerating: isImageGenerating } = useImageGeneration();
  const { isGenerating: isVideoGenerating } = useVideoGeneration();
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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedFile(null);
    setPreviewUrl(null);
  };

  const getCreditsCost = () => {
    // Image generation costs
    return 1;
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
      // Use the final prompt directly - Google Generative AI handles optimization
      const enhancedPrompt = finalPrompt;

       // Log generation parameters before sending
       console.log('🎯 Chat: Sending generation request with parameters:', {
         aspectRatio,
         type: 'image', // Always generate image for now
         hasUploadedImage: !!userMessage.uploadedImage?.file
       });

       // Always generate image (image-to-image when image is uploaded, text-to-image otherwise)
       let result;
       
       // Prepare form data for image generation
        const formData = new FormData();
        formData.append('prompt', enhancedPrompt);
        formData.append('style', 'realistic'); // Default style
        formData.append('quality', 'standard');
        formData.append('aspectRatio', aspectRatio);
        formData.append('type', 'image');
        formData.append('projectId', projectId || '');
        
        if (chainId) {
          formData.append('chainId', chainId);
        }
        
        if (referenceRenderId) {
          formData.append('referenceRenderId', referenceRenderId);
        }
        
        if (versionContext) {
          formData.append('versionContext', JSON.stringify(versionContext));
        }
        
        formData.append('isPublic', 'true');
        
        // Add environment if selected (not "none")
        if (environment && environment !== 'none') {
          formData.append('environment', environment);
        }
        
        // Add effect if selected (not "none")
        if (effect && effect !== 'none') {
          formData.append('effect', effect);
        }
        
        // Add uploaded image (main image being edited)
        if (userMessage.uploadedImage?.file) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = (e) => {
              const result = e.target?.result as string;
              resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
            };
            reader.readAsDataURL(userMessage.uploadedImage!.file!);
          });
          formData.append('uploadedImageData', base64);
          formData.append('uploadedImageType', userMessage.uploadedImage.file.type);
        }
        
        // Add style transfer image
        if (styleTransferImage) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = (e) => {
              const result = e.target?.result as string;
              resolve(result.split(',')[1]);
            };
            reader.readAsDataURL(styleTransferImage);
          });
          formData.append('styleTransferImageData', base64);
          formData.append('styleTransferImageType', styleTransferImage.type);
        }
        
        // Add temperature (0.0-1.0, default 0.5)
        formData.append('temperature', temperature);
        
        // Call the API directly
        const response = await fetch('/api/renders', {
          method: 'POST',
          body: formData,
        });
        
        const apiResult = await response.json();
        
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
          result = {
            success: false,
            error: apiResult.error || 'Image generation failed'
          };
        }
      
      // Check if generation was successful
      
      // Check if generation was successful
      if (result && (result.imageUrl || result.videoUrl || (result.success && result.data))) {
         // Create a new render version for this chat message
         // Note: The actual render will be created by the API with a proper database ID
         const newRender: Render = {
           id: 'temp-' + Date.now(), // Temporary ID for frontend display
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
              Render
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
        
        {/* Version Carousel - Mobile */}
        {messages.some(m => m.render && m.render.type === 'image') && (
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
                    .filter(m => m.render && m.render.type === 'image')
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
                        <Image
                          src={message.render!.outputUrl}
                          alt={`Version ${message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}`}
                          fill
                          className="object-cover"
                        />
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
          {messages.some(m => m.render && m.render.type === 'image') && (
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
                      .filter(m => m.render && m.render.type === 'image')
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
                          <Image
                            src={message.render!.outputUrl}
                            alt={`Version ${message.render?.chainPosition !== undefined ? message.render.chainPosition + 1 : index + 1}`}
                            fill
                            className="object-cover"
                          />
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
                      router.refresh();
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
                          <Copy className="h-3 w-3" />
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
                        <Image
                          src={message.render.outputUrl}
                          alt="Generated render"
                          fill
                          className="object-cover"
                          sizes="100vw"
                        />
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
        <div className={cn(
          "p-2 sm:p-2 border-t border-border flex-shrink-0 bg-background",
          isSidebarCollapsed && "lg:hidden"
        )}>
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
                     placeholder={isEnhancing ? "Enhancing your prompt..." : "Describe your vision..."}
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
            
             {/* Style Settings - 2 columns: Environment/Temperature (3/4) and Style Transfer (1/4) */}
             <div>
               <div className="flex gap-2 sm:gap-3 items-start">
                 {/* Left Column: Environment/Effect and Temperature (3/4 width, 2 rows) */}
                 <div className="flex-[3] flex flex-col gap-2 sm:gap-3">
                  {/* Row 1: Environment and Effect dropdowns */}
                  <div className="flex gap-2 sm:gap-3">
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
                        <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs w-full">
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
                        <SelectTrigger className="h-7 sm:h-8 text-[10px] sm:text-xs w-full">
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

                  {/* Temperature Toggle */}
                  <div className="space-y-1 flex flex-col">
                    <div className="flex items-center gap-1">
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
                      className="h-7 sm:h-8 w-full"
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
                </div>

                 {/* Right Column: Style Transfer (1/4 width, matches combined height) */}
                 <div className="flex-[1] space-y-1 flex flex-col">
                   <div className="flex items-center gap-1">
                     <Label className="text-[10px] sm:text-xs font-medium whitespace-nowrap">Style Transfer</Label>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help shrink-0" />
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>Upload an image to transfer its style to your generated image</p>
                       </TooltipContent>
                     </Tooltip>
                   </div>
                   <div className="relative w-full h-[5.75rem] sm:h-[6.25rem]">
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
                          <Image
                            src={styleTransferPreview || ''}
                            alt="Style transfer"
                            fill
                            className="object-cover"
                          />
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
                      >
                        <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    )}
                  </div>
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
        {/* Header with Toolbar */}
        <div className="border-b border-border bg-background sticky top-0 z-10">
          <div className="px-4 py-1.5 h-11 flex items-center">
            {/* Toolbar - Only show when there's a render */}
            {currentRender && (() => {
              const versionNumber = currentRender.chainPosition !== undefined 
                ? currentRender.chainPosition + 1 
                : messages.findIndex(m => m.render?.id === currentRender.id) + 1;
              return (
                <div className="flex items-center gap-3 w-full">
                  {/* Sidebar Toggle Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="h-7 w-7 p-0 shrink-0"
                    title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {isSidebarCollapsed ? (
                      <PanelRight className="h-3 w-3" />
                    ) : (
                      <PanelLeft className="h-3 w-3" />
                    )}
                  </Button>
                  
                  {/* Separator */}
                  <div className="h-4 w-px bg-border shrink-0"></div>
                  
                  {/* Version Number */}
                  <div className="text-xs font-medium text-muted-foreground shrink-0">
                    Version {versionNumber}
                  </div>
                  
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
                      onClick={() => {}} 
                      className="h-7 px-2 text-[10px] flex-1 flex items-center justify-center gap-1.5" 
                      disabled
                    >
                      <Video className="h-3 w-3 shrink-0" />
                      <span>Video</span>
                    </Button>
                    {/* Download */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownload} 
                      className="h-7 px-2 text-[10px] flex-1 flex items-center justify-center gap-1.5"
                    >
                      <Download className="h-3 w-3 shrink-0" />
                      <span>Download</span>
                    </Button>
                    {/* Share */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleShare} 
                      className="h-7 px-2 text-[10px] flex-1 flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="h-3 w-3 shrink-0" />
                      <span>Share</span>
                    </Button>
                    {/* More Tools - Placeholder */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {}} 
                      className="h-7 px-2 text-[10px] flex-1 flex items-center justify-center gap-1.5" 
                      disabled
                    >
                      <MoreVertical className="h-3 w-3 shrink-0" />
                      <span>More</span>
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
                <Card className="w-full h-full py-0 gap-0 overflow-hidden">
                  <CardContent className="p-0 h-full overflow-hidden">
                    <div className="h-full w-full flex flex-col overflow-hidden">
                      {/* Image Display */}
                      <div className="flex-1 bg-muted rounded-t-lg overflow-hidden relative min-h-[200px] sm:min-h-[300px] min-w-0">
                        <div className="w-full h-full flex items-center justify-center relative p-0.5 sm:p-1 overflow-hidden min-w-0">
                        <Image
                          src={currentRender.outputUrl}
                          alt={currentRender.prompt}
                          width={800}
                          height={600}
                          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg cursor-pointer"
                          style={{ maxWidth: '100%', maxHeight: '100%' }}
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
