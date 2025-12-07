# 🚨 CRITICAL BUG: Double Credits Audit

## Problem Summary

**Users are receiving DOUBLE (or TRIPLE) credits** when purchasing credit packages or subscriptions due to credits being added in multiple places simultaneously.

---

## Root Cause Analysis

### Credit Packages - 3 Places Adding Credits

#### 1. `RazorpayService.verifyPayment()` - Line 277
```typescript
// lib/services/razorpay.service.ts:277
if (paymentOrder.type === 'credit_package' && paymentOrder.referenceId) {
  const creditsResult = await this.addCreditsToAccount(paymentOrder.userId, paymentOrder.referenceId);
  // ✅ Adds credits (FIRST TIME)
}
```

#### 2. `app/api/payments/verify-payment/route.ts` - Line 68
```typescript
// app/api/payments/verify-payment/route.ts:68
// Add credits if this is a credit package purchase
if (verifyResult.data?.type === 'credit_package' && verifyResult.data?.referenceId) {
  const creditsResult = await RazorpayService.addCreditsToAccount(
    user.id,
    verifyResult.data.referenceId
  );
  // ❌ DUPLICATE! Adds credits AGAIN (SECOND TIME)
}
```

#### 3. `handlePaymentCaptured` Webhook - Line 1659
```typescript
// lib/services/razorpay.service.ts:1659
// Add credits to user account
if (paymentOrder.referenceId) {
  await this.addCreditsToAccount(paymentOrder.userId, paymentOrder.referenceId);
  // ❌ DUPLICATE! Adds credits AGAIN (THIRD TIME)
}
```

**Flow:**
1. User pays → Frontend calls `/api/payments/verify-payment`
2. API route calls `RazorpayService.verifyPayment()` → **Adds credits (1st time)**
3. API route ALSO calls `addCreditsToAccount()` directly → **Adds credits (2nd time)**
4. Razorpay webhook fires `payment.captured` → **Adds credits (3rd time)**

**Result: User gets 3x credits!**

---

### Subscriptions - 5 Places Adding Credits

#### 1. `RazorpayService.verifySubscriptionPayment()` - Line 1068
```typescript
// lib/services/razorpay.service.ts:1068
// CRITICAL: Always add credits when payment is verified
const creditsResult = await this.addSubscriptionCredits(subscription.userId, subscription.planId);
// ✅ Adds credits (FIRST TIME)
```

#### 2. `app/api/payments/verify-subscription/route.ts` - Line 161
```typescript
// app/api/payments/verify-subscription/route.ts:161
// Add initial credits
if (subscription.plan) {
  const creditsResult = await RazorpayService.addSubscriptionCredits(
    user.id,
    subscription.subscription.planId
  );
  // ❌ DUPLICATE! Adds credits AGAIN (SECOND TIME)
}
```

#### 3. `handlePaymentAuthorized` Webhook - Line 1488
```typescript
// lib/services/razorpay.service.ts:1488
// Always add initial credits when payment is authorized/captured
const creditsResult = await this.addSubscriptionCredits(subscription.userId, subscription.planId);
// ❌ DUPLICATE! Adds credits AGAIN (THIRD TIME)
```

#### 4. `handleSubscriptionActivated` Webhook - Line 1760
```typescript
// lib/services/razorpay.service.ts:1760
// Add initial credits (always add on activation)
const creditsResult = await this.addSubscriptionCredits(subscription.userId, subscription.planId);
// ❌ DUPLICATE! Adds credits AGAIN (FOURTH TIME)
```

#### 5. `handleSubscriptionCharged` Webhook - Line 2027
```typescript
// lib/services/razorpay.service.ts:2027
// Add monthly credits for recurring payment
if (subscription.status === 'active') {
  const creditsResult = await this.addSubscriptionCredits(subscription.userId, subscription.planId);
  // ❌ DUPLICATE! Adds credits AGAIN (FIFTH TIME - for recurring)
}
```

**Flow:**
1. User pays → Frontend calls `/api/payments/verify-subscription`
2. API route calls `RazorpayService.verifySubscriptionPayment()` → **Adds credits (1st time)**
3. API route ALSO calls `addSubscriptionCredits()` directly → **Adds credits (2nd time)**
4. Razorpay webhook fires `payment.authorized` → **Adds credits (3rd time)**
5. Razorpay webhook fires `subscription.activated` → **Adds credits (4th time)**
6. Razorpay webhook fires `subscription.charged` → **Adds credits (5th time)**

**Result: User gets 5x credits!**

---

## Current Idempotency Checks

### Subscription Credits - Has Partial Protection
```typescript
// lib/services/razorpay.service.ts:1116-1168
// Check if credits were already added recently (5 minutes)
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
const [recentTransaction] = await db
  .select()
  .from(creditTransactions)
  .where(
    and(
      eq(creditTransactions.userId, userId),
      eq(creditTransactions.referenceId, planId),
      eq(creditTransactions.referenceType, 'subscription'),
      gte(creditTransactions.createdAt, fiveMinutesAgo)
    )
  )
  .limit(1);

if (recentTransaction) {
  logger.log('⚠️ Credits already added recently, skipping duplicate');
  return { success: true, newBalance: userCredit.balance, alreadyAdded: true };
}
```

**Problem:** 
- ✅ Works for subscriptions (5-minute window)
- ❌ **Credit packages have NO idempotency check**
- ❌ 5-minute window is too short - webhooks can arrive later
- ❌ Multiple webhooks can fire simultaneously

### Payment Order Duplicate Check
```typescript
// lib/utils/payment-security.ts:81-126
export async function checkDuplicatePayment(
  razorpayOrderId: string,
  razorpayPaymentId: string
): Promise<{ isDuplicate: boolean; existingOrderId?: string }> {
  // Checks if payment ID already exists
  // Checks for recent duplicate orders (5 minutes)
}
```

**Problem:**
- ✅ Prevents duplicate payment verification
- ❌ **Does NOT prevent duplicate credit addition**
- ❌ Credits can be added even if payment order exists

---

## Files Involved

### Credit Addition Functions
1. `lib/services/razorpay.service.ts`
   - `addCreditsToAccount()` - Line 325 (NO idempotency)
   - `addSubscriptionCredits()` - Line 1113 (HAS idempotency, but insufficient)

### Payment Verification
2. `app/api/payments/verify-payment/route.ts` - Line 68 (DUPLICATE credit addition)
3. `app/api/payments/verify-subscription/route.ts` - Line 161 (DUPLICATE credit addition)

### Webhook Handlers
4. `lib/services/razorpay.service.ts`
   - `handlePaymentCaptured()` - Line 1659 (DUPLICATE credit addition)
   - `handlePaymentAuthorized()` - Line 1488 (DUPLICATE credit addition)
   - `handleSubscriptionActivated()` - Line 1760 (DUPLICATE credit addition)
   - `handleSubscriptionCharged()` - Line 2027 (DUPLICATE credit addition)

---

## The Fix

### Solution: Single Source of Truth + Idempotency

**Principle:** Credits should ONLY be added in ONE place, with proper idempotency checks.

### Strategy 1: Webhook-Only (Recommended)

**Remove credit addition from:**
- ❌ `app/api/payments/verify-payment/route.ts` - Remove lines 66-77
- ❌ `app/api/payments/verify-subscription/route.ts` - Remove lines 159-187
- ❌ `RazorpayService.verifyPayment()` - Remove lines 275-281
- ❌ `RazorpayService.verifySubscriptionPayment()` - Remove lines 1066-1086

**Keep credit addition ONLY in:**
- ✅ `handlePaymentCaptured` webhook (for credit packages)
- ✅ `handleSubscriptionActivated` webhook (for subscriptions - first payment)
- ✅ `handleSubscriptionCharged` webhook (for subscriptions - recurring)

**Add idempotency checks:**
- Check if payment order already processed
- Check if credits already added for this payment order
- Use payment order ID as unique identifier

### Strategy 2: Verification-Only (Alternative)

**Remove credit addition from:**
- ❌ All webhook handlers
- ❌ API routes (keep verification only)

**Keep credit addition ONLY in:**
- ✅ `RazorpayService.verifyPayment()` (for credit packages)
- ✅ `RazorpayService.verifySubscriptionPayment()` (for subscriptions)

**Add idempotency checks:**
- Check payment order status before adding credits
- Check if credits already added for this payment order

**Problem:** If webhook arrives before verification, credits won't be added.

---

## Recommended Fix: Webhook-Only with Idempotency

### Why Webhook-Only?
1. **More reliable** - Webhooks are guaranteed delivery
2. **Single source of truth** - Only webhooks add credits
3. **Handles edge cases** - Works even if user closes browser
4. **Razorpay best practice** - Webhooks are the authoritative source

### Implementation

#### Step 1: Add Idempotency to Credit Packages

**File: `lib/services/razorpay.service.ts` - `addCreditsToAccount()`**

```typescript
static async addCreditsToAccount(
  userId: string,
  creditPackageId: string,
  paymentOrderId?: string // Add payment order ID for idempotency
) {
  try {
    logger.log('💰 RazorpayService: Adding credits to account:', { userId, creditPackageId, paymentOrderId });

    // ✅ IDEMPOTENCY CHECK: Check if credits already added for this payment order
    if (paymentOrderId) {
      const [existingTransaction] = await db
        .select()
        .from(creditTransactions)
        .where(
          and(
            eq(creditTransactions.userId, userId),
            eq(creditTransactions.referenceId, creditPackageId),
            eq(creditTransactions.referenceType, 'subscription'), // Same type as current
            // Check if transaction was created for this payment order
            // We can store paymentOrderId in transaction metadata or check payment order
          )
        )
        .limit(1);

      // Better: Check payment order to see if credits were already added
      if (paymentOrderId) {
        const [paymentOrder] = await db
          .select()
          .from(paymentOrders)
          .where(eq(paymentOrders.id, paymentOrderId))
          .limit(1);

        if (paymentOrder && paymentOrder.status === 'completed') {
          // Check if credits transaction exists for this payment order
          const [creditTransaction] = await db
            .select()
            .from(creditTransactions)
            .where(
              and(
                eq(creditTransactions.userId, userId),
                eq(creditTransactions.referenceId, creditPackageId),
                gte(creditTransactions.createdAt, new Date(paymentOrder.createdAt))
              )
            )
            .orderBy(desc(creditTransactions.createdAt))
            .limit(1);

          if (creditTransaction) {
            logger.log('⚠️ RazorpayService: Credits already added for this payment order, skipping duplicate');
            const [userCredit] = await db
              .select()
              .from(userCredits)
              .where(eq(userCredits.userId, userId))
              .limit(1);
            return { 
              success: true, 
              newBalance: userCredit?.balance || 0, 
              alreadyAdded: true 
            };
          }
        }
      }
    }

    // ... rest of the function
  }
}
```

#### Step 2: Remove Credit Addition from API Routes

**File: `app/api/payments/verify-payment/route.ts`**

```typescript
// ❌ REMOVE THIS ENTIRE BLOCK (lines 66-77)
// Add credits if this is a credit package purchase
if (verifyResult.data?.type === 'credit_package' && verifyResult.data?.referenceId) {
  const creditsResult = await RazorpayService.addCreditsToAccount(
    user.id,
    verifyResult.data.referenceId
  );
  // ...
}

// ✅ KEEP ONLY VERIFICATION
// Credits will be added by webhook
```

**File: `app/api/payments/verify-subscription/route.ts`**

```typescript
// ❌ REMOVE THIS ENTIRE BLOCK (lines 159-187)
// Add initial credits
if (subscription.plan) {
  const creditsResult = await RazorpayService.addSubscriptionCredits(
    user.id,
    subscription.subscription.planId
  );
  // ...
}

// ✅ KEEP ONLY VERIFICATION
// Credits will be added by webhook
```

#### Step 3: Remove Credit Addition from Verification Methods

**File: `lib/services/razorpay.service.ts` - `verifyPayment()`**

```typescript
// ❌ REMOVE THIS BLOCK (lines 275-281)
// Add credits only for fully captured payments
if (paymentOrder.type === 'credit_package' && paymentOrder.referenceId) {
  const creditsResult = await this.addCreditsToAccount(paymentOrder.userId, paymentOrder.referenceId);
  // ...
}

// ✅ KEEP ONLY VERIFICATION AND INVOICE GENERATION
// Credits will be added by webhook
```

**File: `lib/services/razorpay.service.ts` - `verifySubscriptionPayment()`**

```typescript
// ❌ REMOVE THIS BLOCK (lines 1066-1086)
// CRITICAL: Always add credits when payment is verified
const creditsResult = await this.addSubscriptionCredits(subscription.userId, subscription.planId);
// ...

// ✅ KEEP ONLY VERIFICATION AND INVOICE GENERATION
// Credits will be added by webhook
```

#### Step 4: Update Webhook Handlers with Idempotency

**File: `lib/services/razorpay.service.ts` - `handlePaymentCaptured()`**

```typescript
// ✅ KEEP credit addition, but add idempotency check
// Add credits to user account
if (paymentOrder.referenceId) {
  // ✅ ADD: Pass payment order ID for idempotency
  await this.addCreditsToAccount(
    paymentOrder.userId, 
    paymentOrder.referenceId,
    paymentOrder.id // Pass payment order ID
  );
}
```

**File: `lib/services/razorpay.service.ts` - `handlePaymentAuthorized()`**

```typescript
// ❌ REMOVE credit addition from here
// This webhook fires BEFORE payment.captured
// Credits should only be added in payment.captured or subscription.activated

// ✅ REMOVE THIS (line 1488):
// const creditsResult = await this.addSubscriptionCredits(...);
```

**File: `lib/services/razorpay.service.ts` - `handleSubscriptionActivated()`**

```typescript
// ✅ KEEP credit addition, but improve idempotency
// The existing check (5 minutes) is insufficient
// Use payment order ID instead

// ✅ IMPROVE: Check payment order instead of time window
const [paymentOrder] = await db
  .select()
  .from(paymentOrders)
  .where(eq(paymentOrders.razorpaySubscriptionId, subscriptionId))
  .orderBy(desc(paymentOrders.createdAt))
  .limit(1);

if (paymentOrder) {
  // Check if credits already added for this payment order
  const [existingTransaction] = await db
    .select()
    .from(creditTransactions)
    .where(
      and(
        eq(creditTransactions.userId, subscription.userId),
        eq(creditTransactions.referenceId, subscription.planId),
        eq(creditTransactions.referenceType, 'subscription'),
        gte(creditTransactions.createdAt, new Date(paymentOrder.createdAt))
      )
    )
    .limit(1);

  if (existingTransaction) {
    logger.log('⚠️ Credits already added for this subscription activation, skipping');
    return;
  }
}

// Then add credits
const creditsResult = await this.addSubscriptionCredits(subscription.userId, subscription.planId);
```

**File: `lib/services/razorpay.service.ts` - `handleSubscriptionCharged()`**

```typescript
// ✅ KEEP credit addition, but improve idempotency
// Check payment order instead of subscription status

// ✅ IMPROVE: Use payment order to check if credits already added
const [paymentOrder] = await db
  .select()
  .from(paymentOrders)
  .where(eq(paymentOrders.razorpaySubscriptionId, subscriptionId))
  .orderBy(desc(paymentOrders.createdAt))
  .limit(1);

if (paymentOrder) {
  // Check if credits already added for this payment order
  const [existingTransaction] = await db
    .select()
    .from(creditTransactions)
    .where(
      and(
        eq(creditTransactions.userId, subscription.userId),
        eq(creditTransactions.referenceId, subscription.planId),
        eq(creditTransactions.referenceType, 'subscription'),
        gte(creditTransactions.createdAt, new Date(paymentOrder.createdAt))
      )
    )
    .limit(1);

  if (existingTransaction) {
    logger.log('⚠️ Credits already added for this subscription charge, skipping');
    return;
  }
}

// Then add credits
const creditsResult = await this.addSubscriptionCredits(subscription.userId, subscription.planId);
```

---

## Complete Fix Implementation

### Fix 1: Add Payment Order ID to Credit Transactions

**Update Schema (if needed):**
- Add `paymentOrderId` field to `credit_transactions` table (optional, can use metadata)

**Or use metadata:**
```typescript
// Store payment order ID in transaction metadata
db.insert(creditTransactions).values({
  userId,
  amount: totalCredits,
  type: 'earned',
  description: `Purchased ${packageData.name}...`,
  referenceId: creditPackageId,
  referenceType: 'subscription',
  metadata: {
    paymentOrderId: paymentOrderId, // Store for idempotency
  },
});
```

### Fix 2: Update `addCreditsToAccount()` with Idempotency

```typescript
static async addCreditsToAccount(
  userId: string,
  creditPackageId: string,
  paymentOrderId?: string
) {
  try {
    // ✅ IDEMPOTENCY: Check if credits already added for this payment order
    if (paymentOrderId) {
      const [paymentOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, paymentOrderId))
        .limit(1);

      if (paymentOrder) {
        // Check if transaction exists for this payment order
        const [existingTransaction] = await db
          .select()
          .from(creditTransactions)
          .where(
            and(
              eq(creditTransactions.userId, userId),
              eq(creditTransactions.referenceId, creditPackageId),
              eq(creditTransactions.referenceType, 'subscription'),
              gte(creditTransactions.createdAt, new Date(paymentOrder.createdAt))
            )
          )
          .orderBy(desc(creditTransactions.createdAt))
          .limit(1);

        if (existingTransaction) {
          logger.log('⚠️ RazorpayService: Credits already added for payment order, skipping duplicate');
          const [userCredit] = await db
            .select()
            .from(userCredits)
            .where(eq(userCredits.userId, userId))
            .limit(1);
          return { 
            success: true, 
            newBalance: userCredit?.balance || 0, 
            alreadyAdded: true 
          };
        }
      }
    }

    // ... rest of function (existing code)
  }
}
```

### Fix 3: Remove Duplicate Credit Addition

**Remove from:**
1. `app/api/payments/verify-payment/route.ts` - Lines 66-77
2. `app/api/payments/verify-subscription/route.ts` - Lines 159-187
3. `lib/services/razorpay.service.ts` - `verifyPayment()` - Lines 275-281
4. `lib/services/razorpay.service.ts` - `verifySubscriptionPayment()` - Lines 1066-1086
5. `lib/services/razorpay.service.ts` - `handlePaymentAuthorized()` - Line 1488

**Keep in:**
1. `lib/services/razorpay.service.ts` - `handlePaymentCaptured()` - Line 1659 (with idempotency)
2. `lib/services/razorpay.service.ts` - `handleSubscriptionActivated()` - Line 1760 (with improved idempotency)
3. `lib/services/razorpay.service.ts` - `handleSubscriptionCharged()` - Line 2027 (with improved idempotency)

---

## Testing Checklist

### Credit Packages
- [ ] Test single purchase - should add credits once
- [ ] Test webhook arrives before verification - credits added once
- [ ] Test verification happens before webhook - credits added once
- [ ] Test duplicate webhook - credits not added twice
- [ ] Test duplicate verification - credits not added twice

### Subscriptions
- [ ] Test first payment - credits added once
- [ ] Test recurring payment - credits added once per month
- [ ] Test multiple webhooks fire - credits not duplicated
- [ ] Test verification + webhook - credits not duplicated
- [ ] Test subscription.activated + subscription.charged - credits not duplicated

---

## Migration Plan

### Phase 1: Add Idempotency (No Breaking Changes)
1. Update `addCreditsToAccount()` with idempotency check
2. Update `addSubscriptionCredits()` with better idempotency
3. Test thoroughly

### Phase 2: Remove Duplicate Calls
1. Remove credit addition from API routes
2. Remove credit addition from verification methods
3. Remove credit addition from `handlePaymentAuthorized`
4. Deploy and monitor

### Phase 3: Verify & Monitor
1. Monitor logs for duplicate credit additions
2. Check user credit balances
3. Verify no double credits in production

---

## Risk Assessment

### High Risk
- **Removing credit addition** - If webhook fails, credits won't be added
- **Timing issues** - Webhook might arrive late

### Mitigation
- **Keep webhook as primary** - Most reliable
- **Add retry logic** - If webhook fails, retry
- **Monitor logs** - Alert if credits not added
- **Manual credit addition** - Admin tool for edge cases

---

## Quick Fix (Immediate)

**For immediate fix, add idempotency checks without removing code:**

1. Update `addCreditsToAccount()` to check payment order
2. Update `addSubscriptionCredits()` to use payment order instead of time window
3. This will prevent duplicates even if multiple calls happen

**Then later:**
- Remove duplicate credit addition calls
- Clean up code

---

**Last Updated:** 2025-01-XX  
**Severity:** CRITICAL  
**Impact:** Revenue loss, user confusion

