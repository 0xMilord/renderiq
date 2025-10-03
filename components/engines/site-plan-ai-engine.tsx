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
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Play, Pause, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SitePlanAIEngineProps {
  type: 'image' | 'video';
}

const sitePlanStyles = [
  { value: 'modern', label: 'Modern' },
  { value: 'contemporary', label: 'Contemporary' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'sustainable', label: 'Sustainable' },
  { value: 'urban', label: 'Urban' },
  { value: 'suburban', label: 'Suburban' },
  { value: 'rural', label: 'Rural' },
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

export function SitePlanAIEngine({ type }: SitePlanAIEngineProps) {
  const { credits } = useCredits();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('modern');
  const [quality, setQuality] = useState('standard');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5); // for video
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
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
    if (!uploadedFile || !prompt.trim()) {
      setError('Please upload an image and enter a prompt');
      return;
    }

    const creditsCost = getCreditsCost();
    if (credits && credits.balance < creditsCost) {
      setError('Insufficient credits');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Simulate processing
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 1000);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      clearInterval(interval);
      setProgress(100);
      setResult('https://via.placeholder.com/800x600/f97316/ffffff?text=Generated+Site+Plan+Render');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const creditsCost = getCreditsCost();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload and Settings */}
      <div className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Site Plan</CardTitle>
            <CardDescription>
              Upload your site plan, floor plan, or architectural drawing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!uploadedFile ? (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isDragActive ? 'Drop image here' : 'Upload site plan'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Drag and drop or click to select
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, WebP • Max 10MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">
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
                placeholder="Describe the site plan style, landscaping, building materials, lighting, and environmental context..."
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
                    {sitePlanStyles.map((styleOption) => (
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
                <span className="text-sm text-gray-600">
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
                disabled={!uploadedFile || !prompt.trim() || isProcessing || (credits && credits.balance < creditsCost)}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
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

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
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
              Your AI-generated site plan render will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {type === 'video' ? (
                    <video
                      src={result}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={result}
                      alt="Generated site plan render"
                      className="w-full h-full object-cover"
                    />
                  )}
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
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Generated result will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
