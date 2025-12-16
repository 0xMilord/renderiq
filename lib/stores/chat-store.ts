'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Render } from '@/lib/types/render';
import { logger } from '@/lib/utils/logger';
import { getSafeStorage } from '@/lib/utils/safe-storage';

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'video';
  content: string;
  timestamp: Date;
  render?: Render;
  isGenerating?: boolean;
  uploadedImage?: {
    file?: File; // Optional for persisted images
    previewUrl: string;
    persistedUrl?: string; // URL from database/storage
  };
  referenceRenderId?: string; // Which render this message is referring to
}

interface ChatState {
  // Core chat state
  messages: Message[];
  inputValue: string;
  currentRender: Render | null;
  isGenerating: boolean;
  progress: number;
  
  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  setInputValue: (value: string) => void;
  setCurrentRender: (render: Render | null) => void;
  setIsGenerating: (value: boolean) => void;
  setProgress: (value: number) => void;
  
  // Utility actions
  clearMessages: () => void;
  resetChat: () => void;
}

// Helper to serialize/deserialize messages for localStorage
const messageSerializer = {
  serialize: (messages: Message[]): string => {
    return JSON.stringify(
      messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
        // Don't store File objects, only URLs
        uploadedImage: msg.uploadedImage ? {
          previewUrl: msg.uploadedImage.previewUrl,
          persistedUrl: msg.uploadedImage.persistedUrl
        } : undefined,
        // Don't store render objects in localStorage (they come from DB)
        render: undefined
      }))
    );
  },
  deserialize: (str: string): Message[] => {
    try {
      const parsed = JSON.parse(str);
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        uploadedImage: msg.uploadedImage ? {
          previewUrl: msg.uploadedImage.previewUrl,
          persistedUrl: msg.uploadedImage.persistedUrl
        } : undefined
      }));
    } catch (error) {
      logger.error('Failed to deserialize messages from localStorage:', error);
      return [];
    }
  }
};

const getStorageKey = (projectId?: string, chainId?: string) => {
  return `chat-store-${projectId || 'default'}-${chainId || 'default'}`;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      inputValue: '',
      currentRender: null,
      isGenerating: false,
      progress: 0,

      // Actions
      setMessages: (messages) => {
        logger.log('📝 ChatStore: Setting messages', { count: messages.length });
        // ✅ FIX: Normalize timestamps to Date objects
        const normalizedMessages = messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
        }));
        set({ messages: normalizedMessages });
      },

      addMessage: (message) => {
        logger.log('➕ ChatStore: Adding message', { id: message.id, type: message.type });
        // ✅ FIX: Normalize timestamp to Date object
        const normalizedMessage = {
          ...message,
          timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
        };
        set((state) => ({
          messages: [...state.messages, normalizedMessage]
        }));
      },

      updateMessage: (id, updates) => {
        logger.log('🔄 ChatStore: Updating message', { id, updates: Object.keys(updates) });
        set((state) => ({
          messages: state.messages.map(msg => {
            if (msg.id === id) {
              const updated = { ...msg, ...updates };
              // ✅ FIX: Normalize timestamp if it was updated
              if (updates.timestamp) {
                updated.timestamp = updates.timestamp instanceof Date 
                  ? updates.timestamp 
                  : new Date(updates.timestamp);
              }
              return updated;
            }
            return msg;
          })
        }));
      },

      removeMessage: (id) => {
        logger.log('➖ ChatStore: Removing message', { id });
        set((state) => ({
          messages: state.messages.filter(msg => msg.id !== id)
        }));
      },

      setInputValue: (value) => {
        set({ inputValue: value });
      },

      setCurrentRender: (render) => {
        logger.log('🎨 ChatStore: Setting current render', { 
          renderId: render?.id, 
          status: render?.status 
        });
        set({ currentRender: render });
      },

      setIsGenerating: (value) => {
        logger.log('⚙️ ChatStore: Setting isGenerating', { value });
        set({ isGenerating: value });
      },

      setProgress: (value) => {
        set({ progress: value });
      },

      clearMessages: () => {
        logger.log('🗑️ ChatStore: Clearing messages');
        set({ messages: [] });
      },

      resetChat: () => {
        logger.log('🔄 ChatStore: Resetting chat');
        set({
          messages: [],
          inputValue: '',
          currentRender: null,
          isGenerating: false,
          progress: 0,
        });
      },
    }),
    {
      name: 'chat-store-default', // Default name, will be overridden per instance
      storage: createJSONStorage(() => getSafeStorage()),
      onRehydrateStorage: () => (state) => {
        // ✅ FIX: Normalize timestamps when rehydrating from localStorage
        if (state?.messages) {
          state.messages = state.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date 
              ? msg.timestamp 
              : new Date(msg.timestamp)
          }));
        }
      },
      partialize: (state) => ({
        // Only persist messages and inputValue
        // Messages will be serialized by Zustand's default JSON.stringify
        // Note: File objects in uploadedImage won't be persisted (expected)
        messages: state.messages.map(msg => ({
          ...msg,
          // Convert Date to ISO string for persistence
          timestamp: msg.timestamp instanceof Date 
            ? msg.timestamp.toISOString() 
            : typeof msg.timestamp === 'string' 
              ? msg.timestamp 
              : new Date(msg.timestamp).toISOString(),
          // Remove File objects before persisting
          uploadedImage: msg.uploadedImage ? {
            previewUrl: msg.uploadedImage.previewUrl,
            persistedUrl: msg.uploadedImage.persistedUrl
          } : undefined
        })),
        inputValue: state.inputValue,
        // Don't persist: currentRender, isGenerating, progress (ephemeral state)
      }),
    }
  )
);

// Factory function to create a scoped store instance per project/chain
// This allows multiple chat instances to have separate state
export const createChatStore = (projectId: string, chainId?: string) => {
  const storageKey = getStorageKey(projectId, chainId);
  
  return create<ChatState>()(
    persist(
      (set, get) => ({
        messages: [],
        inputValue: '',
        currentRender: null,
        isGenerating: false,
        progress: 0,

        setMessages: (messages) => {
          logger.log('📝 ChatStore: Setting messages', { count: messages.length, projectId, chainId });
          // ✅ FIX: Normalize timestamps to Date objects
          const normalizedMessages = messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
          }));
          set({ messages: normalizedMessages });
        },

        addMessage: (message) => {
          logger.log('➕ ChatStore: Adding message', { id: message.id, type: message.type, projectId, chainId });
          // ✅ FIX: Normalize timestamp to Date object
          const normalizedMessage = {
            ...message,
            timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
          };
          set((state) => ({
            messages: [...state.messages, normalizedMessage]
          }));
        },

        updateMessage: (id, updates) => {
          logger.log('🔄 ChatStore: Updating message', { id, updates: Object.keys(updates), projectId, chainId });
          set((state) => ({
            messages: state.messages.map(msg => {
              if (msg.id === id) {
                const updated = { ...msg, ...updates };
                // ✅ FIX: Normalize timestamp if it was updated
                if (updates.timestamp) {
                  updated.timestamp = updates.timestamp instanceof Date 
                    ? updates.timestamp 
                    : new Date(updates.timestamp);
                }
                return updated;
              }
              return msg;
            })
          }));
        },

        removeMessage: (id) => {
          logger.log('➖ ChatStore: Removing message', { id, projectId, chainId });
          set((state) => ({
            messages: state.messages.filter(msg => msg.id !== id)
          }));
        },

        setInputValue: (value) => {
          set({ inputValue: value });
        },

        setCurrentRender: (render) => {
          logger.log('🎨 ChatStore: Setting current render', { 
            renderId: render?.id, 
            status: render?.status,
            projectId,
            chainId
          });
          set({ currentRender: render });
        },

        setIsGenerating: (value) => {
          logger.log('⚙️ ChatStore: Setting isGenerating', { value, projectId, chainId });
          set({ isGenerating: value });
        },

        setProgress: (value) => {
          set({ progress: value });
        },

        clearMessages: () => {
          logger.log('🗑️ ChatStore: Clearing messages', { projectId, chainId });
          set({ messages: [] });
        },

        resetChat: () => {
          logger.log('🔄 ChatStore: Resetting chat', { projectId, chainId });
          set({
            messages: [],
            inputValue: '',
            currentRender: null,
            isGenerating: false,
            progress: 0,
          });
        },
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => getSafeStorage()),
        onRehydrateStorage: () => (state) => {
          // ✅ FIX: Normalize timestamps when rehydrating from localStorage
          if (state?.messages) {
            state.messages = state.messages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp instanceof Date 
                ? msg.timestamp 
                : new Date(msg.timestamp)
            }));
          }
        },
        partialize: (state) => ({
          messages: state.messages.map(msg => ({
            ...msg,
            // Convert Date to ISO string for persistence
            timestamp: msg.timestamp instanceof Date 
              ? msg.timestamp.toISOString() 
              : typeof msg.timestamp === 'string' 
                ? msg.timestamp 
                : new Date(msg.timestamp).toISOString(),
            // Remove File objects before persisting
            uploadedImage: msg.uploadedImage ? {
              previewUrl: msg.uploadedImage.previewUrl,
              persistedUrl: msg.uploadedImage.persistedUrl
            } : undefined
          })),
          inputValue: state.inputValue,
        }),
      }
    )
  );
};

