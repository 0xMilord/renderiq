/**
 * Clipboard API Utilities
 * Copy/paste text and images
 */

/**
 * Check if Clipboard API is supported
 */
export function isClipboardSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'clipboard' in navigator;
}

/**
 * Copy text to clipboard
 */
export async function copyText(text: string): Promise<boolean> {
  if (!isClipboardSupported()) {
    console.warn('Clipboard API is not supported');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
}

/**
 * Copy image to clipboard
 */
export async function copyImage(imageUrl: string): Promise<boolean> {
  if (!isClipboardSupported()) {
    console.warn('Clipboard API is not supported');
    return false;
  }

  try {
    // Fetch image as blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Create ClipboardItem
    const clipboardItem = new ClipboardItem({
      [blob.type]: blob,
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (error) {
    console.error('Failed to copy image:', error);
    return false;
  }
}

/**
 * Read text from clipboard
 */
export async function readText(): Promise<string | null> {
  if (!isClipboardSupported()) {
    console.warn('Clipboard API is not supported');
    return null;
  }

  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error('Failed to read text from clipboard:', error);
    return null;
  }
}

/**
 * Read image from clipboard
 */
export async function readImage(): Promise<File | null> {
  if (!isClipboardSupported()) {
    console.warn('Clipboard API is not supported');
    return null;
  }

  try {
    const clipboardItems = await navigator.clipboard.read();
    
    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        if (type.startsWith('image/')) {
          const blob = await clipboardItem.getType(type);
          return new File([blob], 'clipboard-image.png', { type });
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to read image from clipboard:', error);
    return null;
  }
}








