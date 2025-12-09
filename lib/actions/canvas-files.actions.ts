'use server';

import { revalidatePath } from 'next/cache';
import { CanvasFilesService } from '@/lib/services/canvas-files.service';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';
import type { CanvasState } from '@/lib/types/canvas';

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

