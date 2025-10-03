import { z } from 'zod';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Upload types
export const uploadSchema = z.object({
  file: z.instanceof(File),
  projectName: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
});

export type UploadFormData = z.infer<typeof uploadSchema>;

// Render types
export const renderSettingsSchema = z.object({
  style: z.enum(['photorealistic', 'architectural', 'modern', 'classic', 'futuristic']),
  quality: z.enum(['standard', 'high', 'ultra']),
  aspectRatio: z.enum(['16:9', '4:3', '1:1', '21:9']),
  duration: z.number().min(1).max(60).optional(), // for videos
});

export type RenderSettings = z.infer<typeof renderSettingsSchema>;

export const createRenderSchema = z.object({
  projectId: z.string().uuid(),
  type: z.enum(['image', 'video']),
  prompt: z.string().min(1, 'Prompt is required'),
  settings: renderSettingsSchema,
});

export type CreateRenderData = z.infer<typeof createRenderSchema>;

// Gallery types
export interface GalleryItemWithDetails {
  id: string;
  renderId: string;
  userId: string;
  isPublic: boolean;
  likes: number;
  views: number;
  createdAt: Date;
  render: {
    id: string;
    type: 'image' | 'video';
    prompt: string;
    outputUrl: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
  };
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

// Google AI API types
export interface GoogleAIConfig {
  apiKey: string;
}

export interface GoogleAIImageRequest {
  prompt: string;
  style: string;
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: string;
  uploadedImage?: File;
}

export interface GoogleAIVideoRequest {
  prompt: string;
  style: string;
  quality: 'standard' | 'high' | 'ultra';
  duration: number;
  aspectRatio: string;
}

export interface GoogleAIResponse {
  success: boolean;
  data?: {
    url: string;
    id: string;
  };
  error?: string;
}

// File upload types
export interface FileUploadResult {
  url: string;
  key: string;
  size: number;
  type: string;
}

// User session types
export interface UserSession {
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
  expires: string;
}
