'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { X, FileImage, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  multiple?: boolean;
  maxFiles?: number;
  accept?: Record<string, string[]>;
  onFilesChange: (files: File[]) => void;
  previews?: string[];
  className?: string;
  aspectRatio?: string;
}

export function FileUpload({
  multiple = false,
  maxFiles = 1,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
  onFilesChange,
  previews: externalPreviews,
  className,
  aspectRatio = '16/9',
}: FileUploadProps) {
  const [internalPreviews, setInternalPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  // Use external previews if provided, otherwise use internal
  const previews = externalPreviews || internalPreviews;
  
  // Sync internal files state when external previews are cleared
  useEffect(() => {
    if (externalPreviews && externalPreviews.length === 0 && files.length > 0) {
      setFiles([]);
      setInternalPreviews([]);
    }
  }, [externalPreviews?.length, files.length]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // Calculate current file count based on external previews or internal files
      const currentCount = externalPreviews ? externalPreviews.length : files.length;
      
      const newFiles = multiple
        ? acceptedFiles.slice(0, maxFiles - currentCount)
        : acceptedFiles.slice(0, 1);

      if (newFiles.length === 0) return;

      // Always update internal files state for remove functionality
      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
      setFiles(updatedFiles);
      
      // Always call onFilesChange - parent component will handle previews if external
      onFilesChange(updatedFiles);

      // Generate previews only if not provided externally
      if (!externalPreviews) {
        const previewPromises = newFiles.map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.onerror = () => {
              resolve(''); // Resolve with empty string on error
            };
            reader.readAsDataURL(file);
          });
        });

        Promise.all(previewPromises).then((newPreviews) => {
          const validPreviews = newPreviews.filter(p => p !== '');
          setInternalPreviews((prev) => {
            return multiple ? [...prev, ...validPreviews] : validPreviews;
          });
        });
      }
    },
    [multiple, maxFiles, files, onFilesChange, externalPreviews]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles: multiple ? maxFiles : 1,
    noClick: false,
    noKeyboard: false,
  });

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setInternalPreviews(updatedPreviews);
    onFilesChange(updatedFiles);
  };

  const clearAll = () => {
    setFiles([]);
    setInternalPreviews([]);
    onFilesChange([]);
  };

  const aspectRatioClass = useMemo(() => {
    const ratios: Record<string, string> = {
      '16/9': 'aspect-video',
      '4/3': 'aspect-[4/3]',
      '1/1': 'aspect-square',
      '9/16': 'aspect-[9/16]',
    };
    return ratios[aspectRatio] || 'aspect-video';
  }, [aspectRatio]);

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden',
          aspectRatioClass,
          isDragActive
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-primary/50',
          'group'
        )}
      >
        <input {...getInputProps()} className="hidden" />
        
        {previews.length > 0 ? (
          <div className="w-full h-full relative">
            {multiple ? (
              <div className="grid grid-cols-2 gap-2 p-2 h-full">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative group/item aspect-video rounded-lg overflow-hidden border border-border bg-muted"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/40 transition-colors flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover/item:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {files.length < maxFiles && (
                  <div
                    className="aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add more</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full relative group/item">
                <img
                  src={previews[0]}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/50 transition-colors flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Replace
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAll();
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6">
            <div
              className={cn(
                'rounded-full p-4 mb-4 transition-colors',
                isDragActive ? 'bg-primary/20' : 'bg-muted'
              )}
            >
              <FileImage
                className={cn(
                  'h-8 w-8 transition-colors',
                  isDragActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </div>
            <p
              className={cn(
                'text-sm font-medium mb-1 transition-colors',
                isDragActive ? 'text-primary' : 'text-foreground'
              )}
            >
              {isDragActive
                ? 'Drop images here'
                : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              {multiple
                ? `Up to ${maxFiles} images (PNG, JPG, WebP)`
                : 'Single image (PNG, JPG, WebP)'}
            </p>
            {multiple && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Max file size: 10MB per image
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

