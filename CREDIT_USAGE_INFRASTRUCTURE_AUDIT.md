# Credit Usage Infrastructure - Comprehensive Audit

## Executive Summary

This document provides a comprehensive audit of the credit deduction, refund, and subscription credit allocation infrastructure across the Renderiq codebase.

**Date:** 2025-01-27
**Status:** ✅ Generally Good - Minor Improvements Needed

---

## 1. Credit Deduction Infrastructure

### ✅ Implementation Status: COMPLETE

Credit deduction is properly implemented across all generation endpoints:

#### 1.1 Image Generation (`lib/actions/render.actions.ts`)
- **Location**: `createRenderAction()`
- **Credit Calculation**: 
  - Base cost: 1 credit (image) or 5 credits (video)
  - Quality multiplier: Standard (1x), High (2x), Ultra (3x)
  - Formula: `baseCost * qualityMultiplier`
- **Deduction Point**: Before generation starts
- **Method**: `deductCredits()` from `lib/actions/billing.actions.ts`
- **Status**: ✅ Correct

#### 1.2 Video Generation (`app/api/video/route.ts`)
- **Location**: `POST /api/video`
- **Credit Calculation**:
  - Base cost: 5 credits
  - Duration multiplier: `duration / 5`
  - Model multiplier: Fast (1x) or Standard (2x)
  - Formula: `Math.ceil(baseCost * durationMultiplier * modelMultiplier)`
- **Deduction Point**: After credit check, before generation
- **Method**: `billingDAL.deductCredits()`
- **Status**: ✅ Correct

#### 1.3 Canvas Variants (`app/api/canvas/generate-variants/route.ts`)
- **Location**: `POST /api/canvas/generate-variants`
- **Credit Calculation**: 1 credit per variant
- **Deduction Point**: Before generation
- **Method**: `BillingService.deductCredits()`
- **Status**: ✅ Correct

#### 1.4 Core Deduction Service (`lib/services/billing.ts`)
- **Method**: `deductCredits(userId, amount, description, referenceId, referenceType)`
- **Logic**:
  1. Check if user has sufficient credits
  2. If insufficient, return error
  3. Call `addCredits()` with negative amount
- **Transaction Recording**: ✅ Records in `credit_transactions` table
- **Balance Update**: ✅ Updates `user_credits` balance and `total_spent`
- **Status**: ✅ Correct

---

## 2. Refund Infrastructure

### ✅ Implementation Status: COMPLETE

Refunds are properly handled when generation fails:

#### 2.1 Image Generation Refunds (`lib/actions/render.actions.ts`)
- **Trigger**: Generation fails in `processRenderAsync()`
- **Method**: `addCredits()` with type `'refund'`
- **Amount**: Full credit cost refunded
- **Transaction Type**: `referenceType: 'refund'`
- **Status**: ✅ Correct

#### 2.2 Video Generation Refunds (`app/api/video/route.ts`)
- **Trigger**: Video generation fails
- **Method**: `billingDAL.deductCredits()` with negative amount
- **Amount**: Full credit cost refunded
- **Status**: ✅ Correct (but note: uses negative deduction instead of refund type)

#### 2.3 Refund Service (`lib/services/billing.ts`)
- **Method**: `addCredits()` with type `'refund'`
- **Logic**: Adds credits back to balance
- **Transaction Recording**: ✅ Records with type `'refund'`
- **Status**: ✅ Correct

### ⚠️ Minor Issue Found

**Issue**: Video API uses negative deduction instead of proper refund type
- **Location**: `app/api/video/route.ts:258-263`
- **Current**: `billingDAL.deductCredits({ amount: -creditsCost, ... })`
- **Should be**: Use `addCredits()` with type `'refund'` for consistency
- **Severity**: Low - Functionally works, but inconsistent with other refunds

---

## 3. Subscription Credit Allocation

### ✅ Implementation Status: COMPLETE

Subscription credits are allocated correctly:

#### 3.1 Initial Subscription Credits
- **Location**: `lib/services/billing.ts:94` (Stripe)
- **Location**: `lib/services/razorpay.service.ts:347` (Razorpay)
- **Trigger**: When subscription is first created
- **Amount**: Plan's `creditsPerMonth`
- **Method**: `addCredits()` with type `'earned'`
- **Status**: ✅ Correct

#### 3.2 Monthly Renewal Credits
- **Stripe**: `lib/services/billing.ts:297-302`
  - Trigger: `invoice.payment_succeeded` webhook
  - Adds monthly credits on successful payment
- **Razorpay**: `lib/services/razorpay.service.ts:567-568`
  - Trigger: `subscription.charged` webhook
  - Adds monthly credits on charge
- **Status**: ✅ Correct

#### 3.3 Credit Accumulation Model
- **Behavior**: Credits accumulate (additive), not reset
- **Logic**: Each billing period adds `creditsPerMonth` to existing balance
- **Example**: User has 20 credits, receives 100 for new period = 120 total
- **Status**: ✅ Intentional - Like mobile data rollover

**Note**: The system uses an accumulation model (credits roll over) rather than a reset model. This is intentional and documented in the UI.

---

## 4. Credit Checking & Validation

### ✅ Implementation Status: COMPLETE

All generation endpoints properly check credits before proceeding:

1. **Image Generation**: Checks in `createRenderAction()` before deduction
2. **Video Generation**: Checks via `getUserCreditsWithReset()` before deduction
3. **Canvas Variants**: Checks via `BillingService.getUserCredits()` before generation
4. **All**: Return proper error messages when insufficient

**Status**: ✅ Correct

---

## 5. Transaction Recording

### ✅ Implementation Status: COMPLETE

All credit transactions are properly recorded:

- **Table**: `credit_transactions`
- **Fields Recorded**:
  - `userId`: User who owns the transaction
  - `amount`: Positive (earned/refund) or negative (spent)
  - `type`: `'earned' | 'spent' | 'refund' | 'bonus'`
  - `description`: Human-readable description
  - `referenceId`: Related entity ID (render_id, plan_id, etc.)
  - `referenceType`: `'render' | 'subscription' | 'bonus' | 'refund'`
  - `createdAt`: Timestamp

**Status**: ✅ Complete audit trail

---

## 6. User Dropdown Integration

### ✅ Implementation Status: COMPLETE (Now Enhanced)

The user dropdown properly displays credit information:

- **Component**: `components/user-dropdown.tsx`
- **Features**:
  - ✅ Shows current credit balance
  - ✅ Shows Pro badge if user has active subscription
  - ✅ Shows reset date for subscription users
  - ✅ "Upgrade" button for non-pro users (now enhanced with "Become Pro" badge)
  - ✅ Uses `useCreditsWithReset()` hook
  - ✅ Uses `useIsPro()` hook

**Enhancement**: Added "Become Pro" badge for non-pro users

---

## 7. Issues Found & Recommendations

### 🔴 Critical Issues
**None**

### 🟡 Minor Issues

1. **Inconsistent Refund Method** (Video API)
   - **File**: `app/api/video/route.ts:258`
   - **Issue**: Uses negative deduction instead of refund type
   - **Impact**: Low - Works correctly but inconsistent
   - **Recommendation**: Update to use `addCredits()` with type `'refund'` for consistency

2. **Credit Reset Logic**
   - **Current**: Credits accumulate (roll over)
   - **Status**: ✅ Intentional design
   - **Note**: If reset behavior is desired, would need to implement periodic job

### ✅ Strengths

1. ✅ Consistent credit deduction across all endpoints
2. ✅ Proper error handling for insufficient credits
3. ✅ Complete transaction audit trail
4. ✅ Automatic subscription credit allocation
5. ✅ Proper refund handling for failures
6. ✅ User-friendly credit display in UI

---

## 8. Testing Recommendations

### Unit Tests Needed
- [ ] Credit deduction with sufficient balance
- [ ] Credit deduction with insufficient balance
- [ ] Credit refund on failure
- [ ] Subscription credit allocation
- [ ] Monthly renewal credit addition
- [ ] Transaction recording accuracy

### Integration Tests Needed
- [ ] End-to-end image generation with credit deduction
- [ ] End-to-end video generation with credit deduction
- [ ] Refund flow when generation fails
- [ ] Subscription webhook credit allocation
- [ ] Credit balance display accuracy

---

## 9. Credit Costs Reference

### Image Generation
- Standard Quality: **1 credit**
- High Quality: **2 credits**
- Ultra Quality: **3 credits**

### Video Generation
- Base Cost: **5 credits**
- Duration Multiplier: `duration / 5`
- Model Multiplier: Fast (1x), Standard (2x)

### Credit Packages (5 INR per credit)
- Starter Pack: 50 credits = 250 INR
- Professional Pack: 100 credits = 499 INR
- Power Pack: 500 credits = 2499 INR
- Enterprise Pack: 1000 credits = 4999 INR

### Subscription Plans
- Free: 10 credits/month
- Pro: 100 credits/month (499 INR)
- Pro Annual: 100 credits/month (4790 INR/year)
- Enterprise: 1000 credits/month (4999 INR)
- Enterprise Annual: 1000 credits/month (44999 INR/year)

---

## 10. Conclusion

The credit usage infrastructure is **well-implemented and robust**. All major components are in place:

✅ Credit deduction works correctly across all endpoints
✅ Refunds are properly handled on failures
✅ Subscription credits are allocated correctly
✅ Transaction recording is complete
✅ User interface properly displays credit information

**Overall Grade: A-**

Only minor improvement needed: Make video refund consistent with image refund method.

---

## Appendix: File Reference

### Key Files
- `lib/services/billing.ts` - Core billing service
- `lib/actions/billing.actions.ts` - Server actions for billing
- `lib/dal/billing.ts` - Data access layer for billing
- `lib/actions/render.actions.ts` - Render creation with credit deduction
- `app/api/video/route.ts` - Video generation API
- `lib/services/razorpay.service.ts` - Razorpay payment service
- `components/user-dropdown.tsx` - User dropdown with credit display

### Database Tables
- `user_credits` - User credit balances
- `credit_transactions` - Transaction audit trail
- `user_subscriptions` - User subscription records
- `subscription_plans` - Available subscription plans
- `credit_packages` - One-time credit packages
- `payment_orders` - Payment tracking

