import { db } from '@/lib/db';
import { renderChains, renders, projects } from '@/lib/db/schema';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { CreateChainData, UpdateChainData } from '@/lib/types/render-chain';
import { logger } from '@/lib/utils/logger';

export class RenderChainsDAL {
  static async create(data: CreateChainData) {
    logger.log('📝 Creating render chain:', data);
    
    const [chain] = await db
      .insert(renderChains)
      .values({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
      })
      .returning();

    logger.log('✅ Render chain created:', chain.id);
    return chain;
  }

  static async getById(id: string) {
    logger.log('🔍 Fetching render chain by ID:', id);
    
    const [chain] = await db
      .select()
      .from(renderChains)
      .where(eq(renderChains.id, id))
      .limit(1);

    return chain;
  }

  static async getByProjectId(projectId: string) {
    logger.log('🔍 Fetching render chains for project:', projectId);
    
    const chains = await db
      .select()
      .from(renderChains)
      .where(eq(renderChains.projectId, projectId))
      .orderBy(desc(renderChains.createdAt));

    logger.log(`✅ Found ${chains.length} chains for project`);
    return chains;
  }

  /**
   * ✅ OPTIMIZED: Batch get chains for multiple projects in ONE query
   * This replaces sequential calls to getByProjectId for each project
   */
  static async getByProjectIds(projectIds: string[]) {
    if (projectIds.length === 0) return [];
    
    logger.log('🔍 [BATCH] Fetching render chains for', projectIds.length, 'projects');
    
    const chains = await db
      .select()
      .from(renderChains)
      .where(inArray(renderChains.projectId, projectIds))
      .orderBy(desc(renderChains.createdAt));

    logger.log(`✅ [BATCH] Found ${chains.length} chains for ${projectIds.length} projects`);
    return chains;
  }

  static async update(id: string, data: UpdateChainData) {
    logger.log('🔄 Updating render chain:', { id, data });
    
    const [updatedChain] = await db
      .update(renderChains)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(renderChains.id, id))
      .returning();

    logger.log('✅ Render chain updated:', updatedChain.id);
    return updatedChain;
  }

  static async delete(id: string) {
    logger.log('🗑️ Deleting render chain:', id);
    
    await db
      .delete(renderChains)
      .where(eq(renderChains.id, id));

    logger.log('✅ Render chain deleted:', id);
  }

  static async addRender(chainId: string, renderId: string, position?: number) {
    logger.log('🔗 Adding render to chain:', { chainId, renderId, position });
    
    // ✅ OPTIMIZED: Use SQL subquery to calculate position in single query
    // This eliminates the need for a separate query to get max position
    if (position === undefined) {
      const [updatedRender] = await db
        .update(renders)
        .set({
          chainId,
          chainPosition: sql`COALESCE((SELECT MAX(${renders.chainPosition}) FROM ${renders} WHERE ${renders.chainId} = ${chainId}), -1) + 1`,
          updatedAt: new Date(),
        })
        .where(eq(renders.id, renderId))
        .returning();

      logger.log('✅ Render added to chain:', updatedRender.id);
      return updatedRender;
    } else {
      // Position specified, use it directly
      const [updatedRender] = await db
        .update(renders)
        .set({
          chainId,
          chainPosition: position,
          updatedAt: new Date(),
        })
        .where(eq(renders.id, renderId))
        .returning();

      logger.log('✅ Render added to chain:', updatedRender.id);
      return updatedRender;
    }
  }

  static async removeRender(chainId: string, renderId: string) {
    logger.log('🔗 Removing render from chain:', { chainId, renderId });
    
    const [updatedRender] = await db
      .update(renders)
      .set({
        chainId: null,
        chainPosition: null,
        updatedAt: new Date(),
      })
      .where(eq(renders.id, renderId))
      .returning();

    logger.log('✅ Render removed from chain:', updatedRender.id);
    return updatedRender;
  }

  static async getChainRenders(chainId: string) {
    logger.log('🔍 Fetching renders for chain:', chainId);
    
    const chainRenders = await db
      .select()
      .from(renders)
      .where(eq(renders.chainId, chainId))
      .orderBy(desc(renders.chainPosition));

    logger.log(`✅ Found ${chainRenders.length} renders in chain`);
    return chainRenders;
  }

  /**
   * ✅ OPTIMIZED: Get chain with all renders in parallel queries
   * This reduces from sequential 2 queries to parallel 2 queries
   * Note: Can't use single JOIN because one chain has many renders (1-to-many relationship)
   */
  static async getChainWithRenders(chainId: string) {
    logger.log('🔍 [OPTIMIZED] Fetching chain with renders in parallel:', chainId);
    
    // ✅ OPTIMIZED: Fetch chain and renders in parallel (2 queries simultaneously)
    const [chainResult, rendersResult] = await Promise.all([
      db
        .select()
        .from(renderChains)
        .where(eq(renderChains.id, chainId))
        .limit(1),
      db
        .select()
        .from(renders)
        .where(eq(renders.chainId, chainId))
        .orderBy(renders.chainPosition)
    ]);

    const [chain] = chainResult;
    
    if (!chain) {
      return null;
    }

    logger.log(`✅ [OPTIMIZED] Found chain with ${rendersResult.length} renders (parallel fetch)`);

    return {
      ...chain,
      renders: rendersResult,
    };
  }

  /**
   * Batch remove multiple renders from a chain in ONE query
   * ✅ OPTIMIZED: Prevents N+1 queries when deleting chains
   */
  static async batchRemoveRendersFromChain(renderIds: string[]) {
    if (renderIds.length === 0) return;
    
    logger.log('🔗 Batch removing', renderIds.length, 'renders from chain');
    
    await db
      .update(renders)
      .set({
        chainId: null,
        chainPosition: null,
        updatedAt: new Date(),
      })
      .where(inArray(renders.id, renderIds));

    logger.log('✅ Batch removed renders from chain');
  }

  // ✅ OPTIMIZED: Batch method to get all chains for a user with renders using JOINs
  // This reduces from 3 queries to 2 queries (could be 1 with a more complex JOIN, but this is clearer)
  static async getUserChainsWithRenders(userId: string) {
    logger.log('🔍 [BATCH] Fetching all chains with renders for user:', userId);
    
    // Get all user project IDs first (single query)
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.userId, userId));
    
    const projectIds = userProjects.map(p => p.id);
    
    if (projectIds.length === 0) {
      return [];
    }

    // ✅ OPTIMIZED: Get chains and renders in parallel (2 queries instead of sequential)
    const [chains, allRenders] = await Promise.all([
      // Get all chains for these projects
      db
        .select()
        .from(renderChains)
        .where(inArray(renderChains.projectId, projectIds))
        .orderBy(desc(renderChains.createdAt)),
      // Get all renders for user's projects in one query (using projectId join)
      db
        .select({
          render: renders,
          chainId: renders.chainId,
        })
        .from(renders)
        .innerJoin(renderChains, eq(renders.chainId, renderChains.id))
        .where(inArray(renderChains.projectId, projectIds))
        .orderBy(desc(renders.chainPosition))
    ]);

    logger.log(`✅ [BATCH] Found ${chains.length} chains and ${allRenders.length} renders for user`);

    // Group renders by chain
    const rendersByChain = allRenders.reduce((acc, { render, chainId }) => {
      if (!chainId || !render) return acc;
      if (!acc[chainId]) acc[chainId] = [];
      acc[chainId].push(render);
      return acc;
    }, {} as Record<string, typeof allRenders[0]['render'][]>);

    // Combine chains with their renders
    return chains.map(chain => ({
      ...chain,
      renders: rendersByChain[chain.id] || []
    }));
  }
}

