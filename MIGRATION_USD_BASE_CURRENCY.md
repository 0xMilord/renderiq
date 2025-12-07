# Migration Guide: INR to USD Base Currency

## Overview

This migration switches the entire payment infrastructure from **INR (Indian Rupee)** to **USD (US Dollar)** as the base currency. All prices will be stored in USD, displayed in user's preferred currency, and Razorpay will handle final currency conversion at payment time.

**Target Date:** TBD  
**Estimated Duration:** 2-3 days  
**Risk Level:** High (affects all payment flows)

---

## Migration Strategy

### Phase 1: Preparation & Backup
1. Backup database
2. Document current prices in INR
3. Calculate USD equivalents
4. Create feature flag for gradual rollout

### Phase 2: Code Changes
1. Update base currency constants
2. Fix currency detection (remove USD blocking)
3. Update exchange rate API (USD base)
4. Update all service files
5. Update UI components

### Phase 3: Database Migration
1. Convert existing prices to USD
2. Update schema defaults
3. Migrate payment orders
4. Update invoices/receipts

### Phase 4: Testing & Validation
1. Test currency conversion
2. Test payment flows
3. Test invoice generation
4. Test receipt generation

### Phase 5: Deployment
1. Deploy code changes
2. Run database migration
3. Monitor for issues
4. Rollback plan ready

---

## Current State Analysis

### Current Prices (INR)

#### Subscription Plans
- Free: ₹0.00
- Starter: ₹119.00/month
- Pro: ₹499.00/month
- Pro Annual: ₹4,790.00/year
- Enterprise: ₹4,999.00/month
- Enterprise Annual: ₹44,999.00/year

#### Credit Packages
- Starter Pack: ₹250.00 (50 credits)
- Professional Pack: ₹499.00 (100 credits)
- Power Pack: ₹2,499.00 (500 credits)
- Enterprise Pack: ₹4,999.00 (1000 credits)

### Exchange Rate Assumption
**1 USD = 83 INR** (Use current rate at migration time)

### Target Prices (USD)

#### Subscription Plans
- Free: $0.00
- Starter: $1.43/month (₹119 ÷ 83)
- Pro: $6.01/month (₹499 ÷ 83)
- Pro Annual: $57.71/year (₹4,790 ÷ 83)
- Enterprise: $60.23/month (₹4,999 ÷ 83)
- Enterprise Annual: $542.16/year (₹44,999 ÷ 83)

#### Credit Packages
- Starter Pack: $3.01 (50 credits) - ₹250 ÷ 83
- Professional Pack: $6.01 (100 credits) - ₹499 ÷ 83
- Power Pack: $30.11 (500 credits) - ₹2,499 ÷ 83
- Enterprise Pack: $60.23 (1000 credits) - ₹4,999 ÷ 83

**Note:** Round to 2 decimal places for USD prices.

---

## Files Requiring Changes

### 1. Core Currency Files (Priority: CRITICAL)

#### `lib/utils/currency.ts`
**Changes:**
- Line 86: Change `BASE_CURRENCY = 'INR'` → `BASE_CURRENCY = 'USD'`
- Lines 96-150: Remove USD blocking in `detectUserCurrency()`
- Lines 163-247: Update `getExchangeRate()` to use USD as base
  - Change API endpoint: `https://api.exchangerate-api.com/v4/latest/USD`
  - Update fallback rates (convert from INR-based to USD-based)
- Lines 252-259: Update `convertCurrency()` to convert from USD
- Line 285: Update fallback to use USD
- Line 303: Update fallback to use USD
- Line 322: Change default from INR to USD

**Code Changes:**
```typescript
// OLD
const BASE_CURRENCY = 'INR';

// NEW
const BASE_CURRENCY = 'USD';
```

```typescript
// OLD
const response = await fetch(
  `https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`,
  // ...
);

// NEW
const response = await fetch(
  `https://api.exchangerate-api.com/v4/latest/USD`,
  // ...
);
```

#### `lib/hooks/use-currency.ts`
**Changes:**
- Line 8: Change default state from `'INR'` → `'USD'`
- Lines 20-38: Remove USD blocking logic
- Line 78: Update condition from `currency === 'INR'` → `currency === 'USD'`
- Line 88: Update fallback from `'INR'` → `'USD'`

**Code Changes:**
```typescript
// OLD
const [currency, setCurrency] = useState<string>('INR');
if (!savedCurrency || savedCurrency === 'USD') {
  localStorage.setItem('user_currency', 'INR');
  setCurrency('INR');
  // ...
}

// NEW
const [currency, setCurrency] = useState<string>('USD');
// Remove USD blocking - allow all currencies
if (savedCurrency && /^[A-Z]{3}$/.test(savedCurrency)) {
  setCurrency(savedCurrency);
  loadExchangeRate(savedCurrency);
} else {
  const detected = detectUserCurrency();
  setCurrency(detected);
  loadExchangeRate(detected);
}
```

```typescript
// OLD
const convert = (amountInINR: number): number => {
  if (currency === 'INR') {
    return amountInINR;
  }
  return amountInINR * exchangeRate;
};

// NEW
const convert = (amountInUSD: number): number => {
  if (currency === 'USD') {
    return amountInUSD;
  }
  return amountInUSD * exchangeRate;
};
```

#### `app/api/currency/exchange-rate/route.ts`
**Changes:**
- Line 6: Change `BASE_CURRENCY = 'INR'` → `BASE_CURRENCY = 'USD'`
- Line 41: Update API endpoint to use USD base
- Lines 61-72: Update fallback rates (convert from INR-based to USD-based)

**Code Changes:**
```typescript
// OLD
const BASE_CURRENCY = 'INR';
const response = await fetch(
  `https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`,
  // ...
);

// NEW
const BASE_CURRENCY = 'USD';
const response = await fetch(
  `https://api.exchangerate-api.com/v4/latest/USD`,
  // ...
);
```

#### `lib/utils/reset-currency-to-inr.ts`
**Changes:**
- **DELETE THIS FILE** or rename to `reset-currency-to-usd.ts`
- Update all imports

**Alternative:** Delete and remove all references

### 2. Database Schema (Priority: CRITICAL)

#### `lib/db/schema.ts`
**Changes:**
- Line 27: Change `currency: text('currency').default('USD')` → Already USD ✅
- Line 46: Change `currency: text('currency').default('INR')` → `default('USD')`
- Line 67: Change `currency: text('currency').default('INR')` → `default('USD')`
- Line 89: Change `currency: text('currency').default('INR')` → `default('USD')`

**Code Changes:**
```typescript
// OLD
currency: text('currency').default('INR').notNull(), // Razorpay uses INR

// NEW
currency: text('currency').default('USD').notNull(), // Base currency is USD
```

#### Database Migration SQL
**File: `drizzle/XXXX_migrate_to_usd_base.sql`**

```sql
-- Migration: Switch base currency from INR to USD
-- Date: TBD
-- Exchange Rate: 1 USD = 83 INR (UPDATE WITH ACTUAL RATE)

BEGIN;

-- 1. Update subscription_plans prices (INR → USD)
-- Exchange rate: 1 USD = 83 INR
UPDATE subscription_plans
SET 
  price = ROUND(price::numeric / 83, 2),
  currency = 'USD',
  updated_at = NOW()
WHERE currency = 'INR';

-- 2. Update credit_packages prices (INR → USD)
UPDATE credit_packages
SET 
  price = ROUND(price::numeric / 83, 2),
  price_per_credit = ROUND(price_per_credit::numeric / 83, 2),
  currency = 'USD',
  updated_at = NOW()
WHERE currency = 'INR';

-- 3. Update payment_orders amounts (INR → USD)
-- Note: Historical payment orders should keep original currency for records
-- Only update if currency is INR and status is pending/processing
UPDATE payment_orders
SET 
  amount = ROUND(amount::numeric / 83, 2),
  currency = 'USD',
  updated_at = NOW()
WHERE currency = 'INR' 
  AND status IN ('pending', 'processing');

-- 4. Update invoices (INR → USD)
UPDATE invoices
SET 
  subtotal = ROUND(subtotal::numeric / 83, 2),
  tax_amount = ROUND(tax_amount::numeric / 83, 2),
  total_amount = ROUND(total_amount::numeric / 83, 2),
  currency = 'USD',
  updated_at = NOW()
WHERE currency = 'INR' 
  AND status IN ('draft', 'pending');

-- 5. Update schema defaults
ALTER TABLE credit_packages 
  ALTER COLUMN currency SET DEFAULT 'USD';

ALTER TABLE payment_orders 
  ALTER COLUMN currency SET DEFAULT 'USD';

ALTER TABLE invoices 
  ALTER COLUMN currency SET DEFAULT 'USD';

-- 6. Add migration metadata
INSERT INTO schema_migrations (version, description, applied_at)
VALUES (
  'XXXX_migrate_to_usd_base',
  'Migrated base currency from INR to USD. Exchange rate: 1 USD = 83 INR',
  NOW()
);

COMMIT;
```

**⚠️ IMPORTANT:** 
- Update exchange rate (83) with actual rate at migration time
- Test on staging first
- Backup database before running
- Consider keeping historical records in original currency

### 3. Seed Data (Priority: HIGH)

#### `lib/db/seed.ts`
**Changes:**
- All `currency: 'INR'` → `currency: 'USD'`
- All prices converted from INR to USD
- Update comments to reflect USD pricing

**Code Changes:**
```typescript
// OLD
{
  name: 'Starter',
  price: '119.00',
  currency: 'INR',
  // ...
}

// NEW
{
  name: 'Starter',
  price: '1.43', // ₹119 ÷ 83 = $1.43
  currency: 'USD',
  // ...
}
```

**Complete Seed Data (USD):**
```typescript
// Subscription Plans
{ name: 'Free', price: '0.00', currency: 'USD', /* ... */ },
{ name: 'Starter', price: '1.43', currency: 'USD', /* ... */ },
{ name: 'Pro', price: '6.01', currency: 'USD', /* ... */ },
{ name: 'Pro Annual', price: '57.71', currency: 'USD', /* ... */ },
{ name: 'Enterprise', price: '60.23', currency: 'USD', /* ... */ },
{ name: 'Enterprise Annual', price: '542.16', currency: 'USD', /* ... */ },

// Credit Packages
{ name: 'Starter Pack', price: '3.01', currency: 'USD', credits: 50, /* ... */ },
{ name: 'Professional Pack', price: '6.01', currency: 'USD', credits: 100, /* ... */ },
{ name: 'Power Pack', price: '30.11', currency: 'USD', credits: 500, /* ... */ },
{ name: 'Enterprise Pack', price: '60.23', currency: 'USD', credits: 1000, /* ... */ },
```

### 4. Payment Processing (Priority: CRITICAL)

#### `app/api/payments/create-order/route.ts`
**Changes:**
- Line 43: Change default from `'INR'` → `'USD'`
- Line 72: Update condition from `currency !== 'INR'` → `currency !== 'USD'`
- Line 74: Update conversion logic (USD → target currency)
- Line 87: Change fallback from `'INR'` → `'USD'`

**Code Changes:**
```typescript
// OLD
let currency = requestedCurrency && SUPPORTED_CURRENCIES[requestedCurrency]
  ? getRazorpayCurrencyCode(requestedCurrency)
  : 'INR'; // Default to INR

let orderAmount = parseFloat(packageData.price);
if (currency !== 'INR' && packageData.currency === 'INR') {
  orderAmount = await convertCurrency(orderAmount, currency);
  // ...
  currency = 'INR';
}

// NEW
let currency = requestedCurrency && SUPPORTED_CURRENCIES[requestedCurrency]
  ? getRazorpayCurrencyCode(requestedCurrency)
  : 'USD'; // Default to USD

let orderAmount = parseFloat(packageData.price);
if (currency !== 'USD' && packageData.currency === 'USD') {
  orderAmount = await convertCurrency(orderAmount, currency);
  // ...
  currency = 'USD';
}
```

#### `lib/services/razorpay.service.ts`
**Changes:**
- Line 39: Change default parameter from `'INR'` → `'USD'`
- Lines 63-74: Update minimum amounts (convert to USD equivalents)
- Lines 87-100: Currency multiplier logic (keep as is, works for all currencies)
- Lines 202, 942, 1454, 1548, 1826: Change fallbacks from `|| 'INR'` → `|| 'USD'`

**Code Changes:**
```typescript
// OLD
static async createOrder(
  userId: string,
  creditPackageId: string,
  amount: number,
  currency: string = 'INR'
) {
  // ...
  const minimumAmounts: Record<string, number> = {
    INR: 1.00, USD: 0.01, // ...
  };
  // ...
  currency: cachedPlan.currency || 'INR',
}

// NEW
static async createOrder(
  userId: string,
  creditPackageId: string,
  amount: number,
  currency: string = 'USD'
) {
  // ...
  const minimumAmounts: Record<string, number> = {
    USD: 0.01, INR: 0.83, EUR: 0.01, // ... (convert INR minimum: 1 INR = 0.012 USD)
  };
  // ...
  currency: cachedPlan.currency || 'USD',
}
```

**Minimum Amounts (USD equivalents):**
```typescript
const minimumAmounts: Record<string, number> = {
  USD: 0.01,      // $0.01
  INR: 0.83,      // ₹1.00 = $0.012 (use 0.83 for safety)
  EUR: 0.01,      // €0.01
  GBP: 0.01,      // £0.01
  JPY: 1,         // ¥1
  AUD: 0.01,      // A$0.01
  CAD: 0.01,      // C$0.01
  SGD: 0.01,      // S$0.01
  AED: 0.01,      // د.إ0.01
  SAR: 0.01,      // ﷼0.01
};
```

### 5. UI Components (Priority: HIGH)

#### `components/pricing/credit-packages.tsx`
**Changes:**
- Line 35: Change fallback from `'INR'` → `'USD'`
- Line 75: Update condition from `currency === 'INR'` → `currency === 'USD'`
- Line 189: Currency is now USD by default

**Code Changes:**
```typescript
// OLD
const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR'];
converted[pkg.id] = currency === 'INR' ? priceInINR : priceInINR * exchangeRate;

// NEW
const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['USD'];
converted[pkg.id] = currency === 'USD' ? priceInUSD : priceInUSD * exchangeRate;
```

#### `components/pricing/pricing-plans.tsx`
**Changes:**
- Line 35: Change fallback from `'INR'` → `'USD'`
- Line 83: Update condition from `currency === 'INR'` → `currency === 'USD'`
- Line 506: Update condition from `currency === 'INR'` → `currency === 'USD'`

**Code Changes:**
```typescript
// OLD
const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR'];
converted[plan.id] = currency === 'INR' ? priceInINR : priceInINR * exchangeRate;

// NEW
const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['USD'];
converted[plan.id] = currency === 'USD' ? priceInUSD : priceInUSD * exchangeRate;
```

#### `app/pricing/page.tsx`
**Changes:**
- Line 12: Remove import of `resetCurrencyToINR`
- Line 24: Remove call to `resetCurrencyToINR()`

**Code Changes:**
```typescript
// OLD
import { resetCurrencyToINR } from '@/lib/utils/reset-currency-to-inr';

useEffect(() => {
  resetCurrencyToINR();
  loadData();
}, []);

// NEW
// Remove import and reset call - let currency detection work naturally
useEffect(() => {
  loadData();
}, []);
```

### 6. Invoice & Receipt Services (Priority: MEDIUM)

#### `lib/services/invoice.service.ts`
**Changes:**
- Line 141: Change fallback from `|| 'INR'` → `|| 'USD'`

**Code Changes:**
```typescript
// OLD
currency: paymentOrder.currency || 'INR',

// NEW
currency: paymentOrder.currency || 'USD',
```

#### `lib/services/receipt.service.ts`
**Changes:**
- Lines 205, 223, 240, 256: Change fallbacks from `|| 'INR'` → `|| 'USD'`

**Code Changes:**
```typescript
// OLD
page.drawText(`${paymentOrder.currency || 'INR'} ${amount.toFixed(2)}`, {
// ...

// NEW
page.drawText(`${paymentOrder.currency || 'USD'} ${amount.toFixed(2)}`, {
// ...
```

### 7. Billing Components (Priority: MEDIUM)

#### `components/billing/*.tsx`
**Files:**
- `recent-payments-paginated.tsx`
- `billing-history-table.tsx`
- `recent-payments.tsx`
- `invoices-list.tsx`

**Changes:**
- All instances of `|| 'INR'` → `|| 'USD'`

**Code Changes:**
```typescript
// OLD
{payment.currency || 'INR'} {parseFloat(payment.amount || '0').toFixed(2)}

// NEW
{payment.currency || 'USD'} {parseFloat(payment.amount || '0').toFixed(2)}
```

### 8. Pricing Utilities (Priority: LOW)

#### `lib/utils/pricing.ts`
**Changes:**
- Update comments to reflect USD pricing
- No code changes needed (calculations are currency-agnostic)

**Code Changes:**
```typescript
// OLD
/**
 * Calculate total price based on number of credits
 * @param credits - Number of credits
 * @returns Total price in INR
 */

// NEW
/**
 * Calculate total price based on number of credits
 * @param credits - Number of credits
 * @returns Total price in USD
 */
```

### 9. Documentation (Priority: LOW)

#### `docs/CURRENCY_CONVERSION_SYSTEM.md`
**Changes:**
- Update all references from INR to USD
- Update API endpoint documentation
- Update examples

#### `docs/RAZORPAY_PLANS_SETUP.md`
**Changes:**
- Update currency references
- Note that Razorpay still settles in INR but accepts USD payments

---

## Migration Checklist

### Pre-Migration
- [ ] Backup production database
- [ ] Get current USD/INR exchange rate
- [ ] Calculate all USD prices
- [ ] Review all affected files
- [ ] Create feature flag for gradual rollout
- [ ] Test on staging environment
- [ ] Notify team of migration

### Code Changes
- [ ] Update `lib/utils/currency.ts`
- [ ] Update `lib/hooks/use-currency.ts`
- [ ] Update `app/api/currency/exchange-rate/route.ts`
- [ ] Delete/update `lib/utils/reset-currency-to-inr.ts`
- [ ] Update `lib/db/schema.ts`
- [ ] Update `lib/db/seed.ts`
- [ ] Update `app/api/payments/create-order/route.ts`
- [ ] Update `lib/services/razorpay.service.ts`
- [ ] Update `components/pricing/credit-packages.tsx`
- [ ] Update `components/pricing/pricing-plans.tsx`
- [ ] Update `app/pricing/page.tsx`
- [ ] Update `lib/services/invoice.service.ts`
- [ ] Update `lib/services/receipt.service.ts`
- [ ] Update all billing components
- [ ] Update documentation

### Database Migration
- [ ] Create migration SQL file
- [ ] Test migration on staging
- [ ] Backup production database
- [ ] Run migration on production
- [ ] Verify all prices converted correctly
- [ ] Verify schema defaults updated

### Testing
- [ ] Test currency detection (all countries)
- [ ] Test USD payment flow
- [ ] Test INR payment flow (converted)
- [ ] Test EUR payment flow (converted)
- [ ] Test exchange rate API
- [ ] Test price display in UI
- [ ] Test invoice generation
- [ ] Test receipt generation
- [ ] Test payment order creation
- [ ] Test subscription creation
- [ ] Test credit package purchase
- [ ] Test minimum amount validation
- [ ] Test currency selector (if exists)

### Post-Migration
- [ ] Monitor error logs
- [ ] Monitor payment success rates
- [ ] Verify invoices are correct
- [ ] Verify receipts are correct
- [ ] Check user feedback
- [ ] Update documentation
- [ ] Communicate changes to users

---

## Rollback Plan

### If Issues Occur

1. **Immediate Rollback (Code)**
   - Revert all code changes
   - Deploy previous version
   - Restore currency detection

2. **Database Rollback**
   ```sql
   -- Rollback prices (USD → INR)
   -- Exchange rate: 1 USD = 83 INR
   UPDATE subscription_plans
   SET 
     price = ROUND(price::numeric * 83, 2),
     currency = 'INR',
     updated_at = NOW()
   WHERE currency = 'USD';

   UPDATE credit_packages
   SET 
     price = ROUND(price::numeric * 83, 2),
     price_per_credit = ROUND(price_per_credit::numeric * 83, 2),
     currency = 'INR',
     updated_at = NOW()
   WHERE currency = 'USD';

   -- Restore schema defaults
   ALTER TABLE credit_packages 
     ALTER COLUMN currency SET DEFAULT 'INR';
   ALTER TABLE payment_orders 
     ALTER COLUMN currency SET DEFAULT 'INR';
   ```

3. **Data Recovery**
   - Restore from backup if needed
   - Verify all records intact

---

## Risk Assessment

### High Risk Areas
1. **Payment Processing** - Any bugs could prevent payments
2. **Database Migration** - Data loss risk
3. **Price Conversion** - Incorrect prices could cause revenue loss
4. **Exchange Rates** - Stale rates could cause discrepancies

### Mitigation Strategies
1. **Feature Flag** - Gradual rollout
2. **Staging Testing** - Test thoroughly before production
3. **Backup** - Full database backup before migration
4. **Monitoring** - Watch error logs and payment success rates
5. **Rollback Plan** - Ready to revert if needed

---

## Exchange Rate Management

### Current Setup
- Uses free API: `exchangerate-api.com`
- Updates daily at midnight UTC
- Base currency: INR (will change to USD)

### After Migration
- Base currency: USD
- API endpoint: `https://api.exchangerate-api.com/v4/latest/USD`
- Same update frequency

### Considerations
- Free tier may have rate limits
- Consider paid API for production (e.g., Fixer.io, CurrencyLayer)
- Cache rates for 5 minutes (current)
- Fallback rates should be updated

---

## Testing Scenarios

### Scenario 1: USD User
1. User from US visits pricing page
2. Currency auto-detected as USD
3. Prices displayed in USD (no conversion)
4. User purchases credit package
5. Razorpay processes in USD
6. Invoice generated in USD

### Scenario 2: INR User
1. User from India visits pricing page
2. Currency auto-detected as INR
3. Prices converted from USD to INR
4. User purchases credit package
5. Razorpay processes in INR
6. Invoice generated in INR

### Scenario 3: EUR User
1. User from Germany visits pricing page
2. Currency auto-detected as EUR
3. Prices converted from USD to EUR
4. User purchases subscription
5. Razorpay processes in EUR
6. Invoice generated in EUR

### Scenario 4: Manual Currency Selection
1. User manually selects currency
2. Prices update immediately
3. Exchange rate fetched
4. Conversion applied
5. Payment processed in selected currency

---

## Post-Migration Monitoring

### Metrics to Watch
1. **Payment Success Rate** - Should remain stable
2. **Error Logs** - Watch for currency-related errors
3. **Exchange Rate API** - Monitor API failures
4. **User Feedback** - Check for price confusion
5. **Revenue** - Verify no unexpected drops

### Alerts to Set Up
1. Payment failure rate > 5%
2. Exchange rate API failures
3. Currency conversion errors
4. Database migration errors
5. Invoice generation failures

---

## Timeline Estimate

### Day 1: Preparation
- [ ] Code review and planning
- [ ] Calculate USD prices
- [ ] Create migration SQL
- [ ] Update documentation

### Day 2: Implementation
- [ ] Update all code files
- [ ] Test on staging
- [ ] Fix any issues
- [ ] Prepare database migration

### Day 3: Deployment
- [ ] Deploy code changes
- [ ] Run database migration
- [ ] Monitor for issues
- [ ] Verify all systems working

---

## Support & Communication

### Internal Communication
- Notify team of migration date
- Share rollback plan
- Assign on-call person

### User Communication (Optional)
- Email users about currency change
- Update pricing page with note
- Add FAQ about currency

---

## Success Criteria

Migration is successful if:
1. ✅ All prices display correctly in USD
2. ✅ Currency conversion works for all currencies
3. ✅ Payments process successfully
4. ✅ Invoices generate correctly
5. ✅ No increase in payment failures
6. ✅ No data loss
7. ✅ All tests pass

---

**Last Updated:** 2025-01-XX  
**Migration Date:** TBD  
**Exchange Rate:** TBD (Update before migration)

