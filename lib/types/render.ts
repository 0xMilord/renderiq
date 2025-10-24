// Client-side render types to avoid importing database schema in client components

export interface Render {
  id: string;
  projectId: string;
  userId: string;
  type: 'image' | 'video';
  prompt: string;
  settings: Record<string, any> | null;
  outputUrl: string | null;
  outputKey: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  processingTime: number | null;
  creditsCost: number;
  chainId: string | null;
  chainPosition: number | null;
  referenceRenderId: string | null;
  // Uploaded image fields
  uploadedImageUrl: string | null;
  uploadedImageKey: string | null;
  uploadedImageId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RenderChain {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RenderVersion {
  id: string;
  renderId: string;
  versionNumber: number;
  imageUrl: string;
  settings: Record<string, any> | null;
  createdAt: Date;
}
