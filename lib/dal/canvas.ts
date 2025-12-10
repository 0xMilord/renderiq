import { db } from '@/lib/db';
import { canvasGraphs, canvasFiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { CanvasState } from '@/lib/types/canvas';
import { logger } from '@/lib/utils/logger';

export class CanvasDAL {
  // ============================================================================
  // File-based access (Figma-like structure)
  // ============================================================================

  static async getByFileId(fileId: string) {
    try {
      // ✅ OPTIMIZED: Use INNER JOIN to fetch graph and file in a single query
      // This reduces from 2 sequential queries to 1 query
      const [result] = await db
        .select({
          graph: canvasGraphs,
          projectId: canvasFiles.projectId,
        })
        .from(canvasGraphs)
        .innerJoin(canvasFiles, eq(canvasGraphs.fileId, canvasFiles.id))
        .where(eq(canvasGraphs.fileId, fileId))
        .limit(1);

      if (!result || !result.graph) {
        return null;
      }

      return {
        ...result.graph,
        projectId: result.projectId,
      };
    } catch (error) {
      logger.error('Error getting canvas graph by fileId:', error);
      throw error;
    }
  }

  // ============================================================================
  // SAVE GRAPH (file-based only)
  // ============================================================================

  static async saveGraph(
    fileId: string,
    userId: string,
    state: CanvasState
  ) {
    try {
      // ✅ OPTIMIZED: Fetch file and existing graph together in a single query
      const [fileWithGraph] = await db
        .select({
          file: canvasFiles,
          graph: canvasGraphs,
        })
        .from(canvasFiles)
        .leftJoin(canvasGraphs, eq(canvasFiles.id, canvasGraphs.fileId))
        .where(eq(canvasFiles.id, fileId))
        .limit(1);

      if (!fileWithGraph || !fileWithGraph.file) {
        return { success: false, error: 'Canvas file not found' };
      }

      const projectId = fileWithGraph.file.projectId;
      const existing = fileWithGraph.graph || null;

      if (existing) {
        // Update existing graph
        const [updated] = await db
          .update(canvasGraphs)
          .set({
            nodes: state.nodes as any,
            connections: state.connections as any,
            viewport: state.viewport as any,
            version: existing.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(canvasGraphs.fileId, fileId))
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
            fileId: fileId,
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
}

