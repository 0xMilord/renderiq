# Paddle Billing Infrastructure Audit

## Problem Identified: Double Currency Conversion

### Current Flow (PROBLEMATIC)

1. **Database**: Stores prices in INR (e.g., 500 INR)
2. **Frontend Display**: Converts INR → USD using real-time exchange rate
   - `500 INR * 0.012 = $6.00 USD` (displayed to user)
3. **Backend Payment**: Converts INR → USD again
   - `500 INR * 0.012 = $6.00 USD` (passed to Paddle)
4. **Paddle**: Uses fixed USD price from Price ID (e.g., $5.55 USD)
   - **MISMATCH**: User sees $6.00, but Paddle charges $5.55

### Root Cause

- **Paddle Price IDs have FIXED prices** (set in Paddle dashboard)
- When using `priceId` in transaction creation, Paddle **ignores the `amount` parameter**
- Paddle uses the price stored in the Price ID, not the converted amount
- Exchange rate fluctuations cause drift between displayed price and actual charge

### Code Locations

1. **Frontend Conversion** (`components/pricing/credit-packages.tsx:70`):
   ```typescript
   converted[pkg.id] = currency === 'INR' ? priceInINR : priceInINR * exchangeRate;
   ```

2. **Backend Conversion** (`lib/actions/payment.actions.ts:156-158`):
   ```typescript
   if (!isRazorpay && packageData.currency === 'INR') {
     orderAmount = await convertCurrency(orderAmount, 'USD');
   }
   ```

3. **Paddle Transaction** (`lib/services/paddle.service.ts:164`):
   ```typescript
   priceId: this.getPriceIdForPackage(creditPackageId, amount, currency),
   // ⚠️ Paddle ignores 'amount' when using priceId
   ```

## Solution Options

### Option 1: USD-Only for Paddle (RECOMMENDED)

**Pros:**
- Simple and clean
- No conversion drift
- Paddle prices are source of truth
- Better for international market

**Cons:**
- Need to maintain USD prices separately
- Lose INR support for international users

**Implementation:**
1. Store USD prices in database for Paddle packages
2. Remove currency conversion for Paddle
3. Use Paddle Price ID directly (Paddle handles pricing)

### Option 2: Keep INR + Don't Convert for Paddle

**Pros:**
- Keep existing INR infrastructure
- No database migration needed
- Paddle prices still source of truth

**Cons:**
- Display price won't match Paddle price exactly
- Still need to show Paddle's actual price somewhere

**Implementation:**
1. Don't convert amount when using Paddle
2. Fetch actual price from Paddle Price ID for display
3. Show "Price may vary" disclaimer

### Option 3: Dual Currency Support

**Pros:**
- Support both INR and USD markets
- Flexible pricing

**Cons:**
- More complex
- Need to maintain two price sets
- More testing required

**Implementation:**
1. Store both INR and USD prices in database
2. Use appropriate price based on provider
3. No conversion needed

## Recommendation: **Option 1 - USD-Only for Paddle**

### Why USD-Only?

1. **Paddle is for international users** (non-India)
2. **USD is standard** for international payments
3. **Simpler architecture** - one currency, one source of truth
4. **No conversion drift** - Paddle prices are fixed
5. **Better user experience** - price shown = price charged

### Migration Plan

1. **Database Schema Update**:
   - Add `paddlePriceUSD` field to `creditPackages` table
   - Or: Use existing `price` field but set currency to 'USD' for Paddle packages

2. **Remove Currency Conversion**:
   - Remove conversion in `payment.actions.ts` for Paddle
   - Remove conversion in frontend for Paddle packages

3. **Update Price Display**:
   - For Paddle: Show USD price directly from database
   - For Razorpay: Show INR price (no change)

4. **Update Paddle Service**:
   - Don't pass `amount` parameter (Paddle uses Price ID price)
   - Or: Pass amount but ensure it matches Price ID price

## Current Architecture Issues

### Issue 1: Amount Parameter Ignored
```typescript
// lib/services/paddle.service.ts:161-167
const transaction = await paddle.transactions.create({
  items: [{
    priceId: this.getPriceIdForPackage(creditPackageId, amount, currency),
    quantity: 1,
  }],
  // ⚠️ 'amount' is calculated but Paddle ignores it when using priceId
});
```

**Fix**: Remove `amount` calculation for Paddle, or ensure it matches Price ID price.

### Issue 2: Double Conversion
```typescript
// Frontend converts
converted[pkg.id] = priceInINR * exchangeRate; // $6.00

// Backend converts again
orderAmount = await convertCurrency(orderAmount, 'USD'); // $6.00

// Paddle uses fixed price from Price ID
// Price ID has: $5.55
// User charged: $5.55 (not $6.00)
```

**Fix**: Don't convert for Paddle. Use Price ID price directly.

### Issue 3: Exchange Rate Fluctuation
- Real-time exchange rates change
- Displayed price ≠ Paddle's fixed price
- User confusion and potential disputes

**Fix**: Use fixed USD prices for Paddle.

## Implementation Checklist

- [ ] Decide on currency strategy (USD-only recommended)
- [ ] Update database schema if needed
- [ ] Remove currency conversion for Paddle
- [ ] Update frontend to show Paddle USD prices
- [ ] Update Paddle service to not pass amount (or match Price ID)
- [ ] Test payment flow end-to-end
- [ ] Update documentation
- [ ] Monitor for price mismatches

## Testing Plan

1. **Price Display Test**:
   - Verify displayed price matches Paddle Price ID price
   - Check both frontend and backend

2. **Payment Flow Test**:
   - Complete a payment
   - Verify charged amount matches displayed price
   - Check payment order record

3. **Currency Conversion Test**:
   - Verify no conversion happens for Paddle
   - Verify conversion still works for Razorpay

4. **Edge Cases**:
   - Exchange rate changes during checkout
   - Multiple currencies in same session
   - Price ID not found errors

