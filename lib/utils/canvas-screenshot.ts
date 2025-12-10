/**
 * Utility for capturing canvas screenshots
 * Uses html2canvas to capture ReactFlow canvas
 */

/**
 * Capture screenshot of a ReactFlow canvas element
 * @param reactFlowInstance - The ReactFlow instance
 * @param fileId - The canvas file ID
 * @returns Promise<string> - Base64 data URL of the screenshot
 */
export async function captureCanvasScreenshot(
  reactFlowInstance: any,
  fileId: string
): Promise<string | null> {
  try {
    // Dynamically import html2canvas to avoid SSR issues
    // Note: html2canvas needs to be installed: npm install html2canvas
    const html2canvas = (await import('html2canvas')).default;
    
    if (!reactFlowInstance) {
      console.warn('ReactFlow instance not available for screenshot');
      return null;
    }

    // Get the ReactFlow viewport element - try multiple methods
    const reactFlowElement = 
      reactFlowInstance.getViewportElement?.() || 
      document.querySelector('.react-flow__viewport') ||
      document.querySelector('.react-flow') ||
      document.querySelector('[data-id="rf__viewport"]');

    if (!reactFlowElement) {
      console.warn('ReactFlow element not found for screenshot');
      return null;
    }

    // Get viewport bounds to capture visible area
    const viewport = reactFlowInstance.getViewport();
    
    // Capture screenshot with html2canvas
    // Capture the entire viewport area
    const canvas = await html2canvas(reactFlowElement as HTMLElement, {
      backgroundColor: '#ffffff', // White background for better visibility
      scale: 0.5, // Lower scale for faster capture and smaller file size
      useCORS: true,
      logging: false,
      width: (reactFlowElement as HTMLElement).clientWidth || 1920,
      height: (reactFlowElement as HTMLElement).clientHeight || 1080,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

    // Convert to base64 data URL with compression
    return canvas.toDataURL('image/png', 0.8);
  } catch (error) {
    console.error('Error capturing canvas screenshot:', error);
    // If html2canvas is not installed, return null gracefully
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      console.warn('html2canvas not installed. Run: npm install html2canvas');
    }
    return null;
  }
}

/**
 * Upload screenshot to storage and update canvas file
 * @param fileId - The canvas file ID
 * @param screenshotDataUrl - Base64 data URL of the screenshot
 * @returns Promise<{ thumbnailUrl: string; thumbnailKey: string } | null>
 */
export async function uploadCanvasScreenshot(
  fileId: string,
  screenshotDataUrl: string
): Promise<{ thumbnailUrl: string; thumbnailKey: string } | null> {
  try {
    // Convert data URL to blob
    const response = await fetch(screenshotDataUrl);
    const blob = await response.blob();

    // Create FormData
    const formData = new FormData();
    formData.append('file', blob, `canvas-${fileId}-${Date.now()}.png`);
    formData.append('fileId', fileId);

    // Upload to storage via API
    const uploadResponse = await fetch('/api/canvas/upload-thumbnail', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to upload screenshot');
    }

    const result = await uploadResponse.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to upload screenshot');
    }

    return {
      thumbnailUrl: result.url,
      thumbnailKey: result.key,
    };
  } catch (error) {
    console.error('Error uploading canvas screenshot:', error);
    return null;
  }
}

