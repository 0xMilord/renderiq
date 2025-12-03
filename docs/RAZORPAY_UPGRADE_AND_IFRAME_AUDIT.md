# 🔍 Razorpay Upgrade Flow & Iframe Issues Audit

**Date:** 2025-01-03  
**Status:** ✅ FIXES APPLIED

---

## 📊 Executive Summary

Two critical issues were identified and fixed:
1. **Upgrade flow broken** - Users couldn't upgrade plans, causing redirect loops
2. **Razorpay iframe issues** - Font rendering problems and potential duplicate iframes

---

## ❌ Issues Found

### Issue 1: Upgrade Flow Broken

**Problem:**
- When user clicks "Upgrade Plan", API returns error saying subscription already exists
- User gets redirected to `/dashboard/billing`
- Billing page has "Change Plan" button that goes back to `/pricing`
- Creates infinite redirect loop

**Root Cause:**
- Frontend wasn't passing `upgrade: true` flag when upgrading
- API had TODO comment instead of actual upgrade logic
- No proper cancellation of old subscription before creating new one

**Location:**
- `components/pricing/pricing-plans.tsx` - `handleSubscribe()` function
- `app/api/payments/create-subscription/route.ts` - Upgrade logic was TODO

---

### Issue 2: Razorpay Iframe Issues

**Problem:**
- Razorpay checkout iframe font rendering issues (full width, font problems)
- Potential for 2 iframes opening (duplicate Razorpay instances)
- No styling applied to Razorpay modal in pricing-plans.tsx

**Root Cause:**
- No duplicate instance prevention in `pricing-plans.tsx`
- Missing iframe styling (credit-packages.tsx had it, but pricing-plans.tsx didn't)
- No font-family fixes for iframe content

**Location:**
- `components/pricing/pricing-plans.tsx` - Missing duplicate prevention and styling
- `components/pricing/credit-packages.tsx` - Had styling but pricing-plans.tsx didn't

---

## ✅ Fixes Applied

### Fix 1: Upgrade Flow Implementation

**File:** `components/pricing/pricing-plans.tsx`

**Changes:**
1. Added logic to detect upgrade/downgrade:
   ```typescript
   const isUpgrade = userSubscription?.subscription?.status === 'active' && 
                     userSubscription?.subscription?.planId !== planId &&
                     parseFloat(plans.find(p => p.id === planId)?.price || '0') > parseFloat(userSubscription?.plan?.price || '0');
   ```

2. Pass `upgrade` flag to API:
   ```typescript
   body: JSON.stringify({ 
     planId,
     upgrade: isUpgrade || isDowngrade,
   }),
   ```

**File:** `app/api/payments/create-subscription/route.ts`

**Changes:**
1. Implemented actual upgrade logic (replaced TODO):
   - Cancels old subscription in Razorpay
   - Marks old subscription as canceled in database
   - Creates new subscription

2. Added proper error handling for upgrade failures

---

### Fix 2: Duplicate Razorpay Instance Prevention

**File:** `components/pricing/pricing-plans.tsx`

**Changes:**
1. Added `useRef` to track Razorpay instance:
   ```typescript
   const razorpayInstanceRef = useRef<any>(null);
   ```

2. Close existing instance before creating new one:
   ```typescript
   if (razorpayInstanceRef.current) {
     try {
       razorpayInstanceRef.current.close();
     } catch (e) {
       // Ignore errors
     }
     razorpayInstanceRef.current = null;
   }
   ```

3. Store reference after creation:
   ```typescript
   razorpayInstanceRef.current = razorpayInstance;
   ```

4. Clear reference on payment failure/success

---

### Fix 3: Razorpay Iframe Styling

**File:** `components/pricing/pricing-plans.tsx`

**Changes:**
1. Added comprehensive iframe styling (similar to credit-packages.tsx):
   - Modal overlay styling (backdrop, background)
   - Modal container sizing (90vw x 90vh)
   - Iframe border-radius and sizing
   - Font-family fixes for iframe content

2. Added dynamic styling based on theme (dark/light mode)

3. Applied styles via `dangerouslySetInnerHTML` with theme-aware values

---

## 🎯 Expected Behavior After Fixes

### Upgrade Flow:
1. User with active subscription clicks "Upgrade Plan" on a higher-tier plan
2. Frontend detects it's an upgrade and passes `upgrade: true`
3. API cancels old subscription in Razorpay
4. API marks old subscription as canceled in database
5. API creates new subscription
6. User completes payment for new subscription
7. New subscription becomes active

### Razorpay Iframe:
1. Only ONE iframe opens (duplicate prevention)
2. Iframe is properly sized (90vw x 90vh)
3. Fonts render correctly
4. Modal is theme-aware (dark/light mode)
5. Proper styling applied

---

## 📋 Testing Checklist

- [ ] Test upgrade from Starter to Pro
- [ ] Test downgrade from Pro to Starter
- [ ] Verify only one Razorpay iframe opens
- [ ] Verify iframe fonts render correctly
- [ ] Verify iframe width is correct (not full width)
- [ ] Test in dark mode
- [ ] Test in light mode
- [ ] Verify old subscription is canceled when upgrading
- [ ] Verify new subscription is created successfully
- [ ] Test error handling if upgrade fails

---

## 🚨 Priority

**CRITICAL** - Upgrade flow is essential for user experience and revenue.

---

## 📝 Files Modified

1. ✅ `components/pricing/pricing-plans.tsx`
   - Added upgrade detection logic
   - Added duplicate instance prevention
   - Added iframe styling
   - Pass `upgrade` flag to API

2. ✅ `app/api/payments/create-subscription/route.ts`
   - Implemented upgrade logic
   - Cancel old subscription in Razorpay
   - Mark old subscription as canceled
   - Create new subscription

---

## 🔍 Additional Notes

### Why Upgrade Flow Was Needed:
- Users need to change plans without manual cancellation
- Better UX than asking users to cancel and resubscribe
- Prevents confusion and support tickets

### Why Duplicate Prevention Was Needed:
- Multiple iframes cause confusion
- Can lead to multiple payment attempts
- Poor user experience

### Why Iframe Styling Was Needed:
- Razorpay iframe uses default styling
- Doesn't match app theme
- Font rendering issues in some browsers
- Width issues causing layout problems

---

**Status:** ✅ All fixes applied and ready for testing

