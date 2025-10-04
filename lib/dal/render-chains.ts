import { db } from '@/lib/db';
import { renderChains, renders, projects } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { CreateChainData, UpdateChainData } from '@/lib/types/render-chain';

export class RenderChainsDAL {
  static async create(data: CreateChainData) {
    console.log('📝 Creating render chain:', data);
    
    const [chain] = await db
      .insert(renderChains)
      .values({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
      })
      .returning();

    console.log('✅ Render chain created:', chain.id);
    return chain;
  }

  static async getById(id: string) {
    console.log('🔍 Fetching render chain by ID:', id);
    
    const [chain] = await db
      .select()
      .from(renderChains)
      .where(eq(renderChains.id, id))
      .limit(1);

    return chain;
  }

  static async getByProjectId(projectId: string) {
    console.log('🔍 Fetching render chains for project:', projectId);
    
    const chains = await db
      .select()
      .from(renderChains)
      .where(eq(renderChains.projectId, projectId))
      .orderBy(desc(renderChains.createdAt));

    console.log(`✅ Found ${chains.length} chains for project`);
    return chains;
  }

  static async update(id: string, data: UpdateChainData) {
    console.log('🔄 Updating render chain:', { id, data });
    
    const [updatedChain] = await db
      .update(renderChains)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(renderChains.id, id))
      .returning();

    console.log('✅ Render chain updated:', updatedChain.id);
    return updatedChain;
  }

  static async delete(id: string) {
    console.log('🗑️ Deleting render chain:', id);
    
    await db
      .delete(renderChains)
      .where(eq(renderChains.id, id));

    console.log('✅ Render chain deleted:', id);
  }

  static async addRender(chainId: string, renderId: string, position?: number) {
    console.log('🔗 Adding render to chain:', { chainId, renderId, position });
    
    // Get current max position if position not specified
    let finalPosition = position;
    if (finalPosition === undefined) {
      const chainRenders = await db
        .select()
        .from(renders)
        .where(eq(renders.chainId, chainId))
        .orderBy(desc(renders.chainPosition));

      finalPosition = chainRenders.length > 0 
        ? (chainRenders[0].chainPosition || 0) + 1 
        : 0;
    }

    const [updatedRender] = await db
      .update(renders)
      .set({
        chainId,
        chainPosition: finalPosition,
        updatedAt: new Date(),
      })
      .where(eq(renders.id, renderId))
      .returning();

    console.log('✅ Render added to chain:', updatedRender.id);
    return updatedRender;
  }

  static async removeRender(chainId: string, renderId: string) {
    console.log('🔗 Removing render from chain:', { chainId, renderId });
    
    const [updatedRender] = await db
      .update(renders)
      .set({
        chainId: null,
        chainPosition: null,
        updatedAt: new Date(),
      })
      .where(eq(renders.id, renderId))
      .returning();

    console.log('✅ Render removed from chain:', updatedRender.id);
    return updatedRender;
  }

  static async getChainRenders(chainId: string) {
    console.log('🔍 Fetching renders for chain:', chainId);
    
    const chainRenders = await db
      .select()
      .from(renders)
      .where(eq(renders.chainId, chainId))
      .orderBy(desc(renders.chainPosition));

    console.log(`✅ Found ${chainRenders.length} renders in chain`);
    return chainRenders;
  }

  /**
   * Batch remove multiple renders from a chain in ONE query
   * ✅ OPTIMIZED: Prevents N+1 queries when deleting chains
   */
  static async batchRemoveRendersFromChain(renderIds: string[]) {
    if (renderIds.length === 0) return;
    
    console.log('🔗 Batch removing', renderIds.length, 'renders from chain');
    
    await db
      .update(renders)
      .set({
        chainId: null,
        chainPosition: null,
        updatedAt: new Date(),
      })
      .where(inArray(renders.id, renderIds));

    console.log('✅ Batch removed renders from chain');
  }

  // Batch method to get all chains for a user with renders in one query
  static async getUserChainsWithRenders(userId: string) {
    console.log('🔍 [BATCH] Fetching all chains with renders for user:', userId);
    
    // Get all user project IDs first
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.userId, userId));
    
    const projectIds = userProjects.map(p => p.id);
    
    if (projectIds.length === 0) {
      return [];
    }

    // Get all chains for these projects
    const chains = await db
      .select()
      .from(renderChains)
      .where(inArray(renderChains.projectId, projectIds))
      .orderBy(desc(renderChains.createdAt));

    console.log(`✅ [BATCH] Found ${chains.length} chains for user`);
    
    if (chains.length === 0) {
      return chains.map(chain => ({ ...chain, renders: [] }));
    }

    // Get all renders for these chains in one query
    const chainIds = chains.map(c => c.id);
    const allRenders = await db
      .select()
      .from(renders)
      .where(inArray(renders.chainId, chainIds))
      .orderBy(desc(renders.chainPosition));

    console.log(`✅ [BATCH] Found ${allRenders.length} total renders`);

    // Group renders by chain
    const rendersByChain = allRenders.reduce((acc, render) => {
      if (!render.chainId) return acc;
      if (!acc[render.chainId]) acc[render.chainId] = [];
      acc[render.chainId].push(render);
      return acc;
    }, {} as Record<string, typeof allRenders>);

    // Combine chains with their renders
    return chains.map(chain => ({
      ...chain,
      renders: rendersByChain[chain.id] || []
    }));
  }
}

