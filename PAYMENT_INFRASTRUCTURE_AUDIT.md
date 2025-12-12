# Payment Infrastructure Audit & Global Payment Integration Plan

**Date:** December 2024  
**Status:** Critical - Currency Mismatch Blocking Revenue  
**Priority:** P0 - Existential Issue

---

## Executive Summary

**Problem:** Renderiq is a global GPU-heavy AI product but is trapped in an INR-only payment ecosystem (Razorpay), creating a fatal currency mismatch that prevents sustainable revenue from international users.

**Impact:**
- ❌ Cannot accept payments from US/EU/Global users (primary paying segment)
- ❌ Forced to charge ₹5-₹20 payments that cannot sustain GPU costs
- ❌ Missing 80%+ of potential revenue from international customers
- ❌ Product-market fit exists globally, but payment infrastructure blocks monetization

**Solution:** Implement dual payment provider strategy:
- **Razorpay** → Indian users (INR) - Keep as-is
- **Paddle/LemonSqueezy** → International users (USD/EUR/GBP) - NEW

**Timeline:** 2-3 days for MVP, 1 week for full production

---

## Current Payment Infrastructure Analysis

### 1. Payment Flow Architecture

**Current Stack:**
- **Provider:** Razorpay only
- **Currency:** Primarily INR (with multi-currency display but Razorpay limitations)
- **Payment Types:** 
  - One-time credit packages (`credit_packages`)
  - Recurring subscriptions (`subscription_plans`)

**Key Files:**
```
lib/services/razorpay.service.ts       # Core Razorpay integration (2500+ lines)
lib/actions/payment.actions.ts         # Server actions for payments
components/pricing/credit-packages.tsx # Credit purchase UI
components/pricing/pricing-plans.tsx   # Subscription UI
lib/hooks/use-razorpay-checkout.ts    # Razorpay SDK loader
app/api/payments/verify-payment/route.ts # Payment verification
app/api/payments/webhook/route.ts     # Webhook handler
```

### 2. Database Schema

**Payment Tables:**
- `payment_orders` - Tracks all payments
  - Fields: `razorpay_order_id`, `razorpay_payment_id`, `razorpay_subscription_id`
  - **Issue:** Hardcoded to Razorpay fields only
- `user_subscriptions` - Subscription management
  - Fields: `razorpay_subscription_id`, `razorpay_customer_id`
  - **Issue:** No support for other providers
- `subscription_plans` - Plan definitions
  - Fields: `razorpay_plan_id`
  - **Issue:** Plans tied to Razorpay only

**Schema Issues:**
1. ❌ No `payment_provider` field to distinguish Razorpay vs Paddle/LemonSqueezy
2. ❌ Provider-specific IDs are hardcoded (e.g., `razorpay_order_id`)
3. ❌ No abstraction layer for multi-provider support

### 3. Currency Detection & Routing

**Current Implementation:**
- `lib/utils/currency.ts` - Currency detection from browser locale
- `lib/hooks/use-currency.ts` - Client-side currency hook
- **Issue:** Currency detection exists but all payments still route to Razorpay

**Problems:**
1. ❌ No country-based routing (Indian users → Razorpay, International → Paddle)
2. ❌ Currency selection doesn't affect payment provider choice
3. ❌ USD/EUR users still forced through Razorpay (which has limitations)

### 4. Payment Provider Service

**Current:** `RazorpayService` (2500+ lines)
- Handles: Orders, Subscriptions, Webhooks, Verification
- **Issue:** Monolithic, tightly coupled to Razorpay
- **No abstraction:** Cannot swap providers or use multiple providers

**What's Missing:**
1. ❌ No `PaymentProvider` interface/abstraction
2. ❌ No provider factory pattern
3. ❌ No unified payment flow that works across providers

### 5. Frontend Components

**Current:**
- `components/pricing/credit-packages.tsx` - Direct Razorpay SDK integration
- `components/pricing/pricing-plans.tsx` - Direct Razorpay checkout
- **Issue:** Hardcoded Razorpay SDK calls, no provider abstraction

**Problems:**
1. ❌ Razorpay SDK loaded globally even for international users
2. ❌ No conditional provider loading based on user location
3. ❌ UI doesn't adapt to different payment providers

---

## Critical Issues Identified

### 🔴 CRITICAL: Currency Mismatch

**Problem:**
- GPU costs: **$0.01-$0.10 per render** (USD-denominated)
- Indian payments: **₹5-₹20** (INR-denominated)
- Conversion: ₹20 = ~$0.24 USD
- **Result:** Cannot break even on GPU costs with INR payments

**Evidence:**
- Razorpay supports multi-currency but:
  - Limited international card acceptance
  - No PayPal support
  - Poor conversion rates for international users
  - High friction for non-Indian users

### 🔴 CRITICAL: Missing International Payment Gateway

**Problem:**
- 80%+ of target users (US/EU architects) cannot pay easily
- Razorpay optimized for Indian payment methods (UPI, Netbanking)
- International users expect: Credit cards, PayPal, Apple Pay

**Impact:**
- Lost revenue from highest-paying segment
- Product-market fit exists but payment friction kills conversions

### 🟡 MEDIUM: No Provider Abstraction

**Problem:**
- All code assumes Razorpay
- Adding new provider requires refactoring entire payment flow
- No unified interface for payment operations

**Impact:**
- Technical debt makes adding providers difficult
- Risk of breaking existing Razorpay flow during migration

### 🟡 MEDIUM: Database Schema Limitations

**Problem:**
- Provider-specific fields hardcoded in schema
- No way to store Paddle/LemonSqueezy transaction IDs
- Migration will require schema changes

---

## Recommended Solution: Dual Payment Provider Strategy

### Architecture Overview

```
User Location Detection
    ↓
┌─────────────────┐
│  India (IN)     │ → Razorpay (INR)
│  International  │ → Paddle/LemonSqueezy (USD/EUR/GBP)
└─────────────────┘
```

### Provider Comparison: Paddle vs LemonSqueezy

| Feature | Paddle | LemonSqueezy | Recommendation |
|---------|--------|--------------|----------------|
| **Merchant of Record** | ✅ Yes | ✅ Yes | Both |
| **Tax Handling** | ✅ Global | ✅ Global | Both |
| **India Payouts** | ✅ Yes (INR) | ✅ Yes (INR) | Both |
| **Setup Time** | 2-3 hours | 1-2 hours | LemonSqueezy |
| **Pricing** | 5% + $0.50 | 3.5% + $0.30 | LemonSqueezy |
| **Market Share** | Larger | Smaller | Paddle |
| **API Quality** | Excellent | Good | Paddle |
| **Subscription Support** | ✅ Excellent | ✅ Good | Both |
| **Documentation** | Excellent | Good | Paddle |
| **Indie SaaS Focus** | Medium | ✅ High | LemonSqueezy |

**Recommendation: Paddle**
- Better for scale (you're building a global product)
- Better tax handling for international customers
- More established, better support
- Slightly more expensive but worth it for reliability

**Alternative: LemonSqueezy**
- If you want faster setup and lower fees
- Better for indie SaaS aesthetic
- Still excellent, just smaller market share

### Implementation Strategy

#### Phase 1: Provider Abstraction (Day 1)
1. Create `PaymentProvider` interface
2. Create `PaymentProviderFactory` for routing
3. Refactor `RazorpayService` to implement interface
4. Add country detection utility

#### Phase 2: Paddle Integration (Day 2-3)
1. Install Paddle SDK
2. Create `PaddleService` implementing `PaymentProvider`
3. Add Paddle webhook handler
4. Update database schema for multi-provider support

#### Phase 3: UI Updates (Day 3-4)
1. Add country detection in frontend
2. Conditionally load payment provider SDK
3. Update payment components for multi-provider
4. Add provider-specific UI adaptations

#### Phase 4: Testing & Migration (Day 4-5)
1. Test Razorpay flow (ensure no regressions)
2. Test Paddle flow (new international users)
3. Test country detection and routing
4. Deploy with feature flag

---

## Database Schema Changes Required

### 1. Add `payment_provider` Field

```sql
-- Add payment_provider to payment_orders
ALTER TABLE payment_orders 
ADD COLUMN payment_provider TEXT DEFAULT 'razorpay' 
CHECK (payment_provider IN ('razorpay', 'paddle', 'lemonsqueezy'));

-- Add provider-specific ID fields (nullable)
ALTER TABLE payment_orders 
ADD COLUMN paddle_transaction_id TEXT,
ADD COLUMN paddle_subscription_id TEXT,
ADD COLUMN lemonsqueezy_order_id TEXT,
ADD COLUMN lemonsqueezy_subscription_id TEXT;

-- Add payment_provider to user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN payment_provider TEXT DEFAULT 'razorpay'
CHECK (payment_provider IN ('razorpay', 'paddle', 'lemonsqueezy'));

-- Add provider-specific subscription fields
ALTER TABLE user_subscriptions
ADD COLUMN paddle_subscription_id TEXT,
ADD COLUMN paddle_customer_id TEXT,
ADD COLUMN lemonsqueezy_subscription_id TEXT,
ADD COLUMN lemonsqueezy_customer_id TEXT;
```

### 2. Migration Strategy

- **Backward Compatible:** All existing records default to 'razorpay'
- **No Data Loss:** Existing Razorpay IDs remain in current fields
- **Gradual Migration:** New international users use Paddle, existing users stay on Razorpay

---

## Code Architecture Changes

### 1. Payment Provider Interface

```typescript
// lib/services/payment-provider.interface.ts
export interface PaymentProvider {
  // One-time payments
  createOrder(userId: string, packageId: string, amount: number, currency: string): Promise<OrderResult>;
  verifyPayment(paymentData: PaymentVerificationData): Promise<VerificationResult>;
  
  // Subscriptions
  createSubscription(userId: string, planId: string, currency: string): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<CancelResult>;
  
  // Webhooks
  verifyWebhook(body: string, signature: string): boolean;
  handleWebhook(event: string, payload: any): Promise<void>;
}
```

### 2. Provider Factory

```typescript
// lib/services/payment-provider.factory.ts
export class PaymentProviderFactory {
  static getProvider(country: string): PaymentProvider {
    // India → Razorpay
    if (country === 'IN') {
      return new RazorpayService();
    }
    
    // International → Paddle
    return new PaddleService();
  }
  
  static getProviderForUser(userId: string): Promise<PaymentProvider> {
    // Detect user country from profile/IP
    // Return appropriate provider
  }
}
```

### 3. Country Detection

```typescript
// lib/utils/country-detection.ts
export async function detectUserCountry(request: Request): Promise<string> {
  // 1. Check user profile (if logged in)
  // 2. Check IP geolocation (Cloudflare/Vercel headers)
  // 3. Check browser locale
  // 4. Default to 'US' (international)
}
```

---

## Implementation Checklist

### Backend Changes

- [ ] Create `PaymentProvider` interface
- [ ] Refactor `RazorpayService` to implement interface
- [ ] Create `PaddleService` implementing interface
- [ ] Create `PaymentProviderFactory` for routing
- [ ] Add country detection utility
- [ ] Update database schema (migration)
- [ ] Create Paddle webhook handler (`/api/payments/paddle/webhook`)
- [ ] Update payment actions to use factory
- [ ] Add environment variables for Paddle

### Frontend Changes

- [ ] Add country detection hook (`use-country-detection.ts`)
- [ ] Conditionally load payment provider SDK
- [ ] Update `credit-packages.tsx` for multi-provider
- [ ] Update `pricing-plans.tsx` for multi-provider
- [ ] Add provider-specific UI components
- [ ] Update payment success/failure pages

### Testing

- [ ] Test Razorpay flow (Indian users)
- [ ] Test Paddle flow (International users)
- [ ] Test country detection accuracy
- [ ] Test webhook handling for both providers
- [ ] Test subscription flows for both providers
- [ ] Test currency conversion and display

### Deployment

- [ ] Add feature flag for Paddle integration
- [ ] Deploy with gradual rollout
- [ ] Monitor payment success rates
- [ ] Monitor webhook delivery
- [ ] Set up alerts for payment failures

---

## Environment Variables Required

```bash
# Existing Razorpay (keep as-is)
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=...

# New Paddle
PADDLE_API_KEY=...
PADDLE_PUBLIC_KEY=...
NEXT_PUBLIC_PADDLE_PUBLIC_KEY=...
PADDLE_WEBHOOK_SECRET=...

# Or LemonSqueezy
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
```

---

## Risk Assessment

### Low Risk
- ✅ Keeping Razorpay for Indian users (no changes to existing flow)
- ✅ Backward compatible database changes
- ✅ Feature flag allows instant rollback

### Medium Risk
- ⚠️ Country detection accuracy (may need IP geolocation service)
- ⚠️ Webhook reliability (need monitoring)
- ⚠️ Currency conversion edge cases

### Mitigation
- Use Cloudflare/Vercel geolocation headers (free, accurate)
- Add retry logic for webhooks
- Fallback to Razorpay if country detection fails
- Comprehensive logging and monitoring

---

## Success Metrics

### Week 1
- [ ] Paddle integration deployed
- [ ] 10+ international payments processed
- [ ] 0% regression in Razorpay payments
- [ ] Webhook delivery rate > 99%

### Month 1
- [ ] 30%+ of new payments via Paddle
- [ ] Average transaction value increases (USD vs INR)
- [ ] Payment conversion rate improves for international users
- [ ] Revenue from international users > 50% of total

---

## Next Steps

1. **Decide:** Paddle or LemonSqueezy? (Recommend Paddle)
2. **Sign up:** Create Paddle/LemonSqueezy account
3. **Get API keys:** Configure sandbox environment
4. **Start implementation:** Follow Phase 1-4 plan above
5. **Test thoroughly:** Before production deployment

---

## Resources

- [Paddle Documentation](https://developer.paddle.com/)
- [LemonSqueezy Documentation](https://docs.lemonsqueezy.com/)
- [Paddle vs LemonSqueezy Comparison](https://www.saasworthy.com/blog/paddle-vs-lemonsqueezy)

---

**Status:** Ready for implementation  
**Estimated Time:** 2-3 days for MVP, 1 week for production-ready  
**Priority:** P0 - Critical for revenue sustainability

