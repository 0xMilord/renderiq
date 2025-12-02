import { seedDatabase } from '../lib/db/seed';

/**
 * Seed script for subscription plans and credit packages
 * Run with: npx tsx scripts/seed-pricing.ts
 */
async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    await seedDatabase();
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

main();

