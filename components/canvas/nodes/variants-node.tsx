'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Layers, Loader2, Check } from 'lucide-react';
import { VariantsNodeData } from '@/lib/types/canvas';
import { useNodeExecution } from '@/lib/hooks/use-node-execution';
import { BaseNode, useNodeColors } from './base-node';
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
  const nodeColors = useNodeColors();

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
      title="Variants Generator"
      icon={Layers}
      nodeType="variants"
      nodeId={String(id)}
      className="w-80"
      status={nodeStatus}
      inputs={[{ id: 'sourceImage', position: Position.Left, type: 'image', label: 'Source Image' }]}
      outputs={[{ id: 'variants', position: Position.Right, type: 'variants', label: 'Variants' }]}
    >
      <div className="space-y-3">
        {/* Source Image Preview */}
        {localData.sourceImageUrl ? (
          <div className="relative aspect-video bg-muted rounded border border-border overflow-hidden">
            <img
              src={localData.sourceImageUrl}
              alt="Source"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="relative aspect-video bg-muted rounded border border-border overflow-hidden flex items-center justify-center">
            <p className="text-xs text-muted-foreground text-center px-4">
              Connect an Image Node to generate variants
            </p>
          </div>
        )}

        {/* Simple Count Slider */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            Variant Count: {localData.count}
          </Label>
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

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={loading || localData.status === 'generating' || !localData.sourceImageUrl}
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
              Generating Variants...
            </>
          ) : (
            'Generate Variants'
          )}
        </Button>

        {/* Variants Grid */}
        {localData.status === 'completed' && localData.variants.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-semibold">
              Select a variant ({localData.variants.length}):
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {localData.variants.map((variant) => (
                <div
                  key={variant.id}
                  className={`relative aspect-square bg-muted rounded border-2 overflow-hidden cursor-pointer transition-all ${
                    localData.selectedVariantId === variant.id
                      ? 'border-primary ring-2 ring-primary/20'
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
                    <div className="absolute top-1 right-1 rounded-full p-1 shadow-lg" style={{ backgroundColor: nodeColors.color }}>
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
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
    </BaseNode>
  );
}
