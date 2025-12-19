'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, Layers } from 'lucide-react';
import { BaseNode } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';

interface OutputNodeData {
  imageUrl?: string;
  variantUrl?: string;
  variantId?: string;
  status: 'idle' | 'ready';
}

export function OutputNode(props: any) {
  const { data, id } = props;
  const [localData, setLocalData] = useState<OutputNodeData>(data || {
    status: 'idle',
  });

  // Update local data when prop data changes (from connections)
  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  // Watch for incoming connections and update data
  useEffect(() => {
    const handleNodeDataUpdate = (event: CustomEvent) => {
      const { nodeId, data: nodeData } = event.detail;
      // This will be handled by the connection system
    };

    window.addEventListener('nodeDataUpdate', handleNodeDataUpdate as EventListener);
    return () => {
      window.removeEventListener('nodeDataUpdate', handleNodeDataUpdate as EventListener);
    };
  }, []);

  const handleDownload = useCallback(() => {
    const url = localData.imageUrl || localData.variantUrl;
    if (url) {
      window.open(url, '_blank');
    }
  }, [localData]);

  const hasOutput = !!(localData.imageUrl || localData.variantUrl);

  return (
    <BaseNode
      title="Output"
      icon={ImageIcon}
      nodeType="output"
      nodeId={String(id)}
      className="w-[960px]"
      status={hasOutput ? NodeExecutionStatus.COMPLETED : NodeExecutionStatus.IDLE}
      skipContentWrapper={true}
      skipContentPadding={true}
      inputs={[
        { id: 'image', position: Position.Left, type: 'image', label: 'Image' },
        { id: 'variants', position: Position.Left, type: 'variants', label: 'Variants' },
      ]}
      outputs={[
        { id: 'image', position: Position.Right, type: 'image', label: 'Image' },
      ]}
    >
      {/* Output Preview */}
      <div className="relative aspect-video bg-muted rounded border border-border overflow-hidden flex items-center justify-center mb-3">
        {hasOutput ? (
          <img
            src={localData.imageUrl || localData.variantUrl}
            alt="Output"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-4">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Connect an Image or Variants node</p>
          </div>
        )}
      </div>

      {/* Download Button */}
      {hasOutput && (
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs nodrag nopan mb-3"
        >
          <Download className="h-3 w-3 mr-1" />
          Download
        </Button>
      )}

      {/* Status */}
      {hasOutput && (
        <div className="text-xs text-muted-foreground text-center">
          Ready to download
        </div>
      )}
    </BaseNode>
  );
}

