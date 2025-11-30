'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image as ImageIcon, Sparkles, Loader2, Download, ImageOff } from 'lucide-react';
import { ImageNodeData } from '@/lib/types/canvas';
import { useNodeExecution } from '@/lib/hooks/use-node-execution';
import { BaseNode } from './base-node';

export function ImageNode({ data, id }: NodeProps<{ data: ImageNodeData }>) {
  const { getEdges } = useReactFlow();
  const [localData, setLocalData] = useState<ImageNodeData>(data || {
    prompt: '',
    settings: {
      style: 'architectural',
      quality: 'standard',
      aspectRatio: '16:9',
    },
    status: 'idle',
  });
  const { generateImage, enhancePrompt, loading } = useNodeExecution();

  // Check connections
  const edges = getEdges();
  const hasTextInput = edges.some((e) => e.target === id && e.targetHandle === 'prompt');
  const hasStyleInput = edges.some((e) => e.target === id && e.targetHandle === 'style');
  const hasMaterialInput = edges.some((e) => e.target === id && e.targetHandle === 'material');
  
  // Use localData.prompt which gets updated from connections
  const hasPrompt = localData.prompt && localData.prompt.trim().length > 0;

  // Update local data when prop data changes (from connections)
  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const handleGenerate = useCallback(async () => {
    if (!localData.prompt.trim()) {
      alert('Please enter a prompt or connect a Text Node');
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

    console.log('🎨 ImageNode: Starting generation', {
      prompt: enhancedPrompt.substring(0, 100),
      settings: localData.settings,
      hasStyle: !!localData.styleSettings,
      hasMaterial: !!localData.materialSettings
    });

    setLocalData((prev) => ({ ...prev, status: 'generating', errorMessage: undefined }));

    try {
      const result = await generateImage({
        prompt: enhancedPrompt,
        settings: localData.settings,
        nodeId: id,
      });

      console.log('🎨 ImageNode: Generation result', {
        success: result.success,
        hasData: !!result.data,
        hasError: !!result.error
      });

      if (result.success && result.data) {
        const outputUrl = result.data.outputUrl;
        console.log('✅ ImageNode: Image generated successfully', {
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
  }, [localData, id, generateImage]);

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

  return (
    <BaseNode
      title="Image Node"
      icon={ImageIcon}
      nodeType="image"
      nodeId={id}
      className="w-96"
      inputs={[
        { id: 'prompt', position: Position.Left, label: 'Text', type: 'text' },
        { id: 'style', position: Position.Left, label: 'Style', type: 'style' },
        { id: 'material', position: Position.Left, label: 'Material', type: 'material' },
      ]}
      outputs={[{ id: 'image', position: Position.Right, type: 'image' }]}
    >
      {/* Show connection status */}
      <div className="flex gap-2 text-xs text-[#8c8c8c] mb-2">
        {hasTextInput && <span className="px-2 py-0.5 bg-[#094771] rounded">Text</span>}
        {hasStyleInput && <span className="px-2 py-0.5 bg-[#094771] rounded">Style</span>}
        {hasMaterialInput && <span className="px-2 py-0.5 bg-[#094771] rounded">Material</span>}
      </div>

      {/* Show placeholder image when connected, textarea when not */}
      {hasTextInput && hasPrompt ? (
        <div className="space-y-3">
          <div className="relative aspect-video bg-[#1e1e1e] rounded border border-[#3d3d3d] overflow-hidden flex items-center justify-center">
            {localData.status === 'generating' ? (
              <div className="text-center p-4 w-full h-full flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#0e639c] mb-3" />
                <p className="text-xs text-[#8c8c8c]">Generating image...</p>
                <p className="text-xs text-[#8c8c8c] font-mono truncate max-w-full px-2 mt-1">
                  "{localData.prompt.substring(0, 50)}..."
                </p>
              </div>
            ) : localData.status === 'completed' && localData.outputUrl ? (
              <img
                src={localData.outputUrl}
                alt="Generated"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <ImageOff className="h-12 w-12 text-[#3d3d3d] mx-auto mb-2" />
                <p className="text-xs text-[#8c8c8c] mb-1">Connected to Text Node</p>
                <p className="text-xs text-[#8c8c8c] font-mono truncate max-w-full px-2">
                  "{localData.prompt.substring(0, 50)}..."
                </p>
              </div>
            )}
          </div>
          {localData.status !== 'generating' && (
          <Button
            onClick={handleGenerate}
            disabled={!localData.prompt || loading}
            className="w-full bg-[#0e639c] hover:bg-[#1177bb] text-white h-8 text-xs nodrag nopan"
          >
              Generate Image
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative aspect-video bg-[#1e1e1e] rounded border border-[#3d3d3d] overflow-hidden flex items-center justify-center">
            {localData.status === 'generating' ? (
              <div className="text-center p-4 w-full h-full flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#0e639c] mb-3" />
                <p className="text-xs text-[#8c8c8c]">Generating image...</p>
                <p className="text-xs text-[#8c8c8c] font-mono truncate max-w-full px-2 mt-1">
                  "{localData.prompt.substring(0, 50)}..."
                </p>
              </div>
            ) : localData.status === 'completed' && localData.outputUrl ? (
              <img
                src={localData.outputUrl}
                alt="Generated"
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
          {localData.status !== 'generating' && (
            <Textarea
              value={localData.prompt || ''}
              onChange={(e) =>
                setLocalData((prev) => ({ ...prev, prompt: e.target.value }))
              }
              placeholder="Enter prompt for image generation or connect Text Node..."
              className="min-h-[80px] bg-[#1e1e1e] border-[#3d3d3d] text-white placeholder:text-[#8c8c8c] resize-none nodrag nopan"
            />
          )}
        </div>
      )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#8c8c8c] mb-1 block">Style</label>
            <Select
              value={localData.settings.style}
              onValueChange={(value) =>
                setLocalData((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, style: value },
                }))
              }
            >
              <SelectTrigger className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs nodrag nopan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252526] border-[#3d3d3d]">
                <SelectItem value="architectural">Architectural</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="photorealistic">Photorealistic</SelectItem>
                <SelectItem value="sketch">Sketch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-[#8c8c8c] mb-1 block">Quality</label>
            <Select
              value={localData.settings.quality}
              onValueChange={(value: 'standard' | 'high' | 'ultra') =>
                setLocalData((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, quality: value },
                }))
              }
            >
              <SelectTrigger className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs nodrag nopan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252526] border-[#3d3d3d]">
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="ultra">Ultra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs text-[#8c8c8c] mb-1 block">Aspect Ratio</label>
          <Select
            value={localData.settings.aspectRatio}
            onValueChange={(value) =>
              setLocalData((prev) => ({
                ...prev,
                settings: { ...prev.settings, aspectRatio: value },
              }))
            }
          >
            <SelectTrigger className="bg-[#1e1e1e] border-[#3d3d3d] text-white h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#252526] border-[#3d3d3d]">
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="1:1">1:1</SelectItem>
              <SelectItem value="4:3">4:3</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
            </SelectContent>
          </Select>
        </div>

      {!hasTextInput && localData.status !== 'generating' && (
        <div className="flex gap-2">
          <Button
            onClick={handleEnhancePrompt}
            variant="outline"
            size="sm"
            disabled={loading || localData.status === 'generating'}
            className="flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] h-8 text-xs nodrag nopan"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Enhance
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading || localData.status === 'generating' || !localData.prompt}
            className="flex-1 bg-[#0e639c] hover:bg-[#1177bb] text-white h-8 text-xs nodrag nopan"
          >
            {loading || localData.status === 'generating' ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      )}

      {localData.status === 'completed' && localData.outputUrl && hasTextInput && (
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="w-full bg-[#1e1e1e] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] h-8 text-xs nodrag nopan"
        >
          <Download className="h-3 w-3 mr-1" />
          Download
        </Button>
      )}

      {localData.status === 'error' && (
        <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
          {localData.errorMessage}
        </div>
      )}
    </BaseNode>
  );
}

