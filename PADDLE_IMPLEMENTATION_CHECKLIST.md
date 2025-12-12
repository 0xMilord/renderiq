# Paddle Implementation Checklist

**Complete step-by-step checklist for Paddle integration**

---

## Phase 1: Paddle Account Setup

### Account Creation
- [ ] Create Paddle account at https://www.paddle.com/signup
- [ ] Verify email address
- [ ] Complete business details in Settings → Business Details
- [ ] Upload required documents (if needed)
- [ ] Wait for account approval (1-3 business days)

### Business Verification
- [ ] Add business information
- [ ] Add bank account details
- [ ] Verify bank account
- [ ] Set payout preferences

---

## Phase 2: Dashboard Configuration

### API Credentials
- [ ] Go to Developer Tools → Authentication
- [ ] Copy Vendor ID
- [ ] Create API Key (name it: "Renderiq Production" or "Renderiq Sandbox")
- [ ] Copy API Key (save immediately - only shown once!)
- [ ] Copy Public Key from Developer Tools → Public Key

### Products & Prices Setup

#### Credit Packages
- [ ] Go to Catalog → Products
- [ ] Create product for each credit package:
  - [ ] Product 1: "Credit Package - [Name]"
  - [ ] Product 2: "Credit Package - [Name]"
  - [ ] Product 3: "Credit Package - [Name]"
  - [ ] (Add more as needed)
- [ ] For each product, create price:
  - [ ] Price Name: "[Package Name] - USD"
  - [ ] Billing Cycle: One-time
  - [ ] Price: Converted USD amount
  - [ ] Currency: USD
  - [ ] Tax Category: Digital Goods
  - [ ] Copy Price ID (starts with `pri_`)

#### Subscription Plans
- [ ] Create product for each subscription plan:
  - [ ] Product: "[Plan Name]"
  - [ ] (Add all plans)
- [ ] For each plan, create monthly price:
  - [ ] Price Name: "[Plan Name] - Monthly - USD"
  - [ ] Billing Cycle: Monthly
  - [ ] Price: Converted USD amount
  - [ ] Currency: USD
  - [ ] Copy Price ID
- [ ] For annual plans, create yearly price:
  - [ ] Price Name: "[Plan Name] - Annual - USD"
  - [ ] Billing Cycle: Yearly
  - [ ] Price: Converted USD amount
  - [ ] Currency: USD
  - [ ] Copy Price ID

### Webhook Configuration
- [ ] Go to Developer Tools → Events
- [ ] Click "New Destination"
- [ ] Select "Webhook"
- [ ] Name: "Renderiq Production Webhook" (or "Sandbox")
- [ ] URL: `https://yourdomain.com/api/payments/paddle/webhook`
- [ ] Select events:
  - [ ] transaction.completed
  - [ ] transaction.payment_failed
  - [ ] subscription.created
  - [ ] subscription.updated
  - [ ] subscription.canceled
  - [ ] subscription.payment_succeeded
  - [ ] subscription.payment_completed
- [ ] Save webhook
- [ ] Copy Webhook Signing Secret (starts with `whsec_`)

---

## Phase 3: Environment Variables

### Local Development (.env.local)
- [ ] Add `PADDLE_API_KEY` (sandbox: `test_...`, production: `live_...`)
- [ ] Add `PADDLE_PUBLIC_KEY`
- [ ] Add `NEXT_PUBLIC_PADDLE_PUBLIC_KEY`
- [ ] Add `PADDLE_WEBHOOK_SECRET`
- [ ] Add `PADDLE_ENVIRONMENT=sandbox`
- [ ] Add `NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox`
- [ ] Generate price mapping (see below)
- [ ] Add `PADDLE_PRICE_IDS` with JSON mapping

### Generate Price Mapping
- [ ] Run: `npm run generate-paddle-price-mapping` (or use script)
- [ ] Get database IDs for packages/plans
- [ ] Map each ID to Paddle Price ID
- [ ] Format as JSON: `{"package_id_USD": "pri_xxxxx", ...}`
- [ ] Add to `PADDLE_PRICE_IDS` environment variable

### Vercel/Deployment Platform
- [ ] Go to Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Add all Paddle variables:
  - [ ] `PADDLE_API_KEY`
  - [ ] `PADDLE_PUBLIC_KEY`
  - [ ] `NEXT_PUBLIC_PADDLE_PUBLIC_KEY`
  - [ ] `PADDLE_WEBHOOK_SECRET`
  - [ ] `PADDLE_ENVIRONMENT`
  - [ ] `NEXT_PUBLIC_PADDLE_ENVIRONMENT`
  - [ ] `PADDLE_PRICE_IDS`
- [ ] Set environment scope (Production, Preview, Development)
- [ ] Save all variables

---

## Phase 4: Database Migration

- [ ] Check migration file exists: `drizzle/0016_add_payment_provider_support.sql`
- [ ] Run migration: `npm run db:migrate`
- [ ] Verify migration:
  - [ ] Check `payment_orders` table has `payment_provider` column
  - [ ] Check `payment_orders` table has `paddle_transaction_id` column
  - [ ] Check `payment_orders` table has `paddle_subscription_id` column
  - [ ] Check `user_subscriptions` table has `payment_provider` column
  - [ ] Check `user_subscriptions` table has `paddle_subscription_id` column
  - [ ] Check `user_subscriptions` table has `paddle_customer_id` column

---

## Phase 5: Testing (Sandbox)

### Test Credit Package Purchase
- [ ] Set environment to sandbox
- [ ] Deploy or run locally
- [ ] Visit pricing page (as international user - use VPN if needed)
- [ ] Click "Purchase Credits" on a package
- [ ] Verify redirects to Paddle sandbox checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Verify:
  - [ ] Redirects to success page
  - [ ] Credits added to account
  - [ ] Invoice generated
  - [ ] Receipt generated
  - [ ] Credits added email sent
  - [ ] Invoice email sent
  - [ ] Receipt email sent

### Test Subscription
- [ ] Visit pricing page (as international user)
- [ ] Click "Subscribe" on a plan
- [ ] Verify redirects to Paddle sandbox checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Verify:
  - [ ] Subscription activated
  - [ ] Initial credits added
  - [ ] Subscription activated email sent
  - [ ] Credits added email sent
  - [ ] Subscription shows in billing dashboard

### Test Webhooks
- [ ] Go to Paddle Dashboard → Developer Tools → Events
- [ ] Click on your webhook destination
- [ ] Check "Recent Events" tab
- [ ] Verify events are being sent
- [ ] Check server logs for webhook processing
- [ ] Verify webhook events are handled correctly

### Test Country Detection
- [ ] Test as Indian user (VPN or modify detection):
  - [ ] Should use Razorpay
  - [ ] Should show INR prices
  - [ ] Should open Razorpay modal
- [ ] Test as international user:
  - [ ] Should use Paddle
  - [ ] Should show USD prices
  - [ ] Should redirect to Paddle checkout

---

## Phase 6: Production Deployment

### Switch to Production Mode
- [ ] Toggle Paddle Dashboard to Production mode
- [ ] Get production API keys (start with `live_`)
- [ ] Get production public key
- [ ] Create production products and prices (separate from sandbox)
- [ ] Copy production Price IDs
- [ ] Update `PADDLE_PRICE_IDS` with production IDs

### Update Environment Variables
- [ ] Update `PADDLE_ENVIRONMENT=production`
- [ ] Update `NEXT_PUBLIC_PADDLE_ENVIRONMENT=production`
- [ ] Update `PADDLE_API_KEY` to production key
- [ ] Update `PADDLE_PUBLIC_KEY` to production key
- [ ] Update `NEXT_PUBLIC_PADDLE_PUBLIC_KEY` to production key
- [ ] Update `PADDLE_WEBHOOK_SECRET` to production secret
- [ ] Update `PADDLE_PRICE_IDS` with production Price IDs

### Update Webhook URL
- [ ] Go to Developer Tools → Events
- [ ] Edit webhook destination
- [ ] Update URL to: `https://renderiq.io/api/payments/paddle/webhook`
- [ ] Save

### Deploy
- [ ] Update Vercel environment variables
- [ ] Commit changes
- [ ] Push to repository
- [ ] Wait for deployment
- [ ] Verify deployment successful

### Production Testing
- [ ] Test credit package purchase (real card or test mode)
- [ ] Test subscription (real card or test mode)
- [ ] Verify webhooks working
- [ ] Verify emails sending
- [ ] Monitor payment success rates

---

## Phase 7: Monitoring & Maintenance

### Set Up Monitoring
- [ ] Monitor payment success rates in Paddle dashboard
- [ ] Monitor webhook delivery rates
- [ ] Set up alerts for payment failures
- [ ] Set up alerts for webhook failures
- [ ] Monitor credit addition success
- [ ] Monitor email delivery

### Regular Checks
- [ ] Check Paddle dashboard daily for new transactions
- [ ] Verify subscriptions renewing correctly
- [ ] Check webhook logs for errors
- [ ] Monitor payout schedule
- [ ] Review payment success rates weekly

---

## 🎯 Quick Reference

### Test Cards (Sandbox)
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`
- **Expiry:** Any future date
- **CVV:** Any 3 digits

### Important URLs
- **Paddle Dashboard:** https://vendors.paddle.com
- **Developer Tools:** https://vendors.paddle.com/developer-tools
- **API Docs:** https://developer.paddle.com/
- **Support:** support@paddle.com

### Key Files
- **Setup Guide:** `PADDLE_SETUP_GUIDE.md`
- **Price Mapping:** `PADDLE_PRICE_ID_MAPPING_GUIDE.md`
- **Quick Start:** `PADDLE_QUICK_START.md`
- **Migration:** `drizzle/0016_add_payment_provider_support.sql`

---

## ✅ Completion Status

**Phase 1:** ⏳ In Progress  
**Phase 2:** ⏳ In Progress  
**Phase 3:** ⏳ In Progress  
**Phase 4:** ⏳ In Progress  
**Phase 5:** ⏳ In Progress  
**Phase 6:** ⏳ Pending  
**Phase 7:** ⏳ Pending  

---

**Last Updated:** December 12, 2024  
**Status:** Ready to Start Implementation

