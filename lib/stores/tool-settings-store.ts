'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';
import { ModelId, getDefaultModel } from '@/lib/config/models';

interface ToolSettingsState {
  // Image/Video settings
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: string;
  style: string;
  selectedModel: string | undefined;
  videoDuration: 4 | 6 | 8;
  videoModel: string;
  enableAudio: boolean;
  
  // Upload state (not persisted - File objects can't be serialized)
  images: File[];
  previews: string[];
  galleryImageUrl: string | null;
  
  // Actions
  setQuality: (quality: 'standard' | 'high' | 'ultra') => void;
  setAspectRatio: (ratio: string) => void;
  setStyle: (style: string) => void;
  setSelectedModel: (model: string | undefined) => void;
  setVideoDuration: (duration: 4 | 6 | 8) => void;
  setVideoModel: (model: string) => void;
  setEnableAudio: (enable: boolean) => void;
  setImages: (images: File[]) => void;
  setPreviews: (previews: string[]) => void;
  setGalleryImageUrl: (url: string | null) => void;
  addImage: (image: File, preview: string) => void;
  removeImage: (index: number) => void;
  clearImages: () => void;
  resetSettings: () => void;
}

const DEFAULT_IMAGE_MODEL = getDefaultModel('image');
const DEFAULT_VIDEO_MODEL = getDefaultModel('video');

const DEFAULT_SETTINGS: Omit<ToolSettingsState, keyof {
  setQuality: never;
  setAspectRatio: never;
  setStyle: never;
  setSelectedModel: never;
  setVideoDuration: never;
  setVideoModel: never;
  setEnableAudio: never;
  setImages: never;
  setPreviews: never;
  setGalleryImageUrl: never;
  addImage: never;
  removeImage: never;
  clearImages: never;
  resetSettings: never;
}> = {
  quality: 'standard',
  aspectRatio: '16:9',
  style: 'realistic',
  selectedModel: undefined,
  videoDuration: 8,
  videoModel: 'veo-3.1-generate-preview',
  enableAudio: true,
  images: [],
  previews: [],
  galleryImageUrl: null,
};

export const useToolSettingsStore = create<ToolSettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      // Actions
      setQuality: (quality) => {
        logger.log('⚙️ ToolSettingsStore: Setting quality', { quality });
        set({ quality });
      },

      setAspectRatio: (ratio) => {
        logger.log('⚙️ ToolSettingsStore: Setting aspect ratio', { ratio });
        set({ aspectRatio: ratio });
      },

      setStyle: (style) => {
        logger.log('⚙️ ToolSettingsStore: Setting style', { style });
        set({ style });
      },

      setSelectedModel: (model) => {
        logger.log('⚙️ ToolSettingsStore: Setting selected model', { model });
        set({ selectedModel: model });
      },

      setVideoDuration: (duration) => {
        logger.log('⚙️ ToolSettingsStore: Setting video duration', { duration });
        set({ videoDuration: duration });
      },

      setVideoModel: (model) => {
        logger.log('⚙️ ToolSettingsStore: Setting video model', { model });
        set({ videoModel: model });
      },

      setEnableAudio: (enable) => {
        logger.log('⚙️ ToolSettingsStore: Setting enable audio', { enable });
        set({ enableAudio: enable });
      },

      setImages: (images) => {
        set({ images });
      },

      setPreviews: (previews) => {
        set({ previews });
      },

      setGalleryImageUrl: (url) => {
        set({ galleryImageUrl: url });
      },

      addImage: (image, preview) => {
        set((state) => ({
          images: [...state.images, image],
          previews: [...state.previews, preview]
        }));
      },

      removeImage: (index) => {
        set((state) => ({
          images: state.images.filter((_, i) => i !== index),
          previews: state.previews.filter((_, i) => i !== index)
        }));
      },

      clearImages: () => {
        logger.log('🗑️ ToolSettingsStore: Clearing images');
        set({ 
          images: [],
          previews: [],
          galleryImageUrl: null
        });
      },

      resetSettings: () => {
        logger.log('🔄 ToolSettingsStore: Resetting settings');
        set({
          ...DEFAULT_SETTINGS,
          // Keep images/previews on reset (user might want to keep them)
        });
      },
    }),
    {
      name: 'tool-settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist settings, not File objects or previews
        quality: state.quality,
        aspectRatio: state.aspectRatio,
        style: state.style,
        selectedModel: state.selectedModel,
        videoDuration: state.videoDuration,
        videoModel: state.videoModel,
        enableAudio: state.enableAudio,
      }),
    }
  )
);

