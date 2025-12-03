# Razorpay Subscription Troubleshooting Guide

## Error: "The requested URL was not found on the server" (400 BAD_REQUEST_ERROR)

This error occurs when trying to create a Razorpay subscription and typically indicates one of the following issues:

### Root Causes

1. **Subscriptions feature not enabled** on Razorpay account
2. **Invalid or missing Razorpay Plan ID** in database
3. **Plan ID doesn't exist** in Razorpay Dashboard
4. **Wrong Razorpay account** (test vs live mode mismatch)
5. **Incorrect plan ID format** (should start with `plan_`)

## Diagnostic Steps

### Step 1: Check Plan Configuration in Database

Run the diagnostic script to check your plan configuration:

```bash
npx tsx scripts/check-razorpay-plans.ts
```

This will show:
- All active plans
- Their Razorpay Plan IDs
- Which plans are missing Razorpay Plan IDs
- Invalid plan ID formats

### Step 2: Verify Razorpay Dashboard Setup

1. **Login to Razorpay Dashboard**
   - Test Mode: https://dashboard.razorpay.com/app/test
   - Live Mode: https://dashboard.razorpay.com/app

2. **Check if Subscriptions Feature is Enabled**
   - Go to **Settings** → **Account & Settings**
   - Look for "Subscriptions" or "Recurring Payments" feature
   - If not visible, contact Razorpay support to enable it

3. **Verify Plans Exist**
   - Go to **Products** → **Plans**
   - Check if all your plans exist
   - Verify Plan IDs match your database (should start with `plan_`)

### Step 3: Verify Environment Variables

Check your `.env.local` file has correct Razorpay credentials:

```env
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id_here
```

**Important:** 
- Use **Test Mode** keys for development
- Use **Live Mode** keys for production
- Make sure you're using keys from the same account where plans are created

### Step 4: Check Plan ID Format

Razorpay Plan IDs must:
- Start with `plan_` (e.g., `plan_Rn3lmBVjGI02dN`)
- Be exactly as shown in Razorpay Dashboard
- Match the account (test vs live)

## Solutions

### Solution 1: Enable Subscriptions Feature

If subscriptions feature is not enabled:

1. Contact Razorpay Support:
   - Email: support@razorpay.com
   - Or use the support chat in dashboard
   - Request: "Please enable Subscriptions/Recurring Payments feature for my account"

2. Wait for activation (usually 24-48 hours)

3. Once enabled, verify you can see "Plans" section in Dashboard

### Solution 2: Create Missing Plans in Razorpay

If plans don't exist in Razorpay Dashboard:

1. Go to **Products** → **Plans** → **Create Plan**

2. For each plan in your database, create a matching plan:
   - **Plan Name**: Match your database plan name
   - **Billing Frequency**: 
     - Monthly plans: Every `1` Month(s)
     - Annual plans: Every `1` Year(s)
   - **Billing Amount**: Match database price (in INR)
   - **Currency**: INR

3. Copy the Plan ID (starts with `plan_`)

4. Update your database using the SQL script:

```sql
-- Example: Update Pro Monthly plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_Rn3lmBVjGI02dN', -- Replace with actual Plan ID
    updated_at = now()
WHERE name = 'Pro' 
  AND interval = 'month' 
  AND price = 499.00;
```

Or use the provided script:
```bash
# Edit scripts/update-razorpay-plan-ids-execute.sql with your Plan IDs
# Then run it against your database
```

### Solution 3: Fix Plan ID Format

If plan ID format is incorrect:

1. Check the plan ID in Razorpay Dashboard
2. It should start with `plan_`
3. Update database with correct format:

```sql
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_CORRECT_ID_HERE',
    updated_at = now()
WHERE id = 'your-plan-uuid';
```

### Solution 4: Verify Account Mode Match

Ensure your environment variables match the Razorpay account mode:

- **Test Mode**: Use test API keys and test plans
- **Live Mode**: Use live API keys and live plans

**Common mistake**: Using test API keys but trying to access live plans (or vice versa)

## Verification Checklist

After fixing the issue, verify:

- [ ] All plans have Razorpay Plan IDs in database
- [ ] Plan IDs start with `plan_`
- [ ] Plans exist in Razorpay Dashboard
- [ ] Subscriptions feature is enabled
- [ ] Environment variables are set correctly
- [ ] API keys match the account mode (test/live)
- [ ] Restart Next.js dev server after env changes

## Testing

After setup, test subscription creation:

1. Go to `/pricing` page
2. Select a subscription plan
3. Click "Subscribe"
4. Check server logs for detailed error messages
5. If error persists, check the improved error messages in logs

## Improved Error Messages

The code now provides detailed error messages:

- **Plan ID missing**: Shows which plan is missing Razorpay Plan ID
- **Invalid format**: Shows expected vs actual format
- **Plan not found**: Provides steps to verify plan exists
- **Feature not enabled**: Suggests contacting Razorpay support

## Getting Help

If issue persists:

1. Check server logs for detailed error information
2. Run diagnostic script: `npx tsx scripts/check-razorpay-plans.ts`
3. Verify Razorpay Dashboard setup
4. Contact Razorpay Support if subscriptions feature is not enabled
5. Check Razorpay API documentation: https://razorpay.com/docs/api/payments/subscriptions/

## Related Files

- `lib/services/razorpay.service.ts` - Subscription creation logic
- `app/api/payments/create-subscription/route.ts` - API endpoint
- `scripts/check-razorpay-plans.ts` - Diagnostic script
- `scripts/update-razorpay-plan-ids-execute.sql` - Plan ID update script
- `docs/RAZORPAY_PLANS_SETUP.md` - Setup guide

