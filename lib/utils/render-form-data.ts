/**
 * Utility to create FormData for render generation API requests
 */
export interface RenderFormDataOptions {
  prompt: string;
  quality: string;
  aspectRatio: string;
  type: 'image' | 'video';
  projectId: string;
  chainId?: string;
  referenceRenderId?: string;
  versionContext?: any;
  isPublic: boolean;
  environment?: string;
  effect?: string;
  temperature: string;
  // Video-specific
  videoDuration?: number;
  videoKeyframes?: Array<{ imageData: string; imageType: string }>;
  videoLastFrame?: { imageData: string; imageType: string };
  // Image data
  uploadedImageBase64?: string | null;
  uploadedImageType?: string;
  uploadedImageUrl?: string | null; // ✅ FIX CORS: URL for gallery images (fetched server-side)
  styleTransferBase64?: string | null;
  styleTransferImageType?: string;
  model?: string; // Model ID (e.g., 'gemini-3-pro-image-preview', 'veo-3.1-generate-preview')
}

/**
 * Creates FormData for render generation API request
 */
export function createRenderFormData(options: RenderFormDataOptions): FormData {
  const fd = new FormData();
  fd.append('prompt', options.prompt);
  // Use effect as style, or 'realistic' as default (matches unified-chat-interface logic)
  fd.append('style', options.effect && options.effect !== 'none' ? options.effect : 'realistic');
  fd.append('quality', options.quality);
  fd.append('aspectRatio', options.aspectRatio);
  fd.append('type', options.type);
  
  if (options.type === 'video') {
    if (options.videoDuration) {
      fd.append('duration', options.videoDuration.toString());
      fd.append('resolution', options.videoDuration === 8 ? '1080p' : '720p');
    }
    if (options.videoKeyframes && options.videoKeyframes.length > 0) {
      fd.append('keyframes', JSON.stringify(options.videoKeyframes.map(kf => ({
        imageData: kf.imageData,
        imageType: kf.imageType
      }))));
    }
    if (options.videoLastFrame) {
      fd.append('lastFrame', JSON.stringify({
        imageData: options.videoLastFrame.imageData,
        imageType: options.videoLastFrame.imageType
      }));
    }
  }
  
  fd.append('projectId', options.projectId || '');
  if (options.chainId) fd.append('chainId', options.chainId);
  if (options.referenceRenderId) fd.append('referenceRenderId', options.referenceRenderId);
  if (options.versionContext) fd.append('versionContext', JSON.stringify(options.versionContext));
  fd.append('isPublic', options.isPublic.toString());
  if (options.environment && options.environment !== 'none') fd.append('environment', options.environment);
  if (options.effect && options.effect !== 'none') fd.append('effect', options.effect);
  if (options.model) fd.append('model', options.model);
  if (options.uploadedImageBase64) {
    fd.append('uploadedImageData', options.uploadedImageBase64);
    if (options.uploadedImageType) {
      fd.append('uploadedImageType', options.uploadedImageType);
    }
  }
  // ✅ FIX CORS: Support uploadedImageUrl for gallery images (fetched server-side to avoid CORS)
  if (options.uploadedImageUrl && !options.uploadedImageBase64) {
    fd.append('uploadedImageUrl', options.uploadedImageUrl);
  }
  if (options.styleTransferBase64) {
    fd.append('styleTransferImageData', options.styleTransferBase64);
    if (options.styleTransferImageType) {
      fd.append('styleTransferImageType', options.styleTransferImageType);
    }
  }
  fd.append('temperature', options.temperature);
  
  return fd;
}

