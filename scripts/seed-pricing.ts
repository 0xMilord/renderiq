import { seedDatabase } from '../lib/db/seed';
import { logger } from '../lib/utils/logger';

/**
 * Seed script for subscription plans and credit packages
 * Run with: npx tsx scripts/seed-pricing.ts
 */
async function main() {
  logger.log('🌱 Starting database seeding...');
  
  try {
    await seedDatabase();
    logger.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

main();

