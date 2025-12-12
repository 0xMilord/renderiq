/**
 * Web Share API Utilities
 * Share content from app to other apps
 */

/**
 * Check if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'share' in navigator;
}

/**
 * Share content using Web Share API
 */
export async function shareContent(data: {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}): Promise<boolean> {
  if (!isWebShareSupported()) {
    console.warn('Web Share API is not supported');
    return false;
  }

  try {
    if (data.files && 'canShare' in navigator && (navigator as any).canShare({ files: data.files })) {
      await (navigator as any).share({
        title: data.title,
        text: data.text,
        url: data.url,
        files: data.files,
      });
    } else {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
    }
    return true;
  } catch (error: any) {
    // User cancelled or error occurred
    if (error.name !== 'AbortError') {
      console.error('Error sharing content:', error);
    }
    return false;
  }
}

/**
 * Share render URL
 */
export async function shareRender(renderUrl: string, title?: string): Promise<boolean> {
  return shareContent({
    title: title || 'Check out this render from Renderiq',
    text: 'I created this render using Renderiq AI',
    url: renderUrl,
  });
}

/**
 * Share project URL
 */
export async function shareProject(projectUrl: string, projectName?: string): Promise<boolean> {
  return shareContent({
    title: projectName ? `${projectName} - Renderiq Project` : 'Renderiq Project',
    text: 'Check out my Renderiq project',
    url: projectUrl,
  });
}



