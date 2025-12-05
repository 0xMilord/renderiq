'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Download
} from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { TOOL_CONTENT } from '@/lib/tools/tool-content';
import { createRenderAction } from '@/lib/actions/render.actions';
import { useCredits } from '@/lib/hooks/use-credits';
import { useRenders } from '@/lib/hooks/use-renders';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BaseToolComponentProps {
  tool: ToolConfig;
  children?: React.ReactNode;
  customSettings?: React.ReactNode;
  multipleImages?: boolean;
  maxImages?: number;
  onGenerate?: (formData: FormData) => Promise<{ success: boolean; data?: { renderId: string; outputUrl: string }; error?: string } | void>;
  projectId?: string | null;
}

export function BaseToolComponent({
  tool,
  children,
  customSettings,
  multipleImages = false,
  maxImages = 1,
  onGenerate,
  projectId: propProjectId,
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
  const [result, setResult] = useState<{ renderId: string; outputUrl: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'tool' | 'output'>('tool');
  
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('standard');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');

  // Calculate credits cost
  const creditsCost = quality === 'high' ? 10 : quality === 'ultra' ? 15 : 5;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (multipleImages) {
      const newFiles = acceptedFiles.slice(0, maxImages - images.length);
      setImages(prev => [...prev, ...newFiles]);
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    } else {
      const file = acceptedFiles[0];
      if (file) {
        setImages([file]);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews([reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [multipleImages, maxImages, images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: multipleImages,
    maxFiles: multipleImages ? maxImages : 1,
  });

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

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
            setResult({
              renderId: result.data.renderId,
              outputUrl: result.data.outputUrl,
            });
            await refreshCredits();
            toast.success('Render generated successfully!');
            
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
        setResult({
          renderId: ('renderId' in result.data ? result.data.renderId : ('id' in result.data ? String(result.data.id) : '')) as string,
          outputUrl: (result.data.outputUrl || '') as string,
        });
        await refreshCredits();
        toast.success('Render generated successfully!');
        
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
    <Card className="w-full min-h-[600px] lg:h-[calc(100vh-200px)] lg:sticky lg:top-20 overflow-y-auto overflow-x-hidden">
      <CardContent className="space-y-6 pt-6">
            {/* Upload Area - 16:9 */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg cursor-pointer transition-colors aspect-video relative overflow-hidden",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                "hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              {previews.length > 0 ? (
                <div className="w-full h-full relative">
                  {multipleImages ? (
                    <div className="grid grid-cols-2 gap-2 p-2 h-full">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {images.length < maxImages && (
                        <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                          <FileImage className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full relative group">
                      <img 
                        src={previews[0]} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImages([]);
                            setPreviews([]);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2 text-sm text-center">
                    {isDragActive ? 'Drop images here' : `Click to upload or drag and drop`}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    {multipleImages ? `Up to ${maxImages} images` : 'Single image'}
                  </p>
                </div>
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
              {/* Render Settings - Always Shown */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border"></div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Render Settings</span>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="quality" className="text-sm">Quality</Label>
                      <Select value={quality} onValueChange={(v: 'standard' | 'high' | 'ultra') => setQuality(v)}>
                        <SelectTrigger id="quality" className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard (5 credits)</SelectItem>
                          <SelectItem value="high">High (10 credits)</SelectItem>
                          <SelectItem value="ultra">Ultra (15 credits)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="aspect-ratio" className="text-sm">Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger id="aspect-ratio" className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                          <SelectItem value="4:3">4:3 (Traditional)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Tool Settings */}
              {customSettings && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border"></div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{tool.name} Settings</span>
                    <div className="h-px flex-1 bg-border"></div>
                  </div>
                  {customSettings}
                </div>
              )}
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!canGenerate || projectLoading || creditsLoading}
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
                  Generate ({creditsCost} credits)
                </>
              )}
            </Button>

            {credits && credits.balance < creditsCost && (
              <p className="text-xs text-center text-muted-foreground">
                Insufficient credits. You need {creditsCost} but have {credits.balance}.
              </p>
            )}
          </CardContent>
        </Card>
  );

  // Output Panel Content
  const OutputPanelContent = () => (
    <Card className="w-full min-h-[600px] lg:h-[calc(100vh-200px)] flex items-center justify-center">
      <CardContent className="p-6 lg:p-12 text-center w-full">
        {loading ? (
          <ShimmerPlaceholder />
        ) : result ? (
          <div className="space-y-4">
            <img 
              src={result.outputUrl} 
              alt="Generated result" 
              className="max-w-full max-h-[calc(100vh-300px)] mx-auto rounded-lg"
            />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => window.open(result.outputUrl, '_blank')}>
                View Full Size
              </Button>
              <Button variant="outline" onClick={() => {
                const link = document.createElement('a');
                link.href = result.outputUrl;
                link.download = `render-${result.renderId}.png`;
                link.click();
              }}>
                Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Your generated render will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-[1920px] mx-auto overflow-x-hidden">
      {/* Desktop: Side-by-side layout */}
      <div className="hidden lg:grid lg:grid-cols-10 gap-6">
        <div className="lg:col-span-4">
          <ToolPanelContent />
        </div>
        <div className="lg:col-span-6 space-y-6 overflow-x-hidden">
          <OutputPanelContent />
        </div>
      </div>

      {/* Mobile/Tablet: Tabs layout */}
      <div className="block lg:hidden">
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Your Renders from This Tool</CardTitle>
                {toolRenders.length > 0 && (
                  <span className="text-xs text-muted-foreground">{toolRenders.length} render{toolRenders.length !== 1 ? 's' : ''}</span>
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
                <ScrollArea className="w-full">
                  <div className="flex gap-3 pb-2">
                    {toolRenders.map((render, index) => (
                      <div key={render.id} className="flex items-center gap-3">
                        <div
                          className="group relative flex-shrink-0 w-32 aspect-[4/3] rounded-md overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer"
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
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
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
                          <div className="h-16 w-px bg-border flex-shrink-0"></div>
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

      {/* Specialized Sections for Render Section Drawing Tool */}
      {tool.id === 'render-section-drawing' && toolContent && (
        <div className="mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section Types */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Section Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-card">
                    <h4 className="font-semibold text-sm mb-1.5">Technical CAD</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Precise linework with architectural annotations and standard CAD conventions. Perfect for construction documents and permit applications.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <h4 className="font-semibold text-sm mb-1.5">3D Cross Section</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Three-dimensional perspective showing depth, volume, and spatial relationships. Ideal for design visualization and client presentations.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <h4 className="font-semibold text-sm mb-1.5">Illustrated 2D</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Stylized architectural illustration with artistic rendering while maintaining technical accuracy. Great for presentations and marketing materials.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LOD Levels */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Level of Detail (LOD)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-primary">LOD 100</span>
                      <span className="text-xs text-muted-foreground">Conceptual</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Basic shapes and volumes only. Perfect for early concept studies and massing studies.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-primary">LOD 200</span>
                      <span className="text-xs text-muted-foreground">Approximate</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Generic elements with approximate sizes. Ideal for schematic design phase.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-primary">LOD 300</span>
                      <span className="text-xs text-muted-foreground">Precise</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Specific elements with exact dimensions. Best for design development with detailed specifications.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-primary">LOD 400</span>
                      <span className="text-xs text-muted-foreground">Fabrication</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Complete specifications ready for construction. Includes assembly details and fabrication-ready information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Use Cases */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Use Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {toolContent.useCases?.map((useCase, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <h4 className="font-semibold text-sm text-foreground mb-1.5">{useCase.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{useCase.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Software Compatibility */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Software Compatibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">3D Modeling</p>
                    <div className="flex flex-wrap gap-2">
                      {['Revit', 'SketchUp', 'Rhino', 'Archicad', 'Vectorworks'].map((software) => (
                        <span key={software} className="text-xs px-2.5 py-1 rounded-md bg-muted text-foreground">
                          {software}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Rendering</p>
                    <div className="flex flex-wrap gap-2">
                      {['Lumion', 'Enscape', 'V-Ray', 'Twinmotion', 'Unreal Engine'].map((software) => (
                        <span key={software} className="text-xs px-2.5 py-1 rounded-md bg-muted text-foreground">
                          {software}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">CAD Integration</p>
                    <div className="flex flex-wrap gap-2">
                      {['AutoCAD', 'Revit', 'Archicad', 'Vectorworks'].map((software) => (
                        <span key={software} className="text-xs px-2.5 py-1 rounded-md bg-muted text-foreground">
                          {software}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Works with any architectural render regardless of source software. Simply export your render as JPG, PNG, or WebP and upload.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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

