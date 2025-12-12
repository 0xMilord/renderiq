# Credit Deduction Infrastructure Audit

**Date**: 2025-12-12  
**Issue**: Credits not being deducted when model is "auto"  
**Status**: 🔴 Critical Bug - FIXED

---

## Executive Summary

Credits were not being deducted when users selected "auto" model mode because:
1. `getModelConfig('auto')` returns `calculateCredits: () => 0`
2. Credits are calculated BEFORE the pipeline runs
3. The actual model is only selected INSIDE the RenderPipeline (Stage 4)
4. This resulted in `totalCredits: 0` and `amount: 0` being deducted

---

## Root Cause

### Problem Flow:
```
1. User selects "auto" model
2. API route calculates credits: getModelConfig('auto').calculateCredits() → 0
3. Credits deducted: 0 credits
4. Pipeline runs and selects actual model (e.g., Gemini 3 Pro Image)
5. Generation completes but no credits were deducted
```

### Code Location:
- `lib/config/models.ts:346` - `calculateCredits: () => 0` for "auto" mode
- `app/api/renders/route.ts:373-384` - Credit calculation happens before pipeline
- `app/api/renders/route.ts:471` - Credits deducted before pipeline runs

---

## Solution Implemented

### 1. Use Maximum Cost for "Auto" Mode

**Location**: `app/api/renders/route.ts:372-398`

**Fix**:
- For "auto" mode, use maximum possible cost (Gemini 3 Pro Image)
- This ensures users have enough credits before generation starts
- Log that refund will be issued if cheaper model is selected

**Code**:
```typescript
if (imageModelId === 'auto') {
  const maxCostModel = getModelConfig('gemini-3-pro-image-preview' as any);
  if (maxCostModel && maxCostModel.type === 'image') {
    creditsCost = maxCostModel.calculateCredits({ quality, imageSize });
    logger.log('💰 Image credits cost calculation (auto mode - using max cost):', {
      model: 'auto',
      estimatedModel: 'gemini-3-pro-image-preview',
      quality,
      imageSize,
      totalCredits: creditsCost,
      note: 'Will refund difference if cheaper model is selected'
    });
  }
}
```

### 2. Refund Credit Difference After Pipeline

**Location**: `app/api/renders/route.ts:1226-1250`

**Fix**:
- After pipeline completes, check if actual model cost is less than deducted
- If so, refund the difference
- This ensures users only pay for the model actually used

**Code**:
```typescript
if (model === 'auto' && pipelineResult.data.selectedModel && creditsCost) {
  const actualModelConfig = getModelConfig(pipelineResult.data.selectedModel as any);
  const actualCost = actualModelConfig.calculateCredits({ quality, imageSize });
  const refundAmount = creditsCost - actualCost;
  
  if (refundAmount > 0) {
    await addCredits(
      refundAmount,
      'refund',
      `Refund for auto mode - selected ${pipelineResult.data.selectedModel} instead of max cost model`,
      user.id,
      'refund'
    );
  }
}
```

---

## Centralized Credit Infrastructure

### ✅ Credit Deduction Points (All Use Centralized Service)

1. **`app/api/renders/route.ts`** (Image Generation)
   - Uses: `deductCredits()` from `@/lib/actions/billing.actions`
   - Which calls: `BillingService.deductCredits()`
   - ✅ FIXED: Now handles "auto" mode correctly

2. **`app/api/video/route.ts`** (Video Generation)
   - Uses: `BillingService.deductCredits()` directly
   - ✅ Works correctly (no "auto" mode for video yet)

3. **`lib/actions/render.actions.ts`** (Server Actions)
   - Uses: `deductCredits()` from `@/lib/actions/billing.actions`
   - Which calls: `BillingService.deductCredits()`
   - ⚠️ NOTE: Uses old credit calculation (not model-based)

### ✅ Credit Refund Points (All Use Centralized Service)

1. **`app/api/renders/route.ts`** (Multiple locations)
   - Uses: `addCredits()` from `@/lib/actions/billing.actions`
   - Which calls: `BillingService.addCredits()` with type 'refund'
   - ✅ FIXED: Now includes refund for "auto" mode difference

2. **`lib/actions/render.actions.ts`**
   - Uses: `addCredits()` for refunds on failure
   - ✅ Works correctly

### ✅ Centralized Services

1. **`lib/services/billing.ts`** - `BillingService`
   - `addCredits()` - Centralized credit addition
   - `deductCredits()` - Centralized credit deduction
   - ✅ All credit operations go through this service

2. **`lib/actions/billing.actions.ts`** - Server Actions
   - `addCredits()` - Wrapper for BillingService.addCredits()
   - `deductCredits()` - Wrapper for BillingService.deductCredits()
   - ✅ Provides authentication and error handling

---

## Issues Found

### 🔴 CRITICAL: "Auto" Mode Returns 0 Credits

**Status**: ✅ FIXED

**Problem**: `getModelConfig('auto')` returns `calculateCredits: () => 0`

**Impact**: Users with "auto" mode don't get charged

**Fix**: Use maximum cost for "auto" mode, refund difference after pipeline

### 🟡 MEDIUM: Inconsistent Credit Calculation

**Status**: ⚠️ PARTIALLY FIXED

**Problem**: 
- `app/api/renders/route.ts` uses model-based pricing ✅
- `lib/actions/render.actions.ts` uses old fixed pricing ❌

**Impact**: Different credit costs depending on entry point

**Recommendation**: Update `render.actions.ts` to use model-based pricing

### 🟢 LOW: Video API Doesn't Handle "Auto" Mode

**Status**: ⚠️ NOT AN ISSUE YET

**Problem**: Video API doesn't support "auto" mode yet

**Impact**: None (feature not implemented)

**Recommendation**: When implementing "auto" for video, apply same fix

---

## Testing Checklist

- [x] "Auto" mode deducts credits (max cost)
- [x] "Auto" mode refunds difference if cheaper model selected
- [x] Specific model selection deducts correct credits
- [x] Failed generations refund credits
- [x] Video generation deducts credits correctly
- [ ] Server actions use model-based pricing (TODO)

---

## Files Modified

1. **`app/api/renders/route.ts`**
   - Fixed credit calculation for "auto" mode (line 372-398)
   - Added refund logic after pipeline (line 1226-1250)

2. **`docs/CREDIT_DEDUCTION_AUDIT.md`** (this file)
   - Audit documentation

---

## Related Files

- `lib/config/models.ts` - Model configuration and credit calculation
- `lib/services/billing.ts` - Centralized credit service
- `lib/actions/billing.actions.ts` - Server actions for credits
- `app/api/video/route.ts` - Video generation credit deduction
- `lib/actions/render.actions.ts` - Server actions (uses old pricing)

---

## Next Steps

1. ✅ Fix "auto" mode credit calculation - DONE
2. ✅ Add refund logic for "auto" mode - DONE
3. ⚠️ Update `render.actions.ts` to use model-based pricing - TODO
4. ⚠️ Add "auto" mode support for video (when implemented) - TODO
5. ⚠️ Add unit tests for credit calculation - TODO

