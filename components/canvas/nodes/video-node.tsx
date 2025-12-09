'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Video, Sparkles, Loader2, Download, VideoOff } from 'lucide-react';
import { VideoNodeData } from '@/lib/types/canvas';
import { useNodeExecution } from '@/lib/hooks/use-node-execution';
import { BaseNode, useNodeColors } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';
import { logger } from '@/lib/utils/logger';

export function VideoNode(props: any) {
  const { data, id } = props;
  const nodeId = String(id);
  const { getEdges } = useReactFlow();
  const [localData, setLocalData] = useState<VideoNodeData>(data || {
    prompt: '',
    settings: {
      duration: 8,
      aspectRatio: '16:9',
      model: 'veo-3.1-generate-preview',
    },
    status: 'idle' as VideoNodeData['status'],
  });
  
  const { generateVideo, loading } = useNodeExecution();
  const nodeColors = useNodeColors();

  // Check connections
  const edges = getEdges();
  const hasTextInput = edges.some((e) => e.target === nodeId && e.targetHandle === 'prompt');
  const hasImageInput = edges.some((e) => e.target === nodeId && e.targetHandle === 'baseImage');
  
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

    logger.log('🎬 VideoNode: Starting generation', {
      prompt: localData.prompt.substring(0, 100),
      duration: localData.settings.duration,
      aspectRatio: localData.settings.aspectRatio,
      hasBaseImage: !!localData.baseImageData,
    });

    setLocalData((prev) => ({ ...prev, status: 'generating', errorMessage: undefined }));

    try {
      // ✅ CRITICAL: Get projectId and chainId from node data
      const nodeProjectId = (data as any)?.projectId;
      const nodeChainId = (data as any)?.chainId;
      
      const result = await generateVideo({
        prompt: localData.prompt,
        duration: localData.settings.duration,
        aspectRatio: localData.settings.aspectRatio,
        nodeId: nodeId,
        baseImageData: localData.baseImageData,
        baseImageType: localData.baseImageType,
        model: localData.settings.model,
        projectId: nodeProjectId,
        chainId: nodeChainId,
      });

      logger.log('🎬 VideoNode: Generation result', {
        success: result.success,
        hasData: !!result.data,
        hasError: !!result.error
      });

      if (result.success && result.data) {
        const outputUrl = result.data.outputUrl;
        logger.log('✅ VideoNode: Video generated successfully', {
          urlLength: outputUrl?.length,
        });

        setLocalData((prev) => ({
          ...prev,
          status: 'completed',
          outputUrl: outputUrl,
          generatedAt: new Date(),
          renderId: result.data?.renderId,
        }));
      } else {
        setLocalData((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: result.error || 'Video generation failed',
        }));
      }
    } catch (error) {
      logger.error('❌ VideoNode: Generation error', error);
      setLocalData((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Video generation failed',
      }));
    }
  }, [localData, generateVideo, nodeId]);

  const handleChange = useCallback((updates: Partial<VideoNodeData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    
    // Dispatch update event
    const event = new CustomEvent('nodeDataUpdate', {
      detail: { nodeId: id, data: newData },
    });
    window.dispatchEvent(event);
  }, [localData, id]);

  const handleDownload = useCallback(() => {
    if (localData.outputUrl) {
      const link = document.createElement('a');
      link.href = localData.outputUrl;
      link.download = `video-${nodeId}-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [localData.outputUrl, nodeId]);

  const nodeStatus = (data as any)?.status || NodeExecutionStatus.IDLE;
  const isGenerating = localData.status === 'generating' || loading;

  return (
    <BaseNode
      title="Video Generator"
      icon={Video}
      nodeType="video"
      nodeId={nodeId}
      className="w-80"
      status={nodeStatus}
      inputs={[
        { id: 'prompt', position: Position.Left, label: 'Text', type: 'text' },
        { id: 'baseImage', position: Position.Left, label: 'Base Image', type: 'image' },
      ]}
      outputs={[{ id: 'video', position: Position.Right, type: 'image', label: 'Video' }]}
    >
      <div className="space-y-3">
        {/* Connection Status Badges */}
        {(hasTextInput || hasImageInput) && (
          <div className="flex flex-wrap gap-1.5">
            {hasTextInput && (
              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">Text</span>
            )}
            {hasImageInput && (
              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">Base Image</span>
            )}
          </div>
        )}

        {/* Prompt Input */}
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
          </div>
        )}

        {hasTextInput && hasPrompt && (
          <div className="p-2 bg-muted rounded border border-border">
            <p className="text-xs text-muted-foreground mb-1">Connected Prompt:</p>
            <p className="text-xs font-mono truncate">{localData.prompt.substring(0, 60)}...</p>
          </div>
        )}

        {/* Video Settings */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Duration</Label>
            <Select
              value={String(localData.settings.duration)}
              onValueChange={(value) =>
                handleChange({
                  settings: {
                    ...localData.settings,
                    duration: parseInt(value) as 4 | 6 | 8,
                  },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs nodrag nopan" style={{ borderColor: `${nodeColors.color}40` }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 seconds</SelectItem>
                <SelectItem value="6">6 seconds</SelectItem>
                <SelectItem value="8">8 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Aspect Ratio</Label>
            <Select
              value={localData.settings.aspectRatio}
              onValueChange={(value: '16:9' | '9:16' | '1:1') =>
                handleChange({
                  settings: {
                    ...localData.settings,
                    aspectRatio: value,
                  },
                })
              }
            >
              <SelectTrigger className="h-7 text-xs nodrag nopan" style={{ borderColor: `${nodeColors.color}40` }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9</SelectItem>
                <SelectItem value="9:16">9:16</SelectItem>
                <SelectItem value="1:1">1:1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Video Preview */}
        <div className="rounded-lg overflow-hidden bg-muted/50" style={{ borderColor: `${nodeColors.color}40` }}>
          {localData.status === 'completed' && localData.outputUrl ? (
            <video
              src={localData.outputUrl}
              controls
              className="w-full h-auto max-h-48 nodrag nopan"
              preload="metadata"
            />
          ) : (
            <div className="text-center p-4">
              <VideoOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No video generated yet</p>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (!hasPrompt && !hasImageInput)}
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
          {isGenerating ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Video'
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

