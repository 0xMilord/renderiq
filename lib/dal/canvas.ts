import { db } from '@/lib/db';
import { canvasGraphs, renderChains } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { CanvasState } from '@/lib/types/canvas';

export class CanvasDAL {
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
      console.error('Error getting canvas graph:', error);
      throw error;
    }
  }

  static async saveGraph(chainId: string, userId: string, state: CanvasState) {
    try {
      // Get chain to verify ownership and get projectId
      const [chain] = await db
        .select()
        .from(renderChains)
        .where(eq(renderChains.id, chainId))
        .limit(1);

      if (!chain) {
        return { success: false, error: 'Chain not found' };
      }

      // Check if graph exists
      const existing = await this.getByChainId(chainId);

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
          .where(eq(canvasGraphs.chainId, chainId))
          .returning();

        return {
          success: true,
          data: updated,
        };
      } else {
        // Create new graph
        const [created] = await db
          .insert(canvasGraphs)
          .values({
            chainId,
            projectId: chain.projectId,
            userId,
            nodes: state.nodes as any,
            connections: state.connections as any,
            viewport: state.viewport as any,
            version: 1,
          })
          .returning();

        return {
          success: true,
          data: created,
        };
      }
    } catch (error) {
      console.error('Error saving canvas graph:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save canvas graph',
      };
    }
  }
}

