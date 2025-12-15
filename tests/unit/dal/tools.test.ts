/**
 * Comprehensive unit tests for ToolsDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ToolsDAL } from '@/lib/dal/tools';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject, createTestTool, getTestDB } from '../../fixtures/database';
import { tools, toolExecutions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('ToolsDAL', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id, { platform: 'tools' });
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('create', () => {
    it('should create a new tool', async () => {
      const toolData = {
        slug: 'test-tool',
        name: 'Test Tool',
        description: 'Test description',
        category: 'transformation' as const,
        systemPrompt: 'Test prompt',
        inputType: 'image' as const,
        outputType: 'image' as const,
      };

      const tool = await ToolsDAL.create(toolData);

      expect(tool).toBeDefined();
      expect(tool.id).toBeDefined();
      expect(tool.slug).toBe('test-tool');
      expect(tool.name).toBe('Test Tool');
      expect(tool.category).toBe('transformation');
      expect(tool.status).toBe('online');
      expect(tool.isActive).toBe(true);
    });

    it('should create tool with all optional fields', async () => {
      const toolData = {
        slug: 'full-tool',
        name: 'Full Tool',
        description: 'Description',
        category: 'floorplan' as const,
        systemPrompt: 'Prompt',
        inputType: 'image+text' as const,
        outputType: 'image' as const,
        icon: 'icon.svg',
        color: '#FF0000',
        priority: 'high' as const,
        status: 'online' as const,
        settingsSchema: { key: 'value' },
        defaultSettings: { setting: 'default' },
        seoMetadata: {
          title: 'SEO Title',
          description: 'SEO Description',
          keywords: ['keyword1', 'keyword2'],
        },
        metadata: { meta: 'data' },
      };

      const tool = await ToolsDAL.create(toolData);

      expect(tool.icon).toBe('icon.svg');
      expect(tool.color).toBe('#FF0000');
      expect(tool.priority).toBe('high');
      expect(tool.seoMetadata).toEqual(toolData.seoMetadata);
    });

    it('should throw error on duplicate slug', async () => {
      const toolData = {
        slug: 'duplicate-slug',
        name: 'Tool 1',
        category: 'transformation' as const,
        systemPrompt: 'Prompt',
        inputType: 'image' as const,
        outputType: 'image' as const,
      };

      await ToolsDAL.create(toolData);

      await expect(ToolsDAL.create(toolData)).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('should return tool by id', async () => {
      const testTool = await createTestTool();
      const tool = await ToolsDAL.getById(testTool.id);

      expect(tool).toBeDefined();
      expect(tool?.id).toBe(testTool.id);
    });

    it('should return null for non-existent tool', async () => {
      const tool = await ToolsDAL.getById('00000000-0000-0000-0000-000000000000');
      expect(tool).toBeNull();
    });
  });

  describe('getBySlug', () => {
    it('should return tool by slug', async () => {
      const testTool = await createTestTool({ slug: 'find-me-tool' });
      const tool = await ToolsDAL.getBySlug('find-me-tool');

      expect(tool).toBeDefined();
      expect(tool?.id).toBe(testTool.id);
    });

    it('should return null for non-existent slug', async () => {
      const tool = await ToolsDAL.getBySlug('non-existent');
      expect(tool).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all active tools', async () => {
      await createTestTool({ isActive: true, status: 'online' });
      await createTestTool({ isActive: true, status: 'online' });
      await createTestTool({ isActive: false, status: 'offline' });

      const allTools = await ToolsDAL.getAll();

      expect(allTools.length).toBeGreaterThanOrEqual(2);
      expect(allTools.every(t => t.isActive && t.status === 'online')).toBe(true);
    });

    it('should include inactive tools when requested', async () => {
      await createTestTool({ isActive: true });
      await createTestTool({ isActive: false });

      const allTools = await ToolsDAL.getAll(true);

      expect(allTools.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getByCategory', () => {
    it('should return tools by category', async () => {
      await createTestTool({ category: 'transformation' });
      await createTestTool({ category: 'floorplan' });
      await createTestTool({ category: 'transformation' });

      const transformationTools = await ToolsDAL.getByCategory('transformation');

      expect(transformationTools.length).toBeGreaterThanOrEqual(2);
      expect(transformationTools.every(t => t.category === 'transformation')).toBe(true);
    });

    it('should exclude inactive tools by default', async () => {
      await createTestTool({ category: 'transformation', isActive: true });
      await createTestTool({ category: 'transformation', isActive: false });

      const tools = await ToolsDAL.getByCategory('transformation');

      expect(tools.every(t => t.isActive)).toBe(true);
    });
  });

  describe('getByOutputType', () => {
    it('should return tools by output type', async () => {
      await createTestTool({ outputType: 'image' });
      await createTestTool({ outputType: 'video' });
      await createTestTool({ outputType: 'image' });

      const imageTools = await ToolsDAL.getByOutputType('image');

      expect(imageTools.length).toBeGreaterThanOrEqual(2);
      expect(imageTools.every(t => t.outputType === 'image')).toBe(true);
    });
  });

  describe('getToolsByIds', () => {
    it('should return multiple tools by ids', async () => {
      const tool1 = await createTestTool();
      const tool2 = await createTestTool();
      const tool3 = await createTestTool();

      const tools = await ToolsDAL.getToolsByIds([tool1.id, tool2.id, tool3.id]);

      expect(tools.length).toBe(3);
      expect(tools.map(t => t.id).sort()).toEqual([tool1.id, tool2.id, tool3.id].sort());
    });

    it('should return empty array for empty ids', async () => {
      const tools = await ToolsDAL.getToolsByIds([]);
      expect(tools).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update tool fields', async () => {
      const tool = await createTestTool();

      const updated = await ToolsDAL.update(tool.id, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.description).toBe('Updated description');
    });

    it('should update tool status', async () => {
      const tool = await createTestTool();

      const updated = await ToolsDAL.update(tool.id, {
        status: 'offline',
      });

      expect(updated?.status).toBe('offline');
    });

    it('should return null for non-existent tool', async () => {
      const updated = await ToolsDAL.update('00000000-0000-0000-0000-000000000000', {
        name: 'Updated',
      });

      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete tool by setting isActive to false', async () => {
      const tool = await createTestTool();

      await ToolsDAL.delete(tool.id);

      const deleted = await ToolsDAL.getById(tool.id);
      expect(deleted?.isActive).toBe(false);
    });
  });

  describe('createExecution', () => {
    it('should create tool execution', async () => {
      const tool = await createTestTool();
      const executionData = {
        toolId: tool.id,
        projectId: testProject.id,
        userId: testUser.id,
        inputText: 'Test input',
        executionConfig: { config: 'value' },
      };

      const execution = await ToolsDAL.createExecution(executionData);

      expect(execution).toBeDefined();
      expect(execution.toolId).toBe(tool.id);
      expect(execution.status).toBe('pending');
    });

    it('should create execution with input images', async () => {
      const tool = await createTestTool();
      const executionData = {
        toolId: tool.id,
        projectId: testProject.id,
        userId: testUser.id,
        inputImages: [
          { url: 'https://example.com/image.jpg', key: 'images/image.jpg' },
        ],
        executionConfig: { config: 'value' },
      };

      const execution = await ToolsDAL.createExecution(executionData);

      expect(execution.inputImages).toEqual(executionData.inputImages);
    });
  });

  describe('getExecutionById', () => {
    it('should return execution by id', async () => {
      const tool = await createTestTool();
      const db = getTestDB();
      const [execution] = await db.insert(toolExecutions).values({
        toolId: tool.id,
        projectId: testProject.id,
        userId: testUser.id,
        executionConfig: {},
        status: 'pending',
      }).returning();

      const result = await ToolsDAL.getExecutionById(execution.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(execution.id);
    });

    it('should return null for non-existent execution', async () => {
      const result = await ToolsDAL.getExecutionById('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('getExecutionsByTool', () => {
    it('should return executions for tool', async () => {
      const tool = await createTestTool();
      const db = getTestDB();
      await db.insert(toolExecutions).values([
        {
          toolId: tool.id,
          projectId: testProject.id,
          userId: testUser.id,
          executionConfig: {},
          status: 'pending',
        },
        {
          toolId: tool.id,
          projectId: testProject.id,
          userId: testUser.id,
          executionConfig: {},
          status: 'completed',
        },
      ]);

      const executions = await ToolsDAL.getExecutionsByTool(tool.id);

      expect(executions.length).toBeGreaterThanOrEqual(2);
      expect(executions.every(e => e.toolId === tool.id)).toBe(true);
    });

    it('should filter by user when provided', async () => {
      const tool = await createTestTool();
      const user2 = await createTestUser();
      const db = getTestDB();
      await db.insert(toolExecutions).values([
        {
          toolId: tool.id,
          projectId: testProject.id,
          userId: testUser.id,
          executionConfig: {},
          status: 'pending',
        },
        {
          toolId: tool.id,
          projectId: testProject.id,
          userId: user2.id,
          executionConfig: {},
          status: 'pending',
        },
      ]);

      const executions = await ToolsDAL.getExecutionsByTool(tool.id, testUser.id);

      expect(executions.every(e => e.userId === testUser.id)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const tool = await createTestTool();
      const db = getTestDB();
      for (let i = 0; i < 10; i++) {
        await db.insert(toolExecutions).values({
          toolId: tool.id,
          projectId: testProject.id,
          userId: testUser.id,
          executionConfig: {},
          status: 'pending',
        });
      }

      const executions = await ToolsDAL.getExecutionsByTool(tool.id, undefined, 5);

      expect(executions.length).toBe(5);
    });
  });

  describe('getExecutionsByProject', () => {
    it('should return executions for project', async () => {
      const tool = await createTestTool();
      const db = getTestDB();
      await db.insert(toolExecutions).values({
        toolId: tool.id,
        projectId: testProject.id,
        userId: testUser.id,
        executionConfig: {},
        status: 'pending',
      });

      const executions = await ToolsDAL.getExecutionsByProject(testProject.id);

      expect(executions.length).toBeGreaterThanOrEqual(1);
      expect(executions.every(e => e.projectId === testProject.id)).toBe(true);
    });
  });

  describe('getExecutionsByUser', () => {
    it('should return executions for user', async () => {
      const tool = await createTestTool();
      const db = getTestDB();
      await db.insert(toolExecutions).values({
        toolId: tool.id,
        projectId: testProject.id,
        userId: testUser.id,
        executionConfig: {},
        status: 'pending',
      });

      const executions = await ToolsDAL.getExecutionsByUser(testUser.id);

      expect(executions.length).toBeGreaterThanOrEqual(1);
      expect(executions.every(e => e.userId === testUser.id)).toBe(true);
    });
  });
});







