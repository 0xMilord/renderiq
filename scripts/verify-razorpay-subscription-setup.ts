/**
 * Diagnostic script to verify Razorpay subscription setup
 * Run with: npx tsx scripts/verify-razorpay-subscription-setup.ts
 */

import Razorpay from 'razorpay';
import { db } from '../lib/db';
import { subscriptionPlans } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function verifyRazorpaySubscriptionSetup() {
  console.log('🔍 Verifying Razorpay Subscription Setup...\n');

  // Check environment variables
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('❌ Razorpay credentials not found!');
    console.log('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local');
    process.exit(1);
  }

  console.log('✅ Razorpay credentials found');
  console.log(`   Key ID: ${keyId.substring(0, 10)}...`);
  console.log(`   Mode: ${keyId.includes('rzp_test') ? 'TEST' : 'LIVE'}\n`);

  // Initialize Razorpay
  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  // Get plans from database
  console.log('📋 Checking database plans...\n');
  const dbPlans = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true))
    .orderBy(subscriptionPlans.price);

  console.log(`Found ${dbPlans.length} active plans in database:\n`);

  for (const plan of dbPlans) {
    console.log(`📦 Plan: ${plan.name}`);
    console.log(`   Database ID: ${plan.id}`);
    console.log(`   Price: ${plan.price} ${plan.currency}`);
    console.log(`   Interval: ${plan.interval}`);
    
    if (plan.razorpayPlanId) {
      console.log(`   Razorpay Plan ID: ${plan.razorpayPlanId}`);
      
      // Try to verify plan exists in Razorpay
      try {
        // Note: Razorpay SDK doesn't have a direct plans.fetch method
        // We'll try to create a test subscription to see if it fails
        console.log(`   ⏳ Verifying plan exists in Razorpay...`);
        
        // Try to list all plans (if API supports it)
        try {
          // This might not work if subscriptions aren't enabled
          const plans = await (razorpay as any).plans?.all?.({ count: 100 });
          if (plans?.items) {
            const foundPlan = plans.items.find((p: any) => p.id === plan.razorpayPlanId);
            if (foundPlan) {
              console.log(`   ✅ Plan verified in Razorpay`);
              console.log(`      Plan Name: ${foundPlan.item?.name || 'N/A'}`);
              console.log(`      Amount: ${foundPlan.item?.amount ? foundPlan.item.amount / 100 : 'N/A'} ${foundPlan.item?.currency || 'N/A'}`);
            } else {
              console.log(`   ⚠️  Plan ID not found in Razorpay (may not exist or subscriptions not enabled)`);
            }
          }
        } catch (listError: any) {
          if (listError.statusCode === 400 || listError.statusCode === 404) {
            console.log(`   ❌ ERROR: Subscriptions feature appears to be DISABLED`);
            console.log(`      Error: ${listError.error?.description || listError.message}`);
            console.log(`      This confirms subscriptions are not enabled on your account`);
          } else {
            console.log(`   ⚠️  Could not verify plan (API error: ${listError.message})`);
          }
        }
      } catch (error: any) {
        console.log(`   ❌ Error checking plan: ${error.message}`);
      }
    } else {
      if (plan.name === 'Free') {
        console.log(`   ✅ Free plan (no Razorpay ID needed)`);
      } else {
        console.log(`   ❌ MISSING Razorpay Plan ID`);
      }
    }
    console.log('');
  }

  // Summary and recommendations
  console.log('\n📊 Summary:\n');
  
  const plansWithIds = dbPlans.filter(p => p.razorpayPlanId || p.name === 'Free');
  const plansWithoutIds = dbPlans.filter(p => !p.razorpayPlanId && p.name !== 'Free');
  
  console.log(`✅ Plans with Razorpay IDs: ${plansWithIds.length}/${dbPlans.length}`);
  if (plansWithoutIds.length > 0) {
    console.log(`❌ Plans missing Razorpay IDs: ${plansWithoutIds.length}`);
    plansWithoutIds.forEach(p => {
      console.log(`   - ${p.name} (${p.interval})`);
    });
  }

  console.log('\n🔧 Next Steps:\n');
  console.log('1. If you see "Subscriptions feature appears to be DISABLED":');
  console.log('   → Contact Razorpay Support: support@razorpay.com');
  console.log('   → Request: "Please enable Subscriptions/Recurring Payments feature"');
  console.log('   → Wait 24-48 hours for activation\n');
  
  console.log('2. If plans are missing Razorpay Plan IDs:');
  console.log('   → Create plans in Razorpay Dashboard → Products → Plans');
  console.log('   → Update database with Plan IDs using scripts/update-razorpay-plan-ids-execute.sql\n');
  
  console.log('3. Verify account mode:');
  console.log(`   → Current mode: ${keyId.includes('rzp_test') ? 'TEST' : 'LIVE'}`);
  console.log('   → Make sure you\'re using the correct keys for your account mode\n');

  process.exit(0);
}

verifyRazorpaySubscriptionSetup().catch((error) => {
  console.error('❌ Error running verification:', error);
  process.exit(1);
});

