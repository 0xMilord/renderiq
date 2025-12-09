import { db } from '@/lib/db';
import { canvasGraphs, renderChains, canvasFiles } from '@/lib/db/schema';
import { eq, or, isNull } from 'drizzle-orm';
import { CanvasState } from '@/lib/types/canvas';
import { logger } from '@/lib/utils/logger';

export class CanvasDAL {
  // ============================================================================
  // LEGACY: Chain-based access (for backward compatibility)
  // ============================================================================

  static async getByChainId(chainId: string) {
    try {
      const [graph] = await db
        .select()
        .from(canvasGraphs)
        .where(eq(canvasGraphs.chainId, chainId))
        .limit(1);

      if (!graph) {
        return null;
      }

      // Get chain to verify project relationship
      const [chain] = await db
        .select()
        .from(renderChains)
        .where(eq(renderChains.id, chainId))
        .limit(1);

      if (!chain) {
        return null;
      }

      return {
        ...graph,
        projectId: chain.projectId,
      };
    } catch (error) {
      logger.error('Error getting canvas graph by chainId:', error);
      throw error;
    }
  }

  // ============================================================================
  // NEW: File-based access (Figma-like structure)
  // ============================================================================

  static async getByFileId(fileId: string) {
    try {
      const [graph] = await db
        .select()
        .from(canvasGraphs)
        .where(eq(canvasGraphs.fileId, fileId))
        .limit(1);

      if (!graph) {
        return null;
      }

      // Get file to verify project relationship
      const [file] = await db
        .select()
        .from(canvasFiles)
        .where(eq(canvasFiles.id, fileId))
        .limit(1);

      if (!file) {
        return null;
      }

      return {
        ...graph,
        projectId: file.projectId,
      };
    } catch (error) {
      logger.error('Error getting canvas graph by fileId:', error);
      throw error;
    }
  }

  // ============================================================================
  // SAVE GRAPH (supports both legacy chainId and new fileId)
  // ============================================================================

  static async saveGraph(
    identifier: { chainId?: string; fileId?: string },
    userId: string,
    state: CanvasState
  ) {
    try {
      let projectId: string;
      let existing: any = null;

      // Determine if using fileId (new) or chainId (legacy)
      if (identifier.fileId) {
        // New file-based approach
        const [file] = await db
          .select()
          .from(canvasFiles)
          .where(eq(canvasFiles.id, identifier.fileId))
          .limit(1);

        if (!file) {
          return { success: false, error: 'Canvas file not found' };
        }

        projectId = file.projectId;

        // Check if graph exists for this file
        existing = await this.getByFileId(identifier.fileId);
      } else if (identifier.chainId) {
        // Legacy chain-based approach
        const [chain] = await db
          .select()
          .from(renderChains)
          .where(eq(renderChains.id, identifier.chainId))
          .limit(1);

        if (!chain) {
          return { success: false, error: 'Chain not found' };
        }

        projectId = chain.projectId;

        // Check if graph exists for this chain
        existing = await this.getByChainId(identifier.chainId);
      } else {
        return { success: false, error: 'Either fileId or chainId must be provided' };
      }

      if (existing) {
        // Update existing graph
        const whereCondition = identifier.fileId
          ? eq(canvasGraphs.fileId, identifier.fileId)
          : eq(canvasGraphs.chainId, identifier.chainId!);

        const [updated] = await db
          .update(canvasGraphs)
          .set({
            nodes: state.nodes as any,
            connections: state.connections as any,
            viewport: state.viewport as any,
            version: existing.version + 1,
            updatedAt: new Date(),
          })
          .where(whereCondition)
          .returning();

        logger.log('✅ Canvas graph updated:', updated.id);
        return {
          success: true,
          data: updated,
        };
      } else {
        // Create new graph
        const [created] = await db
          .insert(canvasGraphs)
          .values({
            chainId: identifier.chainId || null,
            fileId: identifier.fileId || null,
            projectId,
            userId,
            nodes: state.nodes as any,
            connections: state.connections as any,
            viewport: state.viewport as any,
            version: 1,
          })
          .returning();

        logger.log('✅ Canvas graph created:', created.id);
        return {
          success: true,
          data: created,
        };
      }
    } catch (error) {
      logger.error('Error saving canvas graph:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save canvas graph',
      };
    }
  }

  // ============================================================================
  // MIGRATION: Get graph by either chainId or fileId
  // ============================================================================

  static async getGraph(identifier: { chainId?: string; fileId?: string }) {
    if (identifier.fileId) {
      return await this.getByFileId(identifier.fileId);
    } else if (identifier.chainId) {
      return await this.getByChainId(identifier.chainId);
    }
    return null;
  }
}

