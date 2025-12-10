'use client';

import { create } from 'zustand';
import { logger } from '@/lib/utils/logger';
import type { Render } from '@/lib/db/schema';
import type { LimitType } from '@/lib/services/plan-limits.service';

export interface LimitDialogData {
  limitType: LimitType;
  current: number;
  limit: number | null;
  planName: string;
  message?: string;
}

interface ModalState {
  // Modal visibility
  isImageModalOpen: boolean;
  isProjectEditModalOpen: boolean;
  isProjectDuplicateModalOpen: boolean;
  isProjectDeleteDialogOpen: boolean;
  isUploadModalOpen: boolean;
  isGalleryModalOpen: boolean;
  isPromptGalleryOpen: boolean;
  isPromptBuilderOpen: boolean;
  limitDialogOpen: boolean;
  
  // Modal data
  selectedRender: Render | null;
  limitDialogData: LimitDialogData | null;
  
  // Actions
  openImageModal: (render: Render) => void;
  closeImageModal: () => void;
  openProjectEditModal: () => void;
  closeProjectEditModal: () => void;
  openProjectDuplicateModal: () => void;
  closeProjectDuplicateModal: () => void;
  openProjectDeleteDialog: () => void;
  closeProjectDeleteDialog: () => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openGalleryModal: () => void;
  closeGalleryModal: () => void;
  openPromptGallery: () => void;
  closePromptGallery: () => void;
  openPromptBuilder: () => void;
  closePromptBuilder: () => void;
  openLimitDialog: (data: LimitDialogData) => void;
  closeLimitDialog: () => void;
  closeAllModals: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  // Initial state
  isImageModalOpen: false,
  isProjectEditModalOpen: false,
  isProjectDuplicateModalOpen: false,
  isProjectDeleteDialogOpen: false,
  isUploadModalOpen: false,
  isGalleryModalOpen: false,
  isPromptGalleryOpen: false,
  isPromptBuilderOpen: false,
  limitDialogOpen: false,
  selectedRender: null,
  limitDialogData: null,

  // Actions
  openImageModal: (render) => {
    logger.log('🖼️ ModalStore: Opening image modal', { renderId: render.id });
    set({ 
      isImageModalOpen: true,
      selectedRender: render
    });
  },

  closeImageModal: () => {
    logger.log('🖼️ ModalStore: Closing image modal');
    set({ 
      isImageModalOpen: false,
      selectedRender: null
    });
  },

  openProjectEditModal: () => {
    logger.log('📝 ModalStore: Opening project edit modal');
    set({ isProjectEditModalOpen: true });
  },

  closeProjectEditModal: () => {
    logger.log('📝 ModalStore: Closing project edit modal');
    set({ isProjectEditModalOpen: false });
  },

  openProjectDuplicateModal: () => {
    logger.log('📋 ModalStore: Opening project duplicate modal');
    set({ isProjectDuplicateModalOpen: true });
  },

  closeProjectDuplicateModal: () => {
    logger.log('📋 ModalStore: Closing project duplicate modal');
    set({ isProjectDuplicateModalOpen: false });
  },

  openProjectDeleteDialog: () => {
    logger.log('🗑️ ModalStore: Opening project delete dialog');
    set({ isProjectDeleteDialogOpen: true });
  },

  closeProjectDeleteDialog: () => {
    logger.log('🗑️ ModalStore: Closing project delete dialog');
    set({ isProjectDeleteDialogOpen: false });
  },

  openUploadModal: () => {
    logger.log('📤 ModalStore: Opening upload modal');
    set({ isUploadModalOpen: true });
  },

  closeUploadModal: () => {
    logger.log('📤 ModalStore: Closing upload modal');
    set({ isUploadModalOpen: false });
  },

  openGalleryModal: () => {
    logger.log('🖼️ ModalStore: Opening gallery modal');
    set({ isGalleryModalOpen: true });
  },

  closeGalleryModal: () => {
    logger.log('🖼️ ModalStore: Closing gallery modal');
    set({ isGalleryModalOpen: false });
  },

  openPromptGallery: () => {
    logger.log('💬 ModalStore: Opening prompt gallery');
    set({ isPromptGalleryOpen: true });
  },

  closePromptGallery: () => {
    logger.log('💬 ModalStore: Closing prompt gallery');
    set({ isPromptGalleryOpen: false });
  },

  openPromptBuilder: () => {
    logger.log('🔨 ModalStore: Opening prompt builder');
    set({ isPromptBuilderOpen: true });
  },

  closePromptBuilder: () => {
    logger.log('🔨 ModalStore: Closing prompt builder');
    set({ isPromptBuilderOpen: false });
  },

  openLimitDialog: (data) => {
    logger.log('⚠️ ModalStore: Opening limit dialog', { limitType: data.limitType });
    set({ 
      limitDialogOpen: true,
      limitDialogData: data
    });
  },

  closeLimitDialog: () => {
    logger.log('⚠️ ModalStore: Closing limit dialog');
    set({ 
      limitDialogOpen: false,
      limitDialogData: null
    });
  },

  closeAllModals: () => {
    logger.log('🚪 ModalStore: Closing all modals');
    set({
      isImageModalOpen: false,
      isProjectEditModalOpen: false,
      isProjectDuplicateModalOpen: false,
      isProjectDeleteDialogOpen: false,
      isUploadModalOpen: false,
      isGalleryModalOpen: false,
      isPromptGalleryOpen: false,
      isPromptBuilderOpen: false,
      limitDialogOpen: false,
      selectedRender: null,
      limitDialogData: null,
    });
  },
}));

