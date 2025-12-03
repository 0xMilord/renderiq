/**
 * Test Razorpay Subscriptions API directly
 * This script helps diagnose subscription creation issues
 */

import Razorpay from 'razorpay';

async function testRazorpaySubscriptionAPI() {
  console.log('🔍 Testing Razorpay Subscriptions API...\n');

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error('❌ Error: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
    process.exit(1);
  }

  const accountMode = keyId.includes('rzp_test') ? 'TEST' : 'LIVE';
  console.log(`📋 Account Mode: ${accountMode}`);
  console.log(`🔑 Key ID: ${keyId.substring(0, 10)}...\n`);

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  // Test 1: Try to list plans
  console.log('Test 1: Listing plans...');
  try {
    const plans = await razorpay.plans.all({ count: 10 });
    console.log(`✅ Success! Found ${plans.items.length} plans:`);
    plans.items.forEach((plan: any) => {
      console.log(`   - ${plan.id}: ${plan.item?.name || 'N/A'} (${plan.item?.amount ? plan.item.amount / 100 : 'N/A'} ${plan.item?.currency || 'INR'})`);
    });
  } catch (error: any) {
    console.log(`❌ Failed: ${error.statusCode} - ${error.error?.description || error.message}`);
    if (error.statusCode === 400) {
      console.log('   This suggests Subscriptions API is not accessible');
    }
  }

  console.log('\nTest 2: Testing subscription creation endpoint...');
  
  // Get plan ID from environment or use a test one
  const testPlanId = process.argv[2] || 'plan_Rn3lmBVjGI02dN';
  console.log(`   Using Plan ID: ${testPlanId}\n`);

  // Test 2: Try direct API call
  console.log('Test 2a: Direct API call to Razorpay...');
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const apiUrl = 'https://api.razorpay.com/v1/subscriptions';
    
    const testSubscription = {
      plan_id: testPlanId,
      customer_notify: 0, // Don't notify for test
      total_count: 1, // Just 1 payment for testing
      notes: {
        test: 'true',
        diagnostic: 'true'
      }
    };

    console.log(`   Calling: ${apiUrl}`);
    console.log(`   Payload:`, JSON.stringify(testSubscription, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(testSubscription),
    });

    const responseText = await response.text();
    console.log(`   Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log(`✅ Success! Subscription created: ${data.id}`);
      console.log(`   Status: ${data.status}`);
    } else {
      const errorData = JSON.parse(responseText);
      console.log(`❌ Failed: ${response.status}`);
      console.log(`   Error:`, JSON.stringify(errorData, null, 2));
      
      if (response.status === 400) {
        if (errorData.error?.description?.includes('not found')) {
          console.log('\n💡 Diagnosis:');
          console.log('   - The API endpoint exists but returned "not found"');
          console.log('   - This could mean:');
          console.log('     1. Plan ID doesn\'t exist');
          console.log('     2. Subscriptions feature not fully enabled');
          console.log('     3. Wrong account mode (test vs live)');
        }
      }
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('\nTest 2b: SDK subscription creation...');
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: testPlanId,
      customer_notify: 0,
      total_count: 1,
      notes: {
        test: 'true'
      }
    });
    console.log(`✅ Success! Subscription created via SDK: ${subscription.id}`);
  } catch (error: any) {
    console.log(`❌ Failed: ${error.statusCode} - ${error.error?.description || error.message}`);
    console.log(`   Error details:`, JSON.stringify(error.error || {}, null, 2));
  }

  console.log('\n📝 Recommendations:');
  console.log('1. Verify plan exists in Razorpay Dashboard:');
  console.log(`   - ${accountMode === 'TEST' ? 'https://dashboard.razorpay.com/app/test' : 'https://dashboard.razorpay.com/app'}`);
  console.log('   - Go to: Products → Plans');
  console.log(`   - Look for plan ID: ${testPlanId}`);
  console.log('\n2. Check Subscriptions feature:');
  console.log('   - Look for "Subscriptions" or "Recurring Payments" section');
  console.log('   - If not visible, contact Razorpay support');
  console.log('\n3. Verify account mode:');
  console.log(`   - Current: ${accountMode}`);
  console.log(`   - Make sure plan was created in ${accountMode} mode`);
}

testRazorpaySubscriptionAPI().catch(console.error);

