import { CanvasFilesDAL } from '@/lib/dal/canvas-files';
import { CanvasDAL } from '@/lib/dal/canvas';
import { logger } from '@/lib/utils/logger';
import type { CanvasState } from '@/lib/types/canvas';

export class CanvasFilesService {
  /**
   * Create a new canvas file
   */
  static async createFile(data: {
    projectId: string;
    userId: string;
    name: string;
    slug: string;
    description?: string;
    thumbnailUrl?: string;
    thumbnailKey?: string;
    metadata?: Record<string, any>;
  }) {
    return await CanvasFilesDAL.create(data);
  }

  /**
   * Get canvas file by ID
   */
  static async getFileById(id: string) {
    return await CanvasFilesDAL.getById(id);
  }

  /**
   * Get canvas file by slug
   */
  static async getFileBySlug(projectId: string, slug: string) {
    return await CanvasFilesDAL.getBySlug(projectId, slug);
  }

  /**
   * Get canvas file with its graph
   */
  static async getFileWithGraph(fileId: string) {
    return await CanvasFilesDAL.getFileWithGraph(fileId);
  }

  /**
   * Get canvas file with graph by slug
   */
  static async getFileWithGraphBySlug(projectId: string, slug: string) {
    return await CanvasFilesDAL.getFileWithGraphBySlug(projectId, slug);
  }

  /**
   * Get all canvas files for a project
   */
  static async getFilesByProject(projectId: string, includeArchived = false) {
    return await CanvasFilesDAL.getByProject(projectId, includeArchived);
  }

  /**
   * Get all canvas files for a user
   */
  static async getFilesByUser(userId: string, includeArchived = false) {
    return await CanvasFilesDAL.getByUser(userId, includeArchived);
  }

  /**
   * Update canvas file
   */
  static async updateFile(id: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    thumbnailUrl?: string;
    thumbnailKey?: string;
    isActive?: boolean;
    isArchived?: boolean;
    metadata?: Record<string, any>;
  }) {
    return await CanvasFilesDAL.update(id, data);
  }

  /**
   * Delete canvas file (soft delete - archives it)
   */
  static async deleteFile(id: string) {
    return await CanvasFilesDAL.delete(id);
  }

  /**
   * Save canvas graph state
   */
  static async saveGraph(fileId: string, userId: string, state: CanvasState) {
    const result = await CanvasDAL.saveGraph({ fileId }, userId, state);

    if (result.success && result.data) {
      // Increment file version
      await CanvasFilesDAL.incrementVersion(fileId);

      // Create version snapshot
      await CanvasFilesDAL.createVersion({
        fileId,
        version: result.data.version,
        graphId: result.data.id,
        createdBy: userId,
      });
    }

    return result;
  }

  /**
   * Get canvas graph by file ID
   */
  static async getGraphByFileId(fileId: string) {
    return await CanvasDAL.getByFileId(fileId);
  }

  /**
   * Get file versions
   */
  static async getFileVersions(fileId: string, limit?: number) {
    return await CanvasFilesDAL.getVersionsByFile(fileId, limit);
  }

  /**
   * Get specific file version
   */
  static async getFileVersion(fileId: string, version: number) {
    return await CanvasFilesDAL.getVersionByFileAndVersion(fileId, version);
  }

  /**
   * Get latest file version
   */
  static async getLatestVersion(fileId: string) {
    return await CanvasFilesDAL.getLatestVersion(fileId);
  }
}

