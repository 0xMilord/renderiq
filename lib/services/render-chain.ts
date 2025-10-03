import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChain } from '@/lib/db/schema';
import { ChainContext, CreateChainData, RenderChainWithRenders } from '@/lib/types/render-chain';

export class RenderChainService {
  /**
   * Create a new render chain
   */
  static async createChain(
    projectId: string,
    name: string,
    description?: string
  ): Promise<RenderChain> {
    const data: CreateChainData = {
      projectId,
      name,
      description,
    };

    return await RenderChainsDAL.create(data);
  }

  /**
   * Add a render to a chain
   */
  static async addRenderToChain(
    chainId: string,
    renderId: string,
    position?: number
  ): Promise<void> {
    await RenderChainsDAL.addRender(chainId, renderId, position);
  }

  /**
   * Get chain with all its renders
   */
  static async getChain(chainId: string): Promise<RenderChainWithRenders | null> {
    const chain = await RenderChainsDAL.getById(chainId);
    
    if (!chain) {
      return null;
    }

    const renders = await RendersDAL.getByChainId(chainId);

    return {
      ...chain,
      renders,
    };
  }

  /**
   * Get all chains for a project
   */
  static async getProjectChains(projectId: string): Promise<RenderChain[]> {
    return await RenderChainsDAL.getByProjectId(projectId);
  }

  /**
   * Update chain context by analyzing renders
   */
  static async updateChainContext(chainId: string, context: ChainContext): Promise<void> {
    const renders = await RendersDAL.getByChainId(chainId);
    
    // Update the latest render's context
    if (renders.length > 0) {
      const latestRender = renders[0];
      await RendersDAL.updateContext(latestRender.id, context);
    }
  }

  /**
   * Branch a chain to create a new direction
   */
  static async branchChain(
    chainId: string,
    fromRenderId: string,
    newName: string
  ): Promise<RenderChain> {
    // Get the source chain
    const sourceChain = await RenderChainsDAL.getById(chainId);
    
    if (!sourceChain) {
      throw new Error('Source chain not found');
    }

    // Create new chain
    const newChain = await this.createChain(
      sourceChain.projectId,
      newName,
      `Branched from ${sourceChain.name}`
    );

    // Get the render to branch from
    const sourceRender = await RendersDAL.getById(fromRenderId);
    
    if (!sourceRender) {
      throw new Error('Source render not found');
    }

    // Get all renders up to the branch point
    const sourceRenders = await RendersDAL.getByChainId(chainId);
    const branchPointIndex = sourceRenders.findIndex(r => r.id === fromRenderId);
    
    if (branchPointIndex === -1) {
      throw new Error('Render not found in chain');
    }

    // Copy renders to new chain (from newest to branch point)
    const rendersToCopy = sourceRenders.slice(0, branchPointIndex + 1);
    
    for (let i = 0; i < rendersToCopy.length; i++) {
      const render = rendersToCopy[i];
      // Just update the chain reference, don't duplicate renders
      // In a real scenario, you might want to duplicate or just track the branch point
      console.log(`Render ${render.id} is part of the new branch context`);
    }

    return newChain;
  }

  /**
   * Delete a chain
   */
  static async deleteChain(chainId: string): Promise<void> {
    // First, remove chain reference from all renders
    const renders = await RendersDAL.getByChainId(chainId);
    
    for (const render of renders) {
      await RenderChainsDAL.removeRender(chainId, render.id);
    }

    // Then delete the chain
    await RenderChainsDAL.delete(chainId);
  }

  /**
   * Get chain statistics
   */
  static async getChainStats(chainId: string) {
    const renders = await RendersDAL.getByChainId(chainId);
    
    const completed = renders.filter(r => r.status === 'completed').length;
    const failed = renders.filter(r => r.status === 'failed').length;
    const processing = renders.filter(r => r.status === 'processing').length;
    const pending = renders.filter(r => r.status === 'pending').length;

    return {
      total: renders.length,
      completed,
      failed,
      processing,
      pending,
    };
  }
}

