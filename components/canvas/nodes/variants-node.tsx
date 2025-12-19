'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Layers, Loader2, Check } from 'lucide-react';
import { VariantsNodeData } from '@/lib/types/canvas';
import { useNodeExecution } from '@/lib/hooks/use-node-execution';
import { BaseNode, useNodeColors } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';

export function VariantsNode(props: any) {
  const { data, id } = props;
  const [localData, setLocalData] = useState<VariantsNodeData>(data || {
    count: 4,
    variantType: 'multi-angle', // ✅ NEW: Default to multi-angle
    settings: {
      variationStrength: 0.5,
      quality: 'standard',
    },
    status: 'idle',
    variants: [],
  });
  const { generateVariants, loading } = useNodeExecution();
  const nodeColors = useNodeColors();
  const { openLimitDialog } = useModalStore(); // ✅ NEW: For showing limit dialogs

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
      // ✅ FIXED: Pass projectId and fileId for proper render creation
      // ✅ NEW: Pass variant type and all connected context
      const result = await generateVariants({
        sourceImageUrl: localData.sourceImageUrl,
        prompt: localData.prompt,
        count: localData.count,
        variantType: localData.variantType || 'multi-angle',
        settings: localData.settings,
        styleSettings: localData.styleSettings,
        materialSettings: localData.materialSettings,
        styleReference: localData.styleReference,
        previousVariants: localData.variants.map(v => ({ prompt: v.prompt, url: v.url })),
        nodeId: String(id),
        projectId: data?.projectId,
        fileId: data?.fileId,
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

  // ✅ FIXED: Create dynamic output handles based on variant count
  // When variants are generated, create one output handle per variant
  // If not generated yet, show handles based on the count setting
  const variantCount = localData.status === 'completed' && localData.variants.length > 0
    ? localData.variants.length
    : localData.count;
  
  const outputs = Array.from({ length: variantCount }, (_, index) => ({
    id: `variant-${index}`,
    position: Position.Right as Position,
    type: 'variants' as const,
    label: `Variant ${index + 1}`,
  }));

  return (
    <BaseNode
      title="Variants Generator"
      icon={Layers}
      nodeType="variants"
      nodeId={String(id)}
      className="w-[640px]"
      status={nodeStatus}
      inputs={[
        { id: 'sourceImage', position: Position.Left, type: 'image', label: 'Source Image' },
        { id: 'style', position: Position.Left, type: 'style', label: 'Style' },
        { id: 'materials', position: Position.Left, type: 'material', label: 'Materials' },
      ]}
      outputs={outputs}
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

        {/* Variant Type Selector */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            Variant Type
          </Label>
          <Select
            value={localData.variantType || 'multi-angle'}
            onValueChange={(value: 'multi-angle' | 'design-options') => {
              setLocalData((prev) => {
                const updated = { ...prev, variantType: value };
                // ✅ FIXED: Defer event dispatch to avoid setState during render
                setTimeout(() => {
                  const event = new CustomEvent('nodeDataUpdate', {
                    detail: { nodeId: id, data: updated },
                  });
                  window.dispatchEvent(event);
                }, 0);
                return updated;
              });
            }}
          >
            <SelectTrigger className="w-full bg-background border-border text-foreground h-8 text-xs nodrag nopan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multi-angle">Multi-Angle Views (Same design, different camera angles)</SelectItem>
              <SelectItem value="design-options">Design Options (Different design variations of same concept)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Simple Count Slider */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            Variant Count: {localData.count}
          </Label>
          <Slider
            value={[localData.count]}
            onValueChange={([value]) => {
              setLocalData((prev) => {
                const updated = { ...prev, count: value };
                // ✅ FIXED: Defer event dispatch to avoid setState during render
                setTimeout(() => {
                  const event = new CustomEvent('nodeDataUpdate', {
                    detail: { nodeId: id, data: updated },
                  });
                  window.dispatchEvent(event);
                }, 0);
                return updated;
              });
            }}
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
              Generated Variants ({localData.variants.length}): Connect each variant to an output node
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
              {localData.variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className={`relative aspect-square bg-muted rounded border-2 overflow-hidden cursor-pointer transition-all ${
                    localData.selectedVariantId === variant.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectVariant(variant.id)}
                  title={`Variant ${index + 1} - Click to select`}
                >
                  <img
                    src={variant.url}
                    alt={`Variant ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 text-center">
                    Variant {index + 1}
                  </div>
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
