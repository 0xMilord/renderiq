# Paddle Price Usage Guide

## Overview
Paddle prices are stored in the database in the `paddlePriceUSD` field for both `credit_packages` and `subscription_plans`. These prices are used directly without any currency conversion.

## Pricing Logic

### For India (Razorpay)
- **Currency**: INR
- **Price Source**: `price` field in database
- **No conversion**: Direct INR pricing from database

### For Rest of World (Paddle)
- **Currency**: USD
- **Price Source**: `paddlePriceUSD` field in database
- **No conversion**: Fixed USD prices that match Paddle Price IDs exactly

## Database Schema

### Credit Packages
```sql
ALTER TABLE "credit_packages" ADD COLUMN "paddle_price_usd" numeric(10, 2);
```

### Subscription Plans
```sql
ALTER TABLE "subscription_plans" ADD COLUMN "paddle_price_usd" numeric(10, 2);
```

## Frontend Implementation

### Credit Packages Component
**File**: `components/pricing/credit-packages.tsx`

```typescript
// For USD (international/Paddle users): Use Paddle USD price directly
if (currency === 'USD' && pkg.paddlePriceUSD) {
  converted[pkg.id] = parseFloat(pkg.paddlePriceUSD);
  continue;
}

// For INR (India/Razorpay users): Use INR price directly
if (currency === 'INR') {
  converted[pkg.id] = parseFloat(pkg.price);
  continue;
}
```

### Subscription Plans Component
**File**: `components/pricing/pricing-plans.tsx`

```typescript
// For USD (international/Paddle users): Use Paddle USD price directly
if (currency === 'USD' && plan.paddlePriceUSD) {
  converted[plan.id] = parseFloat(plan.paddlePriceUSD);
  continue;
}

// For INR (India/Razorpay users): Use INR price directly
if (currency === 'INR') {
  converted[plan.id] = parseFloat(plan.price);
  continue;
}
```

## Backend Implementation

### Payment Actions
**File**: `lib/actions/payment.actions.ts`

- **No currency conversion** for Paddle payments
- Paddle uses fixed prices from Price IDs stored in `PADDLE_PRICE_IDS` environment variable
- The `amount` parameter passed to Paddle is informational only - actual charge is from Price ID

### Paddle Service
**File**: `lib/services/paddle.service.ts`

- Uses Price IDs from `PADDLE_PRICE_IDS` environment variable
- Price IDs map to fixed USD prices in Paddle dashboard
- These prices must match `paddlePriceUSD` in database

## Environment Variables

```env
# Paddle Price IDs (JSON format)
# Format: {"package_id_USD":"pri_...", "plan_id_USD":"pri_..."}
PADDLE_PRICE_IDS={"a7cf6c28-0c63-4fdf-b3e9-fb8a11afcee3_USD":"pri_01kd4e20zthbzmmkzp113g972f"}
```

## Database Queries

All queries use `.select()` which automatically includes all fields:

```typescript
// Credit Packages
db.select().from(creditPackages).where(...)

// Subscription Plans  
db.select().from(subscriptionPlans).where(...)
```

This ensures `paddlePriceUSD` is always included in the results.

## Price Matching

**Critical**: The `paddlePriceUSD` value in your database must exactly match the price configured in the Paddle Price ID.

Example:
- Database: `paddlePriceUSD = 0.99`
- Paddle Price ID `pri_...`: `$0.99 USD`
- These must match exactly!

## Migration Status

✅ Migration file updated: `drizzle/0002_add_paddle_price_usd.sql`
- Includes both `credit_packages` and `subscription_plans`
- Can be applied with: `npx drizzle-kit push` or manually via SQL

## Testing Checklist

- [ ] Database migration applied
- [ ] `paddlePriceUSD` values set for all packages/plans
- [ ] Prices match Paddle Price IDs exactly
- [ ] India users see INR prices (Razorpay)
- [ ] International users see USD prices (Paddle)
- [ ] No currency conversion happening
- [ ] Payment flow works for both providers

