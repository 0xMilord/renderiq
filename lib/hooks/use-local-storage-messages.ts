import { useEffect, useRef } from 'react';
import { logger } from '@/lib/utils/logger';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'video';
  content: string;
  timestamp: Date;
  uploadedImage?: {
    previewUrl: string;
    persistedUrl?: string;
  };
}

/**
 * Custom hook to manage localStorage operations for chat messages
 * Handles saving and restoring messages with debouncing
 */
export function useLocalStorageMessages(
  messages: Message[],
  projectId: string,
  chainId?: string
) {
  const localStorageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `chat-messages-${projectId}-${chainId || 'default'}`;

  // Save messages to localStorage with debouncing (1 second delay)
  useEffect(() => {
    if (!messages.length || typeof window === 'undefined') return;
    
    // Clear previous timeout
    if (localStorageTimeoutRef.current) {
      clearTimeout(localStorageTimeoutRef.current);
    }
    
    // Debounce localStorage writes to prevent UI blocking
    localStorageTimeoutRef.current = setTimeout(() => {
      try {
        const messagesToStore = messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
          // Don't store File objects, only URLs
          uploadedImage: msg.uploadedImage ? {
            previewUrl: msg.uploadedImage.previewUrl,
            persistedUrl: msg.uploadedImage.persistedUrl
          } : undefined
        }));
        localStorage.setItem(storageKey, JSON.stringify(messagesToStore));
      } catch (error) {
        logger.error('❌ useLocalStorageMessages: Failed to save messages to localStorage:', error);
      }
    }, 1000); // 1 second debounce
    
    // Cleanup on unmount - save immediately
    return () => {
      if (localStorageTimeoutRef.current) {
        clearTimeout(localStorageTimeoutRef.current);
        // Immediate save on unmount
        try {
          const messagesToStore = messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
            uploadedImage: msg.uploadedImage ? {
              previewUrl: msg.uploadedImage.previewUrl,
              persistedUrl: msg.uploadedImage.persistedUrl
            } : undefined
          }));
          localStorage.setItem(storageKey, JSON.stringify(messagesToStore));
        } catch (error) {
          // Silent fail on unmount
        }
      }
    };
  }, [messages, storageKey]);

  // Save messages immediately (for initialization)
  const saveMessages = (messagesToSave: Message[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      const messagesToStore = messagesToSave.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
        uploadedImage: msg.uploadedImage ? {
          previewUrl: msg.uploadedImage.previewUrl,
          persistedUrl: msg.uploadedImage.persistedUrl
        } : undefined
      }));
      localStorage.setItem(storageKey, JSON.stringify(messagesToStore));
    } catch (error) {
      logger.error('❌ useLocalStorageMessages: Failed to save messages to localStorage:', error);
    }
  };

  // Restore messages from localStorage
  const restoreMessages = (): Message[] | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const storedMessages = localStorage.getItem(storageKey);
      if (!storedMessages) return null;
      
      const parsed = JSON.parse(storedMessages);
      const restoredMessages: Message[] = parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        uploadedImage: msg.uploadedImage ? {
          previewUrl: msg.uploadedImage.previewUrl,
          persistedUrl: msg.uploadedImage.persistedUrl
        } : undefined
      }));
      
      return restoredMessages;
    } catch (error) {
      logger.error('❌ useLocalStorageMessages: Failed to restore messages from localStorage:', error);
      return null;
    }
  };

  // Get storage key for external use
  const getStorageKey = () => storageKey;

  return {
    saveMessages,
    restoreMessages,
    getStorageKey,
  };
}

