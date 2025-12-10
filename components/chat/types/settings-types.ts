import type { ModelId } from '@/lib/config/models';

export interface SettingsState {
  environment: string;
  effect: string;
  styleTransferImage: File | null;
  styleTransferPreview: string | null;
  temperature: string;
  quality: string;
  selectedImageModel: ModelId | undefined;
  selectedVideoModel: ModelId | undefined;
  videoDuration: number;
  isVideoMode: boolean;
  videoKeyframes: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }>;
  videoLastFrame: { imageData: string; imageType: string } | null;
  isPublic: boolean;
}

export type SettingsAction =
  | { type: 'SET_ENVIRONMENT'; payload: string }
  | { type: 'SET_EFFECT'; payload: string }
  | { type: 'SET_STYLE_TRANSFER_IMAGE'; payload: File | null }
  | { type: 'SET_STYLE_TRANSFER_PREVIEW'; payload: string | null }
  | { type: 'SET_TEMPERATURE'; payload: string }
  | { type: 'SET_QUALITY'; payload: string }
  | { type: 'SET_SELECTED_IMAGE_MODEL'; payload: ModelId | undefined }
  | { type: 'SET_SELECTED_VIDEO_MODEL'; payload: ModelId | undefined }
  | { type: 'SET_VIDEO_DURATION'; payload: number }
  | { type: 'SET_IS_VIDEO_MODE'; payload: boolean }
  | { type: 'SET_VIDEO_KEYFRAMES'; payload: Array<{ id: string; imageData: string; imageType: string; timestamp?: number }> }
  | { type: 'SET_VIDEO_LAST_FRAME'; payload: { imageData: string; imageType: string } | null }
  | { type: 'SET_IS_PUBLIC'; payload: boolean };

