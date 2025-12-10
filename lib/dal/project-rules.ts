import { db } from '@/lib/db';
import { projectRules } from '@/lib/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';
import type { NewProjectRule, ProjectRule } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';

export class ProjectRulesDAL {
  /**
   * Get all active rules for a chain
   */
  static async getActiveRulesByChainId(chainId: string): Promise<ProjectRule[]> {
    logger.log('📋 ProjectRulesDAL: Getting active rules for chain:', chainId);
    try {
      const rules = await db
        .select()
        .from(projectRules)
        .where(
          and(
            eq(projectRules.chainId, chainId),
            eq(projectRules.isActive, true)
          )
        )
        .orderBy(asc(projectRules.order), asc(projectRules.createdAt));
      
      logger.log(`✅ ProjectRulesDAL: Found ${rules.length} active rules`);
      return rules;
    } catch (error) {
      logger.error('❌ ProjectRulesDAL: Error getting active rules:', error);
      throw error;
    }
  }

  /**
   * Get all rules for a chain (including inactive)
   */
  static async getAllRulesByChainId(chainId: string): Promise<ProjectRule[]> {
    logger.log('📋 ProjectRulesDAL: Getting all rules for chain:', chainId);
    try {
      const rules = await db
        .select()
        .from(projectRules)
        .where(eq(projectRules.chainId, chainId))
        .orderBy(asc(projectRules.order), asc(projectRules.createdAt));
      
      logger.log(`✅ ProjectRulesDAL: Found ${rules.length} rules`);
      return rules;
    } catch (error) {
      logger.error('❌ ProjectRulesDAL: Error getting all rules:', error);
      throw error;
    }
  }

  /**
   * Create a new project rule
   */
  static async create(ruleData: NewProjectRule): Promise<ProjectRule> {
    logger.log('📋 ProjectRulesDAL: Creating new rule:', ruleData);
    try {
      const [rule] = await db
        .insert(projectRules)
        .values(ruleData)
        .returning();
      
      logger.log('✅ ProjectRulesDAL: Rule created:', rule.id);
      return rule;
    } catch (error) {
      logger.error('❌ ProjectRulesDAL: Error creating rule:', error);
      throw error;
    }
  }

  /**
   * Update a project rule
   */
  static async update(id: string, updates: Partial<Omit<ProjectRule, 'id' | 'chainId' | 'createdAt'>>): Promise<ProjectRule> {
    logger.log('📋 ProjectRulesDAL: Updating rule:', id, updates);
    try {
      const [rule] = await db
        .update(projectRules)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(projectRules.id, id))
        .returning();
      
      if (!rule) {
        throw new Error('Rule not found');
      }
      
      logger.log('✅ ProjectRulesDAL: Rule updated:', id);
      return rule;
    } catch (error) {
      logger.error('❌ ProjectRulesDAL: Error updating rule:', error);
      throw error;
    }
  }

  /**
   * Delete a project rule
   */
  static async delete(id: string): Promise<void> {
    logger.log('📋 ProjectRulesDAL: Deleting rule:', id);
    try {
      await db
        .delete(projectRules)
        .where(eq(projectRules.id, id));
      
      logger.log('✅ ProjectRulesDAL: Rule deleted:', id);
    } catch (error) {
      logger.error('❌ ProjectRulesDAL: Error deleting rule:', error);
      throw error;
    }
  }

  /**
   * Get a rule by ID
   */
  static async getById(id: string): Promise<ProjectRule | null> {
    logger.log('📋 ProjectRulesDAL: Getting rule by ID:', id);
    try {
      const [rule] = await db
        .select()
        .from(projectRules)
        .where(eq(projectRules.id, id));
      
      return rule || null;
    } catch (error) {
      logger.error('❌ ProjectRulesDAL: Error getting rule by ID:', error);
      throw error;
    }
  }

  /**
   * ✅ OPTIMIZED: Batch operation for getting active rules for multiple chains
   * Returns rules grouped by chainId
   */
  static async getActiveRulesByChainIds(chainIds: string[]): Promise<Record<string, ProjectRule[]>> {
    if (chainIds.length === 0) return {};
    
    logger.log('📋 ProjectRulesDAL: Batch getting active rules for', chainIds.length, 'chains');
    try {
      const rules = await db
        .select()
        .from(projectRules)
        .where(
          and(
            inArray(projectRules.chainId, chainIds),
            eq(projectRules.isActive, true)
          )
        )
        .orderBy(asc(projectRules.order), asc(projectRules.createdAt));
      
      // Group by chainId
      const rulesByChain = rules.reduce((acc, rule) => {
        if (!acc[rule.chainId]) acc[rule.chainId] = [];
        acc[rule.chainId].push(rule);
        return acc;
      }, {} as Record<string, ProjectRule[]>);
      
      logger.log(`✅ ProjectRulesDAL: Found rules for ${Object.keys(rulesByChain).length} chains`);
      return rulesByChain;
    } catch (error) {
      logger.error('❌ ProjectRulesDAL: Error batch getting active rules:', error);
      throw error;
    }
  }
}

