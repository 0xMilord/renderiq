'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  Share2, 
  Heart, 
  Eye, 
  RefreshCw,
  Image as ImageIcon,
  Zap,
  Clock,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Expand,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RenderChainViz } from './render-chain-viz';
// VersionSelector component removed - functionality integrated elsewhere
// import { VersionSelector } from './version-selector';
import { Render } from '@/lib/types/render';
import { useUpscaling } from '@/lib/hooks/use-upscaling';
import { logger } from '@/lib/utils/logger';

interface RenderResult {
  imageUrl: string;
  type?: 'video' | 'image';
  thumbnail?: string;
  style?: string;
  quality?: string;
  aspectRatio?: string;
  processingTime?: number;
}

interface RenderPreviewProps {
  result?: RenderResult;
  isGenerating: boolean;
  progress?: number;
  engineType: 'exterior' | 'interior' | 'furniture' | 'site-plan';
  isMobile?: boolean;
  onOpenDrawer?: () => void;
  // Chain visualization props
  chainRenders?: Render[];
  selectedRenderId?: string;
  onSelectRender?: (renderId: string) => void;
  onIterate?: (imageUrl: string) => void;
  onVersionSelect?: (render: Render) => void;
  chainId?: string;
  onChainDeleted?: () => void;
  onNewChain?: () => void;
}

export function RenderPreview({ 
  result, 
  isGenerating, 
  progress = 0, 
  engineType, 
  isMobile = false, 
  onOpenDrawer,
  chainRenders = [],
  selectedRenderId,
  onSelectRender,
  onIterate,
  onVersionSelect,
  chainId,
  onChainDeleted,
  onNewChain
}: RenderPreviewProps) {
  logger.log('🖼️ RenderPreview: Component rendered with result:', result);
  logger.log('🖼️ RenderPreview: isGenerating:', isGenerating);
  logger.log('🖼️ RenderPreview: selectedRenderId:', selectedRenderId);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [versions, setVersions] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Upscaling functionality
  const { upscaleImage, isUpscaling, upscalingResult, error: upscalingError } = useUpscaling();

  // Debug result changes
  useEffect(() => {
    logger.log('🖼️ RenderPreview: Result changed:', result);
    if (result) {
      logger.log('🖼️ RenderPreview: Result has imageUrl:', !!result.imageUrl);
      logger.log('🖼️ RenderPreview: Result imageUrl value:', result.imageUrl);
    }
  }, [result]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

  useEffect(() => {
    if (result) {
      logger.log('👁️ RenderPreview: New result received, incrementing views:', result);
      logger.log('👁️ RenderPreview: Result has imageUrl:', !!result.imageUrl);
      logger.log('👁️ RenderPreview: Result imageUrl value:', result.imageUrl);
      setViews(prev => prev + 1);
    }
  }, [result]);

  useEffect(() => {
    logger.log('🔄 RenderPreview: Props updated:', {
      hasResult: !!result,
      isGenerating,
      progress,
      engineType
    });
  }, [result, isGenerating, progress, engineType]);

  const handleLike = () => {
    logger.log('❤️ RenderPreview: Like button clicked, current state:', { likes, isLiked });
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    setIsLiked(!isLiked);
    logger.log('✅ RenderPreview: Like state updated');
  };

  const handleUpscale = async (scale: 2 | 4 | 10) => {
    if (!result?.imageUrl) return;
    
    // Get projectId from selected render or first chain render
    const selectedRender = chainRenders.find(r => r.id === selectedRenderId);
    const projectId = selectedRender?.projectId || chainRenders[0]?.projectId || '';
    
    if (!projectId) {
      logger.error('❌ RenderPreview: Cannot upscale without projectId');
      return;
    }
    
    logger.log(`🔍 Upscaling image by ${scale}x`);
    await upscaleImage({
      imageUrl: result.imageUrl,
      scale,
      quality: 'high',
      projectId
    });
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    logger.log('⬇️ RenderPreview: Download button clicked');
    if (result?.imageUrl) {
      logger.log('📁 RenderPreview: Starting download for:', result.imageUrl);
      const link = document.createElement('a');
      link.href = result.imageUrl;
      link.download = `${engineType}-render-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      logger.log('✅ RenderPreview: Download initiated');
    } else {
      logger.log('❌ RenderPreview: No image URL available for download');
    }
  };

  const handleShare = () => {
    logger.log('📤 RenderPreview: Share button clicked');
    if (navigator.share && result?.imageUrl) {
      logger.log('📱 RenderPreview: Using native share API');
      navigator.share({
        title: `${engineType} AI Render`,
        text: `Check out this amazing ${engineType} render!`,
        url: result.imageUrl,
      }).then(() => {
        logger.log('✅ RenderPreview: Share successful');
      }).catch((error) => {
        console.error('❌ RenderPreview: Share failed:', error);
      });
    } else {
      logger.log('📋 RenderPreview: Using clipboard fallback');
      // Fallback to copying URL
      navigator.clipboard.writeText(result?.imageUrl || '').then(() => {
        logger.log('✅ RenderPreview: URL copied to clipboard');
      }).catch((error) => {
        console.error('❌ RenderPreview: Clipboard copy failed:', error);
      });
    }
  };

  const getEngineDescription = () => {
    const descriptions = {
      exterior: {
        title: 'Exterior AI',
        subtitle: 'Render or redesign your exterior designs in seconds. Just upload a photo or sketch and see the magic in action.',
        steps: [
          'Upload an image of your design.',
          'Image can be a sketch, snapshot from 3d model or a real photo.',
          'Write a good prompt to describe your design.',
          'Choose your render mode.',
          '← Start generating from side panel'
        ]
      },
      interior: {
        title: 'Interior AI',
        subtitle: 'Transform interior sketches into photorealistic renders with AI-powered design assistance.',
        steps: [
          'Upload your interior design sketch or reference.',
          'Describe the style, materials, and atmosphere.',
          'Select your preferred rendering approach.',
          'Choose quality and aspect ratio settings.',
          '← Generate from the control panel'
        ]
      },
      furniture: {
        title: 'Furniture AI',
        subtitle: 'Create stunning furniture designs and visualizations with AI-powered rendering technology.',
        steps: [
          'Upload furniture sketches or reference images.',
          'Describe materials, style, and finish preferences.',
          'Select rendering quality and lighting setup.',
          'Choose your preferred visualization style.',
          '← Generate from the control panel'
        ]
      },
      'site-plan': {
        title: 'Site Plan AI',
        subtitle: 'Generate comprehensive site plans and master planning visualizations with AI assistance.',
        steps: [
          'Upload site drawings or aerial imagery.',
          'Describe project requirements and constraints.',
          'Select planning approach and detail level.',
          'Choose visualization style and scale.',
          '← Generate from the control panel'
        ]
      }
    };
    
    return descriptions[engineType];
  };

  const description = getEngineDescription();

  return (
    <div className="flex-1 bg-background flex flex-col min-w-0 overflow-hidden w-full lg:w-2/3 h-[calc(100vh-4rem)] pb-[7rem] md:pb-0">
      {/* Main Content */}
      <div className="flex-1 p-6 min-h-0 overflow-y-auto">
        <Card className="h-full">
          <CardContent className="h-full p-0">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Generating {engineType} render...</h3>
                  <p className="text-muted-foreground mb-4">This may take a few moments</p>
                  
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>{Math.round(Math.min(progress, 100))}%</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="h-full flex flex-col">
                {/* Version Tabs */}
                {versions.length > 0 && (
                  <div className="border-b border-border">
                    <Tabs 
                      value={activeTab} 
                      onValueChange={setActiveTab}
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="current" className="flex items-center space-x-2">
                          <ImageIcon className="h-4 w-4" />
                          <span>Current</span>
                        </TabsTrigger>
                        <TabsTrigger value="versions" className="flex items-center space-x-2">
                          <History className="h-4 w-4" />
                          <span>Versions ({versions.length})</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                )}

                {/* Image/Video Display */}
                <div className="flex-1 bg-muted rounded-t-lg overflow-hidden">
                  {activeTab === 'current' ? (
                    result.type === 'video' ? (
                      <video
                        src={result.imageUrl}
                        controls
                        className="w-full h-full object-cover"
                        poster={result.thumbnail}
                      />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center relative">
                         <img
                           src={result.imageUrl}
                           alt={`Generated ${engineType} render`}
                           className={cn(
                             "max-w-full max-h-full object-contain rounded-lg",
                             isFullscreen && "fixed inset-0 z-50 bg-black object-contain"
                           )}
                           onLoad={() => logger.log('✅ RenderPreview: Image loaded successfully:', result.imageUrl)}
                           onError={(e) => {
                             console.error('❌ RenderPreview: Image failed to load:', result.imageUrl, e);
                             console.error('❌ RenderPreview: Image error details:', e.currentTarget);
                           }}
                         />
                         
                         {/* Image Badges */}
                         <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                           <Badge variant="secondary" className="text-xs">
                             {result.style}
                           </Badge>
                           <Badge variant="secondary" className="text-xs">
                             {result.aspectRatio}
                           </Badge>
                           <Badge variant="secondary" className="text-xs">
                             {result.quality}
                           </Badge>
                           <Badge variant="secondary" className="text-xs">
                             <Clock className="h-3 w-3 mr-1" />
                             {result.processingTime?.toFixed(1)}s
                           </Badge>
                         </div>
                         
                         {/* Fullscreen Toggle */}
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={handleFullscreen}
                           className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                         >
                           {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                         </Button>
                       </div>
                     )
                  ) : (
                    <div className="h-full flex flex-col">
                      {/* Version Navigation */}
                      {versions.length > 1 && (
                        <div className="flex items-center justify-between p-2 border-b border-border bg-muted/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentVersionIndex(Math.max(0, currentVersionIndex - 1))}
                            disabled={currentVersionIndex === 0}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Version {currentVersionIndex + 1} of {versions.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentVersionIndex(Math.min(versions.length - 1, currentVersionIndex + 1))}
                            disabled={currentVersionIndex === versions.length - 1}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Version Image */}
                      <div className="flex-1 flex items-center justify-center">
                        {versions[currentVersionIndex] && (
                          // Use regular img tag for external storage URLs to avoid Next.js 16 private IP blocking
                          (versions[currentVersionIndex].imageUrl?.includes('supabase.co') || versions[currentVersionIndex].imageUrl?.includes('storage.googleapis.com') || versions[currentVersionIndex].imageUrl?.includes(process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || '')) ? (
                            <img
                              src={versions[currentVersionIndex].imageUrl || '/placeholder-image.jpg'}
                              alt={`Version ${currentVersionIndex + 1}`}
                              className="max-w-full max-h-full object-contain rounded-lg"
                            />
                          ) : (
                            <Image
                              src={versions[currentVersionIndex].imageUrl || '/placeholder-image.jpg'}
                              alt={`Version ${currentVersionIndex + 1}`}
                              width={800}
                              height={450}
                              className="max-w-full max-h-full object-contain rounded-lg"
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Result Info */}
                <div className="p-4 border-t border-border bg-background">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleLike}
                        className={cn(
                          "flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors",
                          isLiked 
                            ? "bg-destructive/10 text-destructive" 
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                        <span>{likes}</span>
                      </button>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">{views}</span>
                      </div>
                    </div>
                    
                     <div className="flex items-center space-x-2">
                       <Button variant="outline" size="sm" onClick={handleDownload} title="Download">
                         <Download className="h-4 w-4" />
                       </Button>
                       <Button variant="outline" size="sm" onClick={handleShare} title="Share">
                         <Share2 className="h-4 w-4" />
                       </Button>
                       {onIterate && (
                         <Button 
                           variant="default" 
                           size="sm" 
                           onClick={() => {
                             logger.log('🔄 RenderPreview: Iterate button clicked');
                             if (result?.imageUrl) {
                               onIterate(result.imageUrl);
                               logger.log('✅ RenderPreview: Iterate callback triggered with:', result.imageUrl);
                             }
                           }}
                           title="Iterate"
                         >
                           <RefreshCw className="h-4 w-4" />
                         </Button>
                       )}
                       
                       {/* Upscaling Options - Compact Dropdown */}
                       <div className="flex items-center space-x-2">
                         <Select onValueChange={(value) => handleUpscale(parseInt(value) as 2 | 4 | 10)} disabled={isUpscaling}>
                           <SelectTrigger className="w-24 h-8 text-xs">
                             <SelectValue placeholder="Upscale" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="2">2x</SelectItem>
                             <SelectItem value="4">4x</SelectItem>
                             <SelectItem value="10">10x</SelectItem>
                           </SelectContent>
                         </Select>
                         {isUpscaling && (
                           <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                         )}
                       </div>
                     </div>
                  </div>

                  {/* Upscaling Result */}
                  {upscalingResult && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          ✅ Upscaling Complete ({upscalingResult.scale}x)
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {upscalingResult.processingTime}s
                        </Badge>
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                        <div>• Image upscaled by {upscalingResult.scale}x successfully</div>
                        <div>• Processing time: {upscalingResult.processingTime}s</div>
                        <div>• Provider: {upscalingResult.provider}</div>
                      </div>
                    </div>
                  )}

                  {/* Upscaling Error */}
                  {upscalingError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                        ❌ Upscaling Failed
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-300">
                        {upscalingError}
                      </div>
                    </div>
                  )}

                  {/* Render Chain Visualization */}
                  {chainRenders && chainRenders.length > 0 && (
                    <div className="mt-4">
                      <RenderChainViz
                        renders={chainRenders}
                        selectedRenderId={selectedRenderId}
                        onSelectRender={onSelectRender || (() => {})}
                        onVersionSelect={onVersionSelect}
                        chainId={chainId}
                        onChainDeleted={onChainDeleted}
                        onNewChain={onNewChain}
                        isMobile={isMobile}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    {engineType === 'exterior' ? (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    ) : engineType === 'interior' ? (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    ) : engineType === 'furniture' ? (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Your {engineType} render will appear here
                  </h3>
                  <p className="text-muted-foreground">
                    Use the control panel to configure and generate your AI-powered visualization
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}