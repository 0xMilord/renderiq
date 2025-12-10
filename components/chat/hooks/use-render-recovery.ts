'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';

export function useRenderRecovery(chainId: string | undefined, chain: RenderChainWithRenders | undefined, onRefreshChain?: () => void, initializedChainIdRef?: React.MutableRefObject<string | undefined>, isVisibleRef?: React.MutableRefObject<boolean>) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryRenderId, setRecoveryRenderId] = useState<string | null>(null);

  // Network recovery - check for processing renders on mount
  useEffect(() => {
    if (!chainId || !onRefreshChain || !isVisibleRef?.current) return;
    
    // Only check on mount or when chainId changes, not on every chain.renders update
    const currentChainId = chainId || chain?.id;
    if (initializedChainIdRef && initializedChainIdRef.current !== currentChainId) {
      return; // Will be handled by initialization effect
    }
    
    // Check for processing renders that might have been interrupted
    const processingRenders = chain?.renders?.filter(r => 
      (r.status === 'processing' || r.status === 'pending') && 
      r.chainId === chainId
    ) || [];
    
    if (processingRenders.length > 0) {
      const latestProcessing = processingRenders[processingRenders.length - 1];
      logger.log('🔄 Network recovery: Found processing render', {
        renderId: latestProcessing.id,
        status: latestProcessing.status
      });
      
      setIsRecovering(true);
      setRecoveryRenderId(latestProcessing.id);
    } else {
      setIsRecovering(false);
      setRecoveryRenderId(null);
    }
  }, [chainId, chain?.renders, onRefreshChain, initializedChainIdRef, isVisibleRef]);
  
  // Clear recovery state when render completes
  useEffect(() => {
    if (recoveryRenderId && chain?.renders) {
      const recoveredRender = chain.renders.find(r => r.id === recoveryRenderId);
      if (recoveredRender && recoveredRender.status === 'completed') {
        logger.log('✅ Network recovery: Render completed', {
          renderId: recoveryRenderId
        });
        setIsRecovering(false);
        setRecoveryRenderId(null);
        toast.success('Render completed successfully!');
      } else if (recoveredRender && recoveredRender.status === 'failed') {
        logger.log('❌ Network recovery: Render failed', {
          renderId: recoveryRenderId
        });
        setIsRecovering(false);
        setRecoveryRenderId(null);
      }
    }
  }, [recoveryRenderId, chain?.renders]);

  return {
    isRecovering,
    recoveryRenderId,
    setIsRecovering,
    setRecoveryRenderId,
  };
}

