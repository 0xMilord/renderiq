import type { Render } from '@/lib/types/render';

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

export interface ChatState {
  messages: Message[];
  inputValue: string;
  currentRender: Render | null;
  isGenerating: boolean;
  progress: number;
}

export type ChatAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<Message> } }
  | { type: 'SET_INPUT_VALUE'; payload: string }
  | { type: 'SET_CURRENT_RENDER'; payload: Render | null }
  | { type: 'SET_IS_GENERATING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number };

