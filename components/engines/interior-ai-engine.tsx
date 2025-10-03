'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCredits } from '@/lib/hooks/use-credits';
import { useImageGeneration } from '@/lib/hooks/use-image-generation';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Play, Pause, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteriorAIEngineProps {
  type: 'image' | 'video';
}

const interiorStyles = [
  { value: 'modern', label: 'Modern' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'scandinavian', label: 'Scandinavian' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'bohemian', label: 'Bohemian' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'contemporary', label: 'Contemporary' },
  { value: 'mid-century', label: 'Mid-Century Modern' },
];

const qualityOptions = [
  { value: 'standard', label: 'Standard (1 credit)' },
  { value: 'high', label: 'High (2 credits)' },
  { value: 'ultra', label: 'Ultra (3 credits)' },
];

const aspectRatios = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '16:9', label: 'Widescreen (16:9)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '3:2', label: 'Photo (3:2)' },
];

export function InteriorAIEngine({ type }: InteriorAIEngineProps) {
  const { credits, refreshCredits } = useCredits();
  const { generate, reset, isGenerating, result, error } = useImageGeneration();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('modern');
  const [quality, setQuality] = useState('standard');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5); // for video

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
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = () => {
    setUploadedFile(null);
  };

  const getCreditsCost = () => {
    const baseCost = type === 'video' ? 5 : 1;
    const qualityMultiplier = quality === 'high' ? 2 : quality === 'ultra' ? 3 : 1;
    return baseCost * qualityMultiplier;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    const creditsCost = getCreditsCost();
    if (credits && credits.balance < creditsCost) {
      return;
    }

    reset();
    
    await generate({
      prompt,
      style,
      quality: quality as 'standard' | 'high' | 'ultra',
      aspectRatio,
      type,
      duration: type === 'video' ? duration : undefined,
      uploadedImage: uploadedFile || undefined,
    });

    // Refresh credits after generation
    refreshCredits();
  };

  const creditsCost = getCreditsCost();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload and Settings */}
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Interior Sketch</CardTitle>
            <CardDescription>
              Upload your interior design sketch or reference image
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!uploadedFile ? (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-border hover:border-border/80'
                )}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      {isDragActive ? 'Drop image here' : 'Upload interior sketch'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag and drop or click to select
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, WebP • Max 10MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" onClick={removeFile} className="w-full">
                  Upload Different Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Render Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Description</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the interior style, mood, lighting, and specific elements you want..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interiorStyles.map((styleOption) => (
                      <SelectItem key={styleOption.value} value={styleOption.value}>
                        {styleOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality">Quality</Label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityOptions.map((qualityOption) => (
                      <SelectItem key={qualityOption.value} value={qualityOption.value}>
                        {qualityOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspectRatio">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map((ratio) => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === 'video' && (
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
            )}
          </CardContent>
        </Card>

        {/* Credits and Generate */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Credits Required</span>
                <Badge variant="outline">{creditsCost} credits</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Balance</span>
                <span className="text-sm text-muted-foreground">
                  {credits?.balance || 0} credits
                </span>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating || (credits && credits.balance < creditsCost)}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating {type === 'video' ? 'Video' : 'Image'}...
                  </>
                ) : (
                  <>
                    {type === 'video' ? <Play className="h-4 w-4 mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                    Generate {type === 'video' ? 'Video' : 'Image'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Result Preview */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Generated Result</CardTitle>
            <CardDescription>
              Your AI-generated interior render will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {type === 'video' ? (
                    <video
                      src={result.imageUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={result.imageUrl}
                      alt="Generated interior render"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <p><strong>Style:</strong> {result.style}</p>
                    <p><strong>Quality:</strong> {result.quality}</p>
                    <p><strong>Processing Time:</strong> {result.processingTime.toFixed(1)}s</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1">
                      Download
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Generated result will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
