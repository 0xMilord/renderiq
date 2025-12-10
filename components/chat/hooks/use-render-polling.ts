'use client';

import { useEffect, useRef, useCallback } from 'react';
import { POLLING_INTERVAL } from '@/lib/constants/chat-constants';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';

const refreshThrottleMs = 3000; // Minimum 3 seconds between refreshes

export function useRenderPolling(
  chainId: string | undefined,
  chain: RenderChainWithRenders | undefined,
  onRefreshChain?: () => void,
  isGenerating?: boolean,
  isImageGenerating?: boolean,
  isVideoGenerating?: boolean,
  isRecovering?: boolean,
  recentGenerationRef?: React.MutableRefObject<{ timestamp: number; renderId?: string } | null>,
  isVisibleRef?: React.MutableRefObject<boolean>,
  hasProcessingRendersRef?: React.MutableRefObject<boolean>
) {
  const lastRefreshTimeRef = useRef<number>(0);
  const chainRef = useRef(chain);

  // Update chain ref when chain changes
  useEffect(() => {
    chainRef.current = chain;
  }, [chain]);

  // Throttled refresh function
  const throttledRefresh = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    
    if (timeSinceLastRefresh >= refreshThrottleMs) {
      lastRefreshTimeRef.current = now;
      onRefreshChain?.();
    }
  }, [onRefreshChain]);

  // Consolidated polling logic
  useEffect(() => {
    if (!chainId || !onRefreshChain) return;
    
    // Use a single interval that checks refs, not closure values
    // This prevents recreating the interval on every chain.renders change
    let pollInterval: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      if (pollInterval) return; // Already polling
      
      pollInterval = setInterval(() => {
        // Check refs to avoid stale closures
        if (isVisibleRef && !isVisibleRef.current) {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          return;
        }
        
        // Get latest chain from ref, not closure
        const currentChain = chainRef.current;
        const hasProcessingInDB = currentChain?.renders?.some(r => 
          r.status === 'processing' || r.status === 'pending'
        ) || false;
        
        const recentGen = recentGenerationRef?.current;
        const shouldContinue = recentGen && 
          (Date.now() - recentGen.timestamp < 30000);
        
        // Check if the recent generation render is now in the database
        if (recentGen?.renderId && currentChain?.renders) {
          const renderInDB = currentChain.renders.find(r => r.id === recentGen.renderId);
          if (renderInDB && renderInDB.status === 'completed') {
            // Render is now in DB, clear recent generation tracking
            if (recentGenerationRef) {
              recentGenerationRef.current = null;
            }
          }
        }
        
        // Check if we should continue polling
        const hasProcessing = hasProcessingRendersRef?.current || false;
        if (!hasProcessingInDB && !shouldContinue && !hasProcessing) {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          return;
        }
        
        // Use throttled refresh to prevent excessive calls
        throttledRefresh();
      }, POLLING_INTERVAL);
    };
    
    // Start polling if we have processing renders
    const currentChain = chainRef.current;
    const hasProcessingInDB = currentChain?.renders?.some(r => 
      r.status === 'processing' || r.status === 'pending'
    ) || false;
    
    const hasLocalGeneration = isGenerating || isImageGenerating || isVideoGenerating || isRecovering;
    const recentGeneration = recentGenerationRef?.current;
    const shouldContinuePolling = recentGeneration && 
      (Date.now() - (recentGeneration.timestamp || 0) < 30000);
    
    const hasProcessing = hasProcessingInDB || hasLocalGeneration || shouldContinuePolling;
    if (hasProcessingRendersRef) {
      hasProcessingRendersRef.current = hasProcessing;
    }
    
    if (hasProcessing) {
      startPolling();
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  }, [chainId, throttledRefresh, isGenerating, isImageGenerating, isVideoGenerating, isRecovering, recentGenerationRef, isVisibleRef, hasProcessingRendersRef, onRefreshChain]);

  // Update processing ref when state changes (separate effect)
  useEffect(() => {
    const hasProcessing = chain?.renders?.some(r => 
      r.status === 'processing' || r.status === 'pending'
    ) || isGenerating || isImageGenerating || isVideoGenerating || isRecovering;
    
    if (hasProcessingRendersRef) {
      hasProcessingRendersRef.current = hasProcessing;
    }
  }, [chain?.renders, isGenerating, isImageGenerating, isVideoGenerating, isRecovering, hasProcessingRendersRef]);
}

