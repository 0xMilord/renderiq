# Pricing Migration: 5 INR Per Credit

## Overview
This migration updates all pricing to follow a consistent model: **5 INR per credit**.

## Pricing Structure

### Subscription Plans

| Plan | Credits/Month | Price (INR) | Notes |
|------|--------------|-------------|-------|
| Free | 10 | 0.00 | Free tier |
| Starter | 24 | 119.00 | Base: 120 INR (24 × 5), offered at 119 INR |
| Pro | 100 | 499.00 | Base: 500 INR (100 × 5), offered at 499 INR |
| Pro Annual | 100 | 4790.00/year | Base: 6000 INR (1200 × 5), 20% discount = 4800, offered at 4790 |
| Enterprise | 1000 | 4999.00 | Base: 5000 INR (1000 × 5), offered at 4999 INR |
| Enterprise Annual | 1000 | 44999.00/year | Base: 60000 INR (12000 × 5), 25% discount = 45000, offered at 44999 |

### Credit Packages (One-time Purchases)

| Package | Credits | Price (INR) | Notes |
|---------|---------|-------------|-------|
| Starter Pack | 50 | 250.00 | 50 × 5 INR = 250 INR |
| Professional Pack | 100 | 499.00 | Base: 500 INR (100 × 5), offered at 499 INR |
| Power Pack | 500 | 2499.00 | Base: 2500 INR (500 × 5), offered at 2499 INR |
| Enterprise Pack | 1000 | 4999.00 | Base: 5000 INR (1000 × 5), offered at 4999 INR |

## Migration File

The migration file is located at: `drizzle/0008_update_pricing_5_inr_per_credit.sql`

This migration will:
- Update existing subscription plans in the database
- Update existing credit packages in the database
- Remove bonus credits from all packages (all follow base pricing)
- Update the Professional Pack to 100 credits to match Pro subscription

## Running the Migration

### Option 1: Run the SQL file directly

```bash
# Connect to your PostgreSQL database and run:
psql $DATABASE_URL -f drizzle/0008_update_pricing_5_inr_per_credit.sql
```

### Option 2: Use Drizzle Kit

The migration will be automatically picked up when you run:

```bash
npm run db:migrate
```

## Seeding New Data

After running the migration, you can also seed fresh data using:

```bash
npm run db:seed
```

This will use the updated seed file (`lib/db/seed.ts`) which now follows the 5 INR per credit pricing model.

## Key Changes

1. **Pro Plan**: Already at 499 INR for 100 credits ✓
2. **Credit Packages**: All updated to 5 INR per credit
   - Starter Pack: 50 credits = 250 INR
   - Professional Pack: 100 credits = 499 INR (matches Pro subscription)
   - Power Pack: 500 credits = 2499 INR
   - Enterprise Pack: 1000 credits = 4999 INR
3. **Enterprise Plans**: Updated to match 5 INR per credit pricing
4. **Bonus Credits**: Removed from all packages (simplified pricing)

## Notes

- The Professional Pack (credit package) now matches the Pro subscription in credits and pricing
- All packages offer slight discounts (e.g., 499 instead of 500) for marketing purposes
- Annual plans include discounts (20% for Pro, 25% for Enterprise)

