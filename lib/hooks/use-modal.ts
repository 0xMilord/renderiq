import { useState, useCallback } from 'react';

type ModalType = 
  | 'upload' 
  | 'gallery' 
  | 'lowBalance' 
  | 'projectRules' 
  | 'mentionTagger' 
  | 'upgrade';

interface ModalState {
  upload: boolean;
  gallery: boolean;
  lowBalance: boolean;
  projectRules: boolean;
  mentionTagger: boolean;
  upgrade: boolean;
}

/**
 * Custom hook to manage multiple modal states
 * Consolidates all modal open/close logic
 */
export function useModal() {
  const [modals, setModals] = useState<ModalState>({
    upload: false,
    gallery: false,
    lowBalance: false,
    projectRules: false,
    mentionTagger: false,
    upgrade: false,
  });

  const openModal = useCallback((type: ModalType) => {
    setModals(prev => ({ ...prev, [type]: true }));
  }, []);

  const closeModal = useCallback((type: ModalType) => {
    setModals(prev => ({ ...prev, [type]: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({
      upload: false,
      gallery: false,
      lowBalance: false,
      projectRules: false,
      mentionTagger: false,
      upgrade: false,
    });
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    // Individual modal states for convenience
    isUploadModalOpen: modals.upload,
    isGalleryModalOpen: modals.gallery,
    isLowBalanceModalOpen: modals.lowBalance,
    isProjectRulesModalOpen: modals.projectRules,
    isMentionTaggerOpen: modals.mentionTagger,
    isUpgradeDialogOpen: modals.upgrade,
    // Individual setters for backward compatibility
    setIsUploadModalOpen: (open: boolean) => setModals(prev => ({ ...prev, upload: open })),
    setIsGalleryModalOpen: (open: boolean) => setModals(prev => ({ ...prev, gallery: open })),
    setIsLowBalanceModalOpen: (open: boolean) => setModals(prev => ({ ...prev, lowBalance: open })),
    setIsProjectRulesModalOpen: (open: boolean) => setModals(prev => ({ ...prev, projectRules: open })),
    setIsMentionTaggerOpen: (open: boolean) => setModals(prev => ({ ...prev, mentionTagger: open })),
    setIsUpgradeDialogOpen: (open: boolean) => setModals(prev => ({ ...prev, upgrade: open })),
  };
}

