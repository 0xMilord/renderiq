# Pricing & Currency Infrastructure Audit Report

**Date:** 2025-01-27  
**Status:** Critical Issues Found - Requires Decision

## Executive Summary

The pricing and currency infrastructure has **critical inconsistencies** and **failing currency conversion** that need immediate attention. The system is built around INR as the base currency, but there are schema mismatches, incomplete currency conversion implementation, and reliance on a free exchange rate API that may be unreliable.

## Critical Findings

### 1. Schema Currency Mismatch ⚠️ CRITICAL

**Location:** `lib/db/schema.ts:27`

```27:27:lib/db/schema.ts
  currency: text('currency').default('USD').notNull(),
```

**Issue:**
- `subscriptionPlans` table defaults to `'USD'` in schema
- But all seed data uses `'INR'` (see `lib/db/seed.ts`)
- `creditPackages` correctly defaults to `'INR'` (line 46)

**Impact:**
- New plans created without explicit currency will default to USD
- Inconsistent with actual data (all plans are in INR)
- Potential for incorrect currency assumptions in code

**Recommendation:**
- Change schema default to `'INR'` to match actual usage
- OR migrate all data to USD if switching currencies

---

### 2. Currency Conversion Only Partially Implemented ⚠️ CRITICAL

**Location:** `lib/actions/payment.actions.ts`

**Credit Packages:** ✅ Has currency conversion
```141:158:lib/actions/payment.actions.ts
    let orderAmount = parseFloat(packageData.price);
    if (finalCurrency !== 'INR' && packageData.currency === 'INR') {
      // Convert from INR to target currency
      orderAmount = await convertCurrency(orderAmount, finalCurrency);
      
      // Ensure minimum amount after conversion
      const minimumAmounts: Record<string, number> = {
        INR: 1.00, USD: 0.01, EUR: 0.01, GBP: 0.01, JPY: 1,
        AUD: 0.01, CAD: 0.01, SGD: 0.01, AED: 0.01, SAR: 0.01,
      };
      const minimumAmount = minimumAmounts[finalCurrency] || 0.01;
      
      if (orderAmount < minimumAmount) {
        logger.log(`⚠️ PaymentActions: Converted amount ${orderAmount} ${finalCurrency} is below minimum ${minimumAmount}, using INR instead`);
        // Revert to INR if converted amount is too small
        orderAmount = parseFloat(packageData.price);
      }
    }
```

**Subscriptions:** ❌ NO currency conversion
- `createPaymentSubscriptionAction` does NOT handle currency conversion
- Uses plan currency directly from database
- If plan is in INR but user wants USD, conversion doesn't happen

**Impact:**
- Subscriptions cannot be purchased in non-INR currencies
- Inconsistent behavior between credit packages and subscriptions
- International users cannot subscribe in their local currency

---

### 3. Exchange Rate API Reliability Issues ⚠️ HIGH

**Location:** `lib/utils/currency.ts` & `app/api/currency/exchange-rate/route.ts`

**Current Implementation:**
- Uses free API: `exchangerate-api.com`
- No API key required (free tier)
- Updates: Daily at midnight UTC
- Rate limits: Unknown (free tier)

**Issues:**
1. **Free API = Unreliable**
   - No SLA guarantees
   - Rate limits not documented
   - Can fail without notice
   - No monitoring/alerting

2. **Outdated Fallback Rates**
   ```typescript
   USD: 0.012, EUR: 0.011, GBP: 0.0095
   ```
   - These rates are hardcoded and likely outdated
   - Current INR/USD rate is ~0.012 (1 INR = 0.012 USD), which seems correct
   - But no way to verify if fallback rates are current

3. **Silent Failures**
   - Falls back to rate of 1 (no conversion) if API fails
   - Users may pay wrong amount without knowing
   - No error reporting to admins

4. **Cache Issues**
   - Client-side cache (5 minutes) in `use-currency.ts`
   - Server-side cache (5 minutes) in API route
   - Two separate caches can get out of sync

**Impact:**
- Exchange rates may be incorrect
- Users may be charged wrong amounts
- No way to detect or alert on failures
- Potential revenue loss or customer complaints

---

### 4. Currency Detection Logic Forces INR ⚠️ MEDIUM

**Location:** `lib/hooks/use-currency.ts`

```18:38:lib/hooks/use-currency.ts
    const savedCurrency = localStorage.getItem('user_currency');
    
    // If USD or no currency saved, reset to INR (Razorpay default)
    // Only keep non-INR currencies if user explicitly selected them (not USD)
    if (!savedCurrency || savedCurrency === 'USD') {
      localStorage.setItem('user_currency', 'INR');
      setCurrency('INR');
      loadExchangeRate('INR');
      return;
    }

    // Use saved currency if it's valid and not USD
    if (/^[A-Z]{3}$/.test(savedCurrency) && savedCurrency !== 'USD') {
      setCurrency(savedCurrency);
      loadExchangeRate(savedCurrency);
    } else {
      // Invalid or USD, default to INR
      localStorage.setItem('user_currency', 'INR');
      setCurrency('INR');
      loadExchangeRate('INR');
    }
```

**Issue:**
- Explicitly blocks USD selection
- Forces INR even if user wants USD
- Contradicts the goal of supporting multiple currencies

**Impact:**
- Users cannot select USD even if they want to
- International users forced to use INR
- Poor UX for non-Indian users

---

### 5. Razorpay Currency Support ⚠️ INFO

**Current State:**
- Razorpay supports 100+ currencies (ISO 4217)
- System validates currency codes correctly
- But all prices stored in INR

**Issue:**
- Razorpay can handle multi-currency, but system is INR-centric
- No clear strategy: single currency (INR) or multi-currency?

---

## Database State Analysis

### Subscription Plans
- **All plans in INR** (from seed data)
- Prices: 0, 119, 499, 4790, 4999, 44999 INR
- Schema default: USD (mismatch!)

### Credit Packages
- **All packages in INR**
- Prices: 250, 499, 2499, 4999 INR
- Schema default: INR (correct)

### Payment Orders
- Currency field defaults to INR
- Stores actual currency used in payment

---

## Currency Conversion Flow Analysis

### Credit Package Purchase Flow
1. User selects currency (defaults to INR, USD blocked)
2. Frontend converts price using exchange rate
3. `createPaymentOrderAction` converts again server-side
4. Razorpay order created with converted amount
5. ✅ Works (but double conversion possible)

### Subscription Purchase Flow
1. User selects plan
2. No currency selection for subscriptions
3. Plan currency used directly (INR from database)
4. Razorpay subscription created with INR
5. ❌ No currency conversion

---

## Recommendations

### Option A: Stay in INR, Fix Currency Conversion Infrastructure ✅ RECOMMENDED

**Pros:**
- Minimal changes required
- All data already in INR
- Razorpay works best with INR (Indian payment gateway)
- Simpler to maintain

**Cons:**
- International users see INR prices
- Exchange rate API still needed for display
- Currency conversion still has reliability issues

**Required Changes:**
1. Fix schema default: `subscriptionPlans.currency` → `'INR'`
2. Upgrade exchange rate API to paid service (e.g., Fixer.io, CurrencyLayer)
3. Add monitoring/alerting for exchange rate failures
4. Implement subscription currency conversion
5. Remove USD blocking in `use-currency.ts`
6. Add admin dashboard for exchange rate monitoring
7. Update fallback rates regularly

**Cost:** ~$10-50/month for reliable exchange rate API

---

### Option B: Switch to USD, Remove Currency Conversion ❌ NOT RECOMMENDED

**Pros:**
- Standard international currency
- No exchange rate API needed
- Simpler codebase
- Better for international users

**Cons:**
- **MAJOR MIGRATION REQUIRED:**
  - Convert all existing prices (INR → USD)
  - Update all database records
  - Update all Razorpay plans
  - Update all existing subscriptions
  - Update all payment orders
  - Update all invoices/receipts
  - Risk of data corruption
  - Risk of breaking existing subscriptions
- Razorpay is INR-centric (Indian payment gateway)
- May lose Indian market advantage
- Requires extensive testing

**Required Changes:**
1. Migrate all prices: INR → USD (divide by ~83)
2. Update schema defaults to USD
3. Remove all currency conversion code
4. Update Razorpay plans
5. Handle existing subscriptions (complex!)
6. Update all documentation
7. Extensive testing

**Cost:** High risk, high effort, potential revenue loss

---

### Option C: Multi-Currency Support (USD + INR) ⚠️ COMPLEX

**Pros:**
- Best of both worlds
- Users can choose their currency
- International-friendly

**Cons:**
- Most complex option
- Need to maintain prices in multiple currencies
- Exchange rate sync issues
- Razorpay plan management complexity
- Higher maintenance burden

**Required Changes:**
1. Store prices in both USD and INR
2. Implement currency selection UI
3. Handle currency conversion for both directions
4. Manage Razorpay plans in multiple currencies
5. Complex subscription handling
6. Complex reporting/analytics

**Cost:** Very high complexity, ongoing maintenance

---

## Immediate Action Items

### Critical (Do Now)
1. ✅ **Fix schema mismatch**: Change `subscriptionPlans.currency` default to `'INR'`
2. ✅ **Add subscription currency conversion**: Implement in `createPaymentSubscriptionAction`
3. ✅ **Upgrade exchange rate API**: Move to paid service (Fixer.io or CurrencyLayer)
4. ✅ **Add error monitoring**: Alert on exchange rate API failures

### High Priority (This Week)
5. Remove USD blocking in currency selection
6. Add exchange rate monitoring dashboard
7. Update fallback rates to current values
8. Add currency conversion tests

### Medium Priority (This Month)
9. Document currency conversion flow
10. Add admin tools for exchange rate management
11. Consider caching strategy improvements

---

## Decision Matrix

| Factor | Stay INR + Fix | Switch to USD | Multi-Currency |
|--------|---------------|---------------|----------------|
| **Effort** | Low | Very High | Very High |
| **Risk** | Low | High | Medium |
| **Cost** | $10-50/mo | High (migration) | $10-50/mo + dev |
| **Time** | 1-2 days | 1-2 weeks | 2-3 weeks |
| **Maintenance** | Low | Low | High |
| **User Experience** | Good (INR) | Good (USD) | Best |
| **International** | Fair | Good | Best |

---

## Final Recommendation

**✅ RECOMMEND: Option A - Stay in INR, Fix Currency Conversion Infrastructure**

**Reasoning:**
1. **Minimal Risk**: No data migration required
2. **Quick Fix**: Can be done in 1-2 days
3. **Low Cost**: ~$10-50/month for reliable API
4. **Maintains Current State**: All data already in INR
5. **Razorpay Native**: INR is Razorpay's primary currency
6. **International Users**: Can still see converted prices (display only)

**Implementation Plan:**
1. Fix schema default (5 min)
2. Upgrade exchange rate API (2 hours)
3. Add subscription currency conversion (2 hours)
4. Remove USD blocking (15 min)
5. Add monitoring (1 hour)
6. Testing (2 hours)

**Total Time:** ~1 day

---

## Code Changes Required (Option A)

### 1. Fix Schema Default
```typescript
// lib/db/schema.ts:27
currency: text('currency').default('INR').notNull(), // Changed from 'USD'
```

### 2. Add Subscription Currency Conversion
```typescript
// lib/actions/payment.actions.ts
// In createPaymentSubscriptionAction, before creating subscription:
// - Get user's preferred currency
// - Convert plan price if needed
// - Pass converted currency to RazorpayService.createSubscription
```

### 3. Upgrade Exchange Rate API
```typescript
// Use Fixer.io or CurrencyLayer with API key
// Add to .env: EXCHANGE_RATE_API_KEY
// Update lib/utils/currency.ts to use paid API
```

### 4. Remove USD Blocking
```typescript
// lib/hooks/use-currency.ts
// Remove the USD blocking logic
// Allow any valid currency code
```

---

## Questions to Answer

1. **What is your primary market?**
   - If India → Stay INR
   - If International → Consider USD
   - If Both → Multi-currency (complex)

2. **What is your budget for exchange rate API?**
   - Free → Stay INR, accept risks
   - $10-50/mo → Stay INR, use paid API
   - $0 → Switch to USD, remove conversion

3. **How many international users do you have?**
   - Few → Stay INR
   - Many → Consider USD or multi-currency

4. **Can you handle a migration?**
   - No → Stay INR
   - Yes → Consider USD switch

---

## Conclusion

The currency infrastructure has **critical issues** but can be **fixed quickly** by staying in INR and upgrading the exchange rate API. Switching to USD would require a **major migration** with **high risk**. 

**Recommended path forward:** Fix the infrastructure issues while staying in INR. This provides the best balance of effort, risk, and user experience.



