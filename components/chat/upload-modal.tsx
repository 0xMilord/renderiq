'use client';

import { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Images, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useObjectURL } from '@/lib/hooks/use-object-url';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  onGalleryOpen: () => void;
}

export function UploadModal({ isOpen, onClose, onFileSelect, onGalleryOpen }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const previewUrl = useObjectURL(selectedFile); // ✅ FIXED: Use useObjectURL hook for automatic cleanup
  const [activeTab, setActiveTab] = useState('upload');
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // ✅ FIXED: previewUrl is automatically managed by useObjectURL hook
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null); // ✅ FIXED: useObjectURL hook handles URL cleanup automatically
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
      removeSelectedFile();
      onClose();
    }
  };

  const handleClose = () => {
    removeSelectedFile();
    setActiveTab('upload');
    onClose();
  };

  const handleGalleryClick = () => {
    handleClose();
    onGalleryOpen();
  };

  // Reset to upload tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('upload');
      removeSelectedFile();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Camera</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center space-x-2">
              <Images className="h-4 w-4" />
              <span>My Gallery</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">Drop your image here</p>
                <p className="text-xs text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <Button variant="outline" size="sm" type="button">
                  Browse Files
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG, WEBP up to 10MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Selected file"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full"
                    onClick={removeSelectedFile}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="camera" className="space-y-4">
            {!selectedFile ? (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Capture from Camera</p>
                <p className="text-xs text-muted-foreground">
                  Take a photo using your device camera
                </p>
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Open Camera
                </Button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                  aria-label="Camera capture"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Camera capture"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Camera className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full"
                    onClick={removeSelectedFile}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Camera Capture</p>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="text-center py-8">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Images className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-2">My Gallery</p>
            <p className="text-xs text-muted-foreground mb-4">
              Select from your previous renders and uploads
            </p>
            <Button onClick={handleGalleryClick} className="w-full">
              <Images className="h-4 w-4 mr-2" />
              Open Gallery
            </Button>
          </TabsContent>
        </Tabs>

        {selectedFile && (
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Use Image
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
