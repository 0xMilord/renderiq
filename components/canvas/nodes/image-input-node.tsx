'use client';

import { useCallback, useState, useEffect } from 'react';
import { Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { ImageInputNodeData } from '@/lib/types/canvas';
import { BaseNode, useNodeColors } from './base-node';
import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';
import { cn } from '@/lib/utils';

export function ImageInputNode(props: any) {
  const { data, id } = props;
  const nodeColors = useNodeColors();
  // ✅ FIXED: Initialize with data from props if available (includes data from database)
  const [localData, setLocalData] = useState<ImageInputNodeData>(() => {
    if (data) {
      return {
        imageUrl: data.imageUrl ?? null,
        imageData: data.imageData ?? null,
        imageType: data.imageType ?? null,
        imageName: data.imageName ?? null,
      };
    }
    return {
      imageUrl: null,
      imageData: null,
      imageType: null,
      imageName: null,
    };
  });

  // ✅ FIXED: Update local data when prop data changes, but preserve existing data if prop is incomplete
  useEffect(() => {
    if (data) {
      setLocalData((prev) => {
        // Merge with previous data to preserve fields that might not be in the prop
        // This ensures data loaded from database is preserved
        return {
          ...prev,
          ...data,
          // Preserve image data if it exists in either prev or data
          imageUrl: data.imageUrl !== undefined ? data.imageUrl : prev.imageUrl,
          imageData: data.imageData !== undefined ? data.imageData : prev.imageData,
          imageType: data.imageType !== undefined ? data.imageType : prev.imageType,
          imageName: data.imageName !== undefined ? data.imageName : prev.imageName,
        };
      });
    }
  }, [data]);

  const handleChange = useCallback((updates: Partial<ImageInputNodeData>) => {
    // ✅ FIXED: Use functional update to avoid stale closure issues
    setLocalData((prev) => {
      const newData = { ...prev, ...updates };
      
      // ✅ FIXED: Defer event dispatch to avoid setState during render
      setTimeout(() => {
        const event = new CustomEvent('nodeDataUpdate', {
          detail: { nodeId: id, data: newData },
        });
        window.dispatchEvent(event);
      }, 0);
      
      return newData;
    });
  }, [id]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        // Store both data URL (for preview) and base64 (for API)
        const base64Data = result.split(',')[1]; // Remove data:image/...;base64, prefix
        
        handleChange({
          imageUrl: result, // Data URL for preview
          imageData: base64Data, // Base64 for API
          imageType: file.type,
          imageName: file.name,
        });
      };
      
      reader.readAsDataURL(file);
    }
  }, [handleChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
  });

  const handleRemove = useCallback(() => {
    handleChange({
      imageUrl: null,
      imageData: null,
      imageType: null,
      imageName: null,
    });
  }, [handleChange]);

  const status = (data as any)?.status || NodeExecutionStatus.IDLE;

  return (
    <BaseNode
      title="Image Input"
      icon={ImageIcon}
      nodeType="image-input"
      nodeId={String(id)}
      className="w-80"
      status={status}
      outputs={[{ id: 'image', position: Position.Right, type: 'image', label: 'Image' }]}
    >
      <div className="space-y-3">
        {!localData.imageUrl ? (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors nodrag nopan',
              isDragActive
                ? ''
                : 'border-border'
            )}
            style={{
              borderColor: isDragActive ? nodeColors.color : undefined,
              backgroundColor: isDragActive ? `${nodeColors.color}10` : undefined,
            }}
            onMouseEnter={(e) => {
              if (!isDragActive) {
                e.currentTarget.style.borderColor = `${nodeColors.color}80`;
                e.currentTarget.style.backgroundColor = `${nodeColors.color}08`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragActive) {
                e.currentTarget.style.borderColor = undefined;
                e.currentTarget.style.backgroundColor = undefined;
              }
            }}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <Label className="text-xs text-muted-foreground cursor-pointer">
              {isDragActive ? 'Drop image here' : 'Click or drag to upload'}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WEBP up to 10MB
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img
                src={localData.imageUrl}
                alt={localData.imageName || 'Uploaded image'}
                className="w-full h-auto max-h-48 object-contain"
              />
              <Button
                onClick={handleRemove}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 nodrag nopan"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {localData.imageName && (
              <p className="text-xs text-muted-foreground truncate">
                {localData.imageName}
              </p>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

