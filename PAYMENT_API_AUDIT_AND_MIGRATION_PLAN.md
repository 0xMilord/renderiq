# Payment API Routes Audit & Migration Plan

**Date**: 2025-01-27  
**Status**: 🔍 **AUDIT COMPLETE** - Migration Plan Ready

---

## Executive Summary

**Total Payment API Routes**: 13  
**Razorpay-Critical Routes**: 3 (MUST KEEP)  
**Internal DB Operations**: 10 (CAN MIGRATE)  
**Routes Already Have Server Actions**: 3  
**Routes Need Server Actions**: 7  

---

## Payment API Routes Analysis

### 🔴 RAZORPAY-CRITICAL (MUST KEEP AS API ROUTES)

These routes are called by external systems (Razorpay) or are part of the payment gateway flow:

#### 1. `/api/payments/webhook` ✅ **KEEP**
**File**: `app/api/payments/webhook/route.ts`

**Why Critical**:
- Called by Razorpay servers (external webhook)
- Requires raw body for signature verification
- Must be publicly accessible endpoint
- Handles payment events asynchronously

**Functionality**:
- Receives webhook events from Razorpay
- Verifies webhook signature
- Handles payment/subscription events
- Updates database based on events

**Status**: ✅ **MUST KEEP** - External webhook endpoint

---

#### 2. `/api/payments/verify-payment` ⚠️ **KEEP (Payment Gateway Flow)**
**File**: `app/api/payments/verify-payment/route.ts`

**Why Critical**:
- Called from client-side after Razorpay checkout completes
- Part of payment gateway verification flow
- Handles duplicate payment detection
- Security-sensitive (payment verification)

**Functionality**:
- Verifies payment signature from Razorpay
- Checks for duplicate payments
- Updates payment order status
- Adds credits to user account
- Generates invoice/receipt

**Current Usage**:
- `lib/hooks/use-razorpay-checkout.ts` - After payment success
- `components/pricing/credit-packages.tsx` - After credit purchase

**Status**: ⚠️ **KEEP** - Part of payment gateway flow (could potentially be server action, but API route is safer for payment verification)

**Recommendation**: Keep as API route for security and payment gateway integration

---

#### 3. `/api/payments/verify-subscription` ⚠️ **KEEP (Payment Gateway Flow)**
**File**: `app/api/payments/verify-subscription/route.ts`

**Why Critical**:
- Called from client-side after Razorpay subscription checkout
- Part of subscription activation flow
- Handles subscription verification
- Security-sensitive

**Functionality**:
- Verifies subscription payment signature
- Activates subscription in database
- Adds credits to user account
- Handles fallback verification (if no signature)

**Current Usage**:
- `app/payment/success/page.tsx` - After subscription success
- `components/pricing/pricing-plans.tsx` - After subscription purchase

**Status**: ⚠️ **KEEP** - Part of payment gateway flow

**Recommendation**: Keep as API route for security and payment gateway integration

---

### 🟡 RAZORPAY INTEGRATION (CAN MIGRATE TO SERVER ACTIONS)

These routes create Razorpay orders/subscriptions but are called from internal app:

#### 4. `/api/payments/create-order` ⚠️ **CAN MIGRATE**
**File**: `app/api/payments/create-order/route.ts`

**Functionality**:
- Creates Razorpay order for credit package purchase
- Validates currency and amount
- Calls `RazorpayService.createOrder()`
- Returns order details for Razorpay checkout

**Current Usage**:
- `components/pricing/credit-packages.tsx` - Before opening Razorpay checkout

**Server Action Needed**: 
- ✅ Create `createPaymentOrderAction()` in `payment.actions.ts`

**Status**: ⚠️ **CAN MIGRATE** - Internal app operation, but creates Razorpay order

**Recommendation**: Migrate to server action (RazorpayService can be called from server action)

---

#### 5. `/api/payments/create-subscription` ⚠️ **CAN MIGRATE**
**File**: `app/api/payments/create-subscription/route.ts`

**Functionality**:
- Creates Razorpay subscription
- Handles upgrade/downgrade logic
- Cancels old subscription if upgrading
- Calls `RazorpayService.createSubscription()`
- Returns subscription details for Razorpay checkout

**Current Usage**:
- `components/pricing/pricing-plans.tsx` - Before opening Razorpay checkout

**Server Action Needed**: 
- ✅ Create `createPaymentSubscriptionAction()` in `payment.actions.ts`

**Status**: ⚠️ **CAN MIGRATE** - Internal app operation, but creates Razorpay subscription

**Recommendation**: Migrate to server action (RazorpayService can be called from server action)

---

#### 6. `/api/payments/cancel-subscription` ⚠️ **CAN MIGRATE**
**File**: `app/api/payments/cancel-subscription/route.ts`

**Functionality**:
- Cancels pending subscription
- Calls `RazorpayService.cancelPendingSubscription()`
- Updates database

**Current Usage**: 
- ❌ **No active usage found** - May be used in admin or future features

**Server Action Needed**: 
- ✅ Create `cancelPaymentSubscriptionAction()` in `payment.actions.ts`

**Status**: ⚠️ **CAN MIGRATE** - Internal operation

**Recommendation**: Migrate to server action

---

### 🟢 INTERNAL DB OPERATIONS (CAN MIGRATE TO SERVER ACTIONS)

These routes only perform database operations and don't interact with Razorpay:

#### 7. `/api/payments/history` ✅ **HAS SERVER ACTION - CAN MIGRATE**
**File**: `app/api/payments/history/route.ts`

**Functionality**:
- Gets payment history for user
- Filters by type, status, date range
- Uses `PaymentHistoryService.getPaymentHistory()`

**Current Usage**:
- `lib/hooks/use-payment-history.ts` - Payment history hook
- `components/billing/billing-history-table.tsx` - Billing history table
- `app/payment/success/page.tsx` - After payment success

**Server Action Available**: 
- ✅ `getPaymentHistoryAction()` - Already exists in `payment.actions.ts`

**Status**: ✅ **READY TO MIGRATE** - Server action already exists

---

#### 8. `/api/payments/invoices` ✅ **HAS SERVER ACTION - CAN MIGRATE**
**File**: `app/api/payments/invoices/route.ts`

**Functionality**:
- Gets user invoices
- Filters by status
- Uses `InvoiceService.getUserInvoices()`

**Current Usage**:
- `lib/hooks/use-invoices.ts` - Invoices hook

**Server Action Available**: 
- ✅ `getInvoicesAction()` - Already exists in `payment.actions.ts`

**Status**: ✅ **READY TO MIGRATE** - Server action already exists

---

#### 9. `/api/payments/invoices/[invoiceNumber]` ✅ **HAS SERVER ACTION - CAN MIGRATE**
**File**: `app/api/payments/invoices/[invoiceNumber]/route.ts`

**Functionality**:
- Gets invoice by invoice number
- Verifies user ownership
- Uses `InvoiceService.getInvoiceByNumber()`

**Current Usage**: 
- ❌ **No direct usage found** - May be used in email links or future features

**Server Action Available**: 
- ✅ `getInvoiceByNumberAction()` - Already exists in `payment.actions.ts`

**Status**: ✅ **READY TO MIGRATE** - Server action already exists

---

#### 10. `/api/payments/receipt/[id]` ⚠️ **NEEDS SERVER ACTION**
**File**: `app/api/payments/receipt/[id]/route.ts`

**Functionality**:
- GET: Gets receipt PDF URL or streams PDF for download
- POST: Generates receipt PDF
- Uses `ReceiptService.generateReceiptPdf()`
- Handles both payment order ID and subscription ID

**Current Usage**:
- `components/billing/recent-payments.tsx` - Download receipt
- `components/billing/recent-payments-paginated.tsx` - Download receipt
- `components/billing/billing-history-table.tsx` - Download receipt
- `app/dashboard/billing/history/page.tsx` - Download receipt
- `app/payment/success/page.tsx` - Get receipt URL

**Server Action Needed**: 
- ✅ Create `getReceiptAction(id: string, download?: boolean)` in `payment.actions.ts`
- ✅ Create `generateReceiptAction(id: string)` in `payment.actions.ts`

**Status**: ⚠️ **NEEDS SERVER ACTION** - Internal operation

**Note**: PDF streaming might need special handling in server actions (Next.js supports streaming responses)

---

#### 11. `/api/payments/[id]` ⚠️ **NEEDS SERVER ACTION**
**File**: `app/api/payments/[id]/route.ts`

**Functionality**:
- Gets payment order by ID
- Includes reference details (package/plan) via JOIN
- Verifies user ownership

**Current Usage**:
- `app/payment/success/page.tsx` - Get payment order details

**Server Action Needed**: 
- ✅ Create `getPaymentOrderAction(id: string)` in `payment.actions.ts`

**Status**: ⚠️ **NEEDS SERVER ACTION** - Internal operation

---

#### 12. `/api/payments/by-subscription/[subscriptionId]` ⚠️ **NEEDS SERVER ACTION**
**File**: `app/api/payments/by-subscription/[subscriptionId]/route.ts`

**Functionality**:
- Gets payment order by Razorpay subscription ID
- Includes reference details via JOIN
- Verifies user ownership

**Current Usage**:
- `app/payment/success/page.tsx` - Get payment order by subscription ID

**Server Action Needed**: 
- ✅ Create `getPaymentOrderBySubscriptionAction(subscriptionId: string)` in `payment.actions.ts`

**Status**: ⚠️ **NEEDS SERVER ACTION** - Internal operation

---

#### 13. `/api/payments/cancel-order` ⚠️ **NEEDS SERVER ACTION**
**File**: `app/api/payments/cancel-order/route.ts`

**Functionality**:
- Cancels pending payment order
- Updates database status to 'cancelled'
- Only cancels if status is 'pending'

**Current Usage**: 
- ❌ **No active usage found** - May be used in future features

**Server Action Needed**: 
- ✅ Create `cancelPaymentOrderAction(orderId: string)` in `payment.actions.ts`

**Status**: ⚠️ **NEEDS SERVER ACTION** - Internal operation

---

## Existing Server Actions

### ✅ Already Available in `lib/actions/payment.actions.ts`

1. **`getPaymentHistoryAction(filters?)`** - ✅ Exists
   - Replaces: `/api/payments/history`
   - Status: Ready to use

2. **`getInvoicesAction(options?)`** - ✅ Exists
   - Replaces: `/api/payments/invoices`
   - Status: Ready to use

3. **`getInvoiceByNumberAction(invoiceNumber: string)`** - ✅ Exists
   - Replaces: `/api/payments/invoices/[invoiceNumber]`
   - Status: Ready to use

---

## Existing Services

### ✅ Available Services

1. **`RazorpayService`** (`lib/services/razorpay.service.ts`)
   - `createOrder()` - Creates Razorpay order
   - `createSubscription()` - Creates Razorpay subscription
   - `verifyPayment()` - Verifies payment signature
   - `verifySubscriptionPayment()` - Verifies subscription payment
   - `cancelPendingSubscription()` - Cancels subscription
   - `handleWebhook()` - Handles webhook events
   - `verifyWebhookSignature()` - Verifies webhook signature

2. **`PaymentHistoryService`** (`lib/services/payment-history.service.ts`)
   - `getPaymentHistory()` - Gets payment history with filters
   - `getPaymentStatistics()` - Gets payment statistics

3. **`InvoiceService`** (`lib/services/invoice.service.ts`)
   - `getUserInvoices()` - Gets user invoices
   - `getInvoiceByNumber()` - Gets invoice by number
   - `createInvoice()` - Creates invoice

4. **`ReceiptService`** (`lib/services/receipt.service.ts`)
   - `generateReceiptPdf()` - Generates receipt PDF
   - `sendReceiptEmail()` - Sends receipt email

---

## Migration Plan

### Phase 1: Create Missing Server Actions ✅

#### 1. `createPaymentOrderAction(creditPackageId: string, currency?: string)`
**Location**: `lib/actions/payment.actions.ts`

**Implementation**:
```typescript
export async function createPaymentOrderAction(
  creditPackageId: string,
  currency?: string
) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate currency
    const { convertCurrency, getRazorpayCurrencyCode, SUPPORTED_CURRENCIES } = await import('@/lib/utils/currency');
    const finalCurrency = currency && SUPPORTED_CURRENCIES[currency]
      ? getRazorpayCurrencyCode(currency)
      : 'INR';

    // Get credit package and convert currency if needed
    const { db } = await import('@/lib/db');
    const { creditPackages } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const [packageData] = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.id, creditPackageId))
      .limit(1);

    if (!packageData) {
      return { success: false, error: 'Credit package not found' };
    }

    if (!packageData.isActive) {
      return { success: false, error: 'Credit package is not available' };
    }

    // Convert price if currency is different
    let orderAmount = parseFloat(packageData.price);
    if (finalCurrency !== 'INR' && packageData.currency === 'INR') {
      orderAmount = await convertCurrency(orderAmount, finalCurrency);
      // Validate minimum amount...
    }

    // Create Razorpay order
    const result = await RazorpayService.createOrder(
      user.id,
      creditPackageId,
      orderAmount,
      finalCurrency
    );

    return result;
  } catch (error) {
    logger.error('Error creating payment order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}
```

#### 2. `createPaymentSubscriptionAction(planId: string, upgrade?: boolean)`
**Location**: `lib/actions/payment.actions.ts`

**Implementation**:
```typescript
export async function createPaymentSubscriptionAction(
  planId: string,
  upgrade: boolean = false
) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    if (!user.email) {
      return { success: false, error: 'User email not found' };
    }

    // Check for existing subscription (same logic as API route)
    const { BillingDAL } = await import('@/lib/dal/billing');
    const existingSubscription = await BillingDAL.getUserSubscription(user.id);
    
    if (existingSubscription) {
      const isActive = existingSubscription.subscription.status === 'active';
      const isDifferentPlan = existingSubscription.subscription.planId !== planId;
      
      if (isActive && !isDifferentPlan && !upgrade) {
        return {
          success: false,
          error: 'You are already subscribed to this plan.',
          hasExistingSubscription: true,
        };
      }

      // Handle upgrade/downgrade...
    }

    // Create subscription
    const result = await RazorpayService.createSubscription(
      user.id,
      planId,
      {
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email,
      }
    );

    return result;
  } catch (error) {
    logger.error('Error creating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription',
    };
  }
}
```

#### 3. `getPaymentOrderAction(id: string)`
**Location**: `lib/actions/payment.actions.ts`

**Implementation**:
```typescript
export async function getPaymentOrderAction(id: string) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Use same optimized JOIN query as API route
    const { db } = await import('@/lib/db');
    const { paymentOrders, creditPackages, subscriptionPlans } = await import('@/lib/db/schema');
    const { eq, and } = await import('drizzle-orm');

    const [paymentWithDetails] = await db
      .select({
        payment: paymentOrders,
        package: creditPackages,
        plan: subscriptionPlans,
      })
      .from(paymentOrders)
      .leftJoin(/* ... same as API route ... */)
      .where(and(
        eq(paymentOrders.id, id),
        eq(paymentOrders.userId, user.id)
      ))
      .limit(1);

    if (!paymentWithDetails) {
      return { success: false, error: 'Payment order not found' };
    }

    // Format response...
    return { success: true, data: payment };
  } catch (error) {
    logger.error('Error getting payment order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment order',
    };
  }
}
```

#### 4. `getPaymentOrderBySubscriptionAction(subscriptionId: string)`
**Location**: `lib/actions/payment.actions.ts`

**Implementation**: Similar to `getPaymentOrderAction` but filters by `razorpaySubscriptionId`

#### 5. `getReceiptAction(id: string, download?: boolean)`
**Location**: `lib/actions/payment.actions.ts`

**Implementation**:
```typescript
export async function getReceiptAction(id: string, download: boolean = false) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Find payment order (handles both UUID and subscription ID)
    // Generate receipt if needed
    // Return receipt URL or PDF data for download
  } catch (error) {
    // ...
  }
}
```

**Note**: PDF download might need special handling. Server actions can return binary data, but streaming might require API route.

#### 6. `generateReceiptAction(id: string)`
**Location**: `lib/actions/payment.actions.ts`

**Implementation**: Calls `ReceiptService.generateReceiptPdf()`

#### 7. `cancelPaymentOrderAction(orderId: string)`
**Location**: `lib/actions/payment.actions.ts`

**Implementation**: Updates payment order status to 'cancelled' if pending

#### 8. `cancelPaymentSubscriptionAction(subscriptionId: string)`
**Location**: `lib/actions/payment.actions.ts`

**Implementation**: Calls `RazorpayService.cancelPendingSubscription()`

---

### Phase 2: Migrate Component Usage ✅

#### 1. `components/pricing/credit-packages.tsx`
**Current**: Uses `/api/payments/create-order` and `/api/payments/verify-payment`
**Migration**: 
- Replace `create-order` with `createPaymentOrderAction()`
- Keep `verify-payment` as API route (payment gateway flow)

#### 2. `components/pricing/pricing-plans.tsx`
**Current**: Uses `/api/payments/create-subscription` and `/api/payments/verify-subscription`
**Migration**: 
- Replace `create-subscription` with `createPaymentSubscriptionAction()`
- Keep `verify-subscription` as API route (payment gateway flow)

#### 3. `lib/hooks/use-payment-history.ts`
**Current**: Uses `/api/payments/history`
**Migration**: Replace with `getPaymentHistoryAction()`

#### 4. `lib/hooks/use-invoices.ts`
**Current**: Uses `/api/payments/invoices`
**Migration**: Replace with `getInvoicesAction()`

#### 5. `components/billing/billing-history-table.tsx`
**Current**: Uses `/api/payments/history` and `/api/payments/receipt/[id]`
**Migration**: 
- Replace `history` with `getPaymentHistoryAction()`
- Replace `receipt` with `getReceiptAction()`

#### 6. `components/billing/recent-payments.tsx`
**Current**: Uses `/api/payments/receipt/[id]`
**Migration**: Replace with `getReceiptAction()`

#### 7. `components/billing/recent-payments-paginated.tsx`
**Current**: Uses `/api/payments/receipt/[id]`
**Migration**: Replace with `getReceiptAction()`

#### 8. `app/payment/success/page.tsx`
**Current**: Uses multiple payment APIs
**Migration**: 
- Keep `verify-subscription` as API route
- Replace `by-subscription/[id]` with `getPaymentOrderBySubscriptionAction()`
- Replace `[id]` with `getPaymentOrderAction()`
- Replace `receipt/[id]` with `getReceiptAction()`
- Replace `history` with `getPaymentHistoryAction()`

#### 9. `app/dashboard/billing/history/page.tsx`
**Current**: Uses `/api/payments/receipt/[id]`
**Migration**: Replace with `getReceiptAction()`

---

### Phase 3: Delete API Routes ✅

After migration:
1. ✅ Delete `app/api/payments/history/route.ts` (has server action)
2. ✅ Delete `app/api/payments/invoices/route.ts` (has server action)
3. ✅ Delete `app/api/payments/invoices/[invoiceNumber]/route.ts` (has server action)
4. ✅ Delete `app/api/payments/[id]/route.ts` (after creating server action)
5. ✅ Delete `app/api/payments/by-subscription/[subscriptionId]/route.ts` (after creating server action)
6. ✅ Delete `app/api/payments/receipt/[id]/route.ts` (after creating server action)
7. ✅ Delete `app/api/payments/cancel-order/route.ts` (after creating server action)
8. ✅ Delete `app/api/payments/cancel-subscription/route.ts` (after creating server action)
9. ⚠️ **KEEP** `app/api/payments/create-order/route.ts` (OR migrate if server action works)
10. ⚠️ **KEEP** `app/api/payments/create-subscription/route.ts` (OR migrate if server action works)
11. ✅ **KEEP** `app/api/payments/webhook/route.ts` (Razorpay webhook)
12. ✅ **KEEP** `app/api/payments/verify-payment/route.ts` (Payment gateway flow)
13. ✅ **KEEP** `app/api/payments/verify-subscription/route.ts` (Payment gateway flow)

---

## Detailed Findings

### ✅ Routes Already Using Server Actions

1. **`/api/payments/history`** - Wraps `PaymentHistoryService.getPaymentHistory()`
   - **Status**: Easy migration - server action exists

2. **`/api/payments/invoices`** - Wraps `InvoiceService.getUserInvoices()`
   - **Status**: Easy migration - server action exists

3. **`/api/payments/invoices/[invoiceNumber]`** - Wraps `InvoiceService.getInvoiceByNumber()`
   - **Status**: Easy migration - server action exists

### ⚠️ Routes Requiring New Server Actions

1. **`/api/payments/create-order`** - Creates Razorpay order
   - **Complexity**: Medium (currency conversion, validation)
   - **Dependencies**: RazorpayService, currency utils

2. **`/api/payments/create-subscription`** - Creates Razorpay subscription
   - **Complexity**: High (upgrade/downgrade logic, cancellation)
   - **Dependencies**: RazorpayService, BillingDAL

3. **`/api/payments/[id]`** - Gets payment order
   - **Complexity**: Low (simple query with JOIN)
   - **Dependencies**: DB, schema

4. **`/api/payments/by-subscription/[subscriptionId]`** - Gets payment by subscription
   - **Complexity**: Low (simple query with JOIN)
   - **Dependencies**: DB, schema

5. **`/api/payments/receipt/[id]`** - Gets/generates receipt
   - **Complexity**: Medium (PDF generation, streaming)
   - **Dependencies**: ReceiptService
   - **Note**: PDF download might need API route for streaming

6. **`/api/payments/cancel-order`** - Cancels order
   - **Complexity**: Low (simple update)
   - **Dependencies**: DB

7. **`/api/payments/cancel-subscription`** - Cancels subscription
   - **Complexity**: Low (calls RazorpayService)
   - **Dependencies**: RazorpayService

---

## Files to Update

### 1. Create Server Actions
- `lib/actions/payment.actions.ts` - Add 7 new actions

### 2. Migrate Components
- `components/pricing/credit-packages.tsx` - Replace create-order API
- `components/pricing/pricing-plans.tsx` - Replace create-subscription API
- `lib/hooks/use-payment-history.ts` - Replace history API
- `lib/hooks/use-invoices.ts` - Replace invoices API
- `components/billing/billing-history-table.tsx` - Replace history and receipt APIs
- `components/billing/recent-payments.tsx` - Replace receipt API
- `components/billing/recent-payments-paginated.tsx` - Replace receipt API
- `app/payment/success/page.tsx` - Replace multiple APIs
- `app/dashboard/billing/history/page.tsx` - Replace receipt API

### 3. Delete API Routes (After Migration)
- `app/api/payments/history/route.ts`
- `app/api/payments/invoices/route.ts`
- `app/api/payments/invoices/[invoiceNumber]/route.ts`
- `app/api/payments/[id]/route.ts`
- `app/api/payments/by-subscription/[subscriptionId]/route.ts`
- `app/api/payments/receipt/[id]/route.ts` (or keep for PDF streaming)
- `app/api/payments/cancel-order/route.ts`
- `app/api/payments/cancel-subscription/route.ts`

---

## Special Considerations

### PDF Receipt Download

**Issue**: Server actions can return binary data, but streaming PDF downloads might be better handled by API routes.

**Options**:
1. **Option A**: Keep `/api/payments/receipt/[id]` for PDF downloads only
   - Use server action for getting receipt URL
   - Use API route for downloading PDF

2. **Option B**: Use server action with `Response` object
   - Return `Response` with PDF buffer
   - Handle download in client

**Recommendation**: Option A - Keep API route for PDF downloads, use server action for receipt URL/metadata

---

## Verification Checklist

- ✅ All payment API routes identified
- ✅ Razorpay-critical routes identified
- ✅ Internal operations identified
- ✅ Existing server actions found
- ✅ Component usage mapped
- ✅ Migration plan created

---

## Status: ⚠️ **READY FOR MIGRATION**

**Next Steps**:
1. Create missing server actions
2. Migrate component usage
3. Test payment flows
4. Delete migrated API routes
5. Keep Razorpay-critical routes

---

**Report Generated**: 2025-01-27  
**Total Routes**: 13  
**Routes to Migrate**: 10  
**Routes to Keep**: 3  
**Estimated Migration Time**: 2-3 hours

