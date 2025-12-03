# 🔴 Razorpay Subscriptions Feature Not Enabled - Fix Guide

## Current Error

```
❌ RazorpayService: Error creating subscription: {
  statusCode: 400,
  errorCode: 'BAD_REQUEST_ERROR',
  errorDescription: 'The requested URL was not found on the server.'
}
```

## Root Cause

**The Subscriptions/Recurring Payments feature is NOT enabled on your Razorpay account.**

This is a **mandatory requirement** from Razorpay - subscriptions will not work until this feature is enabled by Razorpay support.

## ✅ Solution Steps

### Step 1: Contact Razorpay Support (REQUIRED)

**Email:** support@razorpay.com  
**Subject:** Enable Subscriptions Feature

**Message Template:**
```
Hi Razorpay Support,

I need to enable the Subscriptions/Recurring Payments feature on my Razorpay account.

Account Details:
- Account Email: [your-razorpay-email]
- Account ID: [if you know it]
- Mode: [TEST/LIVE]

I'm trying to create subscriptions using the API but getting "URL not found" error (400).
Please enable the Subscriptions feature so I can use the subscriptions API.

Thank you!
```

**Alternative:** Use the support chat in Razorpay Dashboard:
1. Login to https://dashboard.razorpay.com
2. Click on "Support" or "Help" in the dashboard
3. Request to enable Subscriptions feature

### Step 2: Wait for Activation

- **Typical wait time:** 24-48 hours
- Razorpay will email you when subscriptions are enabled
- You'll see a "Subscriptions" section appear in your dashboard

### Step 3: Verify Feature is Enabled

After Razorpay enables it:

1. **Check Dashboard:**
   - Login to Razorpay Dashboard
   - Look for "Subscriptions" or "Recurring Payments" section
   - If visible, feature is enabled ✅

2. **Run Diagnostic Script:**
   ```bash
   npx tsx scripts/verify-razorpay-subscription-setup.ts
   ```
   This will verify your setup and test if subscriptions are working.

3. **Test Subscription Creation:**
   - Go to `/pricing` page
   - Try to create a subscription
   - Should work now!

## 🔍 Verification Checklist

Before contacting Razorpay, verify:

- [ ] Plan ID exists in Razorpay Dashboard → Products → Plans
- [ ] Plan ID format is correct (starts with `plan_`)
- [ ] Using correct Razorpay account (test vs live)
- [ ] API keys match the account mode
- [ ] Plan ID matches between database and Razorpay

## 📋 Current Setup Status

Based on your logs:
- ✅ Plan ID: `plan_Rn3lmBVjGI02dN` (format is correct)
- ✅ Customer created successfully: `cust_Rn4wr5jyAXxxu8`
- ❌ Subscription creation fails with "URL not found"

**This confirms:** The plan and customer APIs work, but subscriptions API endpoint doesn't exist because the feature isn't enabled.

## 🚨 Important Notes

1. **This is NOT a code issue** - Your code is correct
2. **This is NOT a configuration issue** - Your setup is correct
3. **This IS a Razorpay account limitation** - Only Razorpay support can fix it

## Alternative: Use One-Time Payments

While waiting for subscriptions to be enabled, you can:

1. Use **Credit Packages** (one-time payments) - These work without subscriptions feature
2. Manually create recurring subscriptions after each payment
3. Use Razorpay's manual subscription management in dashboard

## After Subscriptions Are Enabled

Once Razorpay enables the feature:

1. **Test immediately:**
   ```bash
   npx tsx scripts/verify-razorpay-subscription-setup.ts
   ```

2. **Try creating a subscription:**
   - Go to `/pricing`
   - Click "Subscribe" on any plan
   - Should work now!

3. **Monitor logs:**
   - Check server logs for successful subscription creation
   - Verify subscription appears in Razorpay Dashboard

## Related Files

- `lib/services/razorpay.service.ts` - Subscription creation code
- `scripts/verify-razorpay-subscription-setup.ts` - Diagnostic script
- `docs/RAZORPAY_SUBSCRIPTION_TROUBLESHOOTING.md` - General troubleshooting

## Need Help?

If Razorpay support says subscriptions are enabled but you still get errors:

1. Verify you're using the correct Razorpay account
2. Check if you need to switch between test/live mode
3. Verify plan IDs match between database and Razorpay
4. Run the diagnostic script to get detailed error info

