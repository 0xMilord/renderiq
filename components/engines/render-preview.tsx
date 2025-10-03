'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RenderChainViz } from './render-chain-viz';
import { VersionSelector } from './version-selector';
import { Render } from '@/lib/db/schema';

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
  onVersionSelect
}: RenderPreviewProps) {
  console.log('🖼️ RenderPreview: Component rendered with result:', result);
  console.log('🖼️ RenderPreview: isGenerating:', isGenerating);
  console.log('🖼️ RenderPreview: selectedRenderId:', selectedRenderId);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [versions, setVersions] = useState<any[]>([]);

  // Debug result changes
  useEffect(() => {
    console.log('🖼️ RenderPreview: Result changed:', result);
    if (result) {
      console.log('🖼️ RenderPreview: Result has imageUrl:', !!result.imageUrl);
      console.log('🖼️ RenderPreview: Result imageUrl value:', result.imageUrl);
    }
  }, [result]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

  useEffect(() => {
    if (result) {
      console.log('👁️ RenderPreview: New result received, incrementing views:', result);
      console.log('👁️ RenderPreview: Result has imageUrl:', !!result.imageUrl);
      console.log('👁️ RenderPreview: Result imageUrl value:', result.imageUrl);
      setViews(prev => prev + 1);
    }
  }, [result]);

  useEffect(() => {
    console.log('🔄 RenderPreview: Props updated:', {
      hasResult: !!result,
      isGenerating,
      progress,
      engineType
    });
  }, [result, isGenerating, progress, engineType]);

  const handleLike = () => {
    console.log('❤️ RenderPreview: Like button clicked, current state:', { likes, isLiked });
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    setIsLiked(!isLiked);
    console.log('✅ RenderPreview: Like state updated');
  };

  const handleDownload = () => {
    console.log('⬇️ RenderPreview: Download button clicked');
    if (result?.imageUrl) {
      console.log('📁 RenderPreview: Starting download for:', result.imageUrl);
      const link = document.createElement('a');
      link.href = result.imageUrl;
      link.download = `${engineType}-render-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ RenderPreview: Download initiated');
    } else {
      console.log('❌ RenderPreview: No image URL available for download');
    }
  };

  const handleShare = () => {
    console.log('📤 RenderPreview: Share button clicked');
    if (navigator.share && result?.imageUrl) {
      console.log('📱 RenderPreview: Using native share API');
      navigator.share({
        title: `${engineType} AI Render`,
        text: `Check out this amazing ${engineType} render!`,
        url: result.imageUrl,
      }).then(() => {
        console.log('✅ RenderPreview: Share successful');
      }).catch((error) => {
        console.error('❌ RenderPreview: Share failed:', error);
      });
    } else {
      console.log('📋 RenderPreview: Using clipboard fallback');
      // Fallback to copying URL
      navigator.clipboard.writeText(result?.imageUrl || '').then(() => {
        console.log('✅ RenderPreview: URL copied to clipboard');
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
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={result.imageUrl}
                          alt={`Generated ${engineType} render`}
                          className="max-w-full max-h-full object-contain rounded-lg"
                          onLoad={() => console.log('✅ RenderPreview: Image loaded successfully:', result.imageUrl)}
                          onError={(e) => {
                            console.error('❌ RenderPreview: Image failed to load:', result.imageUrl, e);
                            console.error('❌ RenderPreview: Image error details:', e.currentTarget);
                          }}
                        />
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
                          <Image
                            src={versions[currentVersionIndex].imageUrl || '/placeholder-image.jpg'}
                            alt={`Version ${currentVersionIndex + 1}`}
                            width={800}
                            height={450}
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
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
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      {onIterate && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => {
                            console.log('🔄 RenderPreview: Iterate button clicked');
                            if (result?.imageUrl) {
                              onIterate(result.imageUrl);
                              console.log('✅ RenderPreview: Iterate callback triggered with:', result.imageUrl);
                            }
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Iterate
                        </Button>
                      )}
                      {onVersionSelect && chainRenders.length > 0 && (
                        <VersionSelector
                          renders={chainRenders}
                          selectedVersionId={selectedRenderId}
                          onSelectVersion={(id) => {
                            const selectedRender = chainRenders.find(r => r.id === id);
                            if (selectedRender && onSelectRender) {
                              console.log('👁️ RenderPreview: Version selected for preview:', selectedRender.id);
                              onSelectRender(selectedRender.id);
                            }
                          }}
                          onUseAsReference={(id) => {
                            const selectedRender = chainRenders.find(r => r.id === id);
                            if (selectedRender) {
                              console.log('📋 RenderPreview: Version selected for auto-fill:', selectedRender);
                              onVersionSelect(selectedRender);
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Generation Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Style:</span> {result.style}
                    </div>
                    <div>
                      <span className="font-medium">Quality:</span> {result.quality}
                    </div>
                    <div>
                      <span className="font-medium">Aspect Ratio:</span> {result.aspectRatio}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{result.processingTime?.toFixed(1)}s</span>
                    </div>
                  </div>
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