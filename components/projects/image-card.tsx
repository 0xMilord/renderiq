'use client';

import React from 'react';
import { CommonImageCard } from '@/components/common/image-card';
import type { Render } from '@/lib/types/render';

interface ImageCardProps {
  render: Render;
  viewMode: 'default' | 'compact' | 'list';
  onView?: (render: Render) => void;
  onDownload?: (render: Render) => void;
  onLike?: (render: Render) => void;
  onShare?: (render: Render) => void;
  onRemix?: (render: Render) => void;
}

function ImageCardComponent({ 
  render, 
  viewMode, 
  onView, 
  onDownload, 
  onLike, 
  onShare,
  onRemix
}: ImageCardProps) {
  return (
    <CommonImageCard
      render={render}
      viewMode={viewMode}
      onView={onView}
      onDownload={onDownload}
      onLike={onLike}
      onShare={onShare}
      onRemix={onRemix}
      showUser={false}
      showStats={false}
      showActions={true}
    />
  );
}

// Memoize component to prevent unnecessary re-renders
export const ImageCard = React.memo(ImageCardComponent);
