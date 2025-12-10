'use client';

import { useReducer, useCallback, useRef } from 'react';
import type { ChatState, ChatAction, Message } from '../types/chat-types';
import type { Render } from '@/lib/types/render';

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
        )
      };
    case 'SET_INPUT_VALUE':
      return { ...state, inputValue: action.payload };
    case 'SET_CURRENT_RENDER':
      return { ...state, currentRender: action.payload };
    case 'SET_IS_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    default:
      return state;
  }
};

export function useChatState() {
  const messagesRef = useRef<Message[]>([]);
  
  const [chatState, dispatchChat] = useReducer(chatReducer, {
    messages: [],
    inputValue: '',
    currentRender: null,
    isGenerating: false,
    progress: 0,
  });

  // Extract for easier access
  const messages = chatState.messages;
  const inputValue = chatState.inputValue;
  const currentRender = chatState.currentRender;
  const isGenerating = chatState.isGenerating;
  const progress = chatState.progress;

  // Wrapper functions for backward compatibility
  const setMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    const newMessages = typeof updater === 'function' ? updater(chatState.messages) : updater;
    dispatchChat({ type: 'SET_MESSAGES', payload: newMessages });
    messagesRef.current = newMessages; // Keep ref in sync
  }, [chatState.messages]);

  const setInputValue = useCallback((value: string) => {
    dispatchChat({ type: 'SET_INPUT_VALUE', payload: value });
  }, []);

  const setCurrentRender = useCallback((updater: Render | null | ((prev: Render | null) => Render | null)) => {
    const newRender = typeof updater === 'function' ? updater(chatState.currentRender) : updater;
    dispatchChat({ type: 'SET_CURRENT_RENDER', payload: newRender });
  }, [chatState.currentRender]);

  const setIsGenerating = useCallback((value: boolean) => {
    dispatchChat({ type: 'SET_IS_GENERATING', payload: value });
  }, []);

  const setProgress = useCallback((value: number) => {
    dispatchChat({ type: 'SET_PROGRESS', payload: value });
  }, []);

  return {
    // State
    messages,
    inputValue,
    currentRender,
    isGenerating,
    progress,
    // Setters
    setMessages,
    setInputValue,
    setCurrentRender,
    setIsGenerating,
    setProgress,
    // Direct access for advanced use cases
    dispatchChat,
    chatState,
    messagesRef,
  };
}

