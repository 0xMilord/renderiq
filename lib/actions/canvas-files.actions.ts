'use server';

import { revalidatePath } from 'next/cache';
import { CanvasFilesService } from '@/lib/services/canvas-files.service';
import { StorageService } from '@/lib/services/storage';
import { BillingService } from '@/lib/services/billing';
import { RendersDAL } from '@/lib/dal/renders';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';
import type { CanvasState } from '@/lib/types/canvas';

// ============================================================================
// GET ACTIONS (Internal app operations)
// ============================================================================

export async function getCanvasFilesAction(options?: {
  projectId?: string;
  userId?: string;
  includeArchived?: boolean;
}) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        files: [],
      };
    }

    let files;
    if (options?.projectId) {
      files = await CanvasFilesService.getFilesByProject(options.projectId, options.includeArchived);
    } else if (options?.userId) {
      files = await CanvasFilesService.getFilesByUser(options.userId, options.includeArchived);
    } else {
      // Default to current user's files
      files = await CanvasFilesService.getFilesByUser(user.id, options?.includeArchived);
    }

    return {
      success: true,
      files,
    };
  } catch (error) {
    logger.error('Error fetching canvas files:', error);
    return {
      success: false,
      error: 'Failed to fetch canvas files',
      files: [],
    };
  }
}

export async function getCanvasFileByIdAction(fileId: string) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        file: null,
        graph: null,
      };
    }

    const result = await CanvasFilesService.getFileWithGraph(fileId);

    if (!result || !result.file) {
      return {
        success: false,
        error: 'Canvas file not found',
        file: null,
        graph: null,
      };
    }

    // Verify ownership
    if (result.file.userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized',
        file: null,
        graph: null,
      };
    }

    return {
      success: true,
      file: result.file,
      graph: result.graph,
    };
  } catch (error) {
    logger.error('Error fetching canvas file:', error);
    return {
      success: false,
      error: 'Failed to fetch canvas file',
      file: null,
      graph: null,
    };
  }
}

export async function getCanvasFileBySlugAction(projectId: string, slug: string) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        file: null,
        graph: null,
      };
    }

    const result = await CanvasFilesService.getFileWithGraphBySlug(projectId, slug);

    if (!result || !result.file) {
      return {
        success: false,
        error: 'Canvas file not found',
        file: null,
        graph: null,
      };
    }

    // Verify ownership
    if (result.file.userId !== user.id) {
      return {
        success: false,
        error: 'Unauthorized',
        file: null,
        graph: null,
      };
    }

    return {
      success: true,
      file: result.file,
      graph: result.graph,
    };
  } catch (error) {
    logger.error('Error fetching canvas file:', error);
    return {
      success: false,
      error: 'Failed to fetch canvas file',
      file: null,
      graph: null,
    };
  }
}

export async function getCanvasGraphAction(fileId: string) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
        data: null,
      };
    }

    // ✅ OPTIMIZED: Use getFileWithGraph to get file and graph in one query (JOIN)
    const result = await CanvasFilesService.getFileWithGraph(fileId);
    
    if (!result || !result.file) {
      return {
        success: false,
        error: 'Canvas file not found',
        data: null,
      };
    }

    if (result.file.userId !== user.id) {
      return {
        success: false,
        error: 'Access denied',
        data: null,
      };
    }

    // Graph is already fetched with file (from JOIN query)
    const graph = result.graph;

    if (!graph) {
      // Return empty graph if none exists
      return {
        success: true,
        data: {
          nodes: [],
          connections: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      };
    }

    return {
      success: true,
      data: {
        nodes: graph.nodes,
        connections: graph.connections,
        viewport: graph.viewport || { x: 0, y: 0, zoom: 1 },
      },
    };
  } catch (error) {
    logger.error('Error getting canvas graph:', error);
    return {
      success: false,
      error: 'Failed to get canvas graph',
      data: null,
    };
  }
}

// ============================================================================
// CREATE/UPDATE ACTIONS
// ============================================================================

export async function createCanvasFileAction(formData: FormData) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const projectId = formData.get('projectId') as string;
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string | null;
    const thumbnailUrl = formData.get('thumbnailUrl') as string | null;
    const thumbnailKey = formData.get('thumbnailKey') as string | null;

    if (!projectId || !name || !slug) {
      return { success: false, error: 'Project ID, name, and slug are required' };
    }

    const file = await CanvasFilesService.createFile({
      projectId,
      userId: user.id,
      name,
      slug,
      description: description || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      thumbnailKey: thumbnailKey || undefined,
    });

    revalidatePath('/canvas');
    revalidatePath(`/canvas/${projectId}`);

    return {
      success: true,
      data: file,
    };
  } catch (error) {
    logger.error('Error creating canvas file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create canvas file',
    };
  }
}

export async function updateCanvasFileAction(fileId: string, formData: FormData) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const name = formData.get('name') as string | null;
    const slug = formData.get('slug') as string | null;
    const description = formData.get('description') as string | null;
    const thumbnailUrl = formData.get('thumbnailUrl') as string | null;
    const thumbnailKey = formData.get('thumbnailKey') as string | null;
    const isActive = formData.get('isActive') as string | null;
    const isArchived = formData.get('isArchived') as string | null;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (description !== null) updateData.description = description;
    if (thumbnailUrl !== null) updateData.thumbnailUrl = thumbnailUrl;
    if (thumbnailKey !== null) updateData.thumbnailKey = thumbnailKey;
    if (isActive !== null) updateData.isActive = isActive === 'true';
    if (isArchived !== null) updateData.isArchived = isArchived === 'true';

    const file = await CanvasFilesService.updateFile(fileId, updateData);

    if (!file) {
      return { success: false, error: 'Canvas file not found' };
    }

    revalidatePath('/canvas');
    revalidatePath(`/canvas/${file.projectId}`);

    return {
      success: true,
      data: file,
    };
  } catch (error) {
    logger.error('Error updating canvas file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update canvas file',
    };
  }
}

export async function saveCanvasGraphAction(fileId: string, state: CanvasState) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await CanvasFilesService.saveGraph(fileId, user.id, state);

    if (result.success && result.data) {
      // Get file to revalidate correct path
      const file = await CanvasFilesService.getFileById(fileId);
      if (file) {
        revalidatePath('/canvas');
        revalidatePath(`/canvas/${file.projectId}/${file.slug}`);
      }
    }

    return result;
  } catch (error) {
    logger.error('Error saving canvas graph:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save canvas graph',
    };
  }
}

export async function deleteCanvasFileAction(fileId: string) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const file = await CanvasFilesService.getFileById(fileId);
    if (!file) {
      return { success: false, error: 'Canvas file not found' };
    }

    if (file.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await CanvasFilesService.deleteFile(fileId);

    revalidatePath('/canvas');
    revalidatePath(`/canvas/${file.projectId}`);

    return {
      success: true,
    };
  } catch (error) {
    logger.error('Error deleting canvas file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete canvas file',
    };
  }
}

export async function duplicateCanvasFileAction(fileId: string, newName?: string) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const file = await CanvasFilesService.getFileById(fileId);
    if (!file) {
      return { success: false, error: 'Canvas file not found' };
    }

    if (file.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const duplicatedFile = await CanvasFilesService.duplicateFile(fileId, newName);

    revalidatePath('/canvas');
    revalidatePath(`/canvas/${file.projectId}`);

    return {
      success: true,
      data: duplicatedFile,
    };
  } catch (error) {
    logger.error('Error duplicating canvas file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate canvas file',
    };
  }
}

// ============================================================================
// THUMBNAIL & VARIANT ACTIONS
// ============================================================================

/**
 * Upload canvas thumbnail image
 * Migrated from /api/canvas/upload-thumbnail
 */
export async function uploadCanvasThumbnailAction(fileId: string, file: File) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify file ownership
    const canvasFile = await CanvasFilesService.getFileById(fileId);
    if (!canvasFile) {
      return { success: false, error: 'Canvas file not found' };
    }

    if (canvasFile.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Upload to storage
    const uploadResult = await StorageService.uploadFile(
      file,
      'uploads',
      user.id,
      `canvas-thumbnails/${fileId}-${Date.now()}.png`
    );

    // Update canvas file with thumbnail
    const updateFormData = new FormData();
    updateFormData.append('thumbnailUrl', uploadResult.url);
    updateFormData.append('thumbnailKey', uploadResult.key);

    const updateResult = await updateCanvasFileAction(fileId, updateFormData);
    
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    return {
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
    };
  } catch (error) {
    logger.error('Error uploading canvas thumbnail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload thumbnail',
    };
  }
}

/**
 * Generate canvas variants
 * Migrated from /api/canvas/generate-variants
 */
export async function generateCanvasVariantsAction(params: {
  sourceImageUrl: string;
  prompt: string;
  count: number;
  variantType?: 'multi-angle' | 'design-options'; // ✅ NEW: Variant type
  settings: Record<string, any>;
  styleSettings?: any; // ✅ NEW: Style settings from Style Node
  materialSettings?: any; // ✅ NEW: Material settings from Material Node
  styleReference?: any; // ✅ NEW: Style reference from Style Reference Node
  previousVariants?: Array<{ prompt: string; url?: string }>; // ✅ NEW: Previous variants for context
  nodeId?: string;
  projectId?: string;
  fileId?: string;
}) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check credits
    const creditsResult = await BillingService.getUserCredits(user.id);
    if (!creditsResult.success || !creditsResult.credits) {
      return { success: false, error: 'Failed to check credits' };
    }

    const requiredCredits = params.count;
    if (creditsResult.credits.balance < requiredCredits) {
      return { success: false, error: 'Insufficient credits' };
    }

    // ✅ FIXED: Use batch API instead of creating individual renders
    const { buildVariantBatchRequests } = await import('@/lib/utils/variant-prompt-builder');
    const { createRenderAction } = await import('@/lib/actions/render.actions');
    
    // ✅ UPDATED: Build batch requests with full context
    const config = {
      variantCount: params.count,
      variantType: (params.variantType || 'multi-angle') as 'multi-angle' | 'design-options', // Default to multi-angle
      variationStrength: params.settings.variationStrength || 0.5, // ✅ NEW: Include variation strength
      styleSettings: params.styleSettings,
      materialSettings: params.materialSettings,
      styleReference: params.styleReference,
      previousVariants: params.previousVariants,
      basePrompt: params.prompt || 'Generate architectural variant',
    };
    const batchRequests = buildVariantBatchRequests(params.prompt || 'Generate architectural variant', config);
    
    // Create FormData for batch API
    const formData = new FormData();
    formData.append('prompt', params.prompt || 'Generate architectural variant');
    formData.append('style', params.settings.style || 'architectural');
    formData.append('quality', params.settings.quality || 'standard');
    formData.append('aspectRatio', '16:9');
    formData.append('type', 'image');
    
    // ✅ CRITICAL: Include projectId and fileId for proper render creation
    if (params.projectId) {
      formData.append('projectId', params.projectId);
    }
    if (params.fileId) {
      formData.append('fileId', params.fileId);
      formData.append('platform', 'canvas');
    }
    
    // Add batch API flags
    formData.append('useBatchAPI', 'true');
    formData.append('batchRequests', JSON.stringify(batchRequests));
    formData.append('variantCount', params.count.toString());
    formData.append('variantType', params.variantType || 'multi-angle');
    
    // If source image is provided, add it for image-to-image generation
    if (params.sourceImageUrl) {
      try {
        // Fetch the image and convert to File
        const response = await fetch(params.sourceImageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'source-image.png', { type: blob.type || 'image/png' });
        formData.append('uploadedImage', file);
        formData.append('generationType', 'image-to-image');
      } catch (error) {
        logger.warn('Failed to fetch source image for variants:', error);
        // Continue without source image (text-to-image fallback)
      }
    }
    
    // Call batch API
    const renderResult = await createRenderAction(formData);
    
    if (!renderResult.success || !renderResult.data) {
      return {
        success: false,
        error: renderResult.error || 'Failed to generate variants',
      };
    }
    
    // Extract batch results
    const batchResults = Array.isArray(renderResult.data) ? renderResult.data : [renderResult.data];
    
    // Map batch results to variant format
    const variants = batchResults.map((result: any, index: number) => ({
      id: result.renderId || result.id || `variant-${index}`,
      url: result.outputUrl || result.url || params.sourceImageUrl, // Will be updated when render completes
      prompt: batchRequests[index]?.prompt || params.prompt || 'Variant',
      settings: params.settings,
      renderId: result.renderId || result.id,
    }));
    
    // Deduct credits
    await BillingService.deductCredits(
      user.id,
      requiredCredits,
      `Generated ${params.count} variants`,
      undefined,
      'render'
    );

    return {
      success: true,
      data: { variants },
    };
  } catch (error) {
    logger.error('Error generating variants:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate variants',
    };
  }
}

