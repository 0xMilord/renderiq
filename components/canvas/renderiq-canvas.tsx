'use client';

import { Tldraw, createShapeId, DefaultToolbar, TLComponents, AssetRecordType, TLAssetStore, TldrawOverlays, TLUiOverrides, useTools, useIsToolSelected, TldrawUiMenuItem, DefaultToolbarContent, DefaultKeyboardShortcutsDialog, DefaultKeyboardShortcutsDialogContent, DefaultColorThemePalette } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { getAssetUrlsByMetaUrl } from '@tldraw/assets/urls';
import { useEffect, useRef, useState, useMemo } from 'react';
import type { Editor } from '@tldraw/tldraw';
import type { TLAssetId } from '@tldraw/tlschema';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRenderiqCanvas } from '@/lib/hooks/use-renderiq-canvas';
import { useRenderiqAgent } from '@/lib/hooks/use-renderiq-agent';
import type { Render } from '@/lib/types/render';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import { useProjectChainStore } from '@/lib/stores/project-chain-store';
import { useChatStore } from '@/lib/stores/chat-store';
import { LassoSelectTool } from './lasso-select-tool';
import { LassoSelectSvgComponent } from './lasso-overlay';
import { ContextualToolbar } from './contextual-toolbar';
import { TldrawAutoLayout } from '@/lib/canvas/tldraw-auto-layout';
import { GenerateVariantsDialog, type VariantGenerationConfig as VariantConfig } from './generate-variants-dialog';
import { GenerateDrawingDialog, type DrawingGenerationConfig } from './generate-drawing-dialog';
import { ImageToVideoDialog, type ImageToVideoConfig } from './image-to-video-dialog';
import { UpscaleDialog } from './upscale-dialog';
import { ContextHighlights } from '@/agent-kit/client/components/highlights/ContextHighlights';
import { GoToAgentButton } from '@/agent-kit/client/components/GoToAgentButton';

// Customize tldraw's default color palette to match Renderiq's green theme
// This must be done outside React lifecycle (at module level) before component renders
// Convert HSL to hex: Light mode primary = hsl(72, 90%, 35%) ≈ #4a7a1a, Dark mode = hsl(72, 87%, 62%) = #D1F24A

// Light mode - Use dark green (hsl(72, 90%, 35%) = #4a7a1a)
DefaultColorThemePalette.lightMode.blue.solid = '#4a7a1a'; // Primary green
DefaultColorThemePalette.lightMode.blue.semi = '#4a7a1a80'; // Primary green with transparency
DefaultColorThemePalette.lightMode.blue.pattern = '#4a7a1a'; // Primary green

// Also update other colors to green variants for consistency
DefaultColorThemePalette.lightMode.black.solid = '#2d5010'; // Darker green for black
DefaultColorThemePalette.lightMode.black.semi = '#2d501080';
DefaultColorThemePalette.lightMode.black.pattern = '#2d5010';

DefaultColorThemePalette.lightMode.green.solid = '#5a9a2a'; // Medium green
DefaultColorThemePalette.lightMode.green.semi = '#5a9a2a80';
DefaultColorThemePalette.lightMode.green.pattern = '#5a9a2a';

// Dark mode - Use neon green (hsl(72, 87%, 62%) = #D1F24A)
DefaultColorThemePalette.darkMode.blue.solid = '#D1F24A'; // Neon green primary
DefaultColorThemePalette.darkMode.blue.semi = '#D1F24A80'; // Neon green with transparency
DefaultColorThemePalette.darkMode.blue.pattern = '#D1F24A'; // Neon green

DefaultColorThemePalette.darkMode.black.solid = '#A8D13A'; // Lighter neon green for black
DefaultColorThemePalette.darkMode.black.semi = '#A8D13A80';
DefaultColorThemePalette.darkMode.black.pattern = '#A8D13A';

DefaultColorThemePalette.darkMode.green.solid = '#B8E24A'; // Bright green
DefaultColorThemePalette.darkMode.green.semi = '#B8E24A80';
DefaultColorThemePalette.darkMode.green.pattern = '#B8E24A';

interface RenderiqCanvasProps {
  currentRender: Render | null;
  chainId?: string;
  onRenderAdded?: (render: Render) => void;
  className?: string;
  isGenerating?: boolean; // Show loading frame on canvas when generating
  generatingPrompt?: string; // Prompt being generated (for frame label)
  chainRenders?: Render[]; // All renders in the chain (for loading previous renders onto canvas)
  onGenerateFromSelection?: (prompt: string, selectedRenderIds: string[]) => void; // Callback for contextual toolbar generation
  onGenerateVariants?: (config: VariantConfig, selectedRenderIds: string[]) => void; // Callback for variant generation
  onGenerateDrawing?: (config: DrawingGenerationConfig, selectedRenderIds: string[]) => void; // Callback for drawing generation
  onImageToVideo?: (config: ImageToVideoConfig, selectedRenderIds: string[]) => void; // Callback for image to video
}

// Re-export VariantGenerationConfig for convenience
export type VariantGenerationConfig = VariantConfig;

/**
 * Renderiq Canvas Component
 * Integrates tldraw canvas for Figma-like editing experience
 * Reuses existing infrastructure: hooks, actions, services
 */
export function RenderiqCanvas({
  currentRender,
  chainId,
  onRenderAdded,
  className,
  isGenerating = false,
  generatingPrompt,
  chainRenders = [],
  onGenerateFromSelection,
  onGenerateVariants,
  onGenerateDrawing,
  onImageToVideo,
}: RenderiqCanvasProps) {
  
  const [variantsDialogOpen, setVariantsDialogOpen] = useState(false);
  const [selectedRenderIdsForVariants, setSelectedRenderIdsForVariants] = useState<string[]>([]);
  const [drawingDialogOpen, setDrawingDialogOpen] = useState(false);
  const [selectedRenderIdsForDrawing, setSelectedRenderIdsForDrawing] = useState<string[]>([]);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedRenderIdsForVideo, setSelectedRenderIdsForVideo] = useState<string[]>([]);
  const [upscaleDialogOpen, setUpscaleDialogOpen] = useState(false);
  const [selectedRenderIdsForUpscale, setSelectedRenderIdsForUpscale] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme, systemTheme } = useTheme();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  
  // ✅ NEW: Get chainId and currentRender from stores (primary source, props as fallback)
  const { selectedChainId, chains } = useProjectChainStore();
  const storeCurrentRender = useChatStore((state) => state.currentRender);
  const storeChain = chains.find(c => c.id === selectedChainId);
  
  // Use store values as primary, fallback to props for backward compatibility
  const effectiveChainId = selectedChainId || chainId;
  const effectiveCurrentRender = storeCurrentRender || currentRender;
  const effectiveChainRenders = storeChain?.renders || chainRenders;
  
  const { editor, setEditor, isLoading } = useRenderiqCanvas({
    chainId: effectiveChainId,
    currentRenderId: effectiveCurrentRender?.id,
    autoSave: true,
  });

  // ✅ NEW: Get projectId from chain
  const effectiveProjectId = storeChain?.projectId || null;
  
  // ✅ NEW: Initialize agent for canvas manipulation
  const { agent, isAgentGenerating } = useRenderiqAgent({
    editor,
    chainId: effectiveChainId,
    projectId: effectiveProjectId,
    currentRender: effectiveCurrentRender,
    enabled: true,
  });

  // Detect theme changes and mount state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if dark mode is active
  // resolvedTheme is 'dark' | 'light' | undefined (when system)
  // theme is 'dark' | 'light' | 'system'
  const isDarkMode = mounted && (resolvedTheme === 'dark' || (theme === 'system' && systemTheme === 'dark') || theme === 'dark');

  // Sync tldraw theme with app theme when it changes
  useEffect(() => {
    if (!editor || !mounted) return;

    // Update tldraw's color scheme to match app theme
    const tldrawColorScheme = isDarkMode ? 'dark' : 'light';
    const currentTldrawTheme = editor.user.getIsDarkMode();
    
    // Only update if different to avoid unnecessary updates
    if (currentTldrawTheme !== isDarkMode) {
      logger.log('🎨 RenderiqCanvas: Syncing tldraw theme', {
        appTheme: theme,
        resolvedTheme,
        isDarkMode,
        tldrawColorScheme,
        previousTldrawTheme: currentTldrawTheme
      });
      
      editor.user.updateUserPreferences({ 
        colorScheme: tldrawColorScheme 
      });
    }
  }, [editor, isDarkMode, mounted, theme, resolvedTheme]);

  // Configure tldraw asset URLs (for icons, fonts, translations)
  // For Next.js: Try bundler approach first, fall back to CDN defaults
  // CDN defaults work out of the box - bundling is optional for self-hosting
  const assetUrls = useMemo(() => {
    try {
      // Try to use bundled assets (works with Next.js/webpack)
      // If this fails, undefined will use CDN defaults which work perfectly
      if (typeof window !== 'undefined') {
        return getAssetUrlsByMetaUrl();
      }
      return undefined; // Server-side: use CDN
    } catch (error) {
      // Fall back to CDN defaults if bundling fails
      // This is perfectly fine - CDN is the default and works great
      logger.log('ℹ️ RenderiqCanvas: Using CDN asset defaults (recommended)', error);
      return undefined; // CDN defaults work perfectly
    }
  }, []);

  // Get license key from environment (optional - only for production/business license)
  const licenseKey = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    // Client-side only - Next.js exposes NEXT_PUBLIC_* env vars to client
    return process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY || undefined;
  }, []);

  // Configure UI overrides to add lasso tool and custom context menu
  const uiOverrides = useMemo<TLUiOverrides>(() => ({
    tools(editor, tools) {
      tools['lasso-select'] = {
        id: 'lasso-select',
        icon: 'color',
        label: 'Lasso Select',
        kbd: 'w',
        onSelect: () => {
          editor.setCurrentTool('lasso-select');
        },
      };
      return tools;
    },
    actions(editor, actions) {
      // Add custom "Iterate" action
      actions['generate-with-ai'] = {
        id: 'generate-with-ai',
        label: 'Iterate',
        icon: 'sparkles',
        kbd: undefined,
        readonlyOk: false,
        onSelect: () => {
          const selectedShapes = editor.getSelectedShapes();
          const imageShapes = selectedShapes.filter(s => s.type === 'image');
          if (imageShapes.length > 0 && onGenerateFromSelection) {
            // Get render IDs from selected image shapes
            const selectedRenderIds = imageShapes
              .map((shape) => shape.meta?.renderId as string | undefined)
              .filter((id): id is string => !!id);
            
            if (selectedRenderIds.length > 0) {
              logger.log('🎨 Context menu: Iterate clicked', {
                selectedRenderIds,
                shapeCount: imageShapes.length,
              });
              // Trigger with empty prompt - contextual toolbar will handle input
              onGenerateFromSelection('', selectedRenderIds);
            }
          }
        },
      };

      // Add custom "Generate Variants" action
      if (onGenerateVariants) {
        actions['generate-variants'] = {
          id: 'generate-variants',
          label: 'Generate Variants',
          icon: 'layers',
          kbd: undefined,
          readonlyOk: false,
          onSelect: () => {
            const selectedShapes = editor.getSelectedShapes();
            const imageShapes = selectedShapes.filter(s => s.type === 'image');
            if (imageShapes.length > 0) {
              // Get render IDs from selected image shapes
              const selectedRenderIds = imageShapes
                .map((shape) => shape.meta?.renderId as string | undefined)
                .filter((id): id is string => !!id);
              
              if (selectedRenderIds.length > 0) {
                logger.log('🎨 Context menu: Generate Variants clicked', {
                  selectedRenderIds,
                  shapeCount: imageShapes.length,
                });
                setSelectedRenderIdsForVariants(selectedRenderIds);
                setVariantsDialogOpen(true);
              }
            }
          },
        };
      }

      // Add custom "Generate Drawing" action
      if (onGenerateDrawing) {
        actions['generate-drawing'] = {
          id: 'generate-drawing',
          label: 'Generate Drawing',
          icon: 'tool',
          kbd: undefined,
          readonlyOk: false,
          onSelect: () => {
            const selectedShapes = editor.getSelectedShapes();
            const imageShapes = selectedShapes.filter(s => s.type === 'image');
            if (imageShapes.length > 0) {
              const selectedRenderIds = imageShapes
                .map((shape) => shape.meta?.renderId as string | undefined)
                .filter((id): id is string => !!id);
              
              if (selectedRenderIds.length > 0) {
                logger.log('🎨 Context menu: Generate Drawing clicked', {
                  selectedRenderIds,
                  shapeCount: imageShapes.length,
                });
                setSelectedRenderIdsForDrawing(selectedRenderIds);
                setDrawingDialogOpen(true);
              }
            }
          },
        };
      }

      // Add custom "Image to Video" action
      if (onImageToVideo) {
        actions['image-to-video'] = {
          id: 'image-to-video',
          label: 'Image to Video',
          icon: 'video',
          kbd: undefined,
          readonlyOk: false,
          onSelect: () => {
            const selectedShapes = editor.getSelectedShapes();
            const imageShapes = selectedShapes.filter(s => s.type === 'image');
            if (imageShapes.length > 0) {
              const selectedRenderIds = imageShapes
                .map((shape) => shape.meta?.renderId as string | undefined)
                .filter((id): id is string => !!id);
              
              if (selectedRenderIds.length > 0) {
                logger.log('🎨 Context menu: Image to Video clicked', {
                  selectedRenderIds,
                  shapeCount: imageShapes.length,
                });
                setSelectedRenderIdsForVideo(selectedRenderIds);
                setVideoDialogOpen(true);
              }
            }
          },
        };
      }

      return actions;
    },
    menus(editor, menus) {
      // Add "Iterate" to image shape context menu
      const imageMenu = menus['image'];
      if (imageMenu && Array.isArray(imageMenu)) {
        // Create menu item reference to our custom action
        const generateMenuItem = {
          id: 'generate-with-ai',
          type: 'item' as const,
          actionItem: 'generate-with-ai',
        };

        // Try to find where to insert (after download, crop, or replace)
        let insertIndex = -1;
        
        // Look for download, crop, or replace menu items
        for (let i = 0; i < imageMenu.length; i++) {
          const item = imageMenu[i];
          const itemId = item?.id || item?.actionItem;
          if (itemId === 'download-image' || itemId === 'download' || 
              itemId === 'crop-image' || itemId === 'crop' ||
              itemId === 'replace-image' || itemId === 'replace') {
            insertIndex = i + 1;
            break;
          }
        }
        
        // Insert the menu item
        if (insertIndex >= 0) {
          imageMenu.splice(insertIndex, 0, generateMenuItem);
        } else {
          // If none found, add at the end
          imageMenu.push(generateMenuItem);
        }

        // Add "Generate Variants" menu item after "Iterate with AI" (if callback provided)
        if (onGenerateVariants) {
          const generateVariantsMenuItem = {
            id: 'generate-variants',
            type: 'item' as const,
            actionItem: 'generate-variants',
          };

          // Find position after "Iterate with AI"
          const generateAiIndex = imageMenu.findIndex((item: any) => 
            item?.id === 'generate-with-ai' || item?.actionItem === 'generate-with-ai'
          );
          
          if (generateAiIndex >= 0) {
            imageMenu.splice(generateAiIndex + 1, 0, generateVariantsMenuItem);
          } else {
            imageMenu.push(generateVariantsMenuItem);
          }
        }

        // Add "Generate Drawing" menu item
        if (onGenerateDrawing) {
          const generateDrawingMenuItem = {
            id: 'generate-drawing',
            type: 'item' as const,
            actionItem: 'generate-drawing',
          };

          // Find position after "Generate Variants" or "Iterate with AI"
          const generateVariantsIndex = imageMenu.findIndex((item: any) => 
            item?.id === 'generate-variants' || item?.actionItem === 'generate-variants'
          );
          const generateAiIndex = imageMenu.findIndex((item: any) => 
            item?.id === 'generate-with-ai' || item?.actionItem === 'generate-with-ai'
          );
          
          const insertIndex = generateVariantsIndex >= 0 ? generateVariantsIndex + 1 : (generateAiIndex >= 0 ? generateAiIndex + 1 : -1);
          if (insertIndex >= 0) {
            imageMenu.splice(insertIndex, 0, generateDrawingMenuItem);
          } else {
            imageMenu.push(generateDrawingMenuItem);
          }
        }

        // Add "Image to Video" menu item
        if (onImageToVideo) {
          const imageToVideoMenuItem = {
            id: 'image-to-video',
            type: 'item' as const,
            actionItem: 'image-to-video',
          };

          // Find position after "Generate Drawing" or other generate items
          const generateDrawingIndex = imageMenu.findIndex((item: any) => 
            item?.id === 'generate-drawing' || item?.actionItem === 'generate-drawing'
          );
          const generateVariantsIndex = imageMenu.findIndex((item: any) => 
            item?.id === 'generate-variants' || item?.actionItem === 'generate-variants'
          );
          
          const insertIndex = generateDrawingIndex >= 0 ? generateDrawingIndex + 1 : (generateVariantsIndex >= 0 ? generateVariantsIndex + 1 : -1);
          if (insertIndex >= 0) {
            imageMenu.splice(insertIndex, 0, imageToVideoMenuItem);
          } else {
            imageMenu.push(imageToVideoMenuItem);
          }
        }
      }
      return menus;
    },
  }), [onGenerateFromSelection, onGenerateVariants, onGenerateDrawing, onImageToVideo]);

  // Configure components with lasso tool and contextual toolbar
  const components = useMemo<TLComponents>(() => ({
    Toolbar: (props) => {
      const tools = useTools();
      const isLassoSelected = useIsToolSelected(tools['lasso-select']);
      return (
        <DefaultToolbar {...props} orientation="vertical">
          <TldrawUiMenuItem {...tools['lasso-select']} isSelected={isLassoSelected} />
          <DefaultToolbarContent />
        </DefaultToolbar>
      );
    },
    KeyboardShortcutsDialog: (props) => {
      const tools = useTools();
      return (
        <DefaultKeyboardShortcutsDialog {...props}>
          <DefaultKeyboardShortcutsDialogContent />
          {/* Add lasso tool to keyboard shortcuts dialog */}
          <TldrawUiMenuItem {...tools['lasso-select']} />
        </DefaultKeyboardShortcutsDialog>
      );
    },
    Overlays: () => (
      <>
        <TldrawOverlays />
        <LassoSelectSvgComponent />
      </>
    ),
    InFrontOfTheCanvas: () => (
      <>
        <ContextualToolbar 
          onGenerate={onGenerateFromSelection}
          onOpenVariantsDialog={(selectedRenderIds) => {
            setSelectedRenderIdsForVariants(selectedRenderIds);
            setVariantsDialogOpen(true);
          }}
          onOpenUpscaleDialog={(selectedRenderIds) => {
            setSelectedRenderIdsForUpscale(selectedRenderIds);
            setUpscaleDialogOpen(true);
          }}
          onOpenVideoDialog={(selectedRenderIds) => {
            setSelectedRenderIdsForVideo(selectedRenderIds);
            setVideoDialogOpen(true);
          }}
        />
        {agent && <ContextHighlights agent={agent} />}
        {agent && <GoToAgentButton agent={agent} />}
      </>
    ),
  }), [onGenerateFromSelection, onGenerateVariants, onImageToVideo, agent]);

  // Show generating frame on canvas when generating
  useEffect(() => {
    if (!editor) return;
    
    const generatingFrameId = createShapeId('generating-frame');
    const existingFrame = editor.getShape(generatingFrameId);
    
    if (isGenerating) {
      // Create or update generating frame
      if (!existingFrame) {
        // Get viewport center
        const viewportBounds = editor.getViewportPageBounds();
        const centerX = viewportBounds.x + viewportBounds.width / 2;
        const centerY = viewportBounds.y + viewportBounds.height / 2;
        
        // Create generating frame - this will show on the canvas
        editor.createShapes([
          {
            id: generatingFrameId,
            type: 'frame',
            x: centerX - 600,
            y: centerY - 400,
            props: {
              w: 1200,
              h: 800,
              name: 'Generating your render...',
            },
            meta: {
              isGenerating: true,
              prompt: generatingPrompt || '',
            },
          },
        ]);
      }
    } else {
      // Remove generating frame when not generating
      if (existingFrame) {
        editor.deleteShapes([generatingFrameId]);
      }
    }
  }, [isGenerating, generatingPrompt, editor]);

  // ✅ FIXED: Track which renders have been added to canvas to enable incremental updates
  const addedRenderIdsRef = useRef<Set<string>>(new Set());

  // Load chain renders onto canvas incrementally (only new ones)
  useEffect(() => {
    if (!editor || effectiveChainRenders.length === 0) return;

    const loadChainRenders = async () => {
      // Filter to only completed renders with output URLs
      const completedRenders = effectiveChainRenders.filter(
        (r) => r.status === 'completed' && r.outputUrl && r.type === 'image'
      );

      // ✅ FIXED: Only process renders that haven't been added yet
      const newRenders = completedRenders.filter(
        (r) => !addedRenderIdsRef.current.has(r.id)
      );

      if (newRenders.length === 0) {
        logger.log('🔄 RenderiqCanvas: No new renders to add', {
        totalRenders: effectiveChainRenders.length,
        completedRenders: completedRenders.length,
          alreadyAdded: addedRenderIdsRef.current.size,
        });
        return;
      }

      logger.log('🔄 RenderiqCanvas: Loading new renders onto canvas', {
        totalRenders: effectiveChainRenders.length,
        completedRenders: completedRenders.length,
        newRenders: newRenders.length,
        alreadyAdded: addedRenderIdsRef.current.size,
      });

      // Load each new render onto canvas with offset positions
      for (let i = 0; i < newRenders.length; i++) {
        const render = newRenders[i];
        const shapeId = createShapeId(`render-${render.id}`);

        // Check if already on canvas (double-check)
        const existingShape = editor.getShape(shapeId);
        if (existingShape) {
          // Already on canvas, mark as added
          addedRenderIdsRef.current.add(render.id);
          continue;
        }

        try {
          // Get image dimensions
          const img = new Image();
          img.crossOrigin = 'anonymous';

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Image load timeout')), 10000);
            img.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timeout);
              img.crossOrigin = null as any;
              img.src = render.outputUrl!;
            };
            img.src = render.outputUrl!;
          });

          // Calculate optimal position using auto-layout
          // Use spiral layout for many items (50+), grid for fewer items
          const frameWidth = (img.naturalWidth || 1200) + 100; // Add padding
          const frameHeight = (img.naturalHeight || 800) + 100;
          
          // Check if frame already exists
          const frameId = createShapeId(`frame-render-${render.id}`);
          const existingFrame = editor.getShape(frameId);
          
          // Use auto-layout to calculate position (prevents overlap)
          const position = TldrawAutoLayout.calculateOptimalPosition(
            editor,
            frameWidth,
            frameHeight,
            {
              algorithm: completedRenders.length > 20 ? 'spiral' : 'grid',
              spacing: 150, // Spacing between frames
              cols: completedRenders.length > 20 ? undefined : 3, // 3 columns for grid, auto for spiral
            }
          );
          
          const frameX = position.x;
          const frameY = position.y;
          
          // Create frame and image in same batch (frame first, then image as child)
          const shapesToCreate = [];
          
          // ✅ FIXED: Use label from contextData or calculate version/variant name
          let frameName: string;
          const contextData = render.contextData as any; // Type assertion for label property
          if (contextData?.label) {
            // Use stored label (e.g., "Version 1", "Variant 1 of Version 2")
            frameName = contextData.label;
          } else {
            // Calculate label from version number
            const { getVersionNumber } = await import('@/lib/utils/chain-helpers');
            const versionNumber = getVersionNumber(render, effectiveChainRenders);
            if (versionNumber) {
              frameName = `Version ${versionNumber}`;
            } else {
              // Fallback to prompt or index
              frameName = render.prompt?.substring(0, 30) || `Render ${i + 1}`;
            }
          }
          
          if (!existingFrame) {
            shapesToCreate.push({
              id: frameId,
              type: 'frame',
              x: frameX,
              y: frameY,
              props: {
                w: frameWidth,
                h: frameHeight,
                name: frameName,
              },
              meta: {
                renderId: render.id,
                isRenderFrame: true,
              },
            });
          }

          // Create asset ID
          const assetId = AssetRecordType.createId();

          // Create image asset
          editor.createAssets([
            {
              id: assetId,
              typeName: 'asset',
              type: 'image',
              props: {
                w: img.naturalWidth || 1200,
                h: img.naturalHeight || 800,
                name: `render-${render.id}`,
                src: render.outputUrl!,
                mimeType: 'image/png',
                isAnimated: false,
              },
              meta: {
                renderId: render.id,
              },
            },
          ]);

          // Create image shape inside the frame
          // Use frame-relative coordinates (50px padding from frame edge)
          const imageX = 50; // Relative to frame
          const imageY = 50; // Relative to frame

          // Add image shape (as child of frame)
          // When parentId is set, x/y are relative to parent
          shapesToCreate.push({
            id: shapeId,
            type: 'image',
            parentId: frameId, // Parent to frame
            x: imageX, // Relative to frame (50px padding)
            y: imageY, // Relative to frame (50px padding)
            props: {
              w: img.naturalWidth || 1200,
              h: img.naturalHeight || 800,
              assetId: assetId,
            },
            meta: {
              renderId: render.id,
              renderType: render.type,
            },
          });

          // Create all shapes in one batch
          if (shapesToCreate.length > 0) {
            editor.createShapes(shapesToCreate as any);
          }

          // ✅ FIXED: Mark render as added to prevent duplicate additions
          addedRenderIdsRef.current.add(render.id);

          logger.log('✅ RenderiqCanvas: Added chain render to canvas', {
            renderId: render.id,
            index: i,
            label: frameName,
            totalAdded: addedRenderIdsRef.current.size,
          });
        } catch (error) {
          logger.error('❌ RenderiqCanvas: Failed to add chain render to canvas', {
            renderId: render.id,
            error,
          });
        }
      }
    };

    loadChainRenders();
  }, [effectiveChainRenders, editor]);

  // Add render image to canvas when render completes (for new renders)
  useEffect(() => {
    if (!effectiveCurrentRender?.outputUrl || !editor) return;

    // Skip if already in chainRenders (will be loaded by chain renders effect)
    const alreadyInChain = effectiveChainRenders.some((r) => r.id === effectiveCurrentRender.id);
    if (alreadyInChain) return;

    // Create async function to handle image loading and asset creation
    const addImageToCanvas = async () => {
      try {
        const shapeId = createShapeId(`render-${effectiveCurrentRender.id}`);
        
        // Check if image already exists on canvas
        const existingShape = editor.getShape(shapeId);
        if (existingShape) {
          logger.log('🔄 RenderiqCanvas: Render already on canvas', {
            renderId: effectiveCurrentRender.id,
          });
          return;
        }

        // For tldraw v4: Create image asset using createAssets
        try {
          // Get image dimensions first
          const img = new Image();
          // Handle CORS - try anonymous first, if it fails the image might not need CORS
          img.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Image load timeout'));
            }, 10000); // 10 second timeout
            
            img.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            img.onerror = (error) => {
              clearTimeout(timeout);
              // Try without CORS if anonymous fails
              if (img.crossOrigin === 'anonymous') {
                img.crossOrigin = null as any;
                img.src = effectiveCurrentRender.outputUrl!;
              } else {
                reject(error);
              }
            };
            img.src = currentRender.outputUrl!;
          });

          // Calculate optimal position using auto-layout (prevents overlap)
          const imgWidth = img.naturalWidth || 1200;
          const imgHeight = img.naturalHeight || 800;
          const position = TldrawAutoLayout.calculateOptimalPosition(
            editor,
            imgWidth,
            imgHeight,
            {
              algorithm: 'grid', // Use grid for single new render
              spacing: 150,
              cols: 3,
            }
          );

          // Create asset ID using tldraw's AssetRecordType.createId() for proper ID generation
          const assetId = AssetRecordType.createId();
          
          // Create image asset
          editor.createAssets([
            {
              id: assetId,
              typeName: 'asset',
              type: 'image',
              props: {
                w: imgWidth,
                h: imgHeight,
                name: `render-${effectiveCurrentRender.id}`,
                src: effectiveCurrentRender.outputUrl!,
                mimeType: 'image/png',
                isAnimated: false,
              },
              meta: {
                renderId: effectiveCurrentRender.id, // Store render ID in meta for reference
              },
            },
          ]);

          // Create image shape using the asset at calculated position
          editor.createShapes([
            {
              id: shapeId,
              type: 'image',
              x: position.x,
              y: position.y,
              props: {
                w: imgWidth,
                h: imgHeight,
                assetId: assetId,
              },
              meta: {
                renderId: effectiveCurrentRender.id,
                renderType: effectiveCurrentRender.type,
              },
            },
          ]);
        } catch (assetError) {
          // Fallback: create frame with image URL in metadata
          logger.warn('Failed to create image asset, using frame fallback', assetError);
          
          // Calculate position for fallback frame
          const fallbackPosition = TldrawAutoLayout.calculateOptimalPosition(
            editor,
            1200,
            800,
            {
              algorithm: 'grid',
              spacing: 150,
              cols: 3,
            }
          );
          
          editor.createShapes([
            {
              id: shapeId,
              type: 'frame',
              x: fallbackPosition.x,
              y: fallbackPosition.y,
              props: {
                w: 1200,
                h: 800,
              },
              meta: {
                renderId: currentRender.id,
                imageUrl: currentRender.outputUrl,
                renderType: currentRender.type,
              },
            },
          ]);
        }

        logger.log('✅ RenderiqCanvas: Added render to canvas', {
          renderId: effectiveCurrentRender.id,
          shapeId,
        });
      } catch (error) {
        logger.error('❌ RenderiqCanvas: Failed to add render to canvas', error);
      }
    };

    // Call async function
    addImageToCanvas();
  }, [effectiveCurrentRender?.id, effectiveCurrentRender?.outputUrl, effectiveCurrentRender?.type, editor]);

  return (
    <>
    <div 
      ref={containerRef} 
      className={cn('w-full h-full relative', className)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
          <div className="text-sm text-muted-foreground">Loading canvas...</div>
        </div>
      )}

      <Tldraw
        onMount={(editorInstance) => {
          setEditor(editorInstance);
          
          // Set initial theme based on app theme (not system)
          // Use setTimeout to ensure editor is fully initialized
          setTimeout(() => {
            if (mounted) {
              const tldrawColorScheme = isDarkMode ? 'dark' : 'light';
              editorInstance.user.updateUserPreferences({ 
                colorScheme: tldrawColorScheme 
              });
              logger.log('🎨 RenderiqCanvas: Initial theme set', {
                tldrawColorScheme,
                appTheme: theme,
                resolvedTheme,
                isDarkMode
              });
            }
          }, 0);
          
          logger.log('✅ RenderiqCanvas: tldraw editor mounted', {
            theme: isDarkMode ? 'dark' : 'light',
            appTheme: theme,
            resolvedTheme,
            isMobile,
            hasAssetUrls: !!assetUrls,
            hasLicenseKey: !!licenseKey,
          });
        }}
        inferDarkMode={false}
        forceMobile={isMobile}
        persistenceKey={chainId ? `renderiq-canvas-${chainId}` : undefined}
        assetUrls={assetUrls}
        licenseKey={licenseKey}
        components={components}
        tools={[LassoSelectTool]}
        overrides={uiOverrides}
      />
      </div>

      {/* ✅ FIXED: Dialogs rendered outside canvas container to avoid stacking context issues */}
      {/* Generate Variants Dialog */}
      <GenerateVariantsDialog
        open={variantsDialogOpen}
        onOpenChange={setVariantsDialogOpen}
        onGenerate={(config) => {
          if (onGenerateVariants) {
            onGenerateVariants(config, selectedRenderIdsForVariants);
          }
        }}
        selectedRenderIds={selectedRenderIdsForVariants}
      />
      
      {/* Generate Drawing Dialog */}
      <GenerateDrawingDialog
        open={drawingDialogOpen}
        onOpenChange={setDrawingDialogOpen}
        selectedRenderIds={selectedRenderIdsForDrawing}
        onGenerate={(config, selectedRenderIds) => {
          if (onGenerateDrawing) {
            onGenerateDrawing(config, selectedRenderIds);
          }
        }}
      />
      
      {/* Image to Video Dialog */}
      <ImageToVideoDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        selectedRenderIds={selectedRenderIdsForVideo}
        onGenerate={(config, selectedRenderIds) => {
          if (onImageToVideo) {
            onImageToVideo(config, selectedRenderIds);
          }
        }}
      />
      
      {/* Upscale Dialog */}
      <UpscaleDialog
        open={upscaleDialogOpen}
        onOpenChange={setUpscaleDialogOpen}
        selectedRenderIds={selectedRenderIdsForUpscale}
        chainRenders={effectiveChainRenders}
        projectId={effectiveChainRenders[0]?.projectId || undefined}
        chainId={effectiveChainId}
        onUpscaleComplete={(render) => {
          if (onRenderAdded) {
            onRenderAdded(render);
          }
        }}
      />
    </>
  );
}

