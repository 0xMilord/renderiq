'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useUpscaling } from '@/lib/hooks/use-upscaling';
import { logger } from '@/lib/utils/logger';
import { Maximize2, Loader2 } from 'lucide-react';
import type { Render } from '@/lib/types/render';

interface UpscaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRenderIds: string[];
  chainRenders: Render[];
  projectId?: string | null;
  chainId?: string | null;
  onUpscaleComplete?: (render: Render) => void;
}

export function UpscaleDialog({
  open,
  onOpenChange,
  selectedRenderIds,
  chainRenders,
  projectId,
  chainId,
  onUpscaleComplete,
}: UpscaleDialogProps) {
  const [sliderValue, setSliderValue] = useState<number[]>([3]); // Default to 4K
  const { upscaleImage, isUpscaling, upscalingResult, error: upscalingError, reset } = useUpscaling();

  // Get the first selected render
  const selectedRender = chainRenders.find(r => selectedRenderIds.includes(r.id));
  const imageUrl = selectedRender?.outputUrl;

  // Map slider value to scale and imageSize
  const getScaleAndSize = (value: number): { scale: 2 | 4 | 10; imageSize: '1K' | '2K' | '4K' } => {
    if (value === 1) return { scale: 2, imageSize: '1K' };
    if (value === 2) return { scale: 4, imageSize: '2K' };
    return { scale: 10, imageSize: '4K' };
  };

  const { scale, imageSize } = getScaleAndSize(sliderValue[0]);

  // Get display label for current value
  const getDisplayLabel = (value: number): string => {
    if (value === 1) return '1K (1024px)';
    if (value === 2) return '2K (2048px)';
    return '4K (4096px)';
  };

  // Calculate credits cost
  const creditsCost = imageSize === '4K' ? 20 : imageSize === '2K' ? 10 : 5;

  const handleUpscale = async () => {
    if (!imageUrl || !projectId || !selectedRender) {
      logger.error('❌ UpscaleDialog: Missing required data', { imageUrl, projectId, selectedRender: !!selectedRender });
      return;
    }

    logger.log('🎯 UpscaleDialog: Starting upscale', {
      imageUrl,
      scale,
      imageSize,
      selectedRenderId: selectedRender.id,
    });

    // Use the upscaling hook which handles the API call
    // Note: The hook uses quality parameter, but for 4K upscaling we need to pass imageSize
    // We'll need to modify the approach to use the render API directly with imageSize
    try {
      // Create FormData for upscaling
      const formData = new FormData();
      
      // Build upscaling prompt
      const upscalingPrompt = `Upscale this image to ${imageSize} resolution (${getDisplayLabel(sliderValue[0])}), maintaining all details and improving resolution while preserving architectural accuracy`;
      
      formData.append('prompt', upscalingPrompt);
      formData.append('style', 'realistic');
      formData.append('quality', 'standard'); // Standard quality, resolution controlled by imageSize
      formData.append('aspectRatio', selectedRender.settings?.aspectRatio || '16:9');
      formData.append('type', 'image');
      formData.append('projectId', projectId);
      formData.append('imageSize', imageSize); // ✅ CRITICAL: Pass imageSize for 4K upscaling
      
      if (chainId) {
        formData.append('chainId', chainId);
      }
      
      if (selectedRender.id) {
        formData.append('referenceRenderId', selectedRender.id);
      }
      
      // ✅ FIXED: Convert CDN URL to direct GCS URL to avoid CORS issues
      // Use cdnToDirectGCS utility to get direct GCS URL (no CORS)
      const { cdnToDirectGCS, isCDNUrl } = await import('@/lib/utils/cdn-fallback');
      const fetchUrl = isCDNUrl(imageUrl) ? cdnToDirectGCS(imageUrl) : imageUrl;
      
      logger.log('🔄 UpscaleDialog: Fetching image', { 
        original: imageUrl, 
        fetchUrl,
        isCDN: isCDNUrl(imageUrl)
      });
      
      // Fetch image and convert to base64
      const imageResponse = await fetch(fetchUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
      const base64 = btoa(binary);
      
      const contentType = imageResponse.headers.get('content-type') || 'image/png';
      const imageType = contentType.startsWith('image/') ? contentType : 'image/png';
      
      formData.append('uploadedImageData', base64);
      formData.append('uploadedImageType', imageType);
      formData.append('isPublic', 'true');
      formData.append('temperature', '0.5'); // Lower temperature for upscaling

      // Call render API
      const { createRenderAction } = await import('@/lib/actions/render.actions');
      const result = await createRenderAction(formData);

      if (result.success && result.data) {
        const upscaledRender: Render = {
          id: result.data.renderId || result.data.id || `upscale-${Date.now()}`,
          projectId: projectId || '',
          userId: selectedRender.userId,
          type: 'image',
          prompt: upscalingPrompt,
          settings: {
            ...selectedRender.settings,
            imageSize,
          },
          outputUrl: result.data.outputUrl || '',
          outputKey: result.data.outputKey || null,
          status: 'completed',
          errorMessage: null,
          processingTime: result.data.processingTime || 0,
          creditsCost,
          chainId: chainId || null,
          chainPosition: null,
          referenceRenderId: selectedRender.id,
          uploadedImageUrl: null,
          uploadedImageKey: null,
          uploadedImageId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        logger.log('✅ UpscaleDialog: Upscaling completed', upscaledRender);
        
        if (onUpscaleComplete) {
          onUpscaleComplete(upscaledRender);
        }
        
        onOpenChange(false);
        reset();
      } else {
        logger.error('❌ UpscaleDialog: Upscaling failed', result.error);
      }
    } catch (error) {
      logger.error('❌ UpscaleDialog: Exception during upscaling', error);
    }
  };

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setSliderValue([3]); // Reset to 4K
    }
  }, [open, reset]);

  if (!selectedRender || !imageUrl) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Maximize2 className="h-5 w-5" />
            Upscale Render
          </DialogTitle>
          <DialogDescription>
            Upscale the selected render to a higher resolution while maintaining quality and architectural accuracy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="upscale-resolution" className="text-sm font-medium">
                  Resolution
                </Label>
              </div>
              <span className="text-sm font-medium text-foreground">
                {getDisplayLabel(sliderValue[0])}
              </span>
            </div>
            <Slider
              id="upscale-resolution"
              min={1}
              max={3}
              step={1}
              value={sliderValue}
              onValueChange={setSliderValue}
              className="w-full"
              disabled={isUpscaling}
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>1K (1024px)</span>
              <span>2K (2048px)</span>
              <span>4K (4096px)</span>
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selected Render:</span>
                <span className="font-medium">{selectedRender.prompt?.substring(0, 30) || 'Render'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Resolution:</span>
                <span className="font-medium">{getDisplayLabel(sliderValue[0])}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credits Cost:</span>
                <span className="font-medium">{creditsCost} credits</span>
              </div>
            </div>
          </div>

          {upscalingError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {upscalingError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpscaling}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpscale}
            disabled={isUpscaling || !imageUrl || !projectId}
          >
            {isUpscaling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upscaling...
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Upscale to {getDisplayLabel(sliderValue[0])}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

