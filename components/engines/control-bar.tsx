'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCredits } from '@/lib/hooks/use-credits';
import { useImageGeneration } from '@/lib/hooks/use-image-generation';
import { 
  Upload, 
  X, 
  AlertCircle, 
  Image as ImageIcon, 
  Video, 
  Settings,
  Target,
  Sparkles,
  Zap,
  Sun,
  ChevronUp,
  Square,
  Monitor,
  Tablet,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlBarProps {
  engineType: 'exterior' | 'interior' | 'furniture' | 'site-plan';
  onResult?: (result: unknown) => void;
  onGenerationStart?: () => void;
}

const styles = [
  { value: 'none', label: 'None', icon: '🚫' },
  { value: 'realistic', label: 'Realistic', icon: '🏢' },
  { value: 'cgi', label: 'CGI', icon: '💻' },
  { value: 'night', label: 'Night', icon: '🌙' },
  { value: 'snow', label: 'Snow', icon: '❄️' },
  { value: 'rain', label: 'Rain', icon: '🌧️' },
  { value: 'sketch', label: 'Sketch', icon: '✏️' },
  { value: 'watercolor', label: 'Watercolor', icon: '🎨' },
  { value: 'illustration', label: 'Illustration', icon: '🖼️' },
];

const renderModes = [
  { value: 'exact', label: 'Exact', icon: Target, description: 'Precise geometry' },
  { value: 'creative', label: 'Creative', icon: Sparkles, description: 'Artistic style' },
];

const renderSpeeds = [
  { value: 'fast', label: 'Fast', icon: Zap, description: 'Fast: Quicker, Lower quality.' },
  { value: 'best', label: 'Best', icon: Sun, description: 'Best: Slower, Higher quality.' },
];

const aspectRatios = [
  { value: '1:1', label: 'Square', icon: Square, description: '1:1' },
  { value: '16:9', label: 'Wide', icon: Monitor, description: '16:9' },
  { value: '4:3', label: 'Standard', icon: Tablet, description: '4:3' },
  { value: '3:2', label: 'Photo', icon: Camera, description: '3:2' },
];

const imageTypes = [
  { value: '3d-mass', label: '3D Mass', icon: '🏗️' },
  { value: 'photo', label: 'Photo', icon: '📸' },
  { value: 'drawing', label: 'Drawing', icon: '✏️' },
  { value: 'wireframe', label: 'Wireframe', icon: '🔗' },
  { value: 'construction', label: 'Construction', icon: '🚧' },
];

export function ControlBar({ engineType, onResult, onGenerationStart }: ControlBarProps) {
  const { credits, refreshCredits } = useCredits();
  const { generate, reset, isGenerating, result, error } = useImageGeneration();
  
  // State
  const [activeTab, setActiveTab] = useState('image');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [renderMode, setRenderMode] = useState('exact');
  const [renderSpeed, setRenderSpeed] = useState('fast');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageType, setImageType] = useState('3d-mass');
  const [duration, setDuration] = useState(5);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Watch for result changes and pass to parent
  useEffect(() => {
    if (result && onResult) {
      console.log('🔄 ControlBar: Result changed, passing to parent:', result);
      console.log('🔄 ControlBar: Result has imageUrl:', !!result.imageUrl);
      console.log('🔄 ControlBar: Result imageUrl value:', result.imageUrl);
      onResult(result);
    }
  }, [result, onResult]);

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file.type.startsWith('image/')) {
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return;
    }
    
    setUploadedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedFile(null);
    setPreviewUrl(null);
  };

  const getCreditsCost = () => {
    const baseCost = activeTab === 'video' ? 5 : 1;
    const speedMultiplier = renderSpeed === 'best' ? 2 : 1;
    return baseCost * speedMultiplier;
  };

  const handleGenerate = async () => {
    console.log('🎯 ControlBar: Generate button clicked');
    console.log('📝 ControlBar: Form state:', {
      prompt,
      style: selectedStyle,
      quality: renderSpeed === 'best' ? 'high' : 'standard',
      aspectRatio,
      type: activeTab,
      duration: activeTab === 'video' ? duration : undefined,
      hasUploadedFile: !!uploadedFile,
      engineType
    });

    if (!prompt.trim()) {
      console.log('❌ ControlBar: No prompt provided');
      return;
    }

    const creditsCost = getCreditsCost();
    console.log('💰 ControlBar: Credits cost:', creditsCost, 'Balance:', credits?.balance);
    
    if (credits && credits.balance < creditsCost) {
      console.log('❌ ControlBar: Insufficient credits');
      return;
    }

    console.log('🔄 ControlBar: Resetting state and starting generation');
    reset();
    
    // Notify parent component that generation has started
    if (onGenerationStart) {
      console.log('📢 ControlBar: Notifying parent of generation start');
      onGenerationStart();
    }
    
    console.log('🚀 ControlBar: Calling generate function');
    const result = await generate({
      prompt,
      style: selectedStyle,
      quality: renderSpeed === 'best' ? 'high' : 'standard',
      aspectRatio,
      type: activeTab as 'image' | 'video',
      duration: activeTab === 'video' ? duration : undefined,
      uploadedImage: uploadedFile || undefined,
      negativePrompt: negativePrompt || undefined,
      imageType: imageType || undefined,
    });

    console.log('📥 ControlBar: Generate result received:', result);

    console.log('🔄 ControlBar: Refreshing credits');
    refreshCredits();
  };

  const creditsCost = getCreditsCost();

  return (
    <div className={cn(
      "w-1/3 bg-background border-r border-border flex flex-col transition-all duration-300 z-30",
      isCollapsed ? "w-16" : "w-1/3"
    )} style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <h2 className="font-semibold text-foreground capitalize text-sm">
          {isCollapsed ? engineType.charAt(0).toUpperCase() : `${engineType} AI`}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 h-6 w-6"
        >
          <ChevronUp className={cn("h-3 w-3 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 m-3 flex-shrink-0 h-8">
              <TabsTrigger value="image" className="flex items-center space-x-1 text-xs">
                <ImageIcon className="h-3 w-3" />
                <span>Image</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center space-x-1 text-xs">
                <Video className="h-3 w-3" />
                <span>Video</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 flex flex-col min-h-0">
              <TabsContent value="image" className="px-3 flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden data-[state=inactive]:!hidden">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-3 pb-2">
                {/* Upload Section */}
                <div className="space-y-2">
                <Label className="text-sm font-medium">Upload Image</Label>
                {!uploadedFile ? (
                  <div
                    {...getRootProps()}
                    className={cn(
                      'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                      isDragActive
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Upload Image</p>
                      <p className="text-xs text-muted-foreground">or drag & drop image</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Image Preview */}
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Uploaded preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={removeFile}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* File Info */}
                    <div className="flex items-center space-x-2 p-2 border border-border rounded-lg bg-muted/50">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Image Type</Label>
                <div className="grid grid-cols-5 gap-1">
                  {imageTypes.map((type) => (
                    <Button
                      key={type.value}
                      variant={imageType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setImageType(type.value)}
                      className="h-auto p-2 flex flex-col items-center space-y-1"
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your image. e.g. villa, modern architecture, daylight, beige stone facade"
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Negative Prompt */}
              <div className="space-y-2">
                <Label htmlFor="negative-prompt">Negative Prompt (optional)</Label>
                <Input
                  id="negative-prompt"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Remove unwanted elements"
                />
              </div>

              {/* Styles */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Styles</Label>
                <div className="grid grid-cols-3 gap-2">
                  {styles.map((style) => (
                    <Button
                      key={style.value}
                      variant={selectedStyle === style.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStyle(style.value)}
                      className="h-auto p-2 flex flex-col items-center space-y-1"
                    >
                      <span className="text-lg">{style.icon}</span>
                      <span className="text-xs">{style.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

               {/* Render Mode */}
               <div className="space-y-2">
                 <Label className="text-sm font-medium">Render Mode</Label>
                 <div className="grid grid-cols-2 gap-2">
                   {renderModes.map((mode) => (
                     <Button
                       key={mode.value}
                       variant={renderMode === mode.value ? "default" : "outline"}
                       size="sm"
                       onClick={() => setRenderMode(mode.value)}
                       className="h-auto p-2 flex flex-col items-center space-y-1"
                     >
                       <mode.icon className="h-4 w-4" />
                       <div className="text-center">
                         <div className="font-medium text-xs">{mode.label}</div>
                         <div className="text-xs opacity-70 leading-tight">{mode.description}</div>
                       </div>
                     </Button>
                   ))}
                 </div>
               </div>

               {/* Render Speed */}
               <div className="space-y-2">
                 <Label className="text-sm font-medium">Render Speed</Label>
                 <div className="grid grid-cols-2 gap-2">
                   {renderSpeeds.map((speed) => (
                     <Button
                       key={speed.value}
                       variant={renderSpeed === speed.value ? "default" : "outline"}
                       size="sm"
                       onClick={() => setRenderSpeed(speed.value)}
                       className="h-auto p-2 flex flex-col items-center space-y-1"
                     >
                       <speed.icon className="h-4 w-4" />
                       <div className="text-center">
                         <div className="font-medium text-xs">{speed.label}</div>
                         <div className="text-xs opacity-70 leading-tight">{speed.description}</div>
                       </div>
                     </Button>
                   ))}
                 </div>
               </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Aspect Ratio</Label>
                <div className="grid grid-cols-4 gap-2">
                  {aspectRatios.map((ratio) => (
                    <Button
                      key={ratio.value}
                      variant={aspectRatio === ratio.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAspectRatio(ratio.value)}
                      className="h-auto p-2 flex flex-col items-center space-y-1"
                    >
                      <ratio.icon className="h-4 w-4" />
                      <div className="text-center">
                        <div className="font-medium text-xs">{ratio.label}</div>
                        <div className="text-xs opacity-70">{ratio.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              </div>

              {/* Pinned Generate Button */}
              <div className="flex-shrink-0 space-y-1 pt-2 border-t border-border bg-background">
                <div className="flex items-center justify-between text-xs px-1">
                  <span>Credits: {creditsCost}</span>
                  <span className="text-muted-foreground">
                    Balance: {credits?.balance || 0}
                  </span>
                </div>

                {error && (
                  <Alert variant="destructive" className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating || (credits && credits.balance < creditsCost)}
                  className="w-full h-8"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Est: 50 Sec
                </p>
              </div>
              </TabsContent>

              <TabsContent value="video" className="px-3 flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden data-[state=inactive]:!hidden">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-3 pb-2">
                {/* Video-specific content */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="3"
                    max="30"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </div>
                
                {/* Same controls as image but for video */}
                <div className="space-y-2">
                  <Label htmlFor="video-prompt">Video Prompt</Label>
                  <Textarea
                    id="video-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your video sequence..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Pinned Generate Button for Video */}
              <div className="flex-shrink-0 space-y-1 pt-2 border-t border-border bg-background">
                <div className="flex items-center justify-between text-xs px-1">
                  <span>Credits: {creditsCost}</span>
                  <span className="text-muted-foreground">
                    Balance: {credits?.balance || 0}
                  </span>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating || (credits && credits.balance < creditsCost)}
                  className="w-full h-8"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Video className="h-3 w-3 mr-1" />
                      Generate Video
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Est: 2-5 Min
                </p>
              </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}
