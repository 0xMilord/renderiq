/**
 * Seed script for tasks system
 * P0: Internal tasks (daily engagement, product usage)
 * P1: Social follows (Twitter, LinkedIn, Instagram, YouTube, GitHub, etc.)
 * Run with: npx tsx -r tsconfig-paths/register lib/db/seed-tasks.ts
 */

// CRITICAL: Load environment variables BEFORE any other imports
// This must happen first because database connection requires DATABASE_URL
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach((line: string) => {
      // Skip comments and empty lines
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    });
  } catch (e) {
    console.error('⚠️  Warning: Failed to load .env.local:', e);
  }
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is not set after loading .env.local');
  console.error('   Please ensure .env.local exists and contains DATABASE_URL');
  process.exit(1);
}

export async function seedTaskCategories() {
  // Dynamic imports to ensure env vars are loaded first
  const { db } = await import('./index');
  const { taskCategories } = await import('./schema');
  const { logger } = await import('@/lib/utils/logger');
  const categories = [
    {
      name: 'Daily Engagement',
      slug: 'daily',
      description: 'Earn credits by using Renderiq daily',
      icon: 'sparkles',
      displayOrder: 1,
      isActive: true,
    },
    {
      name: 'Social Media',
      slug: 'social-media',
      description: 'Follow us on social media and share Renderiq',
      icon: 'share-2',
      displayOrder: 2,
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
  // Dynamic imports to ensure env vars are loaded first
  const { db } = await import('./index');
  const { tasks } = await import('./schema');
  const { logger } = await import('@/lib/utils/logger');
  
  const allTasks = [
    // ============================================================================
    // P0: INTERNAL TASKS (Daily Engagement)
    // ============================================================================
    {
      categorySlug: 'daily',
      name: 'Daily Login',
      slug: 'daily-login',
      description: 'Log in to Renderiq daily',
      instructions: 'Simply log in to your Renderiq account. Earn more with streaks! The longer your streak, the more credits you earn!',
      creditsReward: 1, // Base, uses quadratic streak formula: base * (streak^2 / 4)
      verificationType: 'automatic' as const,
      verificationConfig: { 
        useStreak: true, 
        baseCredits: 1, 
        formula: 'quadratic', // Uses streak^2 / 4 formula
        maxDaily: 500 // Cap at 500 credits per day
      },
      cooldownHours: 24,
      maxCompletions: null,
      displayOrder: 1,
    },
    {
      categorySlug: 'daily',
      name: 'Create a Render',
      slug: 'create-render',
      description: 'Create a render today',
      instructions: 'Create any render using Renderiq. You can create renders from the Render page or through the chat interface.',
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
      instructions: 'Edit or refine a render you\'ve already created. Use the chat interface to iterate on your designs.',
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
      instructions: 'Return to a project you used earlier this week. This helps you build consistent workflows.',
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
      instructions: 'Try out at least 2 different tools from the Apps section. Explore our 24 specialized AI tools!',
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
      instructions: 'Download or export one of your renders. Share your creations with the world!',
      creditsReward: 1,
      verificationType: 'automatic' as const,
      verificationConfig: { event: 'render_exported' },
      cooldownHours: 24,
      maxCompletions: null,
      displayOrder: 6,
    },
    {
      categorySlug: 'daily',
      name: 'Create a Project',
      slug: 'create-project',
      description: 'Create a new project',
      instructions: 'Create a new project from the dashboard. Projects help you organize your work.',
      creditsReward: 1,
      verificationType: 'automatic' as const,
      verificationConfig: { event: 'project_created' },
      cooldownHours: 24,
      maxCompletions: null,
      displayOrder: 7,
    },
    {
      categorySlug: 'daily',
      name: 'Complete Onboarding',
      slug: 'complete-onboarding',
      description: 'Complete your account setup',
      instructions: 'Finish setting up your Renderiq account. Add your profile picture, bio, and preferences.',
      creditsReward: 2,
      verificationType: 'automatic' as const,
      verificationConfig: { event: 'onboarding_completed' },
      cooldownHours: 0, // One-time
      maxCompletions: 1,
      displayOrder: 8,
    },

    // ============================================================================
    // P1: SOCIAL FOLLOWS (Social Media Engagement)
    // ============================================================================
    {
      categorySlug: 'social-media',
      name: 'Follow on Twitter/X',
      slug: 'follow-twitter',
      description: 'Follow @renderiq on Twitter/X',
      instructions: 'Follow our Twitter/X account @renderiq. Connect your Twitter account for automatic verification, or submit a screenshot.',
      creditsReward: 1,
      verificationType: 'api_verification' as const,
      verificationConfig: { 
        platform: 'twitter',
        username: 'renderiq',
        apiMethod: 'follow_check',
        fallbackToManual: true // Allow screenshot if API unavailable
      },
      cooldownHours: 0, // One-time
      maxCompletions: 1,
      displayOrder: 1,
    },
    {
      categorySlug: 'social-media',
      name: 'Follow on LinkedIn',
      slug: 'follow-linkedin',
      description: 'Follow Renderiq on LinkedIn',
      instructions: 'Follow our LinkedIn company page. Submit the link to your LinkedIn profile showing you follow us.',
      creditsReward: 1,
      verificationType: 'link_verification' as const,
      verificationConfig: { 
        platform: 'linkedin',
        urlPattern: 'linkedin.com',
        validateFormat: true
      },
      cooldownHours: 0, // One-time
      maxCompletions: 1,
      displayOrder: 2,
    },
    {
      categorySlug: 'social-media',
      name: 'Follow on Instagram',
      slug: 'follow-instagram',
      description: 'Follow @renderiq on Instagram',
      instructions: 'Follow our Instagram account @renderiq. Submit a screenshot showing you follow us.',
      creditsReward: 1,
      verificationType: 'screenshot' as const,
      verificationConfig: { 
        platform: 'instagram',
        username: 'renderiq',
        requiresManualReview: true
      },
      cooldownHours: 0, // One-time
      maxCompletions: 1,
      displayOrder: 3,
    },
    {
      categorySlug: 'social-media',
      name: 'Follow on YouTube',
      slug: 'follow-youtube',
      description: 'Subscribe to Renderiq on YouTube',
      instructions: 'Subscribe to our YouTube channel. Submit the link to your YouTube subscription or a screenshot.',
      creditsReward: 1,
      verificationType: 'link_verification' as const,
      verificationConfig: { 
        platform: 'youtube',
        urlPattern: 'youtube.com',
        validateFormat: true
      },
      cooldownHours: 0, // One-time
      maxCompletions: 1,
      displayOrder: 4,
    },
    {
      categorySlug: 'social-media',
      name: 'Follow on GitHub',
      slug: 'follow-github',
      description: 'Follow Renderiq on GitHub',
      instructions: 'Follow our GitHub organization. Connect your GitHub account for automatic verification, or submit a screenshot.',
      creditsReward: 1,
      verificationType: 'api_verification' as const,
      verificationConfig: { 
        platform: 'github',
        username: 'renderiq',
        apiMethod: 'follow_check',
        fallbackToManual: true
      },
      cooldownHours: 0, // One-time
      maxCompletions: 1,
      displayOrder: 5,
    },
    {
      categorySlug: 'social-media',
      name: 'Follow on Medium',
      slug: 'follow-medium',
      description: 'Follow Renderiq on Medium',
      instructions: 'Follow our Medium publication. Submit the link to your Medium profile showing you follow us.',
      creditsReward: 1,
      verificationType: 'link_verification' as const,
      verificationConfig: { 
        platform: 'medium',
        urlPattern: 'medium.com',
        validateFormat: true
      },
      cooldownHours: 0, // One-time
      maxCompletions: 1,
      displayOrder: 6,
    },
    {
      categorySlug: 'social-media',
      name: 'Follow on Reddit',
      slug: 'follow-reddit',
      description: 'Follow r/renderiq on Reddit',
      instructions: 'Join our Reddit community r/renderiq. Submit a screenshot showing you\'re a member.',
      creditsReward: 1,
      verificationType: 'screenshot' as const,
      verificationConfig: { 
        platform: 'reddit',
        subreddit: 'renderiq',
        requiresManualReview: true
      },
      cooldownHours: 0, // One-time
      maxCompletions: 1,
      displayOrder: 7,
    },
    {
      categorySlug: 'social-media',
      name: 'Follow on TikTok',
      slug: 'follow-tiktok',
      description: 'Follow @renderiq on TikTok',
      instructions: 'Follow our TikTok account @renderiq. Submit a screenshot showing you follow us.',
      creditsReward: 1,
      verificationType: 'screenshot' as const,
      verificationConfig: { 
        platform: 'tiktok',
        username: 'renderiq',
        requiresManualReview: true
      },
      cooldownHours: 0, // One-time
      maxCompletions: 1,
      displayOrder: 8,
    },
    {
      categorySlug: 'social-media',
      name: 'Follow on Threads',
      slug: 'follow-threads',
      description: 'Follow @renderiq on Threads',
      instructions: 'Follow our Threads account @renderiq. Submit a screenshot showing you follow us.',
      creditsReward: 1,
      verificationType: 'screenshot' as const,
      verificationConfig: { 
        platform: 'threads',
        username: 'renderiq',
        requiresManualReview: true
      },
      cooldownHours: 0, // One-time
      maxCompletions: 1,
      displayOrder: 9,
    },
    {
      categorySlug: 'social-media',
      name: 'Tweet about Renderiq',
      slug: 'tweet-about',
      description: 'Tweet about Renderiq',
      instructions: 'Share Renderiq on Twitter/X! Mention @renderiq in your tweet. Connect your Twitter account for automatic verification.',
      creditsReward: 2,
      verificationType: 'api_verification' as const,
      verificationConfig: { 
        platform: 'twitter',
        searchQuery: '@renderiq',
        apiMethod: 'tweet_search',
        fallbackToManual: true
      },
      cooldownHours: 24, // Daily
      maxCompletions: null,
      displayOrder: 10,
    },
    {
      categorySlug: 'social-media',
      name: 'Retweet Renderiq Post',
      slug: 'retweet-renderiq',
      description: 'Retweet a Renderiq post',
      instructions: 'Retweet one of our posts on Twitter/X. Connect your Twitter account for automatic verification.',
      creditsReward: 1,
      verificationType: 'api_verification' as const,
      verificationConfig: { 
        platform: 'twitter',
        apiMethod: 'retweet_check',
        fallbackToManual: true
      },
      cooldownHours: 24, // Daily
      maxCompletions: null,
      displayOrder: 11,
    },
    {
      categorySlug: 'social-media',
      name: 'Like Renderiq Tweet',
      slug: 'like-tweet',
      description: 'Like a Renderiq tweet',
      instructions: 'Like one of our tweets on Twitter/X. Connect your Twitter account for automatic verification.',
      creditsReward: 1,
      verificationType: 'api_verification' as const,
      verificationConfig: { 
        platform: 'twitter',
        apiMethod: 'like_check',
        fallbackToManual: true
      },
      cooldownHours: 24, // Daily
      maxCompletions: null,
      displayOrder: 12,
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
    const { logger } = await import('@/lib/utils/logger');
    logger.log('🌱 Starting tasks database seeding...');
    const categoryMap = await seedTaskCategories();
    await seedTasks(categoryMap);
    logger.log('🎉 Tasks database seeding completed successfully');
    logger.log('📊 Summary:');
    logger.log('   - P0: Internal tasks (Daily Engagement) - 8 tasks');
    logger.log('   - P1: Social follows (Social Media) - 12 tasks');
    logger.log('   - Total: 20 tasks');
  } catch (error) {
    console.error('❌ Tasks database seeding failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedTasksDatabase()
    .then(() => {
      console.log('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}
