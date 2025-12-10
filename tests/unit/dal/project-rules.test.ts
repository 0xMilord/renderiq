/**
 * Comprehensive unit tests for ProjectRulesDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectRulesDAL } from '@/lib/dal/project-rules';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject, createTestRenderChain, getTestDB } from '../../fixtures/database';
import { projectRules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('ProjectRulesDAL', () => {
  let testUser: any;
  let testProject: any;
  let testChain: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id);
    testChain = await createTestRenderChain(testProject.id);
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('create', () => {
    it('should create a new project rule', async () => {
      const ruleData = {
        chainId: testChain.id,
        rule: 'Always use modern style',
        isActive: true,
        order: 0,
      };

      const rule = await ProjectRulesDAL.create(ruleData);

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.chainId).toBe(testChain.id);
      expect(rule.rule).toBe('Always use modern style');
      expect(rule.isActive).toBe(true);
      expect(rule.order).toBe(0);
    });

    it('should create rule with default values', async () => {
      const ruleData = {
        chainId: testChain.id,
        rule: 'Test rule',
      };

      const rule = await ProjectRulesDAL.create(ruleData);

      expect(rule.isActive).toBe(true);
      expect(rule.order).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return rule by id', async () => {
      const db = getTestDB();
      const [rule] = await db.insert(projectRules).values({
        chainId: testChain.id,
        rule: 'Test rule',
      }).returning();

      const result = await ProjectRulesDAL.getById(rule.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(rule.id);
    });

    it('should return null for non-existent rule', async () => {
      const result = await ProjectRulesDAL.getById('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('getActiveRulesByChainId', () => {
    it('should return only active rules for chain', async () => {
      const db = getTestDB();
      await db.insert(projectRules).values([
        {
          chainId: testChain.id,
          rule: 'Active rule 1',
          isActive: true,
          order: 0,
        },
        {
          chainId: testChain.id,
          rule: 'Active rule 2',
          isActive: true,
          order: 1,
        },
        {
          chainId: testChain.id,
          rule: 'Inactive rule',
          isActive: false,
          order: 2,
        },
      ]);

      const rules = await ProjectRulesDAL.getActiveRulesByChainId(testChain.id);

      expect(rules.length).toBe(2);
      expect(rules.every(r => r.isActive)).toBe(true);
    });

    it('should order rules by order and createdAt', async () => {
      const db = getTestDB();
      await db.insert(projectRules).values([
        {
          chainId: testChain.id,
          rule: 'Rule 1',
          isActive: true,
          order: 1,
        },
        {
          chainId: testChain.id,
          rule: 'Rule 0',
          isActive: true,
          order: 0,
        },
      ]);

      const rules = await ProjectRulesDAL.getActiveRulesByChainId(testChain.id);

      expect(rules[0].order).toBeLessThanOrEqual(rules[1].order);
    });

    it('should return empty array when no active rules exist', async () => {
      const db = getTestDB();
      await db.insert(projectRules).values({
        chainId: testChain.id,
        rule: 'Inactive rule',
        isActive: false,
      });

      const rules = await ProjectRulesDAL.getActiveRulesByChainId(testChain.id);

      expect(rules).toEqual([]);
    });
  });

  describe('getAllRulesByChainId', () => {
    it('should return all rules including inactive', async () => {
      const db = getTestDB();
      await db.insert(projectRules).values([
        {
          chainId: testChain.id,
          rule: 'Active rule',
          isActive: true,
        },
        {
          chainId: testChain.id,
          rule: 'Inactive rule',
          isActive: false,
        },
      ]);

      const rules = await ProjectRulesDAL.getAllRulesByChainId(testChain.id);

      expect(rules.length).toBe(2);
    });
  });

  describe('update', () => {
    it('should update rule fields', async () => {
      const db = getTestDB();
      const [rule] = await db.insert(projectRules).values({
        chainId: testChain.id,
        rule: 'Original rule',
        isActive: true,
        order: 0,
      }).returning();

      const updated = await ProjectRulesDAL.update(rule.id, {
        rule: 'Updated rule',
        isActive: false,
        order: 1,
      });

      expect(updated.rule).toBe('Updated rule');
      expect(updated.isActive).toBe(false);
      expect(updated.order).toBe(1);
    });

    it('should update single field', async () => {
      const db = getTestDB();
      const [rule] = await db.insert(projectRules).values({
        chainId: testChain.id,
        rule: 'Test rule',
        isActive: true,
      }).returning();

      const updated = await ProjectRulesDAL.update(rule.id, {
        isActive: false,
      });

      expect(updated.isActive).toBe(false);
      expect(updated.rule).toBe('Test rule'); // Unchanged
    });

    it('should throw error for non-existent rule', async () => {
      await expect(
        ProjectRulesDAL.update('00000000-0000-0000-0000-000000000000', {
          rule: 'Updated',
        })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete rule', async () => {
      const db = getTestDB();
      const [rule] = await db.insert(projectRules).values({
        chainId: testChain.id,
        rule: 'To be deleted',
      }).returning();

      await ProjectRulesDAL.delete(rule.id);

      const deleted = await ProjectRulesDAL.getById(rule.id);
      expect(deleted).toBeNull();
    });
  });

  describe('getActiveRulesByChainIds', () => {
    it('should return active rules for multiple chains', async () => {
      const chain2 = await createTestRenderChain(testProject.id);
      const db = getTestDB();
      await db.insert(projectRules).values([
        {
          chainId: testChain.id,
          rule: 'Chain 1 rule',
          isActive: true,
        },
        {
          chainId: chain2.id,
          rule: 'Chain 2 rule',
          isActive: true,
        },
        {
          chainId: testChain.id,
          rule: 'Inactive rule',
          isActive: false,
        },
      ]);

      const rulesByChain = await ProjectRulesDAL.getActiveRulesByChainIds([testChain.id, chain2.id]);

      expect(rulesByChain[testChain.id]).toBeDefined();
      expect(rulesByChain[chain2.id]).toBeDefined();
      expect(rulesByChain[testChain.id].length).toBe(1);
      expect(rulesByChain[chain2.id].length).toBe(1);
    });

    it('should return empty object for empty chain ids', async () => {
      const rulesByChain = await ProjectRulesDAL.getActiveRulesByChainIds([]);

      expect(rulesByChain).toEqual({});
    });

    it('should return empty array for chain with no active rules', async () => {
      const chain2 = await createTestRenderChain(testProject.id);
      const rulesByChain = await ProjectRulesDAL.getActiveRulesByChainIds([chain2.id]);

      expect(rulesByChain[chain2.id]).toEqual([]);
    });
  });
});

