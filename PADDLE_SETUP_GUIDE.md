# Paddle Setup & Implementation Guide - Complete Step-by-Step

**Date:** December 12, 2024  
**Status:** 🚀 Production-Ready Implementation Guide

---

## 📋 Table of Contents

1. [Paddle Account Setup](#1-paddle-account-setup)
2. [Dashboard Configuration](#2-dashboard-configuration)
3. [Environment Variables](#3-environment-variables)
4. [Database Migration](#4-database-migration)
5. [Testing](#5-testing)
6. [Production Deployment](#6-production-deployment)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Paddle Account Setup

### Step 1.1: Create Paddle Account

1. **Go to Paddle Sign Up**
   - Visit: https://www.paddle.com/signup
   - Click "Get Started" or "Sign Up"

2. **Choose Account Type**
   - Select **"Merchant"** (not Customer)
   - You're selling a product/service

3. **Fill Business Details**
   - Business name: **Renderiq**
   - Business type: **SaaS/Software**
   - Country: **India** (or your business country)
   - Email: Your business email

4. **Verify Email**
   - Check your email
   - Click verification link
   - Complete account setup

### Step 1.2: Complete Business Verification

1. **Go to Settings → Business Details**
   - Fill in business information:
     - Legal business name
     - Business address
     - Tax ID (if applicable)
     - Bank account details (for payouts)

2. **Upload Documents** (if required)
   - Business registration documents
   - ID verification
   - Bank account verification

3. **Wait for Approval**
   - Paddle reviews your account (usually 1-3 business days)
   - You'll receive email when approved

---

## 2. Dashboard Configuration

### Step 2.1: Get API Credentials

1. **Navigate to Developer Tools**
   - Go to: https://vendors.paddle.com/developer-tools
   - Or: Dashboard → Developer Tools

2. **Get Vendor ID**
   - In Developer Tools → Authentication
   - Copy your **Vendor ID** (looks like: `12345`)
   - Save this for later

3. **Create API Key**
   - Click **"Create API Key"**
   - Name it: `Renderiq Production` (or `Renderiq Sandbox` for testing)
   - Copy the **API Key** (starts with `test_` for sandbox, `live_` for production)
   - ⚠️ **IMPORTANT:** Save this immediately - you can only see it once!

4. **Get Public Key**
   - In Developer Tools → Public Key
   - Copy the **Public Key** (starts with `test_` or `live_`)
   - This is used for client-side SDK initialization

### Step 2.2: Create Products & Prices

#### For Credit Packages

1. **Go to Catalog → Products**
   - Click **"New Product"**

2. **Create Product for Each Credit Package**
   - **Product Name:** `Credit Package - [Name]` (e.g., "Credit Package - Starter")
   - **Product Type:** `Standard`
   - **Description:** Brief description of the package

3. **Create Price for Each Package**
   - Click **"Add Price"** on the product
   - **Price Name:** `[Package Name] - USD` (e.g., "Starter - USD")
   - **Billing Cycle:** `One-time`
   - **Price:** Enter USD amount (converted from INR)
   - **Currency:** `USD`
   - **Tax Category:** `Digital Goods` or `Software`
   - Click **"Save"**

4. **Copy Price IDs**
   - After creating each price, copy the **Price ID** (looks like: `pri_01hxxxxx`)
   - You'll need these for `PADDLE_PRICE_IDS` environment variable

#### For Subscription Plans

1. **Create Product for Each Subscription Plan**
   - **Product Name:** `[Plan Name]` (e.g., "Pro Plan")
   - **Product Type:** `Standard`
   - **Description:** Plan description

2. **Create Price for Monthly Plan**
   - Click **"Add Price"**
   - **Price Name:** `[Plan Name] - Monthly - USD`
   - **Billing Cycle:** `Monthly`
   - **Price:** Enter USD amount
   - **Currency:** `USD`
   - **Tax Category:** `Digital Goods`
   - Click **"Save"**
   - Copy **Price ID**

3. **Create Price for Annual Plan** (if you have annual plans)
   - Click **"Add Price"** again
   - **Price Name:** `[Plan Name] - Annual - USD`
   - **Billing Cycle:** `Yearly`
   - **Price:** Enter USD amount
   - **Currency:** `USD`
   - **Tax Category:** `Digital Goods`
   - Click **"Save"**
   - Copy **Price ID**

### Step 2.3: Configure Webhooks

1. **Go to Developer Tools → Events**
   - Or: https://vendors.paddle.com/developer-tools/events

2. **Create Webhook Destination**
   - Click **"New Destination"**
   - Select **"Webhook"**

3. **Configure Webhook**
   - **Name:** `Renderiq Production Webhook` (or `Sandbox`)
   - **URL:** `https://yourdomain.com/api/payments/paddle/webhook`
     - For testing: `https://yourdomain.vercel.app/api/payments/paddle/webhook`
     - For production: `https://renderiq.io/api/payments/paddle/webhook`

4. **Select Events**
   - Check these events:
     - ✅ `transaction.completed`
     - ✅ `transaction.payment_failed`
     - ✅ `subscription.created`
     - ✅ `subscription.updated`
     - ✅ `subscription.canceled`
     - ✅ `subscription.payment_succeeded` (if available)
     - ✅ `subscription.payment_completed` (if available)

5. **Save and Get Secret**
   - Click **"Save"**
   - Click on the webhook destination you just created
   - Copy the **Webhook Signing Secret** (starts with `whsec_`)
   - ⚠️ **IMPORTANT:** Save this - you'll need it for `PADDLE_WEBHOOK_SECRET`

### Step 2.4: Configure Payout Settings

1. **Go to Settings → Payouts**
   - Add your bank account details
   - Select payout currency (can be INR if available, or USD)
   - Set payout schedule (daily, weekly, monthly)

2. **Verify Bank Account**
   - Paddle may require verification
   - Follow their instructions

---

## 3. Environment Variables

### Step 3.1: Create Environment Variable File

Create or update your `.env.local` file:

```bash
# ============================================
# PADDLE CONFIGURATION
# ============================================

# Paddle API Key (from Developer Tools → Authentication)
# Sandbox: starts with 'test_'
# Production: starts with 'live_'
PADDLE_API_KEY=test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Paddle Public Key (from Developer Tools → Public Key)
# Sandbox: starts with 'test_'
# Production: starts with 'live_'
PADDLE_PUBLIC_KEY=test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_PADDLE_PUBLIC_KEY=test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Paddle Webhook Secret (from Developer Tools → Events → Webhook)
# Starts with 'whsec_'
PADDLE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Paddle Environment
# Options: 'sandbox' or 'production'
PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox

# Paddle Price IDs Mapping
# Format: JSON object mapping package/plan IDs to Paddle Price IDs
# Example: {"package_id_USD": "pri_01hxxxxx", "plan_id_USD": "pri_01hyyyyy"}
PADDLE_PRICE_IDS={"package_starter_USD": "pri_01hxxxxx", "package_pro_USD": "pri_01hyyyyy", "plan_pro_monthly_USD": "pri_01hzzzzz"}

# ============================================
# EXISTING RAZORPAY (KEEP AS-IS)
# ============================================
RAZORPAY_KEY_ID=rzp_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_xxxxxxxxxxxxx
```

### Step 3.2: Create Price IDs Mapping

You need to map your database package/plan IDs to Paddle Price IDs.

**Example Mapping:**

```json
{
  "package_starter_id_USD": "pri_01hxxxxx",
  "package_pro_id_USD": "pri_01hyyyyy",
  "package_enterprise_id_USD": "pri_01hzzzzz",
  "plan_starter_monthly_USD": "pri_01haaaaa",
  "plan_pro_monthly_USD": "pri_01hbbbbb",
  "plan_pro_annual_USD": "pri_01hccccc",
  "plan_enterprise_monthly_USD": "pri_01hddddd"
}
```

**How to get your database IDs:**

1. Run this query in your database:
```sql
-- Get credit package IDs
SELECT id, name, price FROM credit_packages WHERE is_active = true;

-- Get subscription plan IDs
SELECT id, name, price, interval FROM subscription_plans WHERE is_active = true;
```

2. Map each ID to the Paddle Price ID you created
3. Format: `"[database_id]_USD": "paddle_price_id"`

**Example:**
- Database package ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Paddle Price ID: `pri_01hxxxxx`
- Mapping: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890_USD": "pri_01hxxxxx"`

### Step 3.3: Add to Vercel/Deployment Platform

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to Settings → Environment Variables

2. **Add Each Variable**
   - Add all Paddle variables from Step 3.1
   - Set environment: Production, Preview, Development (as needed)

3. **Redeploy**
   - After adding variables, trigger a new deployment
   - Or wait for next automatic deployment

---

## 4. Database Migration

### Step 4.1: Run Migration

1. **Check Migration File**
   - File: `drizzle/0016_add_payment_provider_support.sql`
   - This adds payment provider fields to your database

2. **Run Migration**
   ```bash
   npm run db:migrate
   ```
   
   Or manually:
   ```bash
   # Connect to your database
   psql your_database_url
   
   # Run the migration
   \i drizzle/0016_add_payment_provider_support.sql
   ```

3. **Verify Migration**
   ```sql
   -- Check payment_orders table
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'payment_orders' 
   AND column_name LIKE '%paddle%';
   
   -- Check user_subscriptions table
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'user_subscriptions' 
   AND column_name LIKE '%paddle%';
   ```

---

## 5. Testing

### Step 5.1: Test in Sandbox

1. **Set Environment to Sandbox**
   ```bash
   PADDLE_ENVIRONMENT=sandbox
   NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
   ```

2. **Use Sandbox Credentials**
   - Use `test_` prefixed API keys
   - Use sandbox webhook URL

3. **Test Credit Package Purchase**
   - Go to pricing page
   - Click "Purchase Credits" (as international user)
   - Should redirect to Paddle sandbox checkout
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVV: Any 3 digits
   - Complete payment
   - Verify:
     - ✅ Redirects to success page
     - ✅ Credits added to account
     - ✅ Invoice generated
     - ✅ Receipt generated
     - ✅ Emails sent

4. **Test Subscription**
   - Go to pricing page
   - Click "Subscribe" on a plan (as international user)
   - Should redirect to Paddle sandbox checkout
   - Use test card
   - Complete payment
   - Verify:
     - ✅ Subscription activated
     - ✅ Credits added
     - ✅ Emails sent
     - ✅ Subscription shows in billing

5. **Test Webhooks**
   - Go to Paddle Dashboard → Developer Tools → Events
   - Click on your webhook destination
   - Check "Recent Events"
   - Verify events are being sent
   - Check your server logs for webhook processing

### Step 5.2: Test Country Detection

1. **Test Indian User**
   - Use VPN or proxy to appear as Indian user
   - Or modify country detection temporarily
   - Should use Razorpay (INR)

2. **Test International User**
   - Use VPN to appear as US/EU user
   - Should use Paddle (USD)

### Step 5.3: Test Payment Flows

**Credit Package Flow:**
1. ✅ Indian user → Razorpay modal → INR payment
2. ✅ International user → Paddle redirect → USD payment

**Subscription Flow:**
1. ✅ Indian user → Razorpay subscription → INR
2. ✅ International user → Paddle subscription → USD

---

## 6. Production Deployment

### Step 6.1: Switch to Production

1. **Get Production Credentials**
   - Go to Paddle Dashboard
   - Switch to **Production** mode (toggle in top right)
   - Get production API keys (start with `live_`)
   - Get production public key
   - Get production webhook secret

2. **Update Environment Variables**
   ```bash
   PADDLE_ENVIRONMENT=production
   NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
   PADDLE_API_KEY=live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   PADDLE_PUBLIC_KEY=live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_PADDLE_PUBLIC_KEY=live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   PADDLE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Update Webhook URL**
   - Go to Developer Tools → Events
   - Edit your webhook destination
   - Update URL to production: `https://renderiq.io/api/payments/paddle/webhook`
   - Save

4. **Create Production Prices**
   - Go to Catalog → Products (in Production mode)
   - Create all products and prices again (sandbox and production are separate)
   - Copy production Price IDs
   - Update `PADDLE_PRICE_IDS` with production IDs

### Step 6.2: Deploy to Production

1. **Update Vercel Environment Variables**
   - Add all production Paddle variables
   - Set environment to "Production"

2. **Deploy**
   ```bash
   git add .
   git commit -m "Add Paddle integration"
   git push
   ```
   - Vercel will auto-deploy

3. **Verify Deployment**
   - Check deployment logs
   - Verify environment variables are set
   - Test production URL

### Step 6.3: Monitor Production

1. **Set Up Monitoring**
   - Monitor payment success rates
   - Monitor webhook delivery
   - Set up alerts for payment failures

2. **Check Paddle Dashboard**
   - Go to Transactions → View all transactions
   - Check for successful payments
   - Monitor subscription renewals

3. **Check Server Logs**
   - Monitor webhook processing
   - Check for errors
   - Verify credit additions

---

## 7. Troubleshooting

### Issue: Webhook Not Receiving Events

**Symptoms:**
- Payments complete but credits not added
- Subscriptions not activating

**Solutions:**
1. Check webhook URL is correct
2. Verify webhook secret matches
3. Check server logs for webhook errors
4. Test webhook endpoint manually:
   ```bash
   curl -X POST https://yourdomain.com/api/payments/paddle/webhook \
     -H "paddle-signature: test_signature" \
     -d '{"event_name": "test"}'
   ```

### Issue: Price ID Not Found

**Symptoms:**
- Error: "Price ID not configured"

**Solutions:**
1. Check `PADDLE_PRICE_IDS` environment variable
2. Verify JSON format is correct
3. Check Price IDs exist in Paddle dashboard
4. Verify mapping format: `"package_id_USD": "pri_xxxxx"`

### Issue: Payment Redirect Not Working

**Symptoms:**
- Clicking purchase doesn't redirect to Paddle

**Solutions:**
1. Check `checkoutUrl` is returned from order creation
2. Verify Paddle public key is set
3. Check browser console for errors
4. Verify country detection is working

### Issue: Currency Conversion Wrong

**Symptoms:**
- USD prices seem incorrect

**Solutions:**
1. Check exchange rate API is working
2. Verify fallback rate (0.012) is correct
3. Check base prices in database are in INR
4. Verify conversion logic in payment actions

### Issue: Credits Not Added

**Symptoms:**
- Payment successful but credits not added

**Solutions:**
1. Check webhook is processing
2. Verify `handleTransactionCompleted` is called
3. Check `addCreditsToAccount` is executing
4. Verify payment order is created
5. Check database for payment order records

---

## 📝 Quick Reference Checklist

### Pre-Deployment
- [ ] Paddle account created and verified
- [ ] API keys obtained (sandbox and production)
- [ ] Products created in Paddle dashboard
- [ ] Prices created for all packages/plans
- [ ] Price IDs copied and mapped
- [ ] Webhook configured
- [ ] Webhook secret copied
- [ ] Environment variables set
- [ ] Database migration run
- [ ] Tested in sandbox

### Production Deployment
- [ ] Production API keys obtained
- [ ] Production prices created
- [ ] Production webhook configured
- [ ] Environment variables updated to production
- [ ] Deployed to production
- [ ] Tested production flow
- [ ] Monitoring set up

---

## 🎯 Next Steps After Setup

1. **Test Everything**
   - Test credit package purchase (both providers)
   - Test subscription (both providers)
   - Test webhooks
   - Test emails

2. **Monitor**
   - Watch payment success rates
   - Monitor webhook delivery
   - Check for errors

3. **Optimize**
   - Adjust pricing if needed
   - Monitor conversion rates
   - Optimize checkout flow

---

## 📞 Support Resources

- **Paddle Documentation:** https://developer.paddle.com/
- **Paddle Support:** support@paddle.com
- **Paddle Status:** https://status.paddle.com/

---

**Last Updated:** December 12, 2024  
**Status:** ✅ Ready for Implementation

