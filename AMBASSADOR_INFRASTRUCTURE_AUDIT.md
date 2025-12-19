# Ambassador Infrastructure Audit

**Date:** 2025-01-27  
**Status:** 🔴 Critical Issues Found

---

## Executive Summary

This audit reveals **critical gaps** in the ambassador infrastructure implementation:

1. ❌ **Discounts are NOT applied at subscription creation** - Users pay full price even if referred
2. ❌ **No discount code generation** - System relies on referral records but discounts aren't applied upfront
3. ❌ **Volume tier updates are NOT automatic** - Tiers don't update when referrals sign up/subscribe
4. ⚠️ **Discount calculation happens too late** - Only in webhooks after payment is processed

---

## Current Flow Analysis

### 1. Ambassador Link Click Flow ✅

**Location:** `app/signup/page.tsx` (lines 54-62)

```typescript
// Store referral code in cookie if present
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  if (refCode) {
    // Store referral code in cookie (expires in 30 days)
    document.cookie = `ambassador_ref=${refCode}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  }
}, []);
```

**Status:** ✅ **WORKING** - Ref parameter is correctly stored in cookie

**Flow:**
1. User clicks: `https://renderiq.com/signup?ref=ABC123`
2. Ref code stored in `ambassador_ref` cookie (30-day expiry)
3. Cookie persists through signup process

---

### 2. User Signup & Referral Tracking ✅

**Location:** `lib/services/user-onboarding.ts` (lines 211-228)

```typescript
// Track ambassador referral if present
if (context?.request) {
  try {
    const cookies = context.request.headers.get('cookie') || '';
    const ambassadorRefMatch = cookies.match(/ambassador_ref=([^;]+)/);
    if (ambassadorRefMatch) {
      const referralCode = ambassadorRefMatch[1];
      logger.log('🔗 UserOnboarding: Tracking ambassador referral:', referralCode);
      
      const { AmbassadorService } = await import('./ambassador.service');
      await AmbassadorService.trackSignup(referralCode, newUser.id);
    }
  } catch (error) {
    logger.warn('⚠️ UserOnboarding: Failed to track ambassador referral:', error);
  }
}
```

**Status:** ✅ **WORKING** - Referral tracking works correctly

**Flow:**
1. User signs up (email/password or OAuth)
2. `UserOnboardingService.createUserProfile()` is called
3. Checks for `ambassador_ref` cookie
4. Calls `AmbassadorService.trackSignup()` which:
   - Validates ambassador code
   - Checks if ambassador is active
   - Creates `ambassador_referrals` record with status `pending`
   - Updates ambassador `totalReferrals` count
   - Updates link `signupCount` if custom link used

**Database Record Created:**
- `ambassador_referrals` table entry with:
  - `status: 'pending'`
  - `referral_code: 'ABC123'`
  - `ambassador_id`, `referred_user_id`, `link_id` (if custom link)

---

### 3. Discount Application ❌ **CRITICAL ISSUE**

**Problem:** Discounts are **NOT applied** when creating subscriptions. They are only calculated in webhooks **AFTER** payment is processed.

#### 3.1 Subscription Creation Flow

**Location:** `lib/services/razorpay.service.ts` - `createSubscription()` method

**Current Implementation:**
- Creates Razorpay subscription with **FULL PRICE**
- Does NOT check for ambassador referral
- Does NOT apply discount
- Does NOT call `AmbassadorService.calculateDiscount()`

**Issue:** User pays full price even if they were referred by an ambassador.

#### 3.2 Discount Calculation (Only in Webhooks)

**Location:** `lib/services/razorpay.service.ts` - `handlePaymentAuthorized()` (lines 1600-1658) and `handleSubscriptionCharged()` (lines 2263-2322)

**Current Implementation:**
```typescript
// Check for ambassador referral and calculate discount
let discountAmount = 0;
let originalAmount = parseFloat(plan.price.toString());

// Check for referral first
let referralData = null;
try {
  const { AmbassadorDAL } = await import('@/lib/dal/ambassador');
  referralData = await AmbassadorDAL.getReferralByUserId(subscription.userId);
  
  if (referralData && referralData.ambassador.status === 'active') {
    const discountPercentage = parseFloat(referralData.ambassador.discountPercentage.toString());
    discountAmount = (originalAmount * discountPercentage) / 100;
  }
} catch (error) {
  logger.warn('⚠️ RazorpayService: Error checking ambassador referral:', error);
}

// Create payment order with discount
amount: (originalAmount - discountAmount).toString(), // Net amount after discount
```

**Status:** ⚠️ **PARTIALLY WORKING** - Discount is calculated but:
1. **Too late** - Payment already processed at full price
2. **Not reflected in Razorpay** - Razorpay charges full amount, discount only in our records
3. **No refund mechanism** - User overpays, no automatic refund

**Flow:**
1. User subscribes → Razorpay charges **FULL PRICE**
2. Webhook fires → We calculate discount
3. Payment order created with discount amount (but Razorpay already charged full price)
4. Commission recorded based on original amount

**Result:** 
- ❌ User pays full price (no discount applied)
- ✅ Commission calculated correctly (on original amount)
- ❌ Discount exists only in our records, not in actual payment

---

### 4. Commission Recording ✅

**Location:** `lib/services/ambassador.service.ts` - `processSubscriptionPayment()` (lines 349-437)

**Status:** ✅ **WORKING** - Commissions are recorded correctly

**Flow:**
1. Webhook handler calls `AmbassadorService.processSubscriptionPayment()`
2. Gets referral record for user
3. Validates ambassador is active
4. Checks commission period (6 months default)
5. Calculates commission (25% of original subscription amount)
6. Records commission in `ambassador_commissions` table
7. Updates ambassador earnings stats

**Commission Calculation:**
```typescript
// Commission is calculated on original amount, not discounted
const commissionPercentage = parseFloat(ambassador.commissionPercentage.toString());
const commissionAmount = (subscriptionAmount * commissionPercentage) / 100;
```

**Database Records:**
- `ambassador_commissions` entry created
- Ambassador `totalEarnings` and `pendingEarnings` updated
- Referral `totalCommissionEarned` updated

---

### 5. Discount Tier System ❌ **NOT AUTOMATIC**

**Location:** `lib/services/ambassador.service.ts` - `updateAmbassadorVolumeTier()` (lines 553-577)

**Status:** ❌ **NOT AUTOMATIC** - Tier updates must be manually triggered

**Problem:**
- Volume tiers exist in database (`ambassador_volume_tiers` table)
- `updateAmbassadorVolumeTier()` method exists
- **BUT** it's never called automatically when:
  - New referral signs up
  - New referral subscribes
  - Weekly stats update

**Volume Tiers:**
- **Bronze** (0-9 referrals): 20% discount
- **Silver** (10-49 referrals): 25% discount
- **Gold** (50-99 referrals): 30% discount
- **Platinum** (100+ referrals): 35% discount

**Current Behavior:**
- Ambassador discount percentage is set at approval (default 20%)
- Never updated automatically based on referral count
- Discount tier calculation exists but not integrated

---

### 6. Discount Code Generation ❌ **DOES NOT EXIST**

**Status:** ❌ **NOT IMPLEMENTED** - No one-time usage discount codes

**Current System:**
- Relies on `ambassador_referrals` record to identify referred users
- Discount applied based on referral record lookup
- No discount code generation or redemption system

**Missing Features:**
- No unique discount codes generated per referral
- No discount code redemption flow
- No one-time usage enforcement
- No discount code expiration

---

## Critical Issues Summary

### Issue #1: Discounts Not Applied at Subscription Creation 🔴

**Severity:** CRITICAL  
**Impact:** Users pay full price even when referred by ambassadors

**Root Cause:**
- `RazorpayService.createSubscription()` does NOT check for ambassador referral
- Discount calculation only happens in webhooks AFTER payment
- Razorpay charges full price, discount only exists in our records

**Fix Required:**
1. Check for ambassador referral in `createSubscription()`
2. Calculate discount BEFORE creating Razorpay subscription
3. Pass discount to Razorpay (via addons or notes)
4. OR: Create discount coupon in Razorpay and apply it

**Files to Modify:**
- `lib/services/razorpay.service.ts` - `createSubscription()` method
- `lib/actions/payment.actions.ts` - `createPaymentSubscriptionAction()`

---

### Issue #2: No Discount Code Generation 🔴

**Severity:** HIGH  
**Impact:** No way to generate one-time discount codes for users

**Current Behavior:**
- System tracks referrals via database records
- No discount codes generated
- Discounts applied via referral lookup (but not working)

**Options:**
1. **Option A:** Generate one-time discount codes per referral
   - Create unique code when referral tracked
   - User redeems code at checkout
   - Mark code as used after redemption

2. **Option B:** Fix current system (recommended)
   - Apply discount directly in subscription creation
   - Use referral record to identify user
   - No code needed, automatic discount

**Recommendation:** Fix Issue #1 first (apply discount at subscription creation), then consider discount codes as enhancement.

---

### Issue #3: Volume Tier Updates Not Automatic 🟡

**Severity:** MEDIUM  
**Impact:** Ambassador discount percentage doesn't increase with more referrals

**Fix Required:**
1. Call `updateAmbassadorVolumeTier()` when:
   - New referral signs up (`trackSignup()`)
   - New referral subscribes (`processSubscriptionPayment()`)
   - Weekly stats update (if cron job exists)

**Files to Modify:**
- `lib/services/ambassador.service.ts` - `trackSignup()` method
- `lib/services/ambassador.service.ts` - `processSubscriptionPayment()` method

---

### Issue #4: Discount Calculation Timing ⚠️

**Severity:** MEDIUM  
**Impact:** Discount calculated too late (after payment processed)

**Current Flow:**
1. User subscribes → Razorpay charges full price
2. Webhook fires → We calculate discount
3. Payment order shows discount (but user already paid full price)

**Fix Required:**
- Move discount calculation to subscription creation
- Apply discount BEFORE payment processing

---

## What Works ✅

1. ✅ **Ambassador link tracking** - Ref parameter stored in cookie
2. ✅ **Referral signup tracking** - Creates `ambassador_referrals` record
3. ✅ **Commission recording** - Commissions calculated and recorded correctly
4. ✅ **Custom link support** - Custom campaign links work
5. ✅ **Link statistics** - Click, signup, and conversion counts tracked
6. ✅ **Database schema** - All tables and relationships correct

---

## What Doesn't Work ❌

1. ❌ **Discount application** - Discounts not applied at subscription creation
2. ❌ **Discount code generation** - No discount codes generated
3. ❌ **Volume tier updates** - Tiers don't update automatically
4. ❌ **Razorpay discount integration** - Discounts not passed to Razorpay

---

## Recommended Fixes

### Priority 1: Fix Discount Application (CRITICAL)

**File:** `lib/services/razorpay.service.ts`

**In `createSubscription()` method, add:**

```typescript
// Check for ambassador referral BEFORE creating subscription
let discountAmount = 0;
let originalAmount = parseFloat(plan.price.toString());

try {
  const { AmbassadorDAL } = await import('@/lib/dal/ambassador');
  const referralData = await AmbassadorDAL.getReferralByUserId(userId);
  
  if (referralData && referralData.ambassador.status === 'active') {
    const discountPercentage = parseFloat(referralData.ambassador.discountPercentage.toString());
    discountAmount = (originalAmount * discountPercentage) / 100;
    
    // Apply discount to Razorpay subscription
    // Option 1: Use Razorpay addons (if supported)
    // Option 2: Create discount coupon in Razorpay
    // Option 3: Adjust plan price (if allowed)
  }
} catch (error) {
  logger.warn('⚠️ RazorpayService: Error checking ambassador referral:', error);
}

// Create subscription with discounted amount
const subscriptionOptions = {
  plan_id: plan.razorpayPlanId,
  customer_notify: 1,
  quantity: 1,
  // Add discount here - check Razorpay API for discount/coupon support
  // If Razorpay doesn't support discounts, we need to:
  // 1. Create a discounted plan variant, OR
  // 2. Use addons with negative amount, OR
  // 3. Apply discount in payment order only (current approach - not ideal)
};
```

**Note:** Razorpay may not support discounts directly in subscriptions. Options:
1. Create discounted plan variants for each tier
2. Use Razorpay addons (negative amount for discount)
3. Apply discount in payment order and refund difference (not ideal)

---

### Priority 2: Automatic Volume Tier Updates

**File:** `lib/services/ambassador.service.ts`

**In `trackSignup()` method, add at end:**

```typescript
// Update ambassador volume tier after new referral
try {
  await this.updateAmbassadorVolumeTier(ambassador.id);
} catch (error) {
  logger.warn('⚠️ AmbassadorService: Failed to update volume tier:', error);
}
```

**In `processSubscriptionPayment()` method, add after commission recorded:**

```typescript
// Update ambassador volume tier after subscription
try {
  await this.updateAmbassadorVolumeTier(ambassador.id);
} catch (error) {
  logger.warn('⚠️ AmbassadorService: Failed to update volume tier:', error);
}
```

---

### Priority 3: Discount Code Generation (Optional Enhancement)

If you want to implement discount codes:

1. **Add discount codes table:**
```sql
CREATE TABLE ambassador_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES ambassador_referrals(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_percentage DECIMAL(5,2) NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);
```

2. **Generate code in `trackSignup()`:**
```typescript
// Generate unique discount code
const discountCode = await this.generateDiscountCode(referral.id, ambassador.discountPercentage);
```

3. **Redeem code at checkout:**
```typescript
// In subscription creation, check for discount code
const discountCode = request.body.discountCode;
if (discountCode) {
  const codeData = await AmbassadorDAL.getDiscountCodeByCode(discountCode);
  if (codeData && !codeData.isUsed) {
    // Apply discount
    // Mark code as used
  }
}
```

---

## Testing Checklist

After fixes, test:

1. ✅ User clicks ambassador link → Ref stored in cookie
2. ✅ User signs up → Referral record created
3. ✅ User subscribes → Discount applied (check Razorpay payment amount)
4. ✅ Commission recorded → Check `ambassador_commissions` table
5. ✅ Volume tier updates → Check ambassador `discount_percentage` after 10 referrals
6. ✅ Custom links work → Test custom campaign links
7. ✅ Multiple referrals → Test multiple users from same ambassador

---

## Conclusion

The ambassador infrastructure has **solid foundations** (tracking, commission recording, database schema) but **critical gaps** in discount application. The main issue is that discounts are calculated too late (in webhooks) instead of at subscription creation.

**Immediate Action Required:**
1. Fix discount application in `createSubscription()`
2. Add automatic volume tier updates
3. Test end-to-end flow with real Razorpay subscription

**Future Enhancements:**
1. Discount code generation (optional)
2. Automatic tier-based discount updates
3. Discount code redemption UI

---

## Files Involved

### Core Services
- `lib/services/ambassador.service.ts` - Ambassador business logic
- `lib/services/razorpay.service.ts` - Payment processing (needs discount fix)
- `lib/services/user-onboarding.ts` - User signup (referral tracking)

### Data Access
- `lib/dal/ambassador.ts` - Database operations

### Frontend
- `app/signup/page.tsx` - Ref parameter handling
- `components/ambassador/` - Ambassador dashboard components

### Actions
- `lib/actions/payment.actions.ts` - Subscription creation (needs discount check)

---

**Next Steps:**
1. Review Razorpay API documentation for discount/coupon support
2. Implement discount application in subscription creation
3. Add automatic volume tier updates
4. Test with real Razorpay account

