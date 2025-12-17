'use client';

import { useEffect, useState } from 'react';
import { Type, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface GalleryItem {
  render?: {
    prompt?: string;
    outputUrl?: string | null;
    status?: string;
  };
}

interface NodeEditorPreviewProps {
  galleryItems?: GalleryItem[];
}

export function NodeEditorPreview({ galleryItems = [] }: NodeEditorPreviewProps) {
  const [typedPrompt, setTypedPrompt] = useState('');
  const [showImage, setShowImage] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(undefined);

  // Filter items that have both prompt and image
  const validItems = galleryItems.filter(
    item => item.render?.prompt && item.render?.outputUrl && item.render?.status === 'completed'
  ).slice(0, 10); // Take latest 10

  // Get current item
  const currentItem = validItems.length > 0 
    ? validItems[currentIndex % validItems.length]
    : null;

  const displayPrompt = currentItem?.render?.prompt || 'Modern minimalist architecture with floor-to-ceiling windows, natural lighting, Scandinavian design';
  
  // Update image URL when item changes and reset image state
  useEffect(() => {
    if (currentItem?.render?.outputUrl) {
      setCurrentImageUrl(currentItem.render.outputUrl);
      setShowImage(false);
      setImageLoading(false);
    }
  }, [currentItem]);

  // Node colors matching base-node.tsx
  const textNodeColor = '#6bcf33';
  const imageNodeColor = '#4a9eff';

  useEffect(() => {
    if (validItems.length === 0) return;

    let typingInterval: NodeJS.Timeout | null = null;
    let loadingTimeout: NodeJS.Timeout | null = null;
    let imageTimeout: NodeJS.Timeout | null = null;
    let resetTimeout: NodeJS.Timeout | null = null;

    const startAnimation = () => {
      // Get current item - ensure we use the current index
      const itemIndex = currentIndex % validItems.length;
      const currentItem = validItems[itemIndex];
      const prompt = currentItem?.render?.prompt || '';
      const imageUrl = currentItem?.render?.outputUrl || undefined;
      
      // Reset state
      setTypedPrompt('');
      setShowImage(false);
      setImageLoading(false);

      // Typing animation
      let charIndex = 0;
      typingInterval = setInterval(() => {
        if (charIndex < prompt.length) {
          setTypedPrompt(prompt.slice(0, charIndex + 1));
          charIndex++;
        } else {
          if (typingInterval) clearInterval(typingInterval);
          // After typing completes, wait a bit then show image loading
          loadingTimeout = setTimeout(() => {
            setImageLoading(true);
            // After loading animation, show the image (using the same item's image)
            imageTimeout = setTimeout(() => {
              setImageLoading(false);
              setShowImage(true);
              // After showing image, move to next item and restart animation
              resetTimeout = setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % validItems.length);
              }, 4000);
            }, 2000);
          }, 800);
        }
      }, 25); // Typing speed
    };

    // Start animation when currentIndex changes
    startAnimation();

    // Cleanup
    return () => {
      if (typingInterval) clearInterval(typingInterval);
      if (loadingTimeout) clearTimeout(loadingTimeout);
      if (imageTimeout) clearTimeout(imageTimeout);
      if (resetTimeout) clearTimeout(resetTimeout);
    };
  }, [currentIndex, validItems]);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}></div>

      {/* Nodes Container */}
      <div className="relative z-10 flex items-center gap-16">
        {/* Text Node - Matching BaseNode structure */}
        <div className="relative" style={{ overflow: 'visible' }}>
          <div 
            className="w-80 bg-card border-2 shadow-lg rounded-lg relative"
            style={{ borderColor: textNodeColor, zIndex: 10, overflow: 'visible' }}
          >
            {/* Header - Matching BaseNode header */}
            <div 
              className="px-3 py-2 border-b-2 flex items-center justify-between rounded-t-lg"
              style={{ 
                backgroundColor: `${textNodeColor}20`,
                borderColor: textNodeColor,
              }}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Type className="h-3.5 w-3.5 flex-shrink-0" style={{ color: textNodeColor }} />
                <span className="text-xs font-semibold truncate" style={{ color: textNodeColor }}>Text Node</span>
              </div>
            </div>

            {/* Content Container */}
            <div className="p-3 space-y-2 relative" style={{ overflow: 'visible' }}>
              <div className="min-h-[100px] text-sm text-foreground leading-relaxed font-mono bg-background p-2 rounded border" style={{ borderColor: `${textNodeColor}40` }}>
                {typedPrompt}
                {typedPrompt.length < displayPrompt.length && (
                  <span className="inline-block w-0.5 h-4 bg-foreground ml-0.5 animate-pulse align-middle">|</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {typedPrompt.length} characters
              </div>
            </div>
          </div>
          
          {/* Output Handle - Right side, matching BaseNode handle style */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              right: '-6px',
              width: '12px',
              height: '12px',
              backgroundColor: textNodeColor,
              borderColor: textNodeColor,
              zIndex: 10,
            }}
            title="Text"
          />
        </div>

        {/* Curved Connection Line - Using Bezier path like React Flow */}
        <div className="relative w-24 h-20 flex items-center justify-center">
          <svg
            width="96"
            height="40"
            viewBox="0 0 96 40"
            className="absolute"
            style={{ overflow: 'visible' }}
          >
            {/* Bezier curve path matching React Flow's getBezierPath */}
            <path
              d="M 0 20 C 24 20, 24 20, 48 20 C 72 20, 72 20, 96 20"
              fill="none"
              stroke={textNodeColor}
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.6"
            />
            {/* Animated dot moving along the path */}
            <circle
              r="3"
              fill={textNodeColor}
            >
              <animateMotion
                dur="1.5s"
                repeatCount="indefinite"
                path="M 0 20 C 24 20, 24 20, 48 20 C 72 20, 72 20, 96 20"
              />
            </circle>
          </svg>
        </div>

        {/* Image Node - Matching BaseNode structure */}
        <div className="relative" style={{ overflow: 'visible' }}>
          <div 
            className="w-80 bg-card border-2 shadow-lg rounded-lg relative"
            style={{ borderColor: imageNodeColor, zIndex: 10, overflow: 'visible' }}
          >
            {/* Header - Matching BaseNode header */}
            <div 
              className="px-3 py-2 border-b-2 flex items-center justify-between rounded-t-lg"
              style={{ 
                backgroundColor: `${imageNodeColor}20`,
                borderColor: imageNodeColor,
              }}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <ImageIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: imageNodeColor }} />
                <span className="text-xs font-semibold truncate" style={{ color: imageNodeColor }}>Image Generator</span>
              </div>
            </div>

            {/* Content Container */}
            <div className="p-3 space-y-2 relative" style={{ overflow: 'visible' }}>
              {/* Image Preview Area */}
              <div className="relative aspect-video bg-muted rounded border overflow-hidden" style={{ borderColor: `${imageNodeColor}40` }}>
                {imageLoading ? (
                  <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin mb-3" style={{ color: imageNodeColor }} />
                    <p className="text-xs text-muted-foreground">Generating image...</p>
                  </div>
                ) : showImage && currentImageUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={currentImageUrl}
                      alt="Generated render"
                      fill
                      className="object-cover"
                      sizes="(max-width: 320px) 100vw, 320px"
                      unoptimized
                    />
                  </div>
                ) : showImage ? (
                  <div className="w-full h-full bg-gradient-to-br from-muted via-muted/50 to-muted flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-2 bg-foreground/5 rounded-lg flex items-center justify-center border border-border">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Image Generated</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-16 h-16 mx-auto mb-2 bg-muted/50 rounded-lg flex items-center justify-center border border-border">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs text-muted-foreground">Waiting for prompt...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Input Handle - Left side, matching BaseNode handle style */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              left: '-6px',
              width: '12px',
              height: '12px',
              backgroundColor: imageNodeColor,
              borderColor: imageNodeColor,
              zIndex: 10,
              transform: 'translateY(-50%) scaleX(-1)', // Mirror for input handle
            }}
            title="Text"
          />
        </div>
      </div>
    </div>
  );
}
