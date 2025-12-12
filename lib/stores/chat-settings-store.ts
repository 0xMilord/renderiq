'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ModelId } from '@/lib/config/models';
import { logger } from '@/lib/utils/logger';

interface ChatSettingsState {
  // Environment and effects
  environment: string;
  effect: string;
  styleTransferImage: File | null;
  styleTransferPreview: string | null;
  
  // Generation settings
  temperature: string;
  quality: 'standard' | 'high' | 'ultra';
  selectedImageModel: ModelId | undefined;
  selectedVideoModel: ModelId | undefined;
  
  // Video settings
  videoDuration: number;
  isVideoMode: boolean;
  videoKeyframes: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }>;
  videoLastFrame: { imageData: string; imageType: string } | null;
  
  // Privacy
  isPublic: boolean;
  
  // Actions
  setEnvironment: (value: string) => void;
  setEffect: (value: string) => void;
  setStyleTransferImage: (value: File | null) => void;
  setStyleTransferPreview: (value: string | null) => void;
  setTemperature: (value: string) => void;
  setQuality: (value: 'standard' | 'high' | 'ultra') => void;
  setSelectedImageModel: (value: ModelId | undefined) => void;
  setSelectedVideoModel: (value: ModelId | undefined) => void;
  setVideoDuration: (value: number) => void;
  setIsVideoMode: (value: boolean) => void;
  setVideoKeyframes: (value: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }>) => void;
  setVideoLastFrame: (value: { imageData: string; imageType: string } | null) => void;
  setIsPublic: (value: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings: Omit<ChatSettingsState, 
  | 'setEnvironment' 
  | 'setEffect' 
  | 'setStyleTransferImage' 
  | 'setStyleTransferPreview'
  | 'setTemperature'
  | 'setQuality'
  | 'setSelectedImageModel'
  | 'setSelectedVideoModel'
  | 'setVideoDuration'
  | 'setIsVideoMode'
  | 'setVideoKeyframes'
  | 'setVideoLastFrame'
  | 'setIsPublic'
  | 'resetSettings'
> = {
  environment: 'none',
  effect: 'none',
  styleTransferImage: null,
  styleTransferPreview: null,
  temperature: '0.5',
  quality: 'standard',
  selectedImageModel: 'auto' as ModelId, // Default to auto mode (uses ModelRouter)
  selectedVideoModel: 'auto' as ModelId, // Default to auto mode (uses ModelRouter)
  videoDuration: 8,
  isVideoMode: false,
  videoKeyframes: [],
  videoLastFrame: null,
  isPublic: true,
};

const getStorageKey = (projectId?: string, chainId?: string) => {
  return `chat-settings-store-${projectId || 'default'}-${chainId || 'default'}`;
};

export const useChatSettingsStore = create<ChatSettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setEnvironment: (value) => {
        logger.log('⚙️ SettingsStore: Setting environment', { value });
        set({ environment: value });
      },

      setEffect: (value) => {
        logger.log('⚙️ SettingsStore: Setting effect', { value });
        set({ effect: value });
      },

      setStyleTransferImage: (value) => {
        logger.log('⚙️ SettingsStore: Setting style transfer image', { hasFile: !!value });
        set({ styleTransferImage: value });
      },

      setStyleTransferPreview: (value) => {
        set({ styleTransferPreview: value });
      },

      setTemperature: (value) => {
        logger.log('⚙️ SettingsStore: Setting temperature', { value });
        set({ temperature: value });
      },

      setQuality: (value) => {
        logger.log('⚙️ SettingsStore: Setting quality', { value });
        set({ quality: value });
      },

      setSelectedImageModel: (value) => {
        logger.log('⚙️ SettingsStore: Setting selected image model', { value });
        set({ selectedImageModel: value });
      },

      setSelectedVideoModel: (value) => {
        logger.log('⚙️ SettingsStore: Setting selected video model', { value });
        set({ selectedVideoModel: value });
      },

      setVideoDuration: (value) => {
        logger.log('⚙️ SettingsStore: Setting video duration', { value });
        set({ videoDuration: value });
      },

      setIsVideoMode: (value) => {
        logger.log('⚙️ SettingsStore: Setting is video mode', { value });
        set({ isVideoMode: value });
      },

      setVideoKeyframes: (value) => {
        logger.log('⚙️ SettingsStore: Setting video keyframes', { count: value.length });
        set({ videoKeyframes: value });
      },

      setVideoLastFrame: (value) => {
        logger.log('⚙️ SettingsStore: Setting video last frame', { hasFrame: !!value });
        set({ videoLastFrame: value });
      },

      setIsPublic: (value) => {
        logger.log('⚙️ SettingsStore: Setting is public', { value });
        set({ isPublic: value });
      },

      resetSettings: () => {
        logger.log('🔄 SettingsStore: Resetting settings');
        set(defaultSettings);
      },
    }),
    {
      name: 'chat-settings-store-default',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist most settings, but not File objects
        environment: state.environment,
        effect: state.effect,
        styleTransferPreview: state.styleTransferPreview,
        temperature: state.temperature,
        quality: state.quality,
        selectedImageModel: state.selectedImageModel,
        selectedVideoModel: state.selectedVideoModel,
        videoDuration: state.videoDuration,
        isVideoMode: state.isVideoMode,
        videoKeyframes: state.videoKeyframes,
        videoLastFrame: state.videoLastFrame,
        isPublic: state.isPublic,
        // Don't persist: styleTransferImage (File object)
      }),
    }
  )
);

// Factory function to create a scoped store instance per project/chain
export const createChatSettingsStore = (projectId: string, chainId?: string) => {
  const storageKey = getStorageKey(projectId, chainId);
  
  return create<ChatSettingsState>()(
    persist(
      (set) => ({
        ...defaultSettings,

        setEnvironment: (value) => {
          logger.log('⚙️ SettingsStore: Setting environment', { value, projectId, chainId });
          set({ environment: value });
        },

        setEffect: (value) => {
          logger.log('⚙️ SettingsStore: Setting effect', { value, projectId, chainId });
          set({ effect: value });
        },

        setStyleTransferImage: (value) => {
          logger.log('⚙️ SettingsStore: Setting style transfer image', { hasFile: !!value, projectId, chainId });
          set({ styleTransferImage: value });
        },

        setStyleTransferPreview: (value) => {
          set({ styleTransferPreview: value });
        },

        setTemperature: (value) => {
          logger.log('⚙️ SettingsStore: Setting temperature', { value, projectId, chainId });
          set({ temperature: value });
        },

        setQuality: (value) => {
          logger.log('⚙️ SettingsStore: Setting quality', { value, projectId, chainId });
          set({ quality: value });
        },

        setSelectedImageModel: (value) => {
          logger.log('⚙️ SettingsStore: Setting selected image model', { value, projectId, chainId });
          set({ selectedImageModel: value });
        },

        setSelectedVideoModel: (value) => {
          logger.log('⚙️ SettingsStore: Setting selected video model', { value, projectId, chainId });
          set({ selectedVideoModel: value });
        },

        setVideoDuration: (value) => {
          logger.log('⚙️ SettingsStore: Setting video duration', { value, projectId, chainId });
          set({ videoDuration: value });
        },

        setIsVideoMode: (value) => {
          logger.log('⚙️ SettingsStore: Setting is video mode', { value, projectId, chainId });
          set({ isVideoMode: value });
        },

        setVideoKeyframes: (value) => {
          logger.log('⚙️ SettingsStore: Setting video keyframes', { count: value.length, projectId, chainId });
          set({ videoKeyframes: value });
        },

        setVideoLastFrame: (value) => {
          logger.log('⚙️ SettingsStore: Setting video last frame', { hasFrame: !!value, projectId, chainId });
          set({ videoLastFrame: value });
        },

        setIsPublic: (value) => {
          logger.log('⚙️ SettingsStore: Setting is public', { value, projectId, chainId });
          set({ isPublic: value });
        },

        resetSettings: () => {
          logger.log('🔄 SettingsStore: Resetting settings', { projectId, chainId });
          set(defaultSettings);
        },
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          environment: state.environment,
          effect: state.effect,
          styleTransferPreview: state.styleTransferPreview,
          temperature: state.temperature,
          quality: state.quality,
          selectedImageModel: state.selectedImageModel,
          selectedVideoModel: state.selectedVideoModel,
          videoDuration: state.videoDuration,
          isVideoMode: state.isVideoMode,
          videoKeyframes: state.videoKeyframes,
          videoLastFrame: state.videoLastFrame,
          isPublic: state.isPublic,
        }),
      }
    )
  );
};

