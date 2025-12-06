import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UseToolUploadOptions {
  multipleImages?: boolean;
  maxImages?: number;
}

export function useToolUpload({ multipleImages = false, maxImages = 1 }: UseToolUploadOptions = {}) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (multipleImages) {
      const newFiles = acceptedFiles.slice(0, maxImages - images.length);
      setImages(prev => [...prev, ...newFiles]);
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    } else {
      const file = acceptedFiles[0];
      if (file) {
        setImages([file]);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews([reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [multipleImages, maxImages, images.length]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: multipleImages,
    maxFiles: multipleImages ? maxImages : 1,
    noClick: false,
    noKeyboard: false,
  });

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImages([]);
    setPreviews([]);
  };

  return {
    images,
    previews,
    getRootProps,
    getInputProps,
    isDragActive,
    open,
    removeImage,
    clearImages,
  };
}

