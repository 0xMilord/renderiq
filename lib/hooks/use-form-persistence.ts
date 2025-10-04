'use client';

import { useEffect, useCallback } from 'react';

interface FormState {
  prompt: string;
  negativePrompt: string;
  style: string;
  quality: string;
  aspectRatio: string;
  imageType: string;
  renderMode: string;
  renderSpeed: string;
  duration: number;
  isPublic: boolean;
  addToChain: boolean;
}

interface FormSetters {
  setPrompt: (value: string) => void;
  setNegativePrompt: (value: string) => void;
  setStyle: (value: string) => void;
  setQuality: (value: string) => void;
  setAspectRatio: (value: string) => void;
  setImageType: (value: string) => void;
  setRenderMode: (value: string) => void;
  setRenderSpeed: (value: string) => void;
  setDuration: (value: number) => void;
  setIsPublic: (value: boolean) => void;
  setAddToChain: (value: boolean) => void;
}

export function useFormPersistence(
  formState: FormState,
  setters: FormSetters,
  key: string = 'engine-form'
) {
  // Save form state to localStorage
  const saveFormState = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(formState));
    } catch (error) {
      console.warn('Failed to save form state:', error);
    }
  }, [formState, key]);

  // Load form state from localStorage
  const loadFormState = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsedState = JSON.parse(saved);
        
        // Apply saved state to setters
        Object.entries(parsedState).forEach(([key, value]) => {
          const setterKey = `set${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof FormSetters;
          if (setters[setterKey] && value !== undefined) {
            (setters[setterKey] as (value: unknown) => void)(value);
          }
        });
        
        return parsedState;
      }
    } catch (error) {
      console.warn('Failed to load form state:', error);
    }
    return null;
  }, [setters, key]);

  // Clear saved form state
  const clearFormState = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear form state:', error);
    }
  }, [key]);

  // Auto-save form state when it changes
  useEffect(() => {
    saveFormState();
  }, [saveFormState]);

  // Load form state on mount
  useEffect(() => {
    loadFormState();
  }, [loadFormState]);

  return {
    saveFormState,
    loadFormState,
    clearFormState,
  };
}

// Utility for saving specific generation parameters
export function saveGenerationParams(params: Record<string, unknown>) {
  try {
    localStorage.setItem('generation-params', JSON.stringify(params));
  } catch (error) {
    console.warn('Failed to save generation params:', error);
  }
}

// Utility for loading specific generation parameters
export function loadGenerationParams(): Record<string, unknown> | null {
  try {
    const saved = localStorage.getItem('generation-params');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load generation params:', error);
    return null;
  }
}
