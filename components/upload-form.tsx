'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { uploadSchema, type UploadFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, CheckCircle } from 'lucide-react';

interface UploadFormProps {
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export function UploadForm({ onSubmit, loading = false }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('file', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setValue('file', undefined as any);
  };

  const onFormSubmit = async (data: UploadFormData) => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('projectName', data.projectName);
      if (data.description) {
        formData.append('description', data.description);
      }

      const result = await onSubmit(formData);
      
      if (result.success) {
        reset();
        setSelectedFile(null);
        setPreview(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* File Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Upload Image</label>
        {!selectedFile ? (
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 10MB
              </span>
            </label>
          </div>
        ) : (
          <div className="relative">
            <img
              src={preview || ''}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={removeFile}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {errors.file && (
          <p className="text-sm text-destructive">{errors.file.message}</p>
        )}
      </div>

      {/* Project Name */}
      <div className="space-y-2">
        <label htmlFor="projectName" className="text-sm font-medium">
          Project Name
        </label>
        <Input
          id="projectName"
          {...register('projectName')}
          placeholder="Enter project name"
        />
        {errors.projectName && (
          <p className="text-sm text-destructive">{errors.projectName.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description (Optional)
        </label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe your project..."
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!selectedFile || isSubmitting || loading}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Creating Project...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Create Project
          </>
        )}
      </Button>
    </form>
  );
}
