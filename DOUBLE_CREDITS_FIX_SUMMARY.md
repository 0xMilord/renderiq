# ✅ Double Credits Bug - FIXED

## Problem Summary

Users were receiving **DOUBLE (or TRIPLE) credits** when purchasing credit packages or subscriptions due to credits being added in multiple places simultaneously.

---

## Root Cause

### Credit Packages - 3 Places Adding Credits
1. `RazorpayService.verifyPayment()` - Line 277 ✅ **KEPT** (verification)
2. `app/api/payments/verify-payment/route.ts` - Line 68 ❌ **REMOVED** (duplicate)
3. `handlePaymentCaptured` Webhook - Line 1697 ❌ **REMOVED** (webhook)

### Subscriptions - 5 Places Adding Credits
1. `RazorpayService.verifySubscriptionPayment()` - Line 1106 ✅ **KEPT** (verification)
2. `app/api/payments/verify-subscription/route.ts` - Line 161 ❌ **REMOVED** (duplicate fallback)
3. `handlePaymentAuthorized` Webhook - Line 1526 ❌ **REMOVED** (webhook)
4. `handleSubscriptionActivated` Webhook - Line 1798 ❌ **REMOVED** (webhook)
5. `handleSubscriptionCharged` Webhook - Line 2065 ❌ **REMOVED** (webhook)

---

## Solution Implemented

### Strategy: Verification-Only (App Adds Credits)

**Principle:** Credits are ONLY added by the app during payment verification. Webhooks only verify and update status.

### Changes Made

#### 1. ✅ Improved Idempotency Checks

**File: `lib/services/razorpay.service.ts`**

- **`addCreditsToAccount()`** - Now accepts `paymentOrderId` parameter
  - Checks if credits were already added for this specific payment order
  - Uses payment order creation time instead of 5-minute window
  - More reliable duplicate detection

- **`addSubscriptionCredits()`** - Now accepts `paymentOrderId` parameter
  - Checks if credits were already added for this specific payment order
  - Uses payment order creation time instead of 5-minute window
  - More reliable duplicate detection

#### 2. ✅ Removed Credit Addition from Webhooks

**File: `lib/services/razorpay.service.ts`**

- **`handlePaymentCaptured()`** - Removed credit addition (line ~1734)
  - Now only updates payment order status and generates invoice/receipt
  - Credits are added by `verifyPayment()` when app verifies payment

- **`handlePaymentAuthorized()`** - Removed credit addition (line ~1526)
  - Now only creates/updates payment order
  - Credits are added by `verifySubscriptionPayment()` when app verifies payment

- **`handleSubscriptionActivated()`** - Removed credit addition (line ~1835)
  - Now only activates subscription status
  - Credits are added by `verifySubscriptionPayment()` when app verifies payment

- **`handleSubscriptionCharged()`** - Removed credit addition (line ~2094)
  - Now only creates payment order for recurring charge
  - Credits are added by `verifySubscriptionPayment()` when app verifies recurring payment

#### 3. ✅ Removed Duplicate Credit Addition from API Routes

**File: `app/api/payments/verify-payment/route.ts`**
- Already fixed - credits are handled by `RazorpayService.verifyPayment()`

**File: `app/api/payments/verify-subscription/route.ts`**
- Removed credit addition from fallback route (line ~161)
- Credits are only added by `verifySubscriptionPayment()` method

#### 4. ✅ Updated Verification Methods to Pass Payment Order ID

**File: `lib/services/razorpay.service.ts`**

- **`verifyPayment()`** - Now passes `paymentOrder.id` to `addCreditsToAccount()`
  ```typescript
  await this.addCreditsToAccount(paymentOrder.userId, paymentOrder.referenceId, paymentOrder.id);
  ```

- **`verifySubscriptionPayment()`** - Now passes `paymentOrder?.id` to `addSubscriptionCredits()`
  ```typescript
  await this.addSubscriptionCredits(subscription.userId, subscription.planId, paymentOrder?.id);
  ```

---

## Current Credit Addition Flow

### Credit Packages
1. User pays → Frontend calls `/api/payments/verify-payment`
2. API route calls `RazorpayService.verifyPayment()`
3. `verifyPayment()` verifies payment and calls `addCreditsToAccount()` with payment order ID
4. `addCreditsToAccount()` checks if credits already added for this payment order
5. If not added, adds credits once ✅
6. Webhook arrives later → Only updates status, does NOT add credits ✅

### Subscriptions
1. User pays → Frontend calls `/api/payments/verify-subscription`
2. API route calls `RazorpayService.verifySubscriptionPayment()`
3. `verifySubscriptionPayment()` verifies payment and calls `addSubscriptionCredits()` with payment order ID
4. `addSubscriptionCredits()` checks if credits already added for this payment order
5. If not added, adds credits once ✅
6. Webhooks arrive later → Only update status, do NOT add credits ✅

---

## Idempotency Protection

### Payment Order-Based Idempotency

Both `addCreditsToAccount()` and `addSubscriptionCredits()` now:
1. Accept optional `paymentOrderId` parameter
2. Check if payment order exists
3. Check if credit transaction was created after payment order creation
4. Skip credit addition if transaction already exists
5. Return success with `alreadyAdded: true` flag

**Benefits:**
- ✅ More reliable than time-based windows
- ✅ Works even if webhooks arrive late
- ✅ Prevents duplicates even if verification is called multiple times
- ✅ Handles edge cases like network retries

---

## Testing Checklist

### Credit Packages
- [ ] Test single purchase - should add credits once
- [ ] Test webhook arrives before verification - credits added once (by verification)
- [ ] Test verification happens before webhook - credits added once (by verification)
- [ ] Test duplicate verification call - credits not added twice (idempotency check)
- [ ] Test duplicate webhook - credits not added (webhook doesn't add credits)

### Subscriptions
- [ ] Test first payment - credits added once (by verification)
- [ ] Test recurring payment - credits added once per month (by verification)
- [ ] Test multiple webhooks fire - credits not duplicated (webhooks don't add credits)
- [ ] Test verification + webhook - credits not duplicated (only verification adds)
- [ ] Test subscription.activated + subscription.charged - credits not duplicated (webhooks don't add)

---

## Files Modified

1. `lib/services/razorpay.service.ts`
   - Updated `addCreditsToAccount()` - Added payment order ID parameter and idempotency check
   - Updated `addSubscriptionCredits()` - Added payment order ID parameter and idempotency check
   - Updated `verifyPayment()` - Passes payment order ID to `addCreditsToAccount()`
   - Updated `verifySubscriptionPayment()` - Passes payment order ID to `addSubscriptionCredits()`
   - Removed credit addition from `handlePaymentCaptured()` webhook
   - Removed credit addition from `handlePaymentAuthorized()` webhook
   - Removed credit addition from `handleSubscriptionActivated()` webhook
   - Removed credit addition from `handleSubscriptionCharged()` webhook

2. `app/api/payments/verify-subscription/route.ts`
   - Removed duplicate credit addition from fallback route

---

## Risk Assessment

### Low Risk ✅
- **Idempotency checks** - Prevents duplicates even if called multiple times
- **Webhook-only status updates** - Webhooks still work, just don't add credits
- **Verification-based credits** - More reliable, user-initiated flow

### Mitigation
- ✅ Idempotency checks prevent duplicates
- ✅ Payment order tracking ensures credits added once per payment
- ✅ Webhooks still update status and generate invoices/receipts
- ✅ If verification fails, user can retry (idempotency prevents duplicates)

---

## Verification

### Current State
- ✅ Credits added ONLY in verification methods (`verifyPayment()`, `verifySubscriptionPayment()`)
- ✅ All webhooks cleaned - no credit addition
- ✅ API routes cleaned - no duplicate credit addition
- ✅ Idempotency checks use payment order ID (more reliable than time windows)

### Remaining Credit Addition Locations
1. `lib/services/razorpay.service.ts:278` - `verifyPayment()` ✅ (intended)
2. `lib/services/razorpay.service.ts:1122` - `verifySubscriptionPayment()` ✅ (intended)

**All other locations have been removed!** ✅

---

**Status:** ✅ **FIXED**  
**Date:** 2025-01-XX  
**Severity:** CRITICAL → RESOLVED

