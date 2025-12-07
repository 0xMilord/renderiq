# Payment & Currency Infrastructure Audit

## Executive Summary

Your payment infrastructure has **conflicting currency handling**:
- **INR is hardcoded** in 50+ locations
- **USD is explicitly blocked** and forced to INR
- **Currency conversion exists** but doesn't work properly
- **Database has inconsistent defaults** (USD for subscriptions, INR for packages)
- **Razorpay settlement is always in INR** regardless of payment currency

## Critical Issues Found

### 1. INR Hardcoding (50+ instances)

#### Core Currency Files
- `lib/utils/currency.ts:86` - `BASE_CURRENCY = 'INR'`
- `lib/hooks/use-currency.ts:8` - Default state: `'INR'`
- `app/api/currency/exchange-rate/route.ts:6` - `BASE_CURRENCY = 'INR'`
- `app/pricing/page.tsx:24` - Forces INR on page load

#### Database Schema
- `lib/db/schema.ts:46` - `creditPackages.currency` defaults to `'INR'`
- `lib/db/schema.ts:67` - `paymentOrders.currency` defaults to `'INR'`
- `lib/db/schema.ts:27` - `subscriptionPlans.currency` defaults to `'USD'` ⚠️ **INCONSISTENT**

#### API Routes
- `app/api/payments/create-order/route.ts:43` - Defaults to `'INR'`
- `app/api/payments/create-order/route.ts:72` - Only converts if `currency !== 'INR'`
- `app/api/payments/create-order/route.ts:87` - Reverts to INR if conversion fails

#### Service Files
- `lib/services/razorpay.service.ts:39` - Default parameter: `currency: string = 'INR'`
- `lib/services/razorpay.service.ts:943,1455,1549,1827` - Fallbacks: `|| 'INR'`
- `lib/services/invoice.service.ts:141` - Fallback: `|| 'INR'`
- `lib/services/receipt.service.ts:205,223,240,256` - Fallbacks: `|| 'INR'`

#### UI Components
- `components/pricing/credit-packages.tsx:35` - Fallback: `SUPPORTED_CURRENCIES['INR']`
- `components/pricing/pricing-plans.tsx:35` - Fallback: `SUPPORTED_CURRENCIES['INR']`
- `components/billing/*.tsx` - Multiple fallbacks: `|| 'INR'`

### 2. USD Explicitly Blocked

**File: `lib/hooks/use-currency.ts`**
```typescript
// Lines 20-23: USD is treated as "no preference" and forced to INR
if (!savedCurrency || savedCurrency === 'USD') {
  localStorage.setItem('user_currency', 'INR');
  setCurrency('INR');
  loadExchangeRate('INR');
  return;
}

// Lines 30: USD is explicitly excluded
if (/^[A-Z]{3}$/.test(savedCurrency) && savedCurrency !== 'USD') {
  setCurrency(savedCurrency);
  loadExchangeRate(savedCurrency);
}
```

**File: `lib/utils/currency.ts`**
```typescript
// Lines 104-113: USD is blocked in currency detection
// Accept any valid 3-letter currency code EXCEPT USD (default to INR for Razorpay)
if (savedCurrency && /^[A-Z]{3}$/.test(savedCurrency) && savedCurrency !== 'USD') {
  return savedCurrency;
}

// If USD or invalid, default to INR for Razorpay
if (savedCurrency === 'USD' || !savedCurrency) {
  return BASE_CURRENCY; // INR
}
```

**File: `lib/utils/reset-currency-to-inr.ts`**
```typescript
// Lines 13-15: Explicitly resets USD to INR
if (!savedCurrency || savedCurrency === 'USD') {
  localStorage.setItem('user_currency', 'INR');
}
```

### 3. Currency Conversion Flow Issues

**Current Flow:**
1. User selects currency (e.g., USD) → **Blocked, forced to INR**
2. Exchange rate fetched (INR → USD) → **Only if currency != INR**
3. Price converted (INR × rate) → **Display only**
4. Razorpay order created → **With converted amount**
5. Razorpay processes payment → **In selected currency**
6. Settlement → **Always in INR** (Razorpay's base)

**Problems:**
- Conversion happens but USD is blocked
- Exchange rates may differ between your API and Razorpay's bank
- User sees one price, pays another (due to rate differences)
- Settlement always in INR creates accounting confusion

### 4. Database Inconsistency

**Schema Mismatch:**
- `subscriptionPlans.currency` → Defaults to `'USD'` (line 27)
- `creditPackages.currency` → Defaults to `'INR'` (line 46)
- `paymentOrders.currency` → Defaults to `'INR'` (line 67)

**Impact:**
- Subscription plans stored in USD but processed as INR
- Credit packages stored in INR
- Payment orders default to INR
- **No single source of truth**

### 5. Exchange Rate API Issues

**File: `lib/utils/currency.ts:163-247`**
- Uses `exchangerate-api.com` with INR as base
- Free tier, daily updates (may be stale)
- Fallback rates are hardcoded and outdated
- No error handling for API failures
- Cache duration: 5 minutes (may miss rate changes)

**File: `app/api/currency/exchange-rate/route.ts`**
- Duplicate implementation (same logic as currency.ts)
- Server-side cache separate from client-side
- No rate limit protection
- Fallback returns `rate: 1` on error (no conversion)

### 6. Razorpay Integration Issues

**File: `lib/services/razorpay.service.ts`**

**Line 39:** Default currency parameter
```typescript
currency: string = 'INR'  // Hardcoded default
```

**Lines 63-74:** Minimum amounts only defined for 10 currencies
```typescript
const minimumAmounts: Record<string, number> = {
  INR: 1.00, USD: 0.01, EUR: 0.01, GBP: 0.01, JPY: 1,
  AUD: 0.01, CAD: 0.01, SGD: 0.01, AED: 0.01, SAR: 0.01,
};
// Missing 90+ currencies
```

**Lines 87-100:** Currency multiplier logic
```typescript
const currencyMultiplier = currency === 'JPY' ? 1 : 100;
// Only handles JPY special case, missing other currencies with different multipliers
```

**Lines 202, 942, 1454, 1548, 1826:** Currency fallbacks
```typescript
currency: cachedPlan.currency || 'INR'  // Always falls back to INR
```

### 7. Frontend Currency Display Issues

**File: `components/pricing/credit-packages.tsx`**
- Line 75: Conversion only if `currency !== 'INR'`
- Line 189: Sends currency to API but it may be blocked
- Line 208: Currency multiplier only handles JPY

**File: `components/pricing/pricing-plans.tsx`**
- Line 83: Same conversion logic
- Line 506: Duplicate conversion logic
- No currency selector visible in component

### 8. Missing Currency Selector

**Issue:** No visible currency selector in pricing components
- Users can't change currency
- Currency detection is automatic but broken (forces INR)
- No UI feedback about currency selection

## Files Involved in Payment/Currency System

### Core Currency Files
1. `lib/utils/currency.ts` - Currency utilities, conversion, formatting
2. `lib/hooks/use-currency.ts` - React hook for currency management
3. `app/api/currency/exchange-rate/route.ts` - Exchange rate API endpoint
4. `lib/utils/reset-currency-to-inr.ts` - Utility to force INR

### Payment Processing Files
5. `lib/services/razorpay.service.ts` - Razorpay integration (2127 lines)
6. `app/api/payments/create-order/route.ts` - Order creation API
7. `app/api/payments/verify-payment/route.ts` - Payment verification
8. `app/api/payments/create-subscription/route.ts` - Subscription creation
9. `app/api/payments/verify-subscription/route.ts` - Subscription verification

### Database Schema
10. `lib/db/schema.ts` - Database schema definitions
11. `drizzle/*.sql` - Migration files

### UI Components
12. `components/pricing/credit-packages.tsx` - Credit package display
13. `components/pricing/pricing-plans.tsx` - Subscription plan display
14. `app/pricing/page.tsx` - Pricing page
15. `components/billing/*.tsx` - Billing history components

### Supporting Files
16. `lib/utils/pricing.ts` - Pricing calculations
17. `lib/actions/pricing.actions.ts` - Pricing server actions
18. `lib/actions/payment.actions.ts` - Payment server actions
19. `lib/services/payment-history.service.ts` - Payment history
20. `lib/services/invoice.service.ts` - Invoice generation
21. `lib/services/receipt.service.ts` - Receipt generation

## Recommendations

### Option 1: Keep INR Uniform (Recommended for Simplicity)

**Pros:**
- Simplest solution
- No currency conversion needed
- Razorpay handles international payments automatically
- Single currency for accounting
- No exchange rate discrepancies

**Cons:**
- Users see prices in INR only
- May confuse international users
- Less user-friendly for non-Indian markets

**Implementation:**
1. Remove all currency conversion code
2. Remove currency selector UI
3. Set all defaults to INR
4. Update database to use INR for all records
5. Remove exchange rate API calls
6. Simplify Razorpay integration (always INR)

**Files to Modify:**
- Remove: `lib/utils/currency.ts` (conversion functions)
- Remove: `app/api/currency/exchange-rate/route.ts`
- Remove: `lib/hooks/use-currency.ts` (or simplify to INR only)
- Update: All components to remove currency selection
- Update: Database schema defaults to INR
- Update: All service files to remove currency parameters

### Option 2: Fix Multi-Currency Support (Recommended for International Growth)

**Pros:**
- Better UX for international users
- Prices displayed in user's currency
- More professional appearance
- Scalable for global expansion

**Cons:**
- More complex implementation
- Exchange rate management needed
- Potential rate discrepancies
- More testing required

**Implementation:**
1. **Remove USD blocking** - Allow all currencies including USD
2. **Standardize base currency** - Choose USD or INR as base
3. **Fix currency detection** - Properly detect user location
4. **Add currency selector UI** - Let users choose currency
5. **Update database** - Consistent currency defaults
6. **Improve exchange rates** - Use Razorpay's rates or better API
7. **Handle rate discrepancies** - Show disclaimer about final amount
8. **Update Razorpay integration** - Support all currencies properly

**Files to Modify:**
- `lib/hooks/use-currency.ts` - Remove USD blocking
- `lib/utils/currency.ts` - Fix detection, allow USD
- `lib/db/schema.ts` - Standardize defaults
- `components/pricing/*.tsx` - Add currency selector
- `lib/services/razorpay.service.ts` - Support all currencies
- `app/api/payments/create-order/route.ts` - Proper conversion

### Option 3: USD Base with Razorpay Conversion

**Pros:**
- USD is global standard
- Easier for international users
- Razorpay handles conversion

**Cons:**
- Requires significant refactoring
- All prices need conversion
- Database migration needed

**Implementation:**
1. Change base currency to USD
2. Store all prices in USD
3. Convert to user's currency for display
4. Let Razorpay handle final conversion
5. Update all database records

## Detailed Line-by-Line Issues

### `lib/utils/currency.ts`

**Line 86:** `const BASE_CURRENCY = 'INR';`
- **Issue:** Hardcoded base currency
- **Fix:** Make configurable or use USD

**Lines 96-150:** `detectUserCurrency()`
- **Issue:** Forces INR, blocks USD
- **Fix:** Remove USD blocking, allow all currencies

**Lines 163-247:** `getExchangeRate()`
- **Issue:** Uses INR as base, free API may be unreliable
- **Fix:** Consider Razorpay's exchange rates or paid API

**Lines 252-259:** `convertCurrency()`
- **Issue:** Only converts from INR
- **Fix:** Support any base currency

### `lib/hooks/use-currency.ts`

**Line 8:** `useState<string>('INR')`
- **Issue:** Hardcoded default
- **Fix:** Use `detectUserCurrency()` result

**Lines 20-38:** Currency initialization
- **Issue:** Blocks USD, forces INR
- **Fix:** Allow all currencies including USD

### `app/api/payments/create-order/route.ts`

**Line 43:** `: 'INR'`
- **Issue:** Hardcoded fallback
- **Fix:** Use package currency or user preference

**Lines 72-89:** Currency conversion
- **Issue:** Only converts if currency !== INR
- **Fix:** Always convert if different from base

### `lib/services/razorpay.service.ts`

**Line 39:** `currency: string = 'INR'`
- **Issue:** Hardcoded default
- **Fix:** Make required parameter or use base currency

**Lines 63-74:** Minimum amounts
- **Issue:** Only 10 currencies defined
- **Fix:** Add all supported currencies or use Razorpay API

**Lines 87-100:** Currency multiplier
- **Issue:** Only handles JPY
- **Fix:** Add all currencies with different multipliers

### `lib/db/schema.ts`

**Line 27:** `currency: text('currency').default('USD')`
- **Issue:** Inconsistent with other tables
- **Fix:** Standardize to one currency (INR or USD)

**Line 46:** `currency: text('currency').default('INR')`
- **Issue:** Hardcoded default
- **Fix:** Make configurable

## Testing Checklist

### Currency Conversion
- [ ] Test with USD user (currently blocked)
- [ ] Test with EUR user
- [ ] Test with INR user
- [ ] Test currency selector (if exists)
- [ ] Test exchange rate API failures
- [ ] Test rate caching
- [ ] Test minimum amount validation

### Payment Processing
- [ ] Test INR payment
- [ ] Test USD payment (if enabled)
- [ ] Test EUR payment (if enabled)
- [ ] Test currency mismatch scenarios
- [ ] Test minimum amount edge cases
- [ ] Test currency multiplier (JPY, etc.)

### Database
- [ ] Verify currency defaults
- [ ] Check existing records
- [ ] Test currency updates
- [ ] Verify payment order currency

### UI/UX
- [ ] Currency selector visibility
- [ ] Price display accuracy
- [ ] Currency symbol display
- [ ] Exchange rate loading states
- [ ] Error handling

## Next Steps

1. **Decide on approach** (Option 1, 2, or 3)
2. **Create migration plan** for database
3. **Update currency utilities** based on decision
4. **Fix Razorpay integration** for chosen approach
5. **Update UI components** accordingly
6. **Test thoroughly** with multiple currencies
7. **Update documentation** to reflect changes

## Questions to Answer

1. **What is your primary market?** (India vs International)
2. **Do you want to support multi-currency?** (Yes/No)
3. **What base currency do you prefer?** (INR/USD)
4. **How important is accurate exchange rates?** (High/Medium/Low)
5. **Do you want users to choose currency?** (Yes/No)
6. **What is your accounting currency?** (INR/USD)

---

**Generated:** 2025-01-XX
**Audited Files:** 21 files
**Issues Found:** 50+ hardcoded INR references, USD blocking, inconsistent defaults

