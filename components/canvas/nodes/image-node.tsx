'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Sparkles, Loader2, Download, ImageOff } from 'lucide-react';
import { ImageNodeData } from '@/lib/types/canvas';
import { useNodeExecution } from '@/lib/hooks/use-node-execution';
import { BaseNode, useNodeColors } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';
import { logger } from '@/lib/utils/logger';

export function ImageNode(props: any) {
  const { data, id } = props;
  const nodeId = String(id);
  const { getEdges } = useReactFlow();
  const [localData, setLocalData] = useState<ImageNodeData>(data || {
    prompt: '',
    settings: {
      style: 'architectural',
      quality: 'standard',
      aspectRatio: '16:9',
    },
    status: 'idle' as ImageNodeData['status'],
  });
  
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

  // Update local data when prop data changes (from connections)
  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const handleGenerate = useCallback(async () => {
    // Allow generation with either prompt OR base image (or both for hybrid)
    if (!localData.prompt.trim() && !localData.baseImageData) {
      alert('Please enter a prompt, connect a Text Node, or connect an Image Input Node');
      return;
    }

    // Build enhanced prompt with style and material settings
    let enhancedPrompt = localData.prompt;

    if (localData.styleSettings) {
      const style = localData.styleSettings;
      enhancedPrompt += `\n\nCamera: ${style.camera.focalLength}mm, f/${style.camera.fStop}, ${style.camera.position} position, ${style.camera.angle} angle.`;
      enhancedPrompt += `\nEnvironment: ${style.environment.scene}, ${style.environment.weather} weather, ${style.environment.timeOfDay}, ${style.environment.season}.`;
      enhancedPrompt += `\nLighting: ${style.lighting.intensity}% intensity, ${style.lighting.direction} direction, ${style.lighting.color} color, ${style.lighting.shadows} shadows.`;
      enhancedPrompt += `\nAtmosphere: ${style.atmosphere.mood} mood, ${style.atmosphere.contrast}% contrast, ${style.atmosphere.saturation}% saturation.`;
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
      prompt: enhancedPrompt.substring(0, 100),
      settings: localData.settings,
      hasStyle: !!localData.styleSettings,
      hasMaterial: !!localData.materialSettings
    });

    setLocalData((prev) => ({ ...prev, status: 'generating', errorMessage: undefined }));

    try {
      // Use settings from style node if connected, otherwise use defaults
      const finalSettings = localData.styleSettings 
        ? { ...defaultSettings } // Style node provides all settings
        : localData.settings || defaultSettings;
      
      // ✅ CRITICAL: Get projectId and chainId from node data
      const nodeProjectId = (data as any)?.projectId;
      const nodeChainId = (data as any)?.chainId;
      
      const result = await generateImage({
        prompt: enhancedPrompt,
        settings: finalSettings,
        nodeId: nodeId,
        baseImageData: localData.baseImageData,
        baseImageType: localData.baseImageType,
        projectId: nodeProjectId,
        chainId: nodeChainId,
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

        setLocalData((prev) => ({
          ...prev,
          status: 'completed',
          outputUrl: outputUrl,
          renderId: result.data.renderId,
          generatedAt: new Date(),
          errorMessage: undefined,
        }));

        // Dispatch update event
        const event = new CustomEvent('nodeDataUpdate', {
          detail: { 
            nodeId: id, 
            data: { 
              ...localData, 
              status: 'completed',
              outputUrl: outputUrl,
              renderId: result.data.renderId,
            } 
          },
        });
        window.dispatchEvent(event);
      } else {
        const errorMsg = result.error || 'Failed to generate image';
        console.error('❌ ImageNode: Generation failed', errorMsg);
        setLocalData((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: errorMsg,
        }));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ ImageNode: Generation exception', error);
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

  const handleDownload = useCallback(() => {
    if (localData.outputUrl) {
      window.open(localData.outputUrl, '_blank');
    }
  }, [localData.outputUrl]);

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
      className="w-80"
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
        <div className="relative aspect-video bg-muted rounded overflow-hidden flex items-center justify-center" style={{ borderColor: `${nodeColors.color}40` }}>
          {localData.status === 'generating' ? (
            <div className="text-center p-4 w-full h-full flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mb-3" style={{ color: nodeColors.color }} />
              <p className="text-xs text-muted-foreground">Generating image...</p>
              {localData.prompt && (
                <p className="text-xs text-muted-foreground font-mono truncate max-w-full px-2 mt-1">
                  "{localData.prompt.substring(0, 50)}..."
                </p>
              )}
            </div>
          ) : localData.status === 'completed' && localData.outputUrl ? (
            <img
              src={localData.outputUrl}
              alt="Generated"
              className="w-full h-full object-cover"
            />
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

        {/* Download Button */}
        {localData.status === 'completed' && localData.outputUrl && (
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs nodrag nopan"
            style={{ borderColor: nodeColors.color, color: nodeColors.color }}
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        )}

        {/* Error Message */}
        {localData.status === 'error' && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {localData.errorMessage}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
