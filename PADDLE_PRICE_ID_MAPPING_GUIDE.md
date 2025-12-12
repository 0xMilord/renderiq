# Paddle Price ID Mapping Guide

**How to map your database package/plan IDs to Paddle Price IDs**

---

## Step 1: Get Your Database IDs

Run these queries to get your current package and plan IDs:

```sql
-- Get all credit packages
SELECT 
  id,
  name,
  price,
  credits,
  currency
FROM credit_packages 
WHERE is_active = true
ORDER BY display_order;

-- Get all subscription plans
SELECT 
  id,
  name,
  price,
  interval,
  currency
FROM subscription_plans 
WHERE is_active = true
ORDER BY price;
```

**Example Output:**
```
Credit Packages:
- id: a1b2c3d4-e5f6-7890-abcd-ef1234567890, name: Starter, price: 100
- id: b2c3d4e5-f6a7-8901-bcde-f12345678901, name: Pro, price: 500
- id: c3d4e5f6-a7b8-9012-cdef-123456789012, name: Enterprise, price: 2000

Subscription Plans:
- id: d4e5f6a7-b8c9-0123-def4-234567890123, name: Starter, price: 299, interval: month
- id: e5f6a7b8-c9d0-1234-ef45-345678901234, name: Pro, price: 999, interval: month
- id: f6a7b8c9-d0e1-2345-f456-456789012345, name: Pro Annual, price: 9999, interval: year
```

---

## Step 2: Create Prices in Paddle Dashboard

For each package/plan, create a price in Paddle:

1. **Go to:** Catalog → Products → [Your Product] → Add Price
2. **Set:**
   - Price Name: `[Package/Plan Name] - USD`
   - Billing Cycle: `One-time` (for packages) or `Monthly`/`Yearly` (for plans)
   - Price: Convert INR to USD (e.g., ₹100 → $1.20)
   - Currency: `USD`
3. **Copy Price ID** (looks like `pri_01hxxxxx`)

---

## Step 3: Create Mapping JSON

Create a JSON object mapping database IDs to Paddle Price IDs:

```json
{
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890_USD": "pri_01hxxxxx",
  "b2c3d4e5-f6a7-8901-bcde-f12345678901_USD": "pri_01hyyyyy",
  "c3d4e5f6-a7b8-9012-cdef-123456789012_USD": "pri_01hzzzzz",
  "d4e5f6a7-b8c9-0123-def4-234567890123_USD": "pri_01haaaaa",
  "e5f6a7b8-c9d0-1234-ef45-345678901234_USD": "pri_01hbbbbb",
  "f6a7b8c9-d0e1-2345-f456-456789012345_USD": "pri_01hccccc"
}
```

**Format:** `"[database_id]_USD": "paddle_price_id"`

---

## Step 4: Add to Environment Variable

Add this JSON to your `.env.local`:

```bash
PADDLE_PRICE_IDS={"a1b2c3d4-e5f6-7890-abcd-ef1234567890_USD": "pri_01hxxxxx", "b2c3d4e5-f6a7-8901-bcde-f12345678901_USD": "pri_01hyyyyy"}
```

**Important:** 
- Keep it on one line (no line breaks)
- Escape quotes properly
- No trailing comma

---

## Step 5: Verify Mapping

Test that the mapping works:

1. Try to purchase a credit package (as international user)
2. Check server logs for Price ID lookup
3. Verify correct Price ID is used

---

## Example: Complete Mapping

**Database:**
```
Credit Packages:
- Starter: id=abc123, price=₹100
- Pro: id=def456, price=₹500

Plans:
- Starter Monthly: id=ghi789, price=₹299
- Pro Monthly: id=jkl012, price=₹999
```

**Paddle Prices Created:**
```
- Starter Package: pri_01hstarter
- Pro Package: pri_01hpro
- Starter Monthly: pri_01hstartermonthly
- Pro Monthly: pri_01hpromonthly
```

**Environment Variable:**
```bash
PADDLE_PRICE_IDS={"abc123_USD": "pri_01hstarter", "def456_USD": "pri_01hpro", "ghi789_USD": "pri_01hstartermonthly", "jkl012_USD": "pri_01hpromonthly"}
```

---

## Troubleshooting

**Error: "Price ID not configured"**
- Check JSON format is valid
- Verify database ID matches exactly
- Check Price ID exists in Paddle dashboard
- Ensure `_USD` suffix is included

**Error: "Invalid Price ID"**
- Verify Price ID is correct (starts with `pri_`)
- Check Price ID exists in Paddle
- Ensure you're using correct environment (sandbox vs production)

---

**Last Updated:** December 12, 2024

