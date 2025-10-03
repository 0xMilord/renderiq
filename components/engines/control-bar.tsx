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
import { Switch } from '@/components/ui/switch';
import { useCredits } from '@/lib/hooks/use-credits';
import { useImageGeneration } from '@/lib/hooks/use-image-generation';
import { useProjects } from '@/lib/hooks/use-projects';
import { useRenders } from '@/lib/hooks/use-renders';
import { VersionSelector } from './version-selector';
import { 
  Upload, 
  X, 
  AlertCircle, 
  Image as ImageIcon, 
  Video, 
  Target,
  Sparkles,
  Zap,
  Sun,
  ChevronUp,
  Square,
  Monitor,
  Tablet,
  Camera,
  Plus,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { CreateProjectModal } from '@/components/projects/create-project-modal';

interface ControlBarProps {
  engineType: 'exterior' | 'interior' | 'furniture' | 'site-plan';
  onResult?: (result: unknown) => void;
  onGenerationStart?: () => void;
  onProjectChange?: (projectId: string) => void;
  isMobile?: boolean;
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

export function ControlBar({ engineType, chainId: initialChainId, onResult, onGenerationStart, onProjectChange, isMobile = false }: ControlBarProps) {
  // State - must be declared before hooks that use them
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [referenceRenderId, setReferenceRenderId] = useState<string>();
  const [chainId, setChainId] = useState<string | undefined>(initialChainId);

  // Set chainId from prop
  useEffect(() => {
    if (initialChainId) {
      setChainId(initialChainId);
      console.log('📍 Using chain from prop:', initialChainId);
    }
  }, [initialChainId]);

  // Hooks - using state declared above
  const { credits, refreshCredits } = useCredits();
  const { generate, reset, isGenerating, result, error } = useImageGeneration();
  const { projects, loading: projectsLoading } = useProjects();
  const { renders } = useRenders(selectedProjectId);

  // Notify parent when project changes
  useEffect(() => {
    if (selectedProjectId && onProjectChange) {
      onProjectChange(selectedProjectId);
    }
  }, [selectedProjectId, onProjectChange]);

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
      engineType,
      projectId: selectedProjectId,
      isPublic
    });

    if (!prompt.trim()) {
      console.log('❌ ControlBar: No prompt provided');
      return;
    }

    if (!selectedProjectId) {
      console.log('❌ ControlBar: No project selected');
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
      projectId: selectedProjectId,
      chainId: chainId,
      referenceRenderId: referenceRenderId,
      isPublic,
    });

    console.log('📥 ControlBar: Generate result received:', result);

    console.log('🔄 ControlBar: Refreshing credits');
    refreshCredits();
  };

  const creditsCost = getCreditsCost();

  return (
    <div className={cn(
      "bg-background flex flex-col transition-all duration-300 z-30",
      isMobile ? "w-full" : isCollapsed ? "w-16 border-r border-border" : "w-full lg:w-1/3 min-w-[280px] max-w-[400px] border-r border-border",
      isMobile ? "h-full" : "h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]"
    )}>
      {/* Header */}
      <div className="p-3 border-b border-border flex flex-col gap-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <h2 className="font-semibold text-foreground capitalize text-sm">
              {isCollapsed ? engineType.charAt(0).toUpperCase() : `${engineType} AI`}
            </h2>
            {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Select value={selectedProjectId} onValueChange={(value) => {
                if (value === 'create') {
                  setShowCreateProjectModal(true);
                } else {
                  setSelectedProjectId(value);
                }
              }}>
                <SelectTrigger className="w-32 h-6 text-xs">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : projects.length > 0 ? (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-projects" disabled>No projects</SelectItem>
                  )}
                  <SelectItem value="create" className="text-primary">
                    <div className="flex items-center space-x-1">
                      <Plus className="h-3 w-3" />
                      <span>Create Project</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Public Toggle */}
              <div className="flex items-center space-x-1">
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  className="scale-75"
                />
                <span className="text-xs text-muted-foreground">Public</span>
              </div>
            </div>
          )}
          </div>
        </div>
        
        {/* Version Selector */}
        {!isCollapsed && selectedProjectId && renders.length > 0 && (
          <div className="px-3 pb-2">
            <VersionSelector
              renders={renders}
              selectedVersionId={selectedVersionId}
              onSelectVersion={(id) => setSelectedVersionId(id)}
              onUseAsReference={async (id) => {
                setReferenceRenderId(id);
                // Load the referenced render's image as uploaded file
                const referencedRender = renders.find(r => r.id === id);
                if (referencedRender?.outputUrl) {
                  try {
                    // Fetch the image and convert to File
                    const response = await fetch(referencedRender.outputUrl);
                    const blob = await response.blob();
                    const file = new File([blob], 'reference-image.jpg', { type: 'image/jpeg' });
                    setUploadedFile(file);
                    console.log('✅ ControlBar: Loaded reference image as uploaded file');
                  } catch (error) {
                    console.error('❌ ControlBar: Failed to load reference image:', error);
                  }
                }
              }}
            />
          </div>
        )}
        
        {isMobile ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // This will be handled by the parent component
              const event = new CustomEvent('closeMobileDrawer');
              window.dispatchEvent(event);
            }}
            className="p-1 h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 h-6 w-6"
          >
            <ChevronUp className={cn("h-3 w-3 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
            <div className="px-3 mt-3 mb-2 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="image" className="flex items-center justify-center space-x-1 text-xs px-2 min-w-0">
                <ImageIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Image</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center justify-center space-x-1 text-xs px-2 min-w-0">
                <Video className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Video</span>
              </TabsTrigger>
              </TabsList>
            </div>
            
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
                      'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors aspect-video flex items-center justify-center',
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
                        <Image
                          src={previewUrl}
                          alt="Uploaded preview"
                          fill
                          className="object-cover"
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
                      className="h-auto p-1 flex flex-col items-center space-y-1 min-w-0"
                    >
                      <span className="text-sm">{type.icon}</span>
                      <span className="text-xs truncate">{type.label}</span>
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
                <div className="grid grid-cols-3 gap-1">
                  {styles.map((style) => (
                    <Button
                      key={style.value}
                      variant={selectedStyle === style.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStyle(style.value)}
                      className="h-auto p-1 flex flex-col items-center space-y-1 min-w-0"
                    >
                      <span className="text-sm">{style.icon}</span>
                      <span className="text-xs truncate">{style.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

               {/* Render Mode */}
               <div className="space-y-2">
                 <Label className="text-sm font-medium">Render Mode</Label>
                 <div className="grid grid-cols-2 gap-1">
                   {renderModes.map((mode) => (
                     <Button
                       key={mode.value}
                       variant={renderMode === mode.value ? "default" : "outline"}
                       size="sm"
                       onClick={() => setRenderMode(mode.value)}
                       className="h-auto p-1 flex flex-col items-center space-y-1 min-w-0"
                     >
                       <mode.icon className="h-3 w-3 flex-shrink-0" />
                       <div className="text-center min-w-0">
                         <div className="font-medium text-xs truncate">{mode.label}</div>
                         <div className="text-xs opacity-70 leading-tight truncate">{mode.description}</div>
                       </div>
                     </Button>
                   ))}
                 </div>
               </div>

               {/* Render Speed */}
               <div className="space-y-2">
                 <Label className="text-sm font-medium">Render Speed</Label>
                 <div className="grid grid-cols-2 gap-1">
                   {renderSpeeds.map((speed) => (
                     <Button
                       key={speed.value}
                       variant={renderSpeed === speed.value ? "default" : "outline"}
                       size="sm"
                       onClick={() => setRenderSpeed(speed.value)}
                       className="h-auto p-1 flex flex-col items-center space-y-1 min-w-0"
                     >
                       <speed.icon className="h-3 w-3 flex-shrink-0" />
                       <div className="text-center min-w-0">
                         <div className="font-medium text-xs truncate">{speed.label}</div>
                         <div className="text-xs opacity-70 leading-tight truncate">{speed.description}</div>
                       </div>
                     </Button>
                   ))}
                 </div>
               </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Aspect Ratio</Label>
                <div className="grid grid-cols-4 gap-1">
                  {aspectRatios.map((ratio) => (
                    <Button
                      key={ratio.value}
                      variant={aspectRatio === ratio.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAspectRatio(ratio.value)}
                      className="h-auto p-1 flex flex-col items-center space-y-1 min-w-0"
                    >
                      <ratio.icon className="h-3 w-3 flex-shrink-0" />
                      <div className="text-center min-w-0">
                        <div className="font-medium text-xs truncate">{ratio.label}</div>
                        <div className="text-xs opacity-70 truncate">{ratio.description}</div>
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

                {/* Requirements Check */}
                {!prompt.trim() && (
                  <Alert className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Please enter a prompt to generate</AlertDescription>
                  </Alert>
                )}

                {!selectedProjectId && prompt.trim() && (
                  <Alert className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Please select a project</AlertDescription>
                  </Alert>
                )}

                {credits && credits.balance < creditsCost && prompt.trim() && selectedProjectId && (
                  <Alert variant="destructive" className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Insufficient credits. Need {creditsCost}, have {credits.balance}
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive" className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || !selectedProjectId || isGenerating || (credits && credits.balance < creditsCost)}
                  className="w-full h-8"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                      Generating...
                    </>
                  ) : credits && credits.balance < creditsCost ? (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Upgrade to Generate
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate
                    </>
                  )}
                </Button>

                {credits && credits.balance < creditsCost && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-6 text-xs"
                      onClick={() => window.open('/plans', '_blank')}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                )}

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

                {/* Requirements Check */}
                {!prompt.trim() && (
                  <Alert className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Please enter a prompt to generate</AlertDescription>
                  </Alert>
                )}

                {!selectedProjectId && prompt.trim() && (
                  <Alert className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Please select a project</AlertDescription>
                  </Alert>
                )}

                {credits && credits.balance < creditsCost && prompt.trim() && selectedProjectId && (
                  <Alert variant="destructive" className="py-1">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Insufficient credits. Need {creditsCost}, have {credits.balance}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || !selectedProjectId || isGenerating || (credits && credits.balance < creditsCost)}
                  className="w-full h-8"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                      Generating Video...
                    </>
                  ) : credits && credits.balance < creditsCost ? (
                    <>
                      <Video className="h-3 w-3 mr-1" />
                      Upgrade to Generate
                    </>
                  ) : (
                    <>
                      <Video className="h-3 w-3 mr-1" />
                      Generate Video
                    </>
                  )}
                </Button>

                {credits && credits.balance < creditsCost && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-6 text-xs"
                      onClick={() => window.open('/plans', '_blank')}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  Est: 2-5 Min
                </p>
              </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal>
        <div className="hidden" />
      </CreateProjectModal>
    </div>
  );
}
