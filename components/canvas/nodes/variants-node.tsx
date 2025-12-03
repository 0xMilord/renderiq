'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Layers, Loader2, Check } from 'lucide-react';
import { VariantsNodeData } from '@/lib/types/canvas';
import { useNodeExecution } from '@/lib/hooks/use-node-execution';
import { BaseNode } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';

export function VariantsNode(props: any) {
  const { data, id } = props;
  const [localData, setLocalData] = useState<VariantsNodeData>(data || {
    count: 4,
    settings: {
      variationStrength: 0.5,
      quality: 'standard',
    },
    status: 'idle',
    variants: [],
  });
  const { generateVariants, loading } = useNodeExecution();

  // Update local data when prop data changes (from connections)
  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const handleGenerate = useCallback(async () => {
    if (!localData.sourceImageUrl) {
      alert('Please connect an image node first');
      return;
    }

    setLocalData((prev) => ({ ...prev, status: 'generating' }));

    try {
      const result = await generateVariants({
        sourceImageUrl: localData.sourceImageUrl,
        prompt: localData.prompt,
        count: localData.count,
        settings: localData.settings,
        nodeId: String(id),
      });

      if (result.success && result.data) {
        setLocalData((prev) => ({
          ...prev,
          status: 'completed',
          variants: result.data.variants,
        }));

        // Dispatch update event
        const event = new CustomEvent('nodeDataUpdate', {
          detail: { nodeId: id, data: { ...localData, variants: result.data.variants } },
        });
        window.dispatchEvent(event);
      } else {
        throw new Error(result.error || 'Failed to generate variants');
      }
    } catch (error) {
      setLocalData((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [localData, id, generateVariants]);

  const handleSelectVariant = useCallback(
    (variantId: string) => {
      setLocalData((prev) => ({ ...prev, selectedVariantId: variantId }));
    },
    []
  );

  const nodeStatus = localData.status === 'generating' 
    ? NodeExecutionStatus.RUNNING 
    : localData.status === 'completed' 
    ? NodeExecutionStatus.COMPLETED 
    : localData.status === 'error'
    ? NodeExecutionStatus.ERROR
    : NodeExecutionStatus.IDLE;

  return (
    <BaseNode
      title="Variants Node"
      icon={Layers}
      nodeType="variants"
      nodeId={String(id)}
      className="w-[500px]"
      status={nodeStatus}
      inputs={[{ id: 'sourceImage', position: Position.Left, type: 'image', label: 'Source Image' }]}
      outputs={[{ id: 'variants', position: Position.Right, type: 'variants', label: 'Variants' }]}
    >

        {localData.sourceImageUrl && (
          <div className="relative aspect-video bg-muted rounded border border-border overflow-hidden">
            <img
              src={localData.sourceImageUrl}
              alt="Source"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground mb-2 block">
            Variant Count: {localData.count}
          </label>
          <Slider
            value={[localData.count]}
            onValueChange={([value]) =>
              setLocalData((prev) => ({ ...prev, count: value }))
            }
            min={1}
            max={8}
            step={1}
            className="w-full nodrag nopan"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-2 block">
            Variation Strength: {localData.settings.variationStrength.toFixed(2)}
          </label>
          <Slider
            value={[localData.settings.variationStrength]}
            onValueChange={([value]) =>
              setLocalData((prev) => ({
                ...prev,
                settings: { ...prev.settings, variationStrength: value },
              }))
            }
            min={0}
            max={1}
            step={0.1}
            className="w-full nodrag nopan"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || localData.status === 'generating' || !localData.sourceImageUrl}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs nodrag nopan"
        >
          {loading || localData.status === 'generating' ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Generating Variants...
            </>
          ) : (
            'Generate Variants'
          )}
        </Button>

        {localData.status === 'completed' && localData.variants.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Select a variant:</div>
            <div className="grid grid-cols-2 gap-2">
              {localData.variants.map((variant) => (
                <div
                  key={variant.id}
                  className={`relative aspect-square bg-muted rounded border-2 overflow-hidden cursor-pointer transition-all ${
                    localData.selectedVariantId === variant.id
                      ? 'border-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectVariant(variant.id)}
                >
                  <img
                    src={variant.url}
                    alt="Variant"
                    className="w-full h-full object-cover"
                  />
                  {localData.selectedVariantId === variant.id && (
                    <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {localData.status === 'error' && (
        <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
          {localData.errorMessage}
        </div>
      )}
    </BaseNode>
  );
}

