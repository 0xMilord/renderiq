/**
 * Diagnostic script to check Razorpay plan configuration
 * Run with: npx tsx scripts/check-razorpay-plans.ts
 */

import { db } from '../lib/db';
import { subscriptionPlans } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkRazorpayPlans() {
  console.log('🔍 Checking Razorpay plan configuration...\n');

  try {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.price);

    console.log(`Found ${plans.length} active plans:\n`);

    for (const plan of plans) {
      console.log(`📋 Plan: ${plan.name}`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Price: ${plan.price} ${plan.currency}`);
      console.log(`   Interval: ${plan.interval}`);
      console.log(`   Credits/Month: ${plan.creditsPerMonth}`);
      
      if (plan.razorpayPlanId) {
        const isValidFormat = plan.razorpayPlanId.startsWith('plan_');
        console.log(`   Razorpay Plan ID: ${plan.razorpayPlanId} ${isValidFormat ? '✅' : '❌ Invalid format'}`);
      } else {
        if (plan.name === 'Free') {
          console.log(`   Razorpay Plan ID: Not required (Free plan) ✅`);
        } else {
          console.log(`   Razorpay Plan ID: ❌ MISSING - This plan needs a Razorpay Plan ID!`);
        }
      }
      console.log('');
    }

    // Summary
    console.log('\n📊 Summary:');
    const plansWithRazorpayId = plans.filter(p => p.razorpayPlanId || p.name === 'Free');
    const plansWithoutRazorpayId = plans.filter(p => !p.razorpayPlanId && p.name !== 'Free');
    
    console.log(`✅ Configured: ${plansWithRazorpayId.length}/${plans.length}`);
    if (plansWithoutRazorpayId.length > 0) {
      console.log(`❌ Missing Razorpay Plan IDs: ${plansWithoutRazorpayId.length}`);
      plansWithoutRazorpayId.forEach(p => {
        console.log(`   - ${p.name} (${p.interval})`);
      });
    }

    // Check for invalid formats
    const invalidFormats = plans.filter(p => 
      p.razorpayPlanId && !p.razorpayPlanId.startsWith('plan_')
    );
    if (invalidFormats.length > 0) {
      console.log(`\n⚠️  Invalid Plan ID formats:`);
      invalidFormats.forEach(p => {
        console.log(`   - ${p.name}: ${p.razorpayPlanId} (should start with 'plan_')`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking plans:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkRazorpayPlans();

