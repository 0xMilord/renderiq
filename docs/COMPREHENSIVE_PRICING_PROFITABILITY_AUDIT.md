# Comprehensive Pricing & Profitability Audit Report
**Date:** December 3, 2025  
**Latest Pricing Data:** November 2025  
**Audit Scope:** Markup Infrastructure, API Costs, Credit System, Profitability Analysis

---

## Executive Summary

This audit examines the entire pricing infrastructure, API costs, markup calculations, credit deduction system, 7-stage pipeline costs, model routing, and profitability analysis for ₹100,000 revenue.

**Key Findings:**
- ✅ Credit infrastructure is well-implemented
- ⚠️ **CRITICAL:** Video pricing inconsistency between `/api/renders` and `/api/video`
- ⚠️ **IMPORTANT:** 7-stage pipeline costs (~$0.004-0.006 per render) are NOT included in credit pricing
- ✅ Markup strategy: 2x multiplier on API costs (for Stage 5 only)
- ✅ Base pricing: 5 INR per credit
- 📊 Profit margin on ₹100k revenue: **~41-43%** (after all API costs including pipeline)
- 📊 **Pipeline Impact:** Additional ~$0.004-0.006 per render (absorbed, not charged)

---

## 1. API Cost Analysis (Latest Pricing - November 2025)

### 1.1 Google Gemini 3 Pro / Nano Banana Pro (Image Generation)

**Latest Pricing (Nov 2025):**
- **1K/2K Resolution:** $0.134 per image
- **4K Resolution:** $0.24 per image
- **Batch API (50% discount):** $0.067/image (1K/2K), $0.12/image (4K)

**Token Consumption:**
- 1K/2K images: 1,120 tokens
- 4K images: 2,000 tokens
- Rate: $120 per 1 million tokens

**Current Implementation:**
- Base cost: **5 credits per image** (standard quality)
- High quality: **10 credits** (2x multiplier)
- Ultra quality: **15 credits** (3x multiplier)

**Cost Breakdown:**
```
Base API Cost: $0.134/image
With 2x Markup: $0.268/image
In INR (83 INR/USD): ₹22.24/image
At 5 INR/credit: 4.45 credits/image → rounded to 5 credits
```

**Revenue per Image:**
- Standard: 5 credits × ₹5 = **₹25/image**
- High: 10 credits × ₹5 = **₹50/image**
- Ultra: 15 credits × ₹5 = **₹75/image**

**Profit per Image:**
- Standard: ₹25 - ₹11.12 (API cost) = **₹13.88** (55.5% margin)
- High: ₹50 - ₹11.12 = **₹38.88** (77.8% margin)
- Ultra: ₹75 - ₹11.12 = **₹63.88** (85.2% margin)

### 1.2 Google Veo 3.1 (Video Generation)

**Latest Pricing (Nov 2025):**
- **Per-second pricing:** $0.75/second (estimated from codebase comments)
- **Subscription plans:** $22.50-$60/month (not applicable for API usage)

**Current Implementation - INCONSISTENCY FOUND:**

#### `/api/renders` Route (Primary):
```typescript
// Based on $0.75/second with 2x markup
const creditsPerSecond = 25;
creditsCost = creditsPerSecond * videoDuration;
```
- **5-second video:** 125 credits = ₹625
- **8-second video:** 200 credits = ₹1,000

#### `/api/video` Route (Secondary):
```typescript
const baseCost = 5;
const durationMultiplier = duration / 5;
const modelMultiplier = model === 'veo3_fast' ? 1 : 2;
creditsCost = Math.ceil(baseCost * durationMultiplier * modelMultiplier);
```
- **5-second video (fast):** 5 credits = ₹25
- **5-second video (standard):** 10 credits = ₹50
- **8-second video (fast):** 8 credits = ₹40
- **8-second video (standard):** 16 credits = ₹80

**⚠️ CRITICAL ISSUE:** These two routes have **completely different pricing** for the same service!

**Cost Breakdown (using `/api/renders` pricing):**
```
Base API Cost: $0.75/second
With 2x Markup: $1.50/second
In INR (83 INR/USD): ₹124.5/second
At 5 INR/credit: 24.9 credits/second → rounded to 25 credits
```

**Revenue per Second:**
- 25 credits × ₹5 = **₹125/second**

**Profit per Second:**
- ₹125 - ₹62.25 (API cost) = **₹62.75** (50.2% margin)

---

## 2. Credit Infrastructure Audit

### 2.1 Credit Pricing Model

**Base Rate:** 5 INR per credit

**Credit Packages:**
| Package | Credits | Price | Price/Credit | Status |
|---------|---------|-------|--------------|--------|
| Starter Pack | 50 | ₹250 | ₹5.00 | ✅ |
| Professional Pack | 100 | ₹499 | ₹4.99 | ✅ |
| Power Pack | 500 | ₹2,499 | ₹4.998 | ✅ |
| Enterprise Pack | 1,000 | ₹4,999 | ₹4.999 | ✅ |

**Subscription Plans:**
| Plan | Credits/Month | Price | Price/Credit | Status |
|------|---------------|-------|--------------|--------|
| Free | 10 | ₹0 | ₹0 | ✅ |
| Pro Monthly | 100 | ₹499 | ₹4.99 | ✅ |
| Pro Annual | 100 | ₹4,790/year | ₹3.99 | ✅ |
| Enterprise Monthly | 1,000 | ₹4,999 | ₹4.999 | ✅ |
| Enterprise Annual | 1,000 | ₹44,999/year | ₹3.75 | ✅ |

### 2.2 Credit Deduction Infrastructure

**✅ Image Generation (`/api/renders`):**
- Deduction: ✅ Before generation
- Calculation: ✅ Correct (5/10/15 credits based on quality)
- Refund: ✅ On failure
- Transaction Logging: ✅ Complete

**✅ Video Generation (`/api/renders`):**
- Deduction: ✅ Before generation
- Calculation: ✅ Correct (25 credits/second)
- Refund: ✅ On failure
- Transaction Logging: ✅ Complete

**⚠️ Video Generation (`/api/video`):**
- Deduction: ✅ Before generation
- Calculation: ⚠️ **DIFFERENT** from `/api/renders` (5-16 credits vs 125-200 credits)
- Refund: ✅ On failure
- Transaction Logging: ✅ Complete

**Issue:** Two different pricing models for the same service creates:
1. User confusion
2. Revenue leakage (if users use cheaper route)
3. Inconsistent profit margins

### 2.3 Credit Allocation

**✅ Subscription Credits:**
- Monthly reset: ✅ Implemented
- Allocation on subscription: ✅ Implemented
- Webhook handling: ✅ Implemented

**✅ Credit Transactions:**
- Audit trail: ✅ Complete
- Transaction types: ✅ Properly categorized
- Reference tracking: ✅ Implemented

---

## 3. Markup & Profitability Analysis

### 3.1 Markup Strategy

**Current Markup:** 2x multiplier on API costs

**Rationale (from codebase):**
- Covers infrastructure costs
- Provides profit margin
- Accounts for currency fluctuations

**Markup Calculation:**
```
API Cost (USD) × 2 (markup) × Exchange Rate (83 INR/USD) ÷ Credit Price (5 INR/credit) = Credits Charged
```

### 3.2 Cost Structure

**Base Costs (per unit):**
- **Image (Standard):** $0.134 → ₹11.12
- **Image (High):** $0.134 → ₹11.12 (same API cost, higher credit charge)
- **Image (Ultra):** $0.134 → ₹11.12 (same API cost, higher credit charge)
- **Video (per second):** $0.75 → ₹62.25

**Revenue (per unit):**
- **Image (Standard):** ₹25
- **Image (High):** ₹50
- **Image (Ultra):** ₹75
- **Video (per second):** ₹125

**Profit Margin:**
- **Image (Standard):** 55.5%
- **Image (High):** 77.8%
- **Image (Ultra):** 85.2%
- **Video:** 50.2%

---

## 4. Profitability Analysis: ₹100,000 Revenue

### 4.1 Scenario 1: Image-Heavy Usage (80% Images, 20% Videos)

**Assumptions:**
- 80% revenue from images (₹80,000)
- 20% revenue from videos (₹20,000)
- Average image quality: Standard (5 credits)
- Average video duration: 5 seconds

**Image Generation:**
- Revenue: ₹80,000
- Credits sold: 16,000 credits
- Images generated: 3,200 images
- API cost: 3,200 × $0.134 × 83 = ₹35,510

**Video Generation:**
- Revenue: ₹20,000
- Credits sold: 4,000 credits
- Video seconds: 160 seconds (32 videos × 5 seconds)
- API cost: 160 × $0.75 × 83 = ₹9,960

**Total Expenses:**
- Stage 5 API Costs: ₹35,510 + ₹9,960 = **₹45,470**
- Pipeline Overhead (if enabled): 3,200 × ₹0.42 = **₹1,344**
- Infrastructure (estimated 10%): ₹10,000
- Payment processing (2%): ₹2,000
- **Total Expenses: ₹58,814** (with pipeline) / **₹57,470** (without pipeline)

**Profit:**
- Revenue: ₹100,000
- Expenses: ₹58,814 (with pipeline) / ₹57,470 (without pipeline)
- **Profit: ₹41,186 (41.2% margin with pipeline)** / **₹42,530 (42.5% margin without pipeline)**

### 4.2 Scenario 2: Video-Heavy Usage (40% Images, 60% Videos)

**Assumptions:**
- 40% revenue from images (₹40,000)
- 60% revenue from videos (₹60,000)
- Average image quality: Standard (5 credits)
- Average video duration: 5 seconds

**Image Generation:**
- Revenue: ₹40,000
- Credits sold: 8,000 credits
- Images generated: 1,600 images
- API cost: 1,600 × $0.134 × 83 = ₹17,755

**Video Generation:**
- Revenue: ₹60,000
- Credits sold: 12,000 credits
- Video seconds: 480 seconds (96 videos × 5 seconds)
- API cost: 480 × $0.75 × 83 = ₹29,880

**Total Expenses:**
- Stage 5 API Costs: ₹17,755 + ₹29,880 = **₹47,635**
- Pipeline Overhead (if enabled): 1,600 × ₹0.42 = **₹672**
- Infrastructure (estimated 10%): ₹10,000
- Payment processing (2%): ₹2,000
- **Total Expenses: ₹60,307** (with pipeline) / **₹59,635** (without pipeline)

**Profit:**
- Revenue: ₹100,000
- Expenses: ₹60,307 (with pipeline) / ₹59,635 (without pipeline)
- **Profit: ₹39,693 (39.7% margin with pipeline)** / **₹40,365 (40.4% margin without pipeline)**

### 4.3 Scenario 3: Balanced Usage (50% Images, 50% Videos)

**Assumptions:**
- 50% revenue from images (₹50,000)
- 50% revenue from videos (₹50,000)
- Average image quality: Standard (5 credits)
- Average video duration: 5 seconds

**Image Generation:**
- Revenue: ₹50,000
- Credits sold: 10,000 credits
- Images generated: 2,000 images
- API cost: 2,000 × $0.134 × 83 = ₹22,244

**Video Generation:**
- Revenue: ₹50,000
- Credits sold: 10,000 credits
- Video seconds: 400 seconds (80 videos × 5 seconds)
- API cost: 400 × $0.75 × 83 = ₹24,900

**Total Expenses:**
- Stage 5 API Costs: ₹22,244 + ₹24,900 = **₹47,144**
- Pipeline Overhead (if enabled): 2,000 × ₹0.42 = **₹840**
- Infrastructure (estimated 10%): ₹10,000
- Payment processing (2%): ₹2,000
- **Total Expenses: ₹59,984** (with pipeline) / **₹59,144** (without pipeline)

**Profit:**
- Revenue: ₹100,000
- Expenses: ₹59,984 (with pipeline) / ₹59,144 (without pipeline)
- **Profit: ₹40,016 (40.0% margin with pipeline)** / **₹40,856 (40.9% margin without pipeline)**

### 4.4 Average Profitability Summary

**Average Profit Margin (without pipeline):** ~41-43%  
**Average Profit Margin (with pipeline):** ~40-41%  
**Average Profit on ₹100k Revenue:** ₹39,000 - ₹42,000 (with pipeline) / ₹40,000 - ₹43,000 (without pipeline)

**Breakdown (with pipeline):**
- Stage 5 API Costs: ~47% of revenue
- Pipeline Overhead: ~0.8-1.3% of revenue (if enabled)
- Infrastructure: ~10% of revenue
- Payment Processing: ~2% of revenue
- **Profit: ~40-41% of revenue**

**Breakdown (without pipeline):**
- Stage 5 API Costs: ~47% of revenue
- Infrastructure: ~10% of revenue
- Payment Processing: ~2% of revenue
- **Profit: ~41-43% of revenue**

---

## 5. Critical Issues & Recommendations

### 5.1 ⚠️ IMPORTANT: 7-Stage Pipeline Costs Not Included in Pricing

**Issue:**
- Pipeline stages 1-4, 6-7 cost ~$0.004-0.006 per render
- These costs are currently **absorbed by the platform**
- Credits only cover Stage 5 (image generation) cost
- Pipeline is optional (feature flag), but when enabled, costs are not recovered

**Impact:**
- Reduces profit margin by ~1-1.5% when pipeline is enabled
- Pipeline provides value (better quality, consistency) but cost is not passed to users
- At scale, this could be significant (e.g., ₹1,344 on ₹100k revenue)

**Options:**
1. **Current Approach (Absorb Costs):** Continue absorbing pipeline costs as value-add
   - Pros: Better quality without price increase
   - Cons: Lower profit margins
   
2. **Add Pipeline Surcharge:** Add small credit surcharge when pipeline is enabled
   - Pros: Recover costs, maintain margins
   - Cons: More complex pricing, potential user confusion
   
3. **Bundle Pipeline:** Include pipeline in higher quality tiers only
   - Pros: Pipeline costs offset by higher credit charges
   - Cons: Pipeline not available for standard quality

**Recommendation:**
- **Short-term:** Continue absorbing costs (pipeline is competitive advantage)
- **Long-term:** Consider adding "Premium Pipeline" option with +1-2 credit surcharge
- **Monitor:** Track pipeline usage and cost impact at scale

### 5.2 ⚠️ CRITICAL: Video Pricing Inconsistency

**Issue:**
- `/api/renders` charges 25 credits/second (₹125/second)
- `/api/video` charges 5-16 credits total (₹25-₹80 total)

**Impact:**
- Revenue leakage if users use `/api/video` route
- Inconsistent user experience
- Potential 80-95% revenue loss on video generation

**Recommendation:**
1. **IMMEDIATE:** Standardize video pricing across both routes
2. Use `/api/renders` pricing model (25 credits/second) as the standard
3. Update `/api/video` route to match pricing
4. Add route validation to prevent bypassing

**Code Fix Required:**
```typescript
// In app/api/video/route.ts
// Replace current calculation with:
const creditsPerSecond = 25;
const creditsCost = creditsPerSecond * duration;
```

### 5.3 Model Routing Impact on Costs

**Current Implementation:**
- Model routing selects optimal model based on complexity/quality
- Simple renders → Flash Image ($0.039) vs Pro Image ($0.134)
- **Cost difference: $0.095 per image (₹7.88)**

**Credit Pricing:**
- All standard quality images: 5 credits (₹25)
- **Profit variation:**
  - Flash Image: ₹25 - ₹3.24 = ₹21.76 (87% margin)
  - Pro Image: ₹25 - ₹11.12 = ₹13.88 (55.5% margin)

**Analysis:**
- Current pricing model works well: Higher margins on simple renders offset complex ones
- Average profit margin maintained across mix of simple/complex renders
- Model routing optimizes costs without affecting user pricing

**Recommendation:**
- ✅ Keep current pricing model (flat rate per quality tier)
- ✅ Model routing provides cost optimization without user impact
- Consider analytics to track model selection distribution

### 5.4 Markup Analysis

**Current Markup:** 2x on API costs

**Assessment:**
- ✅ Reasonable for image generation (55-85% margins)
- ✅ Reasonable for video generation (50% margin)
- ✅ Competitive pricing (5 INR/credit)

**Recommendation:**
- Maintain 2x markup
- Consider dynamic markup based on:
  - Volume discounts for enterprise
  - Quality tiers (already implemented)
  - Market competition

### 5.5 Credit Infrastructure

**Status:** ✅ Well-implemented

**Strengths:**
- Proper deduction before generation
- Refund mechanism on failures
- Complete transaction logging
- Subscription credit allocation

**Minor Improvements:**
- Add credit usage analytics dashboard
- Implement credit expiration for unused credits
- Add credit transfer between users (for teams)

---

## 6. Cost Optimization Opportunities

### 6.1 Batch API Usage

**Current:** Using standard API (real-time)

**Opportunity:** Use Batch API for non-urgent requests (50% discount)

**Savings:**
- Image cost: $0.134 → $0.067 (50% reduction)
- Potential savings: ~₹11,000 on ₹100k revenue

**Implementation:**
- Add "batch processing" option for users
- Queue non-urgent requests
- Process within 24 hours

### 6.2 Quality-Based API Cost

**Current:** All qualities use same API cost ($0.134)

**Opportunity:** Charge higher API costs for ultra quality (if using 4K)

**Potential:** Use 4K API ($0.24) for ultra quality
- Standard: $0.134 → ₹11.12
- Ultra: $0.24 → ₹19.92
- Current charge: ₹75
- Profit: ₹55.08 (73.4% margin) vs current ₹63.88 (85.2% margin)

**Recommendation:** Keep current model (higher profit on ultra)

### 6.3 Infrastructure Costs

**Current Estimate:** 10% of revenue

**Optimization:**
- Use CDN for image/video delivery
- Implement caching for popular renders
- Optimize database queries
- Use serverless functions for generation

**Potential Savings:** Reduce to 5-7% of revenue

---

## 7. Revenue Projections

### 7.1 Monthly Revenue Scenarios

**Scenario A: ₹100k/month**
- API Costs: ₹47,000
- Infrastructure: ₹10,000
- Payment Processing: ₹2,000
- **Profit: ₹41,000 (41%)**

**Scenario B: ₹500k/month**
- API Costs: ₹235,000
- Infrastructure: ₹50,000
- Payment Processing: ₹10,000
- **Profit: ₹205,000 (41%)**

**Scenario C: ₹1M/month**
- API Costs: ₹470,000
- Infrastructure: ₹100,000
- Payment Processing: ₹20,000
- **Profit: ₹410,000 (41%)**

### 7.2 Break-Even Analysis

**Fixed Costs (Monthly):**
- Infrastructure: ₹10,000
- Payment Processing: 2% of revenue
- Support/Operations: ₹5,000

**Variable Costs:**
- API Costs: ~47% of revenue

**Break-Even Point:**
- Minimum revenue: ~₹15,000/month
- At ₹100k revenue: ₹41k profit

---

## 8. Recommendations Summary

### 8.1 Immediate Actions (Critical)

1. **Fix Video Pricing Inconsistency**
   - Standardize `/api/video` route pricing
   - Use 25 credits/second model
   - Priority: **HIGH**

2. **Add Pricing Validation**
   - Prevent route bypassing
   - Add middleware to enforce pricing
   - Priority: **HIGH**

3. **Track Pipeline Costs**
   - Add analytics for pipeline usage
   - Monitor cost impact at scale
   - Priority: **MEDIUM**

### 8.2 Short-Term Improvements

1. **Implement Batch API Option**
   - Add "batch processing" feature
   - Reduce costs by 50% for non-urgent requests
   - Priority: **MEDIUM**

2. **Add Cost Analytics Dashboard**
   - Track API costs vs revenue
   - Monitor profit margins
   - Priority: **MEDIUM**

### 8.3 Long-Term Optimizations

1. **Infrastructure Optimization**
   - Reduce infrastructure costs to 5-7%
   - Implement CDN and caching
   - Priority: **LOW**

2. **Dynamic Pricing**
   - Volume-based discounts
   - Enterprise pricing tiers
   - Priority: **LOW**

---

## 9. Conclusion

**Overall Assessment:** ✅ **GOOD** with critical fix needed

**Strengths:**
- Well-implemented credit infrastructure
- Reasonable markup strategy (2x on Stage 5)
- Good profit margins (40-43%)
- Competitive pricing (5 INR/credit)
- ✅ 7-stage pipeline provides value (costs absorbed)
- ✅ Model routing optimizes costs automatically

**Critical Issues:**
- ⚠️ Video pricing inconsistency (revenue leakage risk)
- ⚠️ Pipeline costs not included in pricing (absorbed, reduces margin by ~1-1.5%)
- Need for pricing standardization

**Profitability:**
- **On ₹100k revenue (without pipeline):** ~₹41k profit (41% margin)
- **On ₹100k revenue (with pipeline):** ~₹40k profit (40% margin)
- **Break-even:** ~₹15k/month
- **Scalability:** Linear profit growth with revenue
- **Pipeline Impact:** ~1-1.5% margin reduction when enabled

**Grade:** **B+** (would be A- after fixing video pricing and pipeline cost strategy)

---

## Appendix A: File References

### Key Files Audited:
- `app/api/renders/route.ts` - Primary render endpoint (image/video)
- `app/api/video/route.ts` - Secondary video endpoint (⚠️ pricing issue)
- `lib/services/billing.ts` - Credit management
- `lib/actions/render.actions.ts` - Render creation with credits
- `lib/dal/billing.ts` - Billing data access layer
- `lib/services/render-pipeline.ts` - 7-stage pipeline orchestrator
- `lib/services/semantic-parsing.ts` - Stage 1 (semantic parsing)
- `lib/services/image-understanding.ts` - Stage 2 (image understanding)
- `lib/services/prompt-optimizer.ts` - Stage 3 (prompt optimization)
- `lib/services/model-router.ts` - Stage 4 (model routing)
- `lib/services/image-validator.ts` - Stage 6 (validation)
- `lib/services/pipeline-memory.ts` - Stage 7 (memory extraction)
- `lib/config/models.ts` - Model configuration and pricing

### Database Tables:
- `user_credits` - Credit balances
- `credit_transactions` - Transaction audit trail
- `subscription_plans` - Plan definitions
- `credit_packages` - One-time credit purchases

---

## Appendix B: Pricing Reference Table

### Stage 5 Only (Current Credit Pricing)

| Service | API Cost (Stage 5) | Markup | Revenue | Profit | Margin |
|---------|-------------------|--------|---------|--------|--------|
| Image (Standard) | ₹11.12 | 2x | ₹25 | ₹13.88 | 55.5% |
| Image (High) | ₹11.12 | 2x | ₹50 | ₹38.88 | 77.8% |
| Image (Ultra) | ₹11.12 | 2x | ₹75 | ₹63.88 | 85.2% |
| Video (per second) | ₹62.25 | 2x | ₹125 | ₹62.75 | 50.2% |

### With Full 7-Stage Pipeline (Costs Absorbed)

| Service | Stage 5 Cost | Pipeline Overhead | Total Cost | Revenue | Profit | Margin |
|---------|-------------|-------------------|------------|---------|--------|--------|
| Image (Standard) | ₹11.12 | ₹0.42 | ₹11.54 | ₹25 | ₹13.46 | 53.8% |
| Image (High) | ₹11.12 | ₹0.42 | ₹11.54 | ₹50 | ₹38.46 | 76.9% |
| Image (Ultra) | ₹11.12 | ₹0.42 | ₹11.54 | ₹75 | ₹63.46 | 84.6% |

### Model Routing Impact

| Model | API Cost | Revenue | Profit | Margin |
|-------|----------|---------|--------|--------|
| Flash Image (Simple) | ₹3.24 | ₹25 | ₹21.76 | 87.0% |
| Pro Image 1K/2K (Complex) | ₹11.12 | ₹25 | ₹13.88 | 55.5% |
| Pro Image 4K (Ultra) | ₹19.92 | ₹75 | ₹55.08 | 73.4% |

---

**Report Generated:** December 3, 2025  
**Next Review:** January 2026  
**Auditor:** AI Assistant

