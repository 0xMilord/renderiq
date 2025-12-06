'use client';

import { useState, useCallback, useEffect } from 'react';
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
  HelpCircle
} from 'lucide-react';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';
import { ToolConfig } from '@/lib/tools/registry';
import { TOOL_CONTENT } from '@/lib/tools/tool-content';
import { createRenderAction } from '@/lib/actions/render.actions';
import { useCredits } from '@/lib/hooks/use-credits';
import { useRenders } from '@/lib/hooks/use-renders';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileUpload } from '@/components/ui/file-upload';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

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
}: BaseToolComponentProps) {
  // Get rich content for this tool, or use defaults
  const toolContent = TOOL_CONTENT[tool.id];
  const router = useRouter();
  const { credits, loading: creditsLoading, refreshCredits } = useCredits();
  
  // Use prop projectId only - no automatic project selection
  const projectId = propProjectId;
  const projectLoading = false; // No longer loading projects automatically
  
  // Fetch renders for this project and filter by tool
  const { renders, loading: rendersLoading, refetch: refetchRenders } = useRenders(projectId);
  const toolRenders = renders.filter(render => {
    // Check if render was created with this tool via settings.imageType
    if (render.settings && typeof render.settings === 'object' && 'imageType' in render.settings) {
      return (render.settings as { imageType?: string }).imageType === tool.id;
    }
    return false;
  }).filter(render => render.status === 'completed' && render.outputUrl).slice(0, 20); // Limit to 20 most recent
  
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ renderId: string; outputUrl: string; label?: string } | null>(null);
  const [results, setResults] = useState<Array<{ renderId: string; outputUrl: string; label?: string }>>([]);
  const [activeTab, setActiveTab] = useState<'tool' | 'output'>('tool');
  const [selectedRenderIndex, setSelectedRenderIndex] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('standard');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');

  // Calculate credits cost
  const creditsCost = quality === 'high' ? 10 : quality === 'ultra' ? 15 : 5;

  // Handle file changes from FileUpload component
  const handleFilesChange = useCallback((files: File[]) => {
    setImages(files);
    // Generate previews
    if (files.length > 0) {
      const newPreviews: string[] = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setPreviews([]);
    }
  }, []);

  const handleGenerate = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
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

    try {
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

      // Build prompt from system prompt and tool settings
      const prompt = tool.systemPrompt;

      // Create FormData
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('style', 'realistic');
      formData.append('quality', quality);
      formData.append('aspectRatio', aspectRatio);
      formData.append('type', 'image');
      formData.append('projectId', projectId);
      formData.append('uploadedImageData', imageBase64);
      formData.append('uploadedImageType', imageFile.type);
      formData.append('imageType', tool.id);

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
              setResults(result.data.map((r, idx) => ({
                renderId: r.renderId,
                outputUrl: r.outputUrl,
                label: r.label || `Result ${idx + 1}`
              })));
              setResult(null);
            } else {
              setResult({
                renderId: result.data.renderId,
                outputUrl: result.data.outputUrl,
                label: result.data.label
              });
              setResults([]);
            }
            await refreshCredits();
            toast.success(Array.isArray(result.data)
              ? `${result.data.length} renders generated successfully!`
              : 'Render generated successfully!');
            
            // Refresh renders list
            refetchRenders();
            
            // Switch to output tab to show result
            setActiveTab('output');
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
        await refreshCredits();
        toast.success(Array.isArray(result.data)
          ? `${result.data.length} renders generated successfully!`
          : 'Render generated successfully!');
        
        // Refresh renders list
        refetchRenders();
        
        // Switch to output tab to show result
        setActiveTab('output');
      } else {
        throw new Error(result.error || 'Failed to generate render');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate render';
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
    if (images.length === 0) return 'Please upload at least one image';
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
              This may take 10-30 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Tool Panel Content
  const ToolPanelContent = () => (
    <Card className="w-full min-h-[600px] lg:h-[calc(100vh-200px)] lg:sticky lg:top-20 overflow-y-auto overflow-x-hidden custom-scrollbar">
      <CardContent className="space-y-6 pt-3 pb-3 px-3">
            {/* Upload Area - Using improved FileUpload component */}
            <FileUpload
              multiple={multipleImages}
              maxFiles={maxImages}
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
              onFilesChange={handleFilesChange}
              previews={previews}
              aspectRatio="16/9"
            />

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
                  Processing your image... This may take 10-30 seconds
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="w-full">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Label htmlFor="quality" className="text-sm">Quality</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Output quality affects resolution and detail. Higher quality uses more credits but produces better results.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select value={quality} onValueChange={(v: 'standard' | 'high' | 'ultra') => setQuality(v)}>
                        <SelectTrigger id="quality" className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">1080p</SelectItem>
                          <SelectItem value="high">2160p</SelectItem>
                          <SelectItem value="ultra">4320p</SelectItem>
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
    const expectedCount = results.length > 0 ? results.length : (loading ? 1 : 0);
    
    return (
      <Card className="w-full min-h-[600px] lg:h-[calc(100vh-200px)]">
        <CardContent className="p-6 lg:p-12 w-full">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: Math.min(8, expectedCount || 1) }).map((_, idx) => (
                <ShimmerGridItem key={idx} />
              ))}
            </div>
          ) : displayResults.length > 0 ? (
            <div className="space-y-6">
              {hasMultipleResults ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {displayResults.map((res, idx) => (
                    <div key={res.renderId || idx} className="space-y-2">
                      <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                        <img 
                          src={res.outputUrl} 
                          alt={res.label || `Generated result ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                        {res.label && (
                          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm border border-border text-foreground px-2 py-1 rounded text-xs font-medium">
                            {res.label}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => window.open(res.outputUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = res.outputUrl;
                            link.download = `render-${res.renderId || idx}.png`;
                            link.click();
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
                  <img 
                    src={displayResults[0].outputUrl} 
                    alt="Generated result" 
                    className="max-w-full max-h-[calc(100vh-300px)] mx-auto rounded-lg"
                  />
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => window.open(displayResults[0].outputUrl, '_blank')}>
                      View Full Size
                    </Button>
                    <Button variant="outline" onClick={() => {
                      const link = document.createElement('a');
                      link.href = displayResults[0].outputUrl;
                      link.download = `render-${displayResults[0].renderId}.png`;
                      link.click();
                    }}>
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground text-center">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Your generated render will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto overflow-x-hidden">
      {/* Desktop: Resizable Panels Layout */}
      <div className="hidden lg:block">
        <PanelGroup direction="horizontal" className="gap-6">
          <Panel defaultSize={30} minSize={30} maxSize={40} className="min-w-0">
            <ToolPanelContent />
          </Panel>
          <PanelResizeHandle className="w-4 group relative flex items-center justify-center cursor-col-resize">
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
          <Panel defaultSize={70} minSize={60} maxSize={70} className="min-w-0">
            <div className="space-y-6 overflow-x-hidden">
              <OutputPanelContent />
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Mobile/Tablet: Tabs layout - Hidden below header */}
      <div className={cn("block lg:hidden", hintMessage ? "pt-20" : "pt-12")}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'tool' | 'output')} className="w-full">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                if (render.outputUrl) {
                                  const link = document.createElement('a');
                                  link.href = render.outputUrl;
                                  link.download = `render-${render.id}.png`;
                                  link.click();
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
                          <img
                            src={toolRenders[selectedRenderIndex].uploadedImageUrl || ''}
                            alt="Before"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value="after" className="mt-0">
                        <div className="relative w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                          <img
                            src={toolRenders[selectedRenderIndex].outputUrl || ''}
                            alt="After"
                            className="w-full h-full object-contain"
                          />
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
                      onClick={() => {
                        if (toolRenders[selectedRenderIndex].outputUrl) {
                          const link = document.createElement('a');
                          link.href = toolRenders[selectedRenderIndex].outputUrl || '';
                          link.download = `render-${toolRenders[selectedRenderIndex].id}.png`;
                          link.click();
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
                  { step: 'Generate', detail: 'Click Generate and wait for AI processing (typically 10-30 seconds)' },
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
                { q: 'How long does processing take?', a: 'Processing typically takes 10-30 seconds depending on the complexity of your image.' },
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
    </div>
  );
}

