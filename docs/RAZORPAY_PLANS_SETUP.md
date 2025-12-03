# Razorpay Subscription Plans Setup Guide

## Overview
This guide helps you create subscription plans in Razorpay Dashboard and map them to your database.

## Current Database Plans

Your database already has these plans seeded (from migration `0011_add_subscription_plans.sql` and `0018_add_starter_plan_119.sql`):

1. **Free** - Monthly - ₹0.00 - 10 credits/month
2. **Starter** - Monthly - ₹119.00 - 24 credits/month
3. **Pro** - Monthly - ₹499.00 - 100 credits/month
4. **Pro Annual** - Yearly - ₹4,790.00 - 100 credits/month
5. **Enterprise** - Monthly - ₹4,999.00 - 1,000 credits/month
6. **Enterprise Annual** - Yearly - ₹44,999.00 - 1,000 credits/month

## Step 1: Create Plans in Razorpay Dashboard

For each plan above (except Free), create a plan in Razorpay:

### Go to Razorpay Dashboard
1. Login to https://dashboard.razorpay.com
2. Navigate to **Products** → **Plans** → **Create Plan**

### Plan Configuration

#### 1. Starter Plan - Monthly
- **Plan Name**: `Starter Monthly` (or `Starter`)
- **Plan Description**: `Great for casual creators - 24 credits per month`
- **Billing Frequency**: 
  - Every: `1`
  - Period: `Month(s)`
- **Billing Amount**: `₹119.00` (in INR)
- **Internal Notes**: `Starter plan - Monthly subscription - 24 credits/month`

**After creating, copy the Plan ID** (starts with `plan_`)

#### 2. Pro Plan - Monthly
- **Plan Name**: `Pro Monthly` (or `Pro`)
- **Plan Description**: `Perfect for regular creators - 100 credits per month`
- **Billing Frequency**: 
  - Every: `1`
  - Period: `Month(s)`
- **Billing Amount**: `₹499.00` (in INR)
- **Internal Notes**: `Pro plan - Monthly subscription - 100 credits/month`

**After creating, copy the Plan ID** (starts with `plan_`)

#### 3. Pro Annual Plan
- **Plan Name**: `Pro Annual`
- **Plan Description**: `Best value for regular creators - 100 credits per month`
- **Billing Frequency**: 
  - Every: `1`
  - Period: `Year(s)` (or `12` Month(s))
- **Billing Amount**: `₹4,790.00` (in INR)
- **Internal Notes**: `Pro plan - Annual subscription - 100 credits/month - 20% discount`

**After creating, copy the Plan ID** (starts with `plan_`)

#### 4. Enterprise Plan - Monthly
- **Plan Name**: `Enterprise Monthly` (or `Enterprise`)
- **Plan Description**: `For professional studios - 1000 credits per month`
- **Billing Frequency**: 
  - Every: `1`
  - Period: `Month(s)`
- **Billing Amount**: `₹4,999.00` (in INR)
- **Internal Notes**: `Enterprise plan - Monthly subscription - 1000 credits/month`

**After creating, copy the Plan ID** (starts with `plan_`)

#### 5. Enterprise Annual Plan
- **Plan Name**: `Enterprise Annual`
- **Plan Description**: `Best value for professional studios - 1000 credits per month`
- **Billing Frequency**: 
  - Every: `1`
  - Period: `Year(s)` (or `12` Month(s))
- **Billing Amount**: `₹44,999.00` (in INR)
- **Internal Notes**: `Enterprise plan - Annual subscription - 1000 credits/month - 25% discount`

**After creating, copy the Plan ID** (starts with `plan_`)

### Note: Free Plan
The Free plan doesn't need a Razorpay plan ID since it's free. Leave `razorpayPlanId` as `NULL` in the database.

## Step 2: Update Database with Razorpay Plan IDs

After creating plans in Razorpay, you need to update your database to store the `razorpayPlanId` for each plan.

### Option 1: Update via SQL (Recommended)

Run this SQL script, replacing the `plan_xxxxx` values with your actual Razorpay Plan IDs:

```sql
-- Update Starter Monthly plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_xxxxx', -- Replace with actual Razorpay Plan ID
    updated_at = now()
WHERE name = 'Starter' 
  AND interval = 'month' 
  AND price = 119.00;

-- Update Pro Monthly plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_xxxxx', -- Replace with actual Razorpay Plan ID
    updated_at = now()
WHERE name = 'Pro' 
  AND interval = 'month' 
  AND price = 499.00;

-- Update Pro Annual plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_xxxxx', -- Replace with actual Razorpay Plan ID
    updated_at = now()
WHERE name = 'Pro Annual' 
  AND interval = 'year' 
  AND price = 4790.00;

-- Update Enterprise Monthly plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_xxxxx', -- Replace with actual Razorpay Plan ID
    updated_at = now()
WHERE name = 'Enterprise' 
  AND interval = 'month' 
  AND price = 4999.00;

-- Update Enterprise Annual plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_xxxxx', -- Replace with actual Razorpay Plan ID
    updated_at = now()
WHERE name = 'Enterprise Annual' 
  AND interval = 'year' 
  AND price = 44999.00;
```

### Option 2: Update via Database Admin Tool

1. Connect to your database
2. Find the `subscription_plans` table
3. For each plan, update the `razorpay_plan_id` column with the Plan ID from Razorpay

### Option 3: Verify Current Plans

To see current plans and their Razorpay Plan IDs:

```sql
SELECT 
  id,
  name,
  description,
  price,
  currency,
  interval,
  credits_per_month,
  razorpay_plan_id,
  is_active
FROM subscription_plans
ORDER BY 
  CASE name 
    WHEN 'Free' THEN 1
    WHEN 'Starter' THEN 2
    WHEN 'Pro' THEN 3
    WHEN 'Pro Annual' THEN 4
    WHEN 'Enterprise' THEN 5
    WHEN 'Enterprise Annual' THEN 6
  END,
  interval;
```

## Step 3: Verify Plan Mapping

After updating the database, verify that all plans have Razorpay Plan IDs (except Free):

```sql
SELECT 
  name,
  interval,
  price,
  razorpay_plan_id,
  CASE 
    WHEN razorpay_plan_id IS NULL AND name != 'Free' THEN '⚠️ Missing Razorpay Plan ID'
    WHEN razorpay_plan_id IS NOT NULL THEN '✅ Configured'
    ELSE '✅ Free Plan (No ID needed)'
  END as status
FROM subscription_plans
WHERE is_active = true
ORDER BY name, interval;
```

## Important Notes

### Razorpay Plan Requirements
- **Plan Name**: Will appear on invoices
- **Plan Description**: Optional, but recommended
- **Billing Frequency**: Cannot be changed after creation
- **Billing Amount**: Cannot be changed after creation (in paise)
- **Currency**: Must be INR for Razorpay

### Database Fields Mapping

| Razorpay Field | Database Field | Notes |
|---------------|----------------|-------|
| Plan Name | `name` | Should match |
| Plan Description | `description` | Should match |
| Billing Frequency | `interval` | `month` or `year` |
| Billing Amount | `price` | In INR (not paise) |
| Plan ID | `razorpay_plan_id` | **Critical** - Must be set |

### Annual Plans in Razorpay

For annual plans, you have two options:
1. **Set period to "Year(s)"** - Razorpay will charge once per year
2. **Set period to "12 Month(s)"** - Razorpay will charge monthly but track as annual

**Recommendation**: Use "Year(s)" for annual plans to charge once per year.

## Troubleshooting

### Plan ID Not Found Error
If you see: `Razorpay plan ID not configured for this plan`

**Solution**: Make sure you've updated the `razorpay_plan_id` in the database for that plan.

### Plan Amount Mismatch
If Razorpay plan amount doesn't match database:

**Solution**: 
1. Check Razorpay plan amount (in paise)
2. Check database `price` field (in INR)
3. Database price × 100 should equal Razorpay amount

Example:
- Database: `499.00` INR
- Razorpay: `49900` paise ✅

### Plan Not Found in Razorpay
If subscription creation fails with "Plan not found":

**Solution**:
1. Verify Plan ID is correct (starts with `plan_`)
2. Check if plan is active in Razorpay Dashboard
3. Ensure you're using the correct Razorpay account (test vs live)

## Testing

After setup, test subscription creation:

1. Go to `/pricing` page
2. Select a subscription plan
3. Click "Subscribe"
4. Complete payment with test card: `4111 1111 1111 1111`
5. Verify subscription is created in Razorpay Dashboard
6. Verify subscription record is created in `user_subscriptions` table

## Next Steps

After completing this setup:
1. ✅ Plans created in Razorpay Dashboard
2. ✅ Plan IDs stored in database
3. ✅ Webhook configured (see `RAZORPAY_WEBHOOK_SETUP.md`)
4. ✅ Test subscription flow
5. ✅ Go live with production keys

