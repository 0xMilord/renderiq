'use client';

import { create } from 'zustand';
import { AutoFillData } from '@/components/engines/control-bar';

interface EngineState {
  // Form state
  prompt: string;
  style: string;
  quality: string;
  aspectRatio: string;
  renderMode: string;
  negativePrompt: string;
  imageType: string;
  
  // Control state
  selectedProjectId: string | null;
  chainId: string | null;
  uploadedFile: File | null;
  
  // Generation state
  isGenerating: boolean;
  result: unknown | null;
  error: string | null;
  
  // Actions
  setPrompt: (prompt: string) => void;
  setStyle: (style: string) => void;
  setQuality: (quality: string) => void;
  setAspectRatio: (aspectRatio: string) => void;
  setRenderMode: (mode: string) => void;
  setNegativePrompt: (prompt: string) => void;
  setImageType: (type: string) => void;
  
  setSelectedProjectId: (id: string | null) => void;
  setChainId: (id: string | null) => void;
  setUploadedFile: (file: File | null) => void;
  
  setIsGenerating: (generating: boolean) => void;
  setResult: (result: unknown | null) => void;
  setError: (error: string | null) => void;
  
  autoFill: (data: AutoFillData) => void;
  reset: () => void;
}

const initialState = {
  prompt: '',
  style: 'realistic',
  quality: 'standard',
  aspectRatio: '16:9',
  renderMode: 'exact',
  negativePrompt: '',
  imageType: '3d-mass',
  
  selectedProjectId: null,
  chainId: null,
  uploadedFile: null,
  
  isGenerating: false,
  result: null,
  error: null,
};

export const useEngineStore = create<EngineState>((set) => ({
  ...initialState,
  
  setPrompt: (prompt) => set({ prompt }),
  setStyle: (style) => set({ style }),
  setQuality: (quality) => set({ quality }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setRenderMode: (renderMode) => set({ renderMode }),
  setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
  setImageType: (imageType) => set({ imageType }),
  
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  setChainId: (chainId) => set({ chainId }),
  setUploadedFile: (uploadedFile) => set({ uploadedFile }),
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  
  autoFill: (data: AutoFillData) => {
    console.log('🏪 EngineStore: Auto-filling with data:', data);
    set({
      prompt: data.prompt,
      style: data.style,
      quality: data.quality,
      aspectRatio: data.aspectRatio,
      renderMode: data.renderMode || 'exact',
      negativePrompt: data.negativePrompt || '',
      imageType: data.imageType || '3d-mass',
    });
  },
  
  reset: () => {
    console.log('🏪 EngineStore: Resetting state');
    set(initialState);
  },
}));

