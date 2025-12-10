'use client';

import { useReducer, useCallback } from 'react';
import type { SettingsState, SettingsAction } from '../types/settings-types';

const settingsReducer = (state: SettingsState, action: SettingsAction): SettingsState => {
  switch (action.type) {
    case 'SET_ENVIRONMENT':
      return { ...state, environment: action.payload };
    case 'SET_EFFECT':
      return { ...state, effect: action.payload };
    case 'SET_STYLE_TRANSFER_IMAGE':
      return { ...state, styleTransferImage: action.payload };
    case 'SET_STYLE_TRANSFER_PREVIEW':
      return { ...state, styleTransferPreview: action.payload };
    case 'SET_TEMPERATURE':
      return { ...state, temperature: action.payload };
    case 'SET_QUALITY':
      return { ...state, quality: action.payload };
    case 'SET_SELECTED_IMAGE_MODEL':
      return { ...state, selectedImageModel: action.payload };
    case 'SET_SELECTED_VIDEO_MODEL':
      return { ...state, selectedVideoModel: action.payload };
    case 'SET_VIDEO_DURATION':
      return { ...state, videoDuration: action.payload };
    case 'SET_IS_VIDEO_MODE':
      return { ...state, isVideoMode: action.payload };
    case 'SET_VIDEO_KEYFRAMES':
      return { ...state, videoKeyframes: action.payload };
    case 'SET_VIDEO_LAST_FRAME':
      return { ...state, videoLastFrame: action.payload };
    case 'SET_IS_PUBLIC':
      return { ...state, isPublic: action.payload };
    default:
      return state;
  }
};

export function useSettingsState() {
  const [settingsState, dispatchSettings] = useReducer(settingsReducer, {
    environment: 'none',
    effect: 'none',
    styleTransferImage: null,
    styleTransferPreview: null,
    temperature: '0.5',
    quality: 'standard',
    selectedImageModel: undefined,
    selectedVideoModel: undefined,
    videoDuration: 8,
    isVideoMode: false,
    videoKeyframes: [],
    videoLastFrame: null,
    isPublic: true,
  });

  // Extract for easier access
  const environment = settingsState.environment;
  const effect = settingsState.effect;
  const styleTransferImage = settingsState.styleTransferImage;
  const styleTransferPreview = settingsState.styleTransferPreview;
  const temperature = settingsState.temperature;
  const quality = settingsState.quality;
  const selectedImageModel = settingsState.selectedImageModel;
  const selectedVideoModel = settingsState.selectedVideoModel;
  const videoDuration = settingsState.videoDuration;
  const isVideoMode = settingsState.isVideoMode;
  const videoKeyframes = settingsState.videoKeyframes;
  const videoLastFrame = settingsState.videoLastFrame;
  const isPublic = settingsState.isPublic;

  // Wrapper functions
  const setEnvironment = useCallback((value: string) => dispatchSettings({ type: 'SET_ENVIRONMENT', payload: value }), []);
  const setEffect = useCallback((value: string) => dispatchSettings({ type: 'SET_EFFECT', payload: value }), []);
  const setStyleTransferImage = useCallback((value: File | null) => dispatchSettings({ type: 'SET_STYLE_TRANSFER_IMAGE', payload: value }), []);
  const setStyleTransferPreview = useCallback((value: string | null) => dispatchSettings({ type: 'SET_STYLE_TRANSFER_PREVIEW', payload: value }), []);
  const setTemperature = useCallback((value: string) => dispatchSettings({ type: 'SET_TEMPERATURE', payload: value }), []);
  const setQuality = useCallback((value: string) => dispatchSettings({ type: 'SET_QUALITY', payload: value }), []);
  const setSelectedImageModel = useCallback((value: any) => dispatchSettings({ type: 'SET_SELECTED_IMAGE_MODEL', payload: value }), []);
  const setSelectedVideoModel = useCallback((value: any) => dispatchSettings({ type: 'SET_SELECTED_VIDEO_MODEL', payload: value }), []);
  const setVideoDuration = useCallback((value: number) => dispatchSettings({ type: 'SET_VIDEO_DURATION', payload: value }), []);
  const setIsVideoMode = useCallback((value: boolean) => dispatchSettings({ type: 'SET_IS_VIDEO_MODE', payload: value }), []);
  const setVideoKeyframes = useCallback((value: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }> | ((prev: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }>) => Array<{ id: string; imageData: string; imageType: string; timestamp?: number }>)) => {
    const newValue = typeof value === 'function' ? value(videoKeyframes) : value;
    dispatchSettings({ type: 'SET_VIDEO_KEYFRAMES', payload: newValue });
  }, [videoKeyframes]);
  const setVideoLastFrame = useCallback((value: { imageData: string; imageType: string } | null) => dispatchSettings({ type: 'SET_VIDEO_LAST_FRAME', payload: value }), []);
  const setIsPublic = useCallback((value: boolean) => dispatchSettings({ type: 'SET_IS_PUBLIC', payload: value }), []);

  return {
    // State
    environment,
    effect,
    styleTransferImage,
    styleTransferPreview,
    temperature,
    quality,
    selectedImageModel,
    selectedVideoModel,
    videoDuration,
    isVideoMode,
    videoKeyframes,
    videoLastFrame,
    isPublic,
    // Setters
    setEnvironment,
    setEffect,
    setStyleTransferImage,
    setStyleTransferPreview,
    setTemperature,
    setQuality,
    setSelectedImageModel,
    setSelectedVideoModel,
    setVideoDuration,
    setIsVideoMode,
    setVideoKeyframes,
    setVideoLastFrame,
    setIsPublic,
    // Direct access for advanced use cases
    dispatchSettings,
    settingsState,
  };
}

