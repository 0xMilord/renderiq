import { useEffect, useState } from 'react';

/**
 * Custom hook to manage object URLs for File objects
 * Automatically creates and cleans up object URLs
 */
export function useObjectURL(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setUrl(objectUrl);
      
      // Cleanup on unmount or when file changes
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setUrl(null);
    }
  }, [file]);

  return url;
}

