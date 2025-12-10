/**
 * Migration script to populate the tools table with all registered tools
 * Run this script to sync tools from the registry to the database
 * 
 * Usage: npx tsx scripts/populate-tools-table.ts
 */

import { db } from '@/lib/db';
import { tools } from '@/lib/db/schema';
import { TOOLS } from '@/lib/tools/registry';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

async function populateToolsTable() {
  logger.log('🚀 Starting tools table population...');
  
  let created = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const toolConfig of TOOLS) {
    try {
      // Check if tool already exists
      const [existing] = await db
        .select()
        .from(tools)
        .where(eq(tools.slug, toolConfig.slug))
        .limit(1);
      
      const toolData = {
        slug: toolConfig.slug,
        name: toolConfig.name,
        description: toolConfig.description,
        category: toolConfig.category,
        systemPrompt: toolConfig.systemPrompt,
        inputType: toolConfig.inputType,
        outputType: toolConfig.outputType === 'video' ? 'video' : 'image', // Map to database enum
        icon: toolConfig.icon,
        color: toolConfig.color,
        priority: toolConfig.priority,
        status: toolConfig.status,
        seoMetadata: {
          title: toolConfig.seo.title,
          description: toolConfig.seo.description,
          keywords: toolConfig.seo.keywords,
        },
        isActive: true,
      };
      
      if (existing) {
        // Update existing tool
        await db
          .update(tools)
          .set({
            ...toolData,
            updatedAt: new Date(),
          })
          .where(eq(tools.id, existing.id));
        
        updated++;
        logger.log(`✅ Updated tool: ${toolConfig.slug}`);
      } else {
        // Create new tool
        await db.insert(tools).values(toolData);
        created++;
        logger.log(`✅ Created tool: ${toolConfig.slug}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to process tool ${toolConfig.slug}:`, error);
      skipped++;
    }
  }
  
  logger.log('🎉 Tools table population complete!', {
    created,
    updated,
    skipped,
    total: TOOLS.length,
  });
  
  process.exit(0);
}

// Run the migration
populateToolsTable().catch((error) => {
  logger.error('❌ Migration failed:', error);
  process.exit(1);
});

