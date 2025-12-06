# Credit Package Volume-Based Pricing Strategy

## Overview

This document outlines the dynamic volume-based pricing (also known as **tiered pricing** or **quantity discount pricing**) strategy for credit packages. This pricing model incentivizes bulk purchases by offering progressively lower prices per credit as the purchase quantity increases.

## Pricing Theory

**Volume-Based Pricing** (also called **Tiered Pricing** or **Non-Linear Pricing**) is a pricing strategy where:
- The price per unit decreases as the quantity purchased increases
- Customers are incentivized to buy larger quantities
- Higher volume customers get better value
- Helps with inventory management and revenue predictability

### Common Industry Terms:
- **Volume Discount**: Discount based on purchase quantity
- **Tiered Pricing**: Different price points for different quantity ranges
- **Quantity Break Pricing**: Price breaks at specific quantity thresholds
- **Bulk Pricing**: Special pricing for large volume purchases

## Current Pricing Structure

### Base Credit Price
- **Standard Rate**: ₹5 per credit (base price for standard packages)

### Pricing Tiers

The pricing model uses **inverse tiered pricing** where:

1. **Single Credit Purchase** (Entry Tier)
   - **Price per credit**: ₹10
   - **Rationale**: Premium pricing for single-use customers, covers transaction costs

2. **Standard Packages** (Base Tier)
   - **Price per credit**: ₹5
   - **Range**: Small to medium packages (e.g., 100-1000 credits)
   - **Rationale**: Standard pricing for regular users

3. **Bulk Packages** (Discount Tier)
   - **Price per credit**: ₹2
   - **Minimum Purchase**: ₹2,50,000 (2.5 Lakh INR)
   - **Credits at this tier**: 125,000 credits at ₹2/credit
   - **Rationale**: Significant discount for enterprise/high-volume customers

## Pricing Calculation Formula

```
If credits <= 1:
    price_per_credit = ₹10
Else if credits <= standard_threshold:
    price_per_credit = ₹5
Else if total_price >= ₹2,50,000:
    price_per_credit = ₹2
```

### Example Calculations

#### Example 1: Single Credit
- **Credits**: 1
- **Price per credit**: ₹10
- **Total Price**: ₹10

#### Example 2: Standard Package
- **Credits**: 100
- **Price per credit**: ₹5
- **Total Price**: ₹500

#### Example 3: Large Package
- **Credits**: 1,000
- **Price per credit**: ₹5
- **Total Price**: ₹5,000

#### Example 4: Bulk Package
- **Total Investment**: ₹2,50,000
- **Price per credit**: ₹2
- **Credits**: 125,000 credits
- **Savings**: ₹3,75,000 (compared to ₹5/credit)

## Implementation Requirements

### Database Schema Updates

The `credit_packages` table needs to support dynamic pricing:

```sql
-- Option 1: Store pricing tier in package
ALTER TABLE credit_packages 
ADD COLUMN pricing_tier VARCHAR(20) DEFAULT 'standard', -- 'single', 'standard', 'bulk'
ADD COLUMN price_per_credit DECIMAL(10, 2) NOT NULL,
ADD COLUMN minimum_credits INTEGER,
ADD COLUMN maximum_credits INTEGER;

-- Option 2: Calculate dynamically based on credits
-- Price per credit calculated by:
-- CASE 
--   WHEN credits = 1 THEN 10
--   WHEN credits * 5 >= 250000 THEN 2
--   ELSE 5
-- END
```

### Pricing Logic Function

```typescript
interface PricingTier {
  name: string;
  minCredits: number;
  maxCredits?: number;
  pricePerCredit: number;
  minTotalPrice?: number;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'single',
    minCredits: 1,
    maxCredits: 1,
    pricePerCredit: 10,
  },
  {
    name: 'bulk',
    minCredits: 125000, // 2.5L / 2 = 125k credits
    pricePerCredit: 2,
    minTotalPrice: 250000, // 2.5 Lakh INR
  },
  {
    name: 'standard',
    minCredits: 2,
    pricePerCredit: 5,
  },
];

function calculatePricePerCredit(credits: number, totalPrice?: number): number {
  // Check bulk tier first (based on total price)
  if (totalPrice && totalPrice >= 250000) {
    return 2;
  }
  
  // Check single credit
  if (credits === 1) {
    return 10;
  }
  
  // Default to standard pricing
  return 5;
}

function calculateTotalPrice(credits: number): number {
  const pricePerCredit = calculatePricePerCredit(credits);
  return credits * pricePerCredit;
}

function getPricingTier(credits: number, totalPrice?: number): PricingTier {
  const pricePerCredit = calculatePricePerCredit(credits, totalPrice);
  
  if (pricePerCredit === 10) {
    return PRICING_TIERS.find(t => t.name === 'single')!;
  }
  if (pricePerCredit === 2) {
    return PRICING_TIERS.find(t => t.name === 'bulk')!;
  }
  return PRICING_TIERS.find(t => t.name === 'standard')!;
}
```

### UI/UX Considerations

1. **Price Display**
   - Show price per credit prominently
   - Display savings compared to standard rate
   - Highlight bulk discounts

2. **Package Recommendations**
   - Suggest bulk packages for users purchasing large quantities
   - Show "You save X%" for bulk purchases

3. **Dynamic Package Builder** (Future Enhancement)
   - Allow users to input desired credit amount
   - Automatically calculate price based on volume
   - Show tier recommendations

## Recommended Credit Packages

### Single Credit Package
- **Credits**: 1
- **Price**: ₹10
- **Price per credit**: ₹10
- **Target**: Trial users, one-time test

### Starter Packages (Standard Tier)
- **Starter Pack**: 100 credits @ ₹5 = ₹500
- **Popular Pack**: 500 credits @ ₹5 = ₹2,500
- **Pro Pack**: 1,000 credits @ ₹5 = ₹5,000

### Value Packages (Standard Tier)
- **Studio Pack**: 5,000 credits @ ₹5 = ₹25,000
- **Enterprise Pack**: 10,000 credits @ ₹5 = ₹50,000
- **Mega Pack**: 25,000 credits @ ₹5 = ₹1,25,000

### Bulk Packages (Discount Tier)
- **Ultra Pack**: 125,000 credits @ ₹2 = ₹2,50,000
- **Maximum Pack**: 250,000 credits @ ₹2 = ₹5,00,000
- **Enterprise Bulk**: 500,000 credits @ ₹2 = ₹10,00,000

## Business Benefits

1. **Revenue Optimization**
   - Higher margins on single credit purchases
   - Predictable revenue from bulk customers
   - Encourages larger purchases

2. **Customer Segmentation**
   - Single-use customers pay premium
   - Regular users get standard pricing
   - Enterprise customers get best rates

3. **Inventory Management**
   - Encourages bulk purchases reduces transaction frequency
   - Better cash flow from larger upfront payments

4. **Market Positioning**
   - Competitive for enterprise customers (₹2/credit)
   - Accessible for small users (single credit option)
   - Fair pricing for regular users (₹5/credit)

## Migration Strategy

1. **Phase 1: Database Updates**
   - Add pricing tier columns
   - Migrate existing packages to new structure
   - Ensure backward compatibility

2. **Phase 2: Backend Implementation**
   - Update pricing calculation logic
   - Modify order creation API
   - Update payment processing

3. **Phase 3: Frontend Updates**
   - Update credit package display
   - Show tier information
   - Display savings for bulk purchases

4. **Phase 4: Testing**
   - Test all pricing tiers
   - Verify payment processing
   - Test edge cases (1 credit, bulk purchases)

## Edge Cases & Considerations

1. **Custom Packages**
   - What if user wants custom credit amount?
   - Should we allow custom pricing for enterprise?

2. **Package Modifications**
   - How to handle price changes for existing packages?
   - Grandfathering existing customers?

3. **Currency Conversion**
   - Apply same tier structure in other currencies?
   - Convert tier thresholds appropriately?

4. **Bonus Credits**
   - How do bonus credits affect tier calculation?
   - Apply bonus before or after tier determination?

## Future Enhancements

1. **Dynamic Package Builder**
   - Let users create custom packages
   - Real-time price calculation

2. **Subscription Tiers**
   - Combine with subscription plans
   - Monthly bulk credits at discounted rate

3. **Loyalty Discounts**
   - Additional discounts for repeat customers
   - Cumulative purchase discounts

4. **Volume Commitments**
   - Annual volume commitments
   - Even better pricing for guarantees

## References

- **Pricing Strategy**: Volume Discount / Tiered Pricing
- **Industry Standard**: Common in SaaS, cloud services, and B2B platforms
- **Examples**: AWS, Google Cloud, Adobe Creative Cloud use similar models

