# Paddle Pricing Fix - Implementation Guide

## Problem Summary

**Double Currency Conversion Issue:**
- Database stores prices in INR
- Frontend converts INR → USD for display (using real-time exchange rate)
- Backend converts INR → USD again for Paddle
- **Paddle ignores the converted amount** and uses fixed price from Price ID
- Result: Displayed price ≠ Actual charge

## Solution: USD-Only for Paddle (Recommended)

### Why USD-Only?

1. ✅ **Paddle is for international users** (non-India market)
2. ✅ **USD is standard** for international payments
3. ✅ **No conversion drift** - Paddle prices are fixed
4. ✅ **Better UX** - price shown = price charged
5. ✅ **Simpler architecture** - one currency, one source of truth

### Implementation Steps

#### Step 1: Add `paddlePriceUSD` Field to Database

```sql
-- Migration: Add paddlePriceUSD field
ALTER TABLE credit_packages 
ADD COLUMN paddle_price_usd DECIMAL(10, 2);

ALTER TABLE subscription_plans 
ADD COLUMN paddle_price_usd DECIMAL(10, 2);
```

#### Step 2: Populate Paddle Prices

For each package/plan, set `paddle_price_usd` to match the price in your Paddle Price IDs:

```sql
-- Example: Update credit packages with Paddle USD prices
-- Get these prices from your Paddle dashboard (Price ID details)

UPDATE credit_packages 
SET paddle_price_usd = 5.55 
WHERE id = 'a7cf6c28-0c63-4fdf-b3e9-fb8a11afcee3';

-- Repeat for all packages/plans
```

#### Step 3: Update Schema

```typescript
// lib/db/schema.ts
export const creditPackages = pgTable('credit_packages', {
  // ... existing fields
  paddlePriceUSD: decimal('paddle_price_usd', { precision: 10, scale: 2 }),
  // ... rest of fields
});
```

#### Step 4: Update Frontend Display

```typescript
// components/pricing/credit-packages.tsx
// For Paddle (international users), use paddlePriceUSD
// For Razorpay (India), use price (INR)

const displayPrice = isPaddleUser && pkg.paddlePriceUSD 
  ? pkg.paddlePriceUSD 
  : parseFloat(pkg.price);
```

#### Step 5: Remove Currency Conversion (Already Done)

✅ Backend conversion removed in `payment.actions.ts`
✅ Paddle service updated to log that amount is ignored

## Alternative: Keep INR + Fetch Paddle Prices

If you don't want to add a database field, you can:

1. **Fetch prices from Paddle API** (slower, requires API call)
2. **Store in extended mapping** (add prices to PADDLE_PRICE_IDS mapping)
3. **Show disclaimer** ("Price may vary, actual charge from Paddle")

## Current Status

✅ **Backend Fixed:**
- Removed currency conversion for Paddle
- Added logging that Paddle uses Price ID price, not amount

⚠️ **Frontend Still Converts:**
- Frontend still converts INR → USD for display
- This causes mismatch with Paddle's fixed price

## Next Steps

1. **Choose approach**: USD-only (recommended) or Keep INR
2. **If USD-only**: 
   - Add `paddlePriceUSD` field to database
   - Populate with actual Paddle prices
   - Update frontend to use `paddlePriceUSD` for international users
3. **If Keep INR**:
   - Update frontend to show Paddle price disclaimer
   - Or fetch prices from Paddle API

## Testing Checklist

- [ ] Verify displayed price matches Paddle Price ID price
- [ ] Complete a payment and verify charged amount = displayed price
- [ ] Test both Razorpay (INR) and Paddle (USD) flows
- [ ] Check payment order records for correct amounts
- [ ] Verify no currency conversion for Paddle

## Migration Script

```sql
-- Add paddle_price_usd column
ALTER TABLE credit_packages 
ADD COLUMN IF NOT EXISTS paddle_price_usd DECIMAL(10, 2);

ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS paddle_price_usd DECIMAL(10, 2);

-- Update with your actual Paddle prices
-- Get these from Paddle Dashboard > Products > Prices
UPDATE credit_packages 
SET paddle_price_usd = 5.55 
WHERE id = 'a7cf6c28-0c63-4fdf-b3e9-fb8a11afcee3';

-- Repeat for all packages...
```

## Recommendation

**Go with USD-only for Paddle.** It's cleaner, simpler, and eliminates all conversion issues. You already have USD prices in Paddle, so just store them in the database and use them directly.

