'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle, Video } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { logger } from '@/lib/utils/logger';

export interface ImageToVideoConfig {
  cameraPathStyle: 'zoom' | 'pan' | 'orbit' | 'fly-through' | 'arc';
  focalLength: 'as-per-render' | 'long' | 'mid' | 'short';
  sceneType: 'interior' | 'exterior';
  duration: 4 | 6 | 8;
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: '16:9' | '9:16';
}

interface ImageToVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRenderIds: string[];
  onGenerate: (config: ImageToVideoConfig, selectedRenderIds: string[]) => void;
}

export function ImageToVideoDialog({
  open,
  onOpenChange,
  selectedRenderIds,
  onGenerate,
}: ImageToVideoDialogProps) {
  const [cameraPathStyle, setCameraPathStyle] = useState<'zoom' | 'pan' | 'orbit' | 'fly-through' | 'arc'>('pan');
  const [focalLength, setFocalLength] = useState<'as-per-render' | 'long' | 'mid' | 'short'>('as-per-render');
  const [sceneType, setSceneType] = useState<'interior' | 'exterior'>('interior');
  const [duration, setDuration] = useState<4 | 6 | 8>(8);
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('standard');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setCameraPathStyle('pan');
      setFocalLength('as-per-render');
      setSceneType('interior');
      setDuration(8);
      setQuality('standard');
      setAspectRatio('16:9');
    }
    }, [open]);

  const handleGenerate = () => {
    if (selectedRenderIds.length === 0) {
      logger.warn('ImageToVideoDialog: No renders selected for video generation.');
      return;
    }

    const config: ImageToVideoConfig = {
      cameraPathStyle,
      focalLength,
      sceneType,
      duration,
      quality,
      aspectRatio,
    };

    logger.log('ImageToVideoDialog: Initiating video generation', { config, selectedRenderIds });
    onGenerate(config, selectedRenderIds);
    onOpenChange(false); // Close dialog after initiating generation
  };

  const isGenerateDisabled = selectedRenderIds.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Image to Video
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="selected-renders" className="text-sm">Selected Renders</Label>
            <span id="selected-renders" className="text-sm text-muted-foreground">
              {selectedRenderIds.length} image{selectedRenderIds.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Camera Path Style */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="camera-path" className="text-sm">Camera Path Style</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Choose the camera movement style for the video animation.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={cameraPathStyle} onValueChange={(v: any) => setCameraPathStyle(v)}>
              <SelectTrigger id="camera-path" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zoom">Zoom (zoom in/out)</SelectItem>
                <SelectItem value="pan">Pan (horizontal/vertical)</SelectItem>
                <SelectItem value="orbit">Orbit (circle around subject)</SelectItem>
                <SelectItem value="fly-through">Fly-through (move through space)</SelectItem>
                <SelectItem value="arc">Arc (curved path)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Focal Length */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="focal-length" className="text-sm">Focal Length</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Choose the focal length perspective for the video.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={focalLength} onValueChange={(v: any) => setFocalLength(v)}>
              <SelectTrigger id="focal-length" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="as-per-render">As per render</SelectItem>
                <SelectItem value="long">Long (compressed perspective)</SelectItem>
                <SelectItem value="mid">Mid (balanced perspective)</SelectItem>
                <SelectItem value="short">Short (wide perspective)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scene Type */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="scene-type" className="text-sm">Scene Type</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Select whether the scene is interior or exterior.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={sceneType} onValueChange={(v: any) => setSceneType(v)}>
              <SelectTrigger id="scene-type" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interior">Interior</SelectItem>
                <SelectItem value="exterior">Exterior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="duration" className="text-sm">Duration</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Select the video duration in seconds.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v) as 4 | 6 | 8)}>
              <SelectTrigger id="duration" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 seconds</SelectItem>
                <SelectItem value="6">6 seconds</SelectItem>
                <SelectItem value="8">8 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="quality" className="text-sm">Quality</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Select the video quality. Higher quality uses more credits.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={quality} onValueChange={(v: any) => setQuality(v)}>
              <SelectTrigger id="quality" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="ultra">Ultra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aspect Ratio */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="aspect-ratio" className="text-sm">Aspect Ratio</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Select the video aspect ratio.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
              <SelectTrigger id="aspect-ratio" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={isGenerateDisabled}>
            <Video className="h-4 w-4 mr-1" />
            Generate Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

