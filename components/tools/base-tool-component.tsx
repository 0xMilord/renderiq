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
import { 
  Sparkles, 
  FileImage, 
  X, 
  AlertCircle, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { ToolConfig } from '@/lib/tools/registry';
import { TOOL_CONTENT } from '@/lib/tools/tool-content';
import { createRenderAction } from '@/lib/actions/render.actions';
import { useToolProject } from '@/lib/hooks/use-tool-project';
import { useCredits } from '@/lib/hooks/use-credits';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BaseToolComponentProps {
  tool: ToolConfig;
  children?: React.ReactNode;
  customSettings?: React.ReactNode;
  multipleImages?: boolean;
  maxImages?: number;
  onGenerate?: (formData: FormData) => Promise<{ success: boolean; data?: { renderId: string; outputUrl: string }; error?: string } | void>;
  additionalSections?: React.ReactNode; // Custom sections for landing pages
}

export function BaseToolComponent({
  tool,
  children,
  customSettings,
  multipleImages = false,
  maxImages = 1,
  onGenerate,
  additionalSections,
}: BaseToolComponentProps) {
  // Get rich content for this tool, or use defaults
  const toolContent = TOOL_CONTENT[tool.id];
  const router = useRouter();
  const { projectId, loading: projectLoading } = useToolProject();
  const { credits, loading: creditsLoading, refreshCredits } = useCredits();
  
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ renderId: string; outputUrl: string } | null>(null);
  
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
      setError('Project not ready. Please wait...');
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
            
            // Navigate to render after a short delay
            setTimeout(() => {
              router.push(`/project/tools`);
            }, 2000);
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
        
        // Navigate to render after a short delay
        setTimeout(() => {
          router.push(`/project/tools`);
        }, 2000);
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

  const canGenerate = images.length > 0 && !loading && projectId && (!credits || credits.balance >= creditsCost);

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left: Upload & Settings - 1/4 width */}
        <Card className="w-full lg:col-span-1 h-[calc(100vh-200px)] sticky top-20 overflow-y-auto">
          <CardContent className="space-y-6 pt-6">
            {/* Upload Area - 1:1 Square */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg cursor-pointer transition-colors aspect-square relative overflow-hidden",
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

            {/* Progress */}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Generating...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Success Alert */}
            {result && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Render generated successfully! Redirecting...
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

        {/* Right: Output Area - 3/4 width */}
        <div className="lg:col-span-3 space-y-6">
          {/* Output/Preview Area */}
          <Card className="w-full h-[calc(100vh-200px)] flex items-center justify-center">
            <CardContent className="p-12 text-center">
              {result ? (
                <div className="space-y-4">
                  <img 
                    src={result.outputUrl} 
                    alt="Generated result" 
                    className="max-w-full max-h-[calc(100vh-300px)] mx-auto rounded-lg"
                  />
                  <div className="flex gap-4 justify-center">
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
                  <FileImage className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Your generated render will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: Brick Pattern Info Cards */}
      <div className="mt-12">
        {/* Brick Pattern Layout - 3 rows with alternating 3/4 and 1/4 widths */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Row 1: How It Works (3/4) + About This Tool (1/4) */}
          <div className="md:col-span-3">
            {children || (
              <Card className="h-full border-2 hover:border-primary/50 transition-colors">
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
            )}
          </div>

          {/* About This Tool - 1/4 width */}
          <div className="md:col-span-1">
            <Card className="h-full border-2 hover:border-primary/50 transition-colors">
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
                {tool.seo.keywords.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tool.seo.keywords.slice(0, 4).map((keyword, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Custom Sections - Rows 2 & 3 in brick pattern */}
          {additionalSections}
        </div>
      </div>

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

