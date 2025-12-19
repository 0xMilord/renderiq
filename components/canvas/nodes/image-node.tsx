'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image as ImageIcon, Sparkles, Loader2, Download, ImageOff, Eye, X } from 'lucide-react';
import { ImageNodeData } from '@/lib/types/canvas';
import { useNodeExecution } from '@/lib/hooks/use-node-execution';
import { BaseNode, useNodeColors } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';
import { logger } from '@/lib/utils/logger';
import { trackRenderStarted, trackRenderCompleted, trackRenderFailed } from '@/lib/utils/sentry-metrics';
import { cn } from '@/lib/utils';

export function ImageNode(props: any) {
  const { data, id } = props;
  const nodeId = String(id);
  const { getEdges } = useReactFlow();
  // ✅ FIXED: Initialize with data from props if available (includes previousRenders from database)
  const [localData, setLocalData] = useState<ImageNodeData>(() => {
    if (data) {
      return {
        prompt: data.prompt || '',
        settings: data.settings || {
          style: 'architectural',
          quality: 'standard',
          aspectRatio: '16:9',
        },
        status: data.status || 'idle',
        previousRenders: (data.previousRenders && Array.isArray(data.previousRenders)) ? data.previousRenders : [],
        outputUrl: data.outputUrl,
        renderId: data.renderId,
        generatedAt: data.generatedAt,
        errorMessage: data.errorMessage,
        styleSettings: data.styleSettings,
        materialSettings: data.materialSettings,
        baseImageData: data.baseImageData,
        baseImageType: data.baseImageType,
      };
    }
    return {
      prompt: '',
      settings: {
        style: 'architectural',
        quality: 'standard',
        aspectRatio: '16:9',
      },
      status: 'idle' as ImageNodeData['status'],
      previousRenders: [],
    };
  });
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  
  // Use default settings - style comes from Style Node connection
  const defaultSettings = {
    style: 'architectural',
    quality: 'standard' as const,
    aspectRatio: '16:9',
  };
  const { generateImage, enhancePrompt, loading } = useNodeExecution();
  const nodeColors = useNodeColors();

  // Check connections
  const edges = getEdges();
  const hasTextInput = edges.some((e) => e.target === nodeId && e.targetHandle === 'prompt');
  const hasImageInput = edges.some((e) => e.target === nodeId && e.targetHandle === 'baseImage');
  const hasStyleInput = edges.some((e) => e.target === nodeId && e.targetHandle === 'style');
  const hasMaterialInput = edges.some((e) => e.target === nodeId && e.targetHandle === 'material');
  
  // Use localData.prompt which gets updated from connections
  const hasPrompt = localData.prompt && localData.prompt.trim().length > 0;

  // Update local data when prop data changes (from connections or initial load)
  // ✅ FIXED: Only update if prop data is actually different to avoid overriding generating state
  // ✅ FIXED: Properly load previousRenders from saved data on initial load
  // ✅ FIXED: Don't override selected version when user clicks thumbnail
  useEffect(() => {
    if (data) {
      setLocalData((prev) => {
        // Don't override if we're currently generating and prop doesn't have generating status
        // This prevents the generating state from being lost
        if (prev.status === 'generating' && data.status !== 'generating') {
          // Keep generating state unless prop explicitly says otherwise
          return prev;
        }
        
        // ✅ FIXED: Don't override outputUrl if user has selected a version
        // This prevents the selected version from being lost when props update
        if (selectedVersion && prev.outputUrl) {
          const selectedRender = prev.previousRenders?.find(r => r.id === selectedVersion);
          if (selectedRender && selectedRender.url === prev.outputUrl) {
            // User has selected a version - preserve it
            const previousRenders = 
              (data.previousRenders !== undefined && Array.isArray(data.previousRenders))
                ? data.previousRenders
                : (prev.previousRenders && Array.isArray(prev.previousRenders))
                ? prev.previousRenders
                : [];
            
            return {
              ...data,
              previousRenders: previousRenders,
              outputUrl: prev.outputUrl, // Preserve selected version
              renderId: prev.renderId, // Preserve selected render ID
            };
          }
        }
        
        // ✅ FIXED: On initial load, if data has previousRenders, use them
        // Priority: data.previousRenders (if exists) > prev.previousRenders > []
        // Use data.previousRenders if it's defined (even if empty array), otherwise preserve prev
        const previousRenders = 
          (data.previousRenders !== undefined && Array.isArray(data.previousRenders))
            ? data.previousRenders
            : (prev.previousRenders && Array.isArray(prev.previousRenders))
            ? prev.previousRenders
            : [];
        
        // Merge to preserve previousRenders and all other data
        return {
          ...data,
          previousRenders: previousRenders,
        };
      });
    }
  }, [data, selectedVersion]);

  // ✅ FIXED: Sync selectedVersion with outputUrl to ensure proper display
  // When outputUrl changes, update selectedVersion if it matches a render
  useEffect(() => {
    if (localData.outputUrl && localData.previousRenders && localData.previousRenders.length > 0) {
      const matchingRender = localData.previousRenders.find(r => r.url === localData.outputUrl);
      if (matchingRender && selectedVersion !== matchingRender.id) {
        setSelectedVersion(matchingRender.id);
      }
    }
  }, [localData.outputUrl, localData.previousRenders, selectedVersion]);

  const handleGenerate = useCallback(async () => {
    // Allow generation with either prompt OR base image (or both for hybrid)
    if (!localData.prompt.trim() && !localData.baseImageData) {
      alert('Please enter a prompt, connect a Text Node, or connect an Image Input Node');
      return;
    }

    // Build enhanced prompt with style and material settings
    // ✅ FIXED: Comprehensive, detailed prompt that includes ALL style settings in proper format
    // All style settings from the Style Settings node are now included in the final prompt
    let enhancedPrompt = localData.prompt.trim();

    if (localData.styleSettings) {
      const style = localData.styleSettings;
      
      // ✅ FIXED: Build comprehensive, detailed style prompt with ALL settings properly formatted
      // Format: Structured sections with clear labels for AI model understanding
      const styleSections: string[] = [];
      
      // Camera Settings - All options included
      if (style.camera) {
        const cameraParts: string[] = [];
        if (style.camera.focalLength !== undefined && style.camera.focalLength !== null) {
          cameraParts.push(`${style.camera.focalLength}mm focal length`);
        }
        if (style.camera.fStop !== undefined && style.camera.fStop !== null) {
          cameraParts.push(`f/${style.camera.fStop} aperture`);
        }
        if (style.camera.position) {
          const positionLabel = style.camera.position
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          cameraParts.push(`${positionLabel} camera position`);
        }
        if (style.camera.angle) {
          const angleLabel = style.camera.angle
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          cameraParts.push(`${angleLabel} view angle`);
        }
        if (cameraParts.length > 0) {
          styleSections.push(`Camera Specifications: ${cameraParts.join(', ')}.`);
        }
      }
      
      // Environment Settings - All options included
      if (style.environment) {
        const envParts: string[] = [];
        if (style.environment.scene) {
          envParts.push(`${style.environment.scene} scene`);
        }
        if (style.environment.weather) {
          envParts.push(`${style.environment.weather} weather conditions`);
        }
        if (style.environment.timeOfDay) {
          envParts.push(`${style.environment.timeOfDay} time of day`);
        }
        if (style.environment.season) {
          envParts.push(`${style.environment.season} season`);
        }
        if (envParts.length > 0) {
          styleSections.push(`Environmental Context: ${envParts.join(', ')}.`);
        }
      }
      
      // Lighting Settings - All options included
      if (style.lighting) {
        const lightingParts: string[] = [];
        if (style.lighting.intensity !== undefined && style.lighting.intensity !== null) {
          lightingParts.push(`${style.lighting.intensity}% light intensity`);
        }
        if (style.lighting.direction) {
          lightingParts.push(`${style.lighting.direction} lighting direction`);
        }
        if (style.lighting.color) {
          lightingParts.push(`${style.lighting.color} color temperature`);
        }
        if (style.lighting.shadows) {
          lightingParts.push(`${style.lighting.shadows} shadows`);
        }
        if (lightingParts.length > 0) {
          styleSections.push(`Lighting Setup: ${lightingParts.join(', ')}.`);
        }
      }
      
      // Atmosphere Settings - All options included
      if (style.atmosphere) {
        const atmosphereParts: string[] = [];
        if (style.atmosphere.mood) {
          atmosphereParts.push(`${style.atmosphere.mood} mood`);
        }
        if (style.atmosphere.contrast !== undefined && style.atmosphere.contrast !== null) {
          atmosphereParts.push(`${style.atmosphere.contrast}% contrast`);
        }
        if (style.atmosphere.saturation !== undefined && style.atmosphere.saturation !== null) {
          atmosphereParts.push(`${style.atmosphere.saturation}% saturation`);
        }
        if (atmosphereParts.length > 0) {
          styleSections.push(`Atmospheric Qualities: ${atmosphereParts.join(', ')}.`);
        }
      }
      
      // Combine all style sections into a comprehensive prompt
      // Each section is clearly labeled for AI model understanding
      if (styleSections.length > 0) {
        enhancedPrompt += `\n\n${styleSections.join(' ')}`;
      }
    }

    if (localData.materialSettings && localData.materialSettings.materials.length > 0) {
      enhancedPrompt += `\n\nMaterials:`;
      localData.materialSettings.materials.forEach((mat) => {
        enhancedPrompt += `\n- ${mat.name} (${mat.type}): ${mat.material}`;
        if (mat.color) enhancedPrompt += `, color: ${mat.color}`;
        if (mat.finish) enhancedPrompt += `, finish: ${mat.finish}`;
      });
    }

    logger.log('🎨 ImageNode: Starting generation', {
      prompt: enhancedPrompt.substring(0, 200),
      promptLength: enhancedPrompt.length,
      settings: localData.settings,
      hasStyle: !!localData.styleSettings,
      hasMaterial: !!localData.materialSettings,
      styleSettings: localData.styleSettings ? {
        camera: localData.styleSettings.camera,
        environment: localData.styleSettings.environment,
        lighting: localData.styleSettings.lighting,
        atmosphere: localData.styleSettings.atmosphere,
      } : null,
    });

    // Update status to generating and dispatch immediately
    setLocalData((prev) => {
      const updated = { ...prev, status: 'generating' as const, errorMessage: undefined };
      // Dispatch update event immediately so UI updates
      const event = new CustomEvent('nodeDataUpdate', {
        detail: { nodeId: id, data: updated },
      });
      window.dispatchEvent(event);
      return updated;
    });

    // Track render started
    const startTime = Date.now();
    const finalSettings = localData.styleSettings 
      ? { ...defaultSettings }
      : localData.settings || defaultSettings;
    trackRenderStarted('image', finalSettings.style || 'architectural', finalSettings.quality || 'standard');

    try {
      // Use settings from style node if connected, otherwise use defaults
      const finalSettings = localData.styleSettings 
        ? { ...defaultSettings } // Style node provides all settings
        : localData.settings || defaultSettings;
      
      // ✅ CRITICAL: Get projectId and fileId from node data
      const nodeProjectId = (data as any)?.projectId;
      const nodeFileId = (data as any)?.fileId;
      
      const result = await generateImage({
        prompt: enhancedPrompt,
        settings: finalSettings,
        nodeId: nodeId,
        baseImageData: localData.baseImageData,
        baseImageType: localData.baseImageType,
        projectId: nodeProjectId,
        fileId: nodeFileId,
      });

      logger.log('🎨 ImageNode: Generation result', {
        success: result.success,
        hasData: !!result.data,
        hasError: !!result.error
      });

      if (result.success && result.data) {
        const outputUrl = result.data.outputUrl;
        logger.log('✅ ImageNode: Image generated successfully', {
          urlLength: outputUrl?.length,
          urlType: outputUrl?.substring(0, 30)
        });

        // Track render completed
        const duration = Date.now() - startTime;
        trackRenderCompleted('image', finalSettings.style || 'architectural', finalSettings.quality || 'standard', duration);

        // Add to previous renders and set as current
        setLocalData((prev) => {
          const newRender = {
            id: result.data.renderId || `render-${Date.now()}`,
            url: outputUrl,
            prompt: enhancedPrompt,
            generatedAt: new Date(),
          };
          const previousRenders = prev.previousRenders || [];
          // Add new render to the beginning of the list
          const updatedRenders = [newRender, ...previousRenders];
          const updatedData = {
            ...prev,
            status: 'completed' as const,
            outputUrl: outputUrl, // ✅ FIXED: Ensure outputUrl is set so main image displays
            renderId: result.data.renderId,
            generatedAt: new Date(),
            errorMessage: undefined,
            previousRenders: updatedRenders,
          };
          
          // ✅ FIXED: Set selected version to the new render so it shows in main area
          setSelectedVersion(newRender.id);
          
          // Dispatch update event with complete data including previousRenders
          const event = new CustomEvent('nodeDataUpdate', {
            detail: { 
              nodeId: id, 
              data: updatedData
            },
          });
          window.dispatchEvent(event);
          
          return updatedData;
        });
      } else {
        const errorMsg = result.error || 'Failed to generate image';
        console.error('❌ ImageNode: Generation failed', errorMsg);
        
        // Track render failed
        trackRenderFailed('image', finalSettings.style || 'architectural', finalSettings.quality || 'standard', errorMsg);
        
        setLocalData((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: errorMsg,
        }));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ ImageNode: Generation exception', error);
      
      // Track render failed
      trackRenderFailed('image', finalSettings.style || 'architectural', finalSettings.quality || 'standard', errorMsg);
      
      setLocalData((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: errorMsg,
      }));
    }
  }, [localData, id, generateImage, nodeId]);

  const handleEnhancePrompt = useCallback(async () => {
    if (!localData.prompt.trim()) {
      alert('Please enter a prompt to enhance');
      return;
    }

    try {
      const result = await enhancePrompt(localData.prompt);
      if (result.success && result.data) {
        setLocalData((prev) => ({ ...prev, prompt: result.data.prompt }));
      }
    } catch (error) {
      console.error('Failed to enhance prompt:', error);
    }
  }, [localData.prompt, enhancePrompt]);

  const handleDownload = useCallback((url?: string) => {
    const imageUrl = url || localData.outputUrl;
    if (imageUrl) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `render-${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [localData.outputUrl]);

  const handleView = useCallback((url: string) => {
    setViewingImageUrl(url);
    setIsModalOpen(true);
  }, []);

  const handleVersionSelect = useCallback((renderId: string) => {
    // ✅ FIXED: Use functional update to avoid stale closure issues
    setLocalData((prev) => {
      const render = prev.previousRenders?.find(r => r.id === renderId);
      if (!render) {
        console.warn('⚠️ ImageNode: Render not found for version selection', { renderId, availableRenders: prev.previousRenders?.map(r => r.id) });
        return prev;
      }
      
      console.log('✅ ImageNode: Selecting version', { renderId, url: render.url });
      
      const updated = {
        ...prev,
        outputUrl: render.url, // ✅ FIXED: Update outputUrl so main image displays
        renderId: render.id,
        status: 'completed' as const, // Ensure status is completed when showing a version
      };
      
      // Dispatch update event to save state
      const event = new CustomEvent('nodeDataUpdate', {
        detail: { 
          nodeId: id, 
          data: updated
        },
      });
      window.dispatchEvent(event);
      
      return updated;
    });
    
    // ✅ FIXED: Set selected version after state update
    setSelectedVersion(renderId);
  }, [id]);

  // Get status from node data or local status
  const nodeStatus = localData.status === 'generating' 
    ? NodeExecutionStatus.RUNNING 
    : localData.status === 'completed' 
    ? NodeExecutionStatus.COMPLETED 
    : localData.status === 'error'
    ? NodeExecutionStatus.ERROR
    : NodeExecutionStatus.IDLE;

  return (
    <BaseNode
      title="Image Generator"
      icon={ImageIcon}
      nodeType="image"
      nodeId={nodeId}
      className="w-[640px]"
      status={nodeStatus}
      inputs={[
        { id: 'prompt', position: Position.Left, label: 'Text', type: 'text' },
        { id: 'baseImage', position: Position.Left, label: 'Base Image', type: 'image' },
        { id: 'style', position: Position.Left, label: 'Style', type: 'style' },
        { id: 'material', position: Position.Left, label: 'Material', type: 'material' },
      ]}
      outputs={[{ id: 'image', position: Position.Right, type: 'image', label: 'Image' }]}
    >
      <div className="space-y-3">
        {/* Connection Status Badges */}
        {(hasTextInput || hasImageInput || hasStyleInput || hasMaterialInput) && (
          <div className="flex flex-wrap gap-1.5">
            {hasTextInput && (
              <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${nodeColors.color}20`, color: nodeColors.color }}>Text</span>
            )}
            {hasImageInput && (
              <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${nodeColors.color}20`, color: nodeColors.color }}>Base Image</span>
            )}
            {hasStyleInput && (
              <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${nodeColors.color}20`, color: nodeColors.color }}>Style</span>
            )}
            {hasMaterialInput && (
              <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${nodeColors.color}20`, color: nodeColors.color }}>Material</span>
            )}
          </div>
        )}

        {/* Prompt Input - Always visible, but shows different UI based on connection */}
        {!hasTextInput && (
          <div className="space-y-2">
            <Textarea
              value={localData.prompt || ''}
              onChange={(e) =>
                setLocalData((prev) => ({ ...prev, prompt: e.target.value }))
              }
              placeholder="Enter prompt or connect Text Node..."
              className="min-h-[80px] bg-background resize-none nodrag nopan"
              style={{ borderColor: `${nodeColors.color}40`, color: 'inherit' }}
            />
            {localData.prompt && (
              <Button
                onClick={handleEnhancePrompt}
                variant="outline"
                size="sm"
                disabled={loading}
                className="w-full h-7 text-xs nodrag nopan"
                style={{ borderColor: nodeColors.color, color: nodeColors.color }}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Enhance Prompt
              </Button>
            )}
          </div>
        )}

        {hasTextInput && hasPrompt && (
          <div className="p-2 bg-muted rounded border border-border">
            <p className="text-xs text-muted-foreground mb-1">Connected Prompt:</p>
            <p className="text-xs font-mono truncate">{localData.prompt.substring(0, 60)}...</p>
          </div>
        )}

        {/* Image Preview/Status */}
        <div className="relative aspect-video bg-muted rounded overflow-hidden flex items-center justify-center group" style={{ borderColor: `${nodeColors.color}40` }}>
          {localData.status === 'generating' ? (
            <div className="absolute inset-0 w-full h-full">
              {/* Shimmer placeholder */}
              <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <Loader2 className="h-8 w-8 animate-spin mb-3" style={{ color: nodeColors.color }} />
                <p className="text-xs text-muted-foreground">Generating image...</p>
                {localData.prompt && (
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-full px-2 mt-1">
                    "{localData.prompt.substring(0, 50)}..."
                  </p>
                )}
              </div>
            </div>
          ) : (localData.status === 'completed' || localData.outputUrl) && localData.outputUrl ? (
            <>
              <img
                key={localData.outputUrl} // ✅ FIXED: Force re-render when URL changes
                src={localData.outputUrl}
                alt="Generated"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('❌ ImageNode: Failed to load image', localData.outputUrl);
                }}
              />
              {/* Hover buttons */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button
                  onClick={() => handleView(localData.outputUrl!)}
                  size="sm"
                  className="h-8 px-3 nodrag nopan"
                  style={{ backgroundColor: nodeColors.color }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  onClick={() => handleDownload()}
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 nodrag nopan bg-background"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <ImageOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No image generated yet</p>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={loading || localData.status === 'generating' || (!hasPrompt && !hasImageInput)}
          className="w-full h-8 text-xs nodrag nopan text-white"
          style={{ backgroundColor: nodeColors.color }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = `${nodeColors.color}dd`;
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = nodeColors.color;
            }
          }}
        >
          {loading || localData.status === 'generating' ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Image'
          )}
        </Button>

        {/* Previous Renders/Versions */}
        {localData.previousRenders && localData.previousRenders.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Previous Renders</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {localData.previousRenders.map((render, index) => (
                <div
                  key={render.id}
                  onClick={() => handleVersionSelect(render.id)}
                  className={cn(
                    "relative flex-shrink-0 w-16 h-16 rounded overflow-hidden cursor-pointer border-2 transition-all group/version",
                    selectedVersion === render.id || (!selectedVersion && index === 0)
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <img
                    src={render.url}
                    alt={`Version ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Version number badge */}
                  <div className="absolute top-0.5 left-0.5 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
                    v{index + 1}
                  </div>
                  {/* Hover overlay with buttons */}
                  <div className="absolute inset-0 bg-black/0 group-hover/version:bg-black/60 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover/version:opacity-100">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(render.url);
                      }}
                      size="sm"
                      className="h-6 px-2 nodrag nopan"
                      style={{ backgroundColor: nodeColors.color }}
                    >
                      <Eye className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(render.url);
                      }}
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 nodrag nopan bg-background"
                    >
                      <Download className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {localData.status === 'error' && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {localData.errorMessage}
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 gap-0">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
            <div className="flex items-center justify-between">
              <DialogTitle>Image Preview</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="nodrag nopan"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {viewingImageUrl && (
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img
                src={viewingImageUrl}
                alt="Fullscreen preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-t p-4 flex items-center justify-center gap-2">
            <Button
              onClick={() => viewingImageUrl && handleDownload(viewingImageUrl)}
              variant="outline"
              className="nodrag nopan"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </BaseNode>
  );
}
