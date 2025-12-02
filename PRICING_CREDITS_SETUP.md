# Pricing + Credits System - Setup Guide

## ✅ Completed Implementation

All components of the pricing and credits system have been implemented:

### Database Schema ✅
- ✅ `credit_packages` table - For one-time credit purchases
- ✅ `payment_orders` table - Tracks Razorpay payments
- ✅ Updated `subscription_plans` - Added `razorpay_plan_id` field
- ✅ Updated `user_subscriptions` - Added Razorpay subscription fields

### Services ✅
- ✅ `lib/services/razorpay.service.ts` - Complete Razorpay integration
  - Order creation for credit packages
  - Payment verification
  - Subscription creation
  - Webhook handling
  - Credit allocation

### API Routes ✅
- ✅ `/api/payments/create-order` - Create Razorpay order for credit purchase
- ✅ `/api/payments/verify-payment` - Verify payment signature
- ✅ `/api/payments/create-subscription` - Create Razorpay subscription
- ✅ `/api/payments/webhook` - Handle Razorpay webhooks

### Server Actions ✅
- ✅ `lib/actions/pricing.actions.ts`
  - `getCreditPackagesAction()` - Fetch available credit packages
  - `getSubscriptionPlansAction()` - Fetch subscription plans
  - `getUserCreditsAction()` - Get user credit balance
  - `getCreditPackageAction()` - Get specific package
  - `getSubscriptionPlanAction()` - Get specific plan

### Frontend ✅
- ✅ `/app/pricing/page.tsx` - Main pricing page with tabs
- ✅ `components/pricing/pricing-plans.tsx` - Subscription plans display
- ✅ `components/pricing/credit-packages.tsx` - Credit packages with Razorpay checkout

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Public Razorpay Key (for frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## Database Migration

Run the following commands to create the new tables:

```bash
npm run db:generate
npm run db:migrate
```

## Razorpay Dashboard Setup

### 1. Create Razorpay Account
- Sign up at https://razorpay.com
- Complete KYC verification
- Get your API keys from Settings → API Keys

### 2. Create Subscription Plans
For each subscription plan in your database, create a Razorpay Plan:
1. Go to Razorpay Dashboard → Products → Plans
2. Create a plan for each subscription:
   - Plan name: Match your database plan name
   - Billing period: Monthly or Yearly
   - Amount: Plan price in paise (₹100 = 10000 paise)
   - Save the Plan ID
3. Update your `subscription_plans` table with `razorpay_plan_id`

### 3. Configure Webhook
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
4. Save the Webhook Secret to `RAZORPAY_WEBHOOK_SECRET`

## Seed Credit Packages

Create initial credit packages in the database:

```sql
INSERT INTO credit_packages (name, description, credits, price, currency, bonus_credits, is_popular, is_active, display_order)
VALUES
  ('Starter Pack', 'Perfect for trying out', 50, 99.00, 'INR', 0, false, true, 1),
  ('Professional Pack', 'For regular users', 200, 399.00, 'INR', 20, true, true, 2),
  ('Power Pack', 'Best value for power users', 500, 899.00, 'INR', 100, false, true, 3),
  ('Enterprise Pack', 'Maximum credits', 1000, 1599.00, 'INR', 250, false, true, 4);
```

## Testing

### Test Mode
Use Razorpay's test keys:
- Test Key ID: Available in Razorpay Dashboard → Settings → API Keys → Test Mode
- Test cards: https://razorpay.com/docs/payments/test-cards/

### Test Flow
1. Navigate to `/pricing`
2. Click "Credit Packages" tab
3. Select a package and click "Purchase Credits"
4. Use test card: `4111 1111 1111 1111`
5. Expiry: Any future date
6. CVV: Any 3 digits
7. Verify credits are added after successful payment

## Features

### Subscription Plans
- ✅ Monthly/Annual billing toggle
- ✅ Fixed credit allocations per month
- ✅ Recurring payments via Razorpay Subscriptions
- ✅ Auto-renewal
- ✅ Cancellation support

### Credit Packages
- ✅ One-time purchases
- ✅ Bonus credits support
- ✅ Instant credit allocation
- ✅ Razorpay Checkout integration
- ✅ Payment verification

### Top-up System
- ✅ Quick credit purchases when quota exhausted
- ✅ No expiration on credits
- ✅ Real-time balance updates

## Usage

### For Users
1. Visit `/pricing`
2. Choose between subscription plans or credit packages
3. Complete payment via Razorpay
4. Credits automatically added to account
5. Use credits for renders (existing system)

### For Developers
- All payment processing is handled server-side
- Webhooks ensure reliable credit allocation
- Payment orders are tracked for audit
- Transaction history in `credit_transactions` table

## Next Steps

1. ✅ Generate database migration
2. ✅ Run migration
3. ✅ Add Razorpay keys to environment
4. ✅ Create Razorpay plans for subscriptions
5. ✅ Seed credit packages
6. ✅ Configure webhook in Razorpay dashboard
7. ✅ Test payment flow

## Support

For issues or questions:
- Check Razorpay docs: https://razorpay.com/docs/
- Review webhook logs in Razorpay Dashboard
- Check server logs for payment processing errors

