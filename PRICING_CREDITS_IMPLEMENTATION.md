# Pricing + Credits System Implementation Plan

## Overview
Implementing a comprehensive pricing system with:
1. **Subscription Plans** - Monthly/Annual plans with fixed credit allocations (like mobile data plans)
2. **Credit Packages** - One-time credit purchases (pay-as-you-go)
3. **Top-up System** - Quick credit purchases when monthly quota is exhausted
4. **Razorpay Integration** - For both recurring subscriptions and one-time payments

## Database Schema Changes

### 1. Credit Packages Table ✅ (Already added)
- `credit_packages` table for one-time credit purchases
- Fields: id, name, description, credits, price, currency (INR), bonusCredits, isPopular, isActive, displayOrder

### 2. Payment Orders Table (NEW - NEEDED)
- `payment_orders` table to track Razorpay payments
- Fields: id, userId, type (subscription|credit_package), referenceId, razorpayOrderId, razorpayPaymentId, amount, currency, status, metadata, createdAt, updatedAt

### 3. Update Subscription Plans
- Add `razorpay_plan_id` field for Razorpay subscription plans
- Update currency to support INR for Razorpay

## Implementation Steps

### Step 1: Database Schema Updates
- [x] Add credit_packages table
- [x] Add payment_orders table
- [x] Update subscription_plans table (add razorpay_plan_id)
- [x] Update user_subscriptions table (add razorpay fields)

### Step 2: Razorpay Service
- [x] Install razorpay package
- [x] Create RazorpayService class
- [x] Implement methods for:
  - Creating orders (one-time payments)
  - Creating subscriptions
  - Verifying payments
  - Handling webhooks

### Step 3: API Routes
- [x] `/api/payments/create-order` - Create Razorpay order for credit package
- [x] `/api/payments/verify-payment` - Verify Razorpay payment
- [x] `/api/payments/create-subscription` - Create Razorpay subscription
- [x] `/api/payments/webhook` - Handle Razorpay webhooks

### Step 4: Server Actions
- [x] `getCreditPackagesAction` - Fetch available credit packages
- [x] `getSubscriptionPlansAction` - Fetch subscription plans
- [x] `getUserCreditsAction` - Get user credit balance
- [x] `getCreditPackageAction` - Get specific package
- [x] `getSubscriptionPlanAction` - Get specific plan

### Step 5: Pricing Page
- [x] Create `/pricing` page
- [x] Two tabs: "Plans" and "Credits"
- [x] Plans tab: Show subscription plans with monthly credit allocations
- [x] Credits tab: Show credit packages for one-time purchases
- [x] Integrated Razorpay checkout for both plans and credits

### Step 6: Components
- [x] `PricingPlans` - Display subscription plans with Razorpay integration
- [x] `CreditPackages` - Display credit packages with Razorpay checkout
- [x] Integrated payment buttons in components

## Razorpay Integration Details

### One-Time Payments (Credit Packages)
1. Create order via Razorpay Orders API
2. Get order_id and amount
3. Initialize Razorpay checkout
4. On payment success, verify payment via webhook
5. Add credits to user account

### Recurring Subscriptions
1. Create Razorpay Plan (one-time setup)
2. Create Razorpay Subscription for user
3. Handle subscription webhooks (activated, charged, cancelled)
4. Update subscription status in database
5. Add credits on successful payment

## File Structure

```
lib/
  services/
    razorpay.service.ts       # Razorpay integration
    billing.service.ts        # Update to support Razorpay
  dal/
    billing.ts                # Update for credit packages
  actions/
    pricing.actions.ts        # New pricing actions
  db/
    schema.ts                 # Already updated with credit_packages
app/
  pricing/
    page.tsx                  # New pricing page
  api/
    payments/
      create-order/
        route.ts              # Create Razorpay order
      verify-payment/
        route.ts              # Verify payment
      create-subscription/
        route.ts              # Create subscription
      webhook/
        route.ts              # Razorpay webhooks
components/
  pricing/
    pricing-plans.tsx         # Subscription plans component
    credit-packages.tsx       # Credit packages component
    top-up-modal.tsx          # Quick top-up modal
```

## Next Steps
1. Add payment_orders table to schema
2. Install Razorpay SDK
3. Create RazorpayService
4. Create pricing page
5. Implement payment flows

