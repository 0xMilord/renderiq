/**
 * Generate Paddle Price ID Mapping
 * 
 * This script helps you generate the PADDLE_PRICE_IDS environment variable
 * by querying your database and formatting the mapping.
 * 
 * Usage:
 * 1. Create prices in Paddle dashboard
 * 2. Run this script to generate the mapping
 * 3. Copy the output to PADDLE_PRICE_IDS environment variable
 */

import { db } from '@/lib/db';
import { creditPackages, subscriptionPlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function generatePriceMapping() {
  console.log('🔍 Generating Paddle Price ID Mapping...\n');

  // Get all active credit packages
  const packages = await db
    .select({
      id: creditPackages.id,
      name: creditPackages.name,
      price: creditPackages.price,
      currency: creditPackages.currency,
    })
    .from(creditPackages)
    .where(eq(creditPackages.isActive, true))
    .orderBy(creditPackages.displayOrder);

  // Get all active subscription plans
  const plans = await db
    .select({
      id: subscriptionPlans.id,
      name: subscriptionPlans.name,
      price: subscriptionPlans.price,
      interval: subscriptionPlans.interval,
      currency: subscriptionPlans.currency,
    })
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true));

  console.log('📦 Credit Packages:');
  console.log('─'.repeat(80));
  packages.forEach((pkg) => {
    const priceInUSD = parseFloat(pkg.price) * 0.012; // Approximate conversion
    console.log(`ID: ${pkg.id}`);
    console.log(`Name: ${pkg.name}`);
    console.log(`Price: ${pkg.price} ${pkg.currency} (~$${priceInUSD.toFixed(2)} USD)`);
    console.log(`Mapping Key: "${pkg.id}_USD"`);
    console.log(`→ Create price in Paddle: $${priceInUSD.toFixed(2)} USD (One-time)`);
    console.log(`→ Copy Price ID and add to mapping\n`);
  });

  console.log('\n📋 Subscription Plans:');
  console.log('─'.repeat(80));
  plans.forEach((plan) => {
    const priceInUSD = parseFloat(plan.price) * 0.012; // Approximate conversion
    console.log(`ID: ${plan.id}`);
    console.log(`Name: ${plan.name}`);
    console.log(`Price: ${plan.price} ${plan.currency} (~$${priceInUSD.toFixed(2)} USD)`);
    console.log(`Interval: ${plan.interval}`);
    console.log(`Mapping Key: "${plan.id}_USD"`);
    console.log(`→ Create price in Paddle: $${priceInUSD.toFixed(2)} USD (${plan.interval})`);
    console.log(`→ Copy Price ID and add to mapping\n`);
  });

  console.log('\n📝 Generated Mapping Template:');
  console.log('─'.repeat(80));
  console.log('Copy this template and fill in the Paddle Price IDs:');
  console.log('\nPADDLE_PRICE_IDS={');
  
  packages.forEach((pkg, index) => {
    const comma = index < packages.length - 1 || plans.length > 0 ? ',' : '';
    console.log(`  "${pkg.id}_USD": "pri_xxxxxxxxx"${comma}`);
  });
  
  plans.forEach((plan, index) => {
    const comma = index < plans.length - 1 ? ',' : '';
    console.log(`  "${plan.id}_USD": "pri_xxxxxxxxx"${comma}`);
  });
  
  console.log('}\n');

  console.log('✅ Next Steps:');
  console.log('1. Create prices in Paddle dashboard for each package/plan above');
  console.log('2. Copy the Price IDs from Paddle (start with "pri_")');
  console.log('3. Replace "pri_xxxxxxxxx" in the mapping above with actual Price IDs');
  console.log('4. Add the complete mapping to your .env.local file');
  console.log('5. Keep it on one line (no line breaks)');
}

// Run the script
generatePriceMapping()
  .then(() => {
    console.log('\n✅ Mapping generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error generating mapping:', error);
    process.exit(1);
  });

