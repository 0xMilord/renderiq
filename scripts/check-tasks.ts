/**
 * Debug script to check tasks in database
 * Run with: npx tsx -r tsconfig-paths/register scripts/check-tasks.ts
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

async function checkTasks() {
  // Dynamic imports to ensure env vars are loaded first
  const { db } = await import('@/lib/db');
  const { taskCategories, tasks } = await import('@/lib/db/schema');
  try {
    console.log('🔍 Checking tasks in database...\n');

    // Check categories
    const categories = await db.select().from(taskCategories);
    console.log(`📁 Task Categories: ${categories.length}`);
    categories.forEach((cat) => {
      console.log(`   - ${cat.name} (${cat.slug}): ${cat.isActive ? 'Active' : 'Inactive'}`);
    });

    // Check tasks
    const allTasks = await db.select().from(tasks);
    console.log(`\n📋 Total Tasks: ${allTasks.length}`);
    
    const activeTasks = allTasks.filter(t => t.isActive);
    console.log(`✅ Active Tasks: ${activeTasks.length}`);
    console.log(`❌ Inactive Tasks: ${allTasks.length - activeTasks.length}`);

    // Group by category
    const tasksByCategory = new Map<string, typeof allTasks>();
    for (const task of allTasks) {
      const category = categories.find(c => c.id === task.categoryId);
      const categoryName = category?.name || 'Unknown';
      if (!tasksByCategory.has(categoryName)) {
        tasksByCategory.set(categoryName, []);
      }
      tasksByCategory.get(categoryName)!.push(task);
    }

    console.log('\n📊 Tasks by Category:');
    for (const [categoryName, categoryTasks] of tasksByCategory.entries()) {
      console.log(`   ${categoryName}: ${categoryTasks.length} tasks`);
      categoryTasks.forEach((task) => {
        console.log(`      - ${task.name} (${task.slug}): ${task.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    // Check for issues
    console.log('\n🔍 Diagnostics:');
    if (categories.length === 0) {
      console.log('   ⚠️ No categories found - run seed script');
    }
    if (allTasks.length === 0) {
      console.log('   ⚠️ No tasks found - run seed script');
    }
    if (activeTasks.length === 0 && allTasks.length > 0) {
      console.log('   ⚠️ Tasks exist but none are active');
    }
    if (activeTasks.length > 0) {
      console.log(`   ✅ ${activeTasks.length} active tasks found - should be visible in UI`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking tasks:', error);
    process.exit(1);
  }
}

checkTasks().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

