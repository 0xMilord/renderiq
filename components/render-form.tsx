'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRenderSchema, type CreateRenderData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Image, Video } from 'lucide-react';

interface RenderFormProps {
  projectId: string;
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export function RenderForm({ projectId, onSubmit, loading = false }: RenderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [renderType, setRenderType] = useState<'image' | 'video'>('image');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateRenderData>({
    resolver: zodResolver(createRenderSchema),
    defaultValues: {
      projectId,
      type: 'image',
      settings: {
        style: 'photorealistic',
        quality: 'high',
        aspectRatio: '16:9',
      },
    },
  });

  const onFormSubmit = async (data: CreateRenderData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('projectId', data.projectId);
      formData.append('type', data.type);
      formData.append('prompt', data.prompt);
      formData.append('style', data.settings.style);
      formData.append('quality', data.settings.quality);
      formData.append('aspectRatio', data.settings.aspectRatio);
      if (data.settings.duration) {
        formData.append('duration', data.settings.duration.toString());
      }

      const result = await onSubmit(formData);
      
      if (result.success) {
        reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Render Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Render Type</label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setRenderType('image')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              renderType === 'image'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Image className="h-4 w-4" />
            <span>Image</span>
          </button>
          <button
            type="button"
            onClick={() => setRenderType('video')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              renderType === 'video'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Video</span>
          </button>
        </div>
        <input type="hidden" {...register('type')} value={renderType} />
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <label htmlFor="prompt" className="text-sm font-medium">
          AI Prompt
        </label>
        <Textarea
          id="prompt"
          {...register('prompt')}
          placeholder="Describe how you want to transform your image... (e.g., 'Transform this into a photorealistic modern building with glass facade and natural lighting')"
          rows={4}
        />
        {errors.prompt && (
          <p className="text-sm text-red-600">{errors.prompt.message}</p>
        )}
      </div>

      {/* Style */}
      <div className="space-y-2">
        <label htmlFor="style" className="text-sm font-medium">
          Style
        </label>
        <select
          {...register('settings.style')}
          className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="photorealistic">Photorealistic</option>
          <option value="architectural">Architectural</option>
          <option value="modern">Modern</option>
          <option value="classic">Classic</option>
          <option value="futuristic">Futuristic</option>
        </select>
      </div>

      {/* Quality */}
      <div className="space-y-2">
        <label htmlFor="quality" className="text-sm font-medium">
          Quality
        </label>
        <select
          {...register('settings.quality')}
          className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="standard">Standard</option>
          <option value="high">High</option>
          <option value="ultra">Ultra</option>
        </select>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <label htmlFor="aspectRatio" className="text-sm font-medium">
          Aspect Ratio
        </label>
        <select
          {...register('settings.aspectRatio')}
          className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="16:9">16:9 (Widescreen)</option>
          <option value="4:3">4:3 (Standard)</option>
          <option value="1:1">1:1 (Square)</option>
          <option value="21:9">21:9 (Ultrawide)</option>
        </select>
      </div>

      {/* Duration (for videos) */}
      {renderType === 'video' && (
        <div className="space-y-2">
          <label htmlFor="duration" className="text-sm font-medium">
            Duration (seconds)
          </label>
          <Input
            id="duration"
            type="number"
            min="1"
            max="60"
            {...register('settings.duration', { valueAsNumber: true })}
            placeholder="10"
          />
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || loading}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Creating Render...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            Generate {renderType === 'image' ? 'Image' : 'Video'}
          </>
        )}
      </Button>
    </form>
  );
}
