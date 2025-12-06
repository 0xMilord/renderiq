'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StyleReference {
  id: string;
  name: string;
  imageUrl: string;
  category?: string;
}

interface StyleReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: File | null, styleName?: string) => void;
  toolId: string;
  currentImage?: File | null;
  currentPreview?: string | null;
}

// Mock library data - In production, this would come from an API
const STYLE_LIBRARY: Record<string, StyleReference[]> = {
  'render-section-drawing': [
    { id: '1', name: 'Modern Minimalist', imageUrl: '/styles/modern-minimalist.jpg', category: 'Contemporary' },
    { id: '2', name: 'Technical CAD', imageUrl: '/styles/technical-cad.jpg', category: 'Technical' },
    { id: '3', name: 'Illustrated Style', imageUrl: '/styles/illustrated.jpg', category: 'Artistic' },
    { id: '4', name: 'Classic Traditional', imageUrl: '/styles/classic-traditional.jpg', category: 'Traditional' },
  ],
  // Add more tool-specific styles as needed
};

export function StyleReferenceDialog({
  open,
  onOpenChange,
  onSelect,
  toolId,
  currentImage,
  currentPreview,
}: StyleReferenceDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(currentImage || null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(currentPreview || null);
  const [selectedLibraryStyle, setSelectedLibraryStyle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');

  const libraryStyles = STYLE_LIBRARY[toolId] || [];

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setUploadedFile(file);
        
        // Generate preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
  });

  const handleRemoveUpload = () => {
    setUploadedFile(null);
    setUploadedPreview(null);
  };

  const handleConfirm = () => {
    if (activeTab === 'upload' && uploadedFile) {
      onSelect(uploadedFile);
    } else if (activeTab === 'library' && selectedLibraryStyle) {
      // In production, fetch the actual image file from the library
      // For now, we'll pass null and the style name
      onSelect(null, selectedLibraryStyle);
    } else {
      onSelect(null);
    }
    onOpenChange(false);
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setUploadedPreview(null);
    setSelectedLibraryStyle(null);
    onSelect(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Style Reference</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'library')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            {uploadedPreview ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted group">
                <img
                  src={uploadedPreview}
                  alt="Style reference"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemoveUpload}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 aspect-video flex flex-col items-center justify-center gap-2 p-4',
                  isDragActive
                    ? 'border-primary bg-primary/10 scale-[1.02]'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                )}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">Style reference image (PNG, JPG, WebP)</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="library" className="space-y-4 mt-4">
            {libraryStyles.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {libraryStyles.map((style) => (
                  <div
                    key={style.id}
                    className={cn(
                      'relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all',
                      selectedLibraryStyle === style.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setSelectedLibraryStyle(style.id)}
                  >
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-sm font-medium text-white">{style.name}</p>
                      {style.category && (
                        <p className="text-xs text-white/70">{style.category}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No styles available in library for this tool</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleRemove}>
            Remove Style Reference
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

