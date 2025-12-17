import { db } from './index';
import { taskCategories, tasks } from './schema';
import { logger } from '@/lib/utils/logger';

/**
 * Seed script for tasks system
 * ✅ VC-SAFE MVP: Only product-native tasks
 * Run with: npx tsx -r tsconfig-paths/register lib/db/seed-tasks.ts
 */

export async function seedTaskCategories() {
  // ✅ VC-SAFE: Only one category for MVP - Core Usage
  const categories = [
    {
      name: 'Core Usage',
      slug: 'daily',
      description: 'Earn credits by using Renderiq',
      icon: 'sparkles',
      displayOrder: 1,
      isActive: true,
    },
  ];

  const categoryMap = new Map<string, string>();

  for (const category of categories) {
    const [inserted] = await db
      .insert(taskCategories)
      .values(category)
      .onConflictDoUpdate({
        target: taskCategories.slug,
        set: {
          name: category.name,
          description: category.description,
          icon: category.icon,
          displayOrder: category.displayOrder,
          isActive: category.isActive,
          updatedAt: new Date(),
        },
      })
      .returning({ id: taskCategories.id });

    categoryMap.set(category.slug, inserted.id);
  }

  logger.log('✅ Task categories seeded successfully');
  return categoryMap;
}

export async function seedTasks(categoryMap: Map<string, string>) {
  // ✅ VC-SAFE: Only product-native tasks (no social/reviews/referrals)
  // Focus: Behavioral signal, not manufactured activity
  const allTasks = [
    // Category 1: Core Usage (Product-Native Only)
    // ✅ VC-SAFE: Only reward actions that happen inside Renderiq

    // ✅ VC-SAFE MVP: Only 6 core product-native tasks
    {
      categorySlug: 'daily',
      name: 'Daily Login',
      slug: 'daily-login',
      description: 'Log in to Renderiq daily',
      instructions: 'Simply log in to your Renderiq account. Earn more with streaks!',
      creditsReward: 1, // Base, uses linear streak (max 3/day)
      verificationType: 'automatic' as const,
      verificationConfig: { useStreak: true, baseCredits: 1, maxDaily: 3 },
      cooldownHours: 24,
      maxCompletions: null,
      displayOrder: 1,
    },
    {
      categorySlug: 'daily',
      name: 'Create a Render',
      slug: 'create-render',
      description: 'Create a render today',
      instructions: 'Create any render using Renderiq',
      creditsReward: 1,
      verificationType: 'automatic' as const,
      verificationConfig: { event: 'render_created' },
      cooldownHours: 24,
      maxCompletions: null,
      displayOrder: 2,
    },
    {
      categorySlug: 'daily',
      name: 'Refine a Render',
      slug: 'refine-render',
      description: 'Refine an existing render',
      instructions: 'Edit or refine a render you\'ve already created',
      creditsReward: 1,
      verificationType: 'automatic' as const,
      verificationConfig: { event: 'render_refined' },
      cooldownHours: 24,
      maxCompletions: null,
      displayOrder: 3,
    },
    {
      categorySlug: 'daily',
      name: 'Use Same Project Twice',
      slug: 'reuse-project',
      description: 'Use the same project twice in 7 days',
      instructions: 'Return to a project you used earlier this week',
      creditsReward: 3,
      verificationType: 'automatic' as const,
      verificationConfig: { event: 'project_reused', days: 7 },
      cooldownHours: 168, // 7 days
      maxCompletions: null,
      displayOrder: 4,
    },
    {
      categorySlug: 'daily',
      name: 'Use 2 Different Tools',
      slug: 'use-2-tools',
      description: 'Use 2 different tools in a week',
      instructions: 'Try out at least 2 different tools from the Apps section',
      creditsReward: 3,
      verificationType: 'automatic' as const,
      verificationConfig: { event: 'tools_used', count: 2, days: 7 },
      cooldownHours: 168, // 7 days
      maxCompletions: null,
      displayOrder: 5,
    },
    {
      categorySlug: 'daily',
      name: 'Export a Render',
      slug: 'export-render',
      description: 'Export a render',
      instructions: 'Download or export one of your renders',
      creditsReward: 1,
      verificationType: 'automatic' as const,
      verificationConfig: { event: 'render_exported' },
      cooldownHours: 24,
      maxCompletions: null,
      displayOrder: 6,
    },
  ];

  for (const taskData of allTasks) {
    const categoryId = categoryMap.get(taskData.categorySlug);
    if (!categoryId) {
      logger.warn(`⚠️ Category not found: ${taskData.categorySlug}`);
      continue;
    }

    await db
      .insert(tasks)
      .values({
        categoryId,
        name: taskData.name,
        slug: taskData.slug,
        description: taskData.description,
        instructions: taskData.instructions,
        creditsReward: taskData.creditsReward,
        verificationType: taskData.verificationType,
        verificationConfig: taskData.verificationConfig,
        cooldownHours: taskData.cooldownHours,
        maxCompletions: taskData.maxCompletions,
        displayOrder: taskData.displayOrder,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: tasks.slug,
        set: {
          name: taskData.name,
          description: taskData.description,
          instructions: taskData.instructions,
          creditsReward: taskData.creditsReward,
          verificationType: taskData.verificationType,
          verificationConfig: taskData.verificationConfig,
          cooldownHours: taskData.cooldownHours,
          maxCompletions: taskData.maxCompletions,
          displayOrder: taskData.displayOrder,
          updatedAt: new Date(),
        },
      });
  }

  logger.log('✅ Tasks seeded successfully');
}

export async function seedTasksDatabase() {
  try {
    logger.log('🌱 Starting tasks database seeding...');
    const categoryMap = await seedTaskCategories();
    await seedTasks(categoryMap);
    logger.log('🎉 Tasks database seeding completed successfully');
  } catch (error) {
    console.error('❌ Tasks database seeding failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedTasksDatabase()
    .then(() => {
      logger.log('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}
