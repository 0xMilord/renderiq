# AI API Routes & SDK Usage Audit Report

**Date**: 2025-01-27  
**Status**: 🔍 **AUDIT COMPLETE** - Issues Found

---

## Executive Summary

✅ **We ARE using the NEW `@google/genai` SDK correctly**  
❌ **We have REDUNDANT old SDK installed** (`@google/generative-ai`)  
⚠️ **AI API routes are thin wrappers** - Could potentially be server actions  
❓ **Need to verify if API routes are needed for external access or streaming**

---

## 1. SDK Usage Analysis

### ✅ Current Implementation (CORRECT)

**SDK Used**: `@google/genai` (version 1.27.0) - **NEW SDK** ✅

**Location**: `lib/services/ai-sdk-service.ts`
```typescript
import { GoogleGenAI } from '@google/genai';

// Using NEW SDK correctly
this.genAI = new GoogleGenAI({ apiKey });

// Image generation uses NEW SDK API
const response = await this.genAI.models.generateContent({
  model: modelName,
  contents: contents,
  config: config
});
```

**Status**: ✅ **CORRECT** - Using new SDK as per Google's migration guide

---

### ❌ Redundant Package (SHOULD REMOVE)

**Package**: `@google/generative-ai` (version 0.21.0) - **OLD SDK** ❌

**Status**: ❌ **NOT USED** - Installed but never imported/used

**Recommendation**: 
- ✅ **Remove** `@google/generative-ai` from `package.json`
- ✅ **Run** `npm uninstall @google/generative-ai`

**Impact**: Reduces bundle size, eliminates confusion

---

## 2. Image Generation Analysis

### How Images Are Generated

**Method**: Using Gemini Native Image Generation (Nano Banana / Nano Banana Pro)

**Flow**:
1. Client calls `/api/ai/generate-image` (API route)
2. API route validates input, rate limits, checks origin
3. API route calls `AISDKService.generateImage()`
4. `AISDKService` uses `this.genAI.models.generateContent()` (NEW SDK)
5. Returns base64 image data

**SDK Used**: ✅ `@google/genai` (NEW SDK) - **CORRECT**

**Models Used**:
- `gemini-3-pro-image-preview` (Nano Banana Pro) - Default
- `gemini-2.5-flash-image` (Nano Banana) - Alternative

**Status**: ✅ **CORRECT** - Using new SDK API correctly

---

## 3. AI API Routes Analysis

### Current AI API Routes

1. **`/api/ai/generate-image`** - Image generation
2. **`/api/ai/generate-video`** - Video generation (Veo 3.1)
3. **`/api/ai/chat`** - Chat with streaming support
4. **`/api/ai/completion`** - Text completion
5. **`/api/ai/enhance-prompt`** - Prompt enhancement
6. **`/api/ai/extract-style`** - Style extraction

### What These Routes Do

**All routes are thin wrappers** around `AISDKService` that add:
- ✅ Input validation (`validatePrompt`, `sanitizeInput`)
- ✅ Rate limiting (`rateLimitMiddleware`)
- ✅ Origin checking (`isAllowedOrigin`)
- ✅ Security logging (`securityLog`)
- ✅ Error handling
- ✅ Sentry integration

**They don't add business logic** - just security/validation layers.

---

## 4. Should AI Routes Be Server Actions?

### Arguments FOR Server Actions

1. ✅ **Better Type Safety** - Shared types between client/server
2. ✅ **Reduced HTTP Overhead** - Direct function calls
3. ✅ **Better Next.js Integration** - Built-in caching, revalidation
4. ✅ **Simpler Code** - No need for fetch/axios calls
5. ✅ **Consistent Pattern** - Matches other migrations (billing, canvas, etc.)

### Arguments AGAINST (Keep API Routes)

1. ⚠️ **Streaming Support** - `/api/ai/chat` uses streaming (ReadableStream)
   - Server actions can return streams, but API routes are more straightforward
2. ⚠️ **External API Access** - If these routes are used by external clients
3. ⚠️ **Rate Limiting** - API routes have middleware-based rate limiting
   - Server actions would need custom rate limiting
4. ⚠️ **Origin Checking** - API routes check request origin
   - Server actions don't have request context by default

### Recommendation

**Option 1: Hybrid Approach** (Recommended)
- ✅ **Keep API routes** for:
  - `/api/ai/chat` (streaming)
  - External API access (if needed)
- ✅ **Migrate to server actions** for:
  - `/api/ai/generate-image` (internal use)
  - `/api/ai/completion` (internal use)
  - `/api/ai/enhance-prompt` (internal use)
  - `/api/ai/extract-style` (internal use)

**Option 2: Keep All API Routes**
- If external API access is needed
- If streaming is critical for all endpoints
- If rate limiting/origin checking is essential

---

## 5. Current Usage Analysis

### Where AI APIs Are Called

**From Code Search**:
- `lib/hooks/use-ai-sdk.ts` - Uses `AISDKService` directly (not API routes) ✅
- `components/canvas/nodes/prompt-builder-node.tsx` - Uses API routes
- `components/canvas/nodes/style-reference-node.tsx` - Uses API routes
- `lib/hooks/use-node-execution.ts` - Uses API routes

**Key Finding**: 
- ✅ `use-ai-sdk.ts` hook uses `AISDKService` directly (good!)
- ⚠️ Canvas nodes use API routes (could migrate to server actions)

---

## 6. Issues Found

### 🔴 Critical Issues

1. **Redundant Old SDK Installed**
   - `@google/generative-ai` (0.21.0) is installed but NOT USED
   - Should be removed

### 🟡 Medium Priority Issues

2. **Inconsistent Usage Pattern**
   - Some code uses `AISDKService` directly (good)
   - Some code uses API routes (could be server actions)
   - Should standardize on one approach

3. **API Routes May Be Redundant**
   - If only used internally, should be server actions
   - Need to verify external usage

---

## 7. Recommendations

### Immediate Actions

1. ✅ **Remove Old SDK**
   ```bash
   npm uninstall @google/generative-ai
   ```
   - Update `package.json`
   - Remove from `package-lock.json`

2. ✅ **Audit API Route Usage**
   - Check if `/api/ai/*` routes are used externally
   - Check if streaming is needed for all endpoints
   - Document which routes need to stay as API routes

### Migration Plan (If Applicable)

3. ⚠️ **Create Server Actions for Internal Use**
   - `generateImageAction()` - Replace `/api/ai/generate-image` for internal use
   - `enhancePromptAction()` - Replace `/api/ai/enhance-prompt`
   - `extractStyleAction()` - Replace `/api/ai/extract-style`
   - `generateCompletionAction()` - Replace `/api/ai/completion`

4. ⚠️ **Keep API Routes For**
   - `/api/ai/chat` - Streaming support
   - `/api/ai/generate-video` - Long-running async operations
   - External API access (if needed)

5. ⚠️ **Update Client Code**
   - Migrate canvas nodes to use server actions
   - Keep API routes for streaming/async operations

---

## 8. Verification Checklist

- ✅ Using NEW `@google/genai` SDK correctly
- ✅ Image generation uses `models.generateContent()` (NEW SDK API)
- ❌ Old `@google/generative-ai` SDK installed but not used
- ⚠️ API routes are thin wrappers (could be server actions)
- ⚠️ Need to verify external usage of API routes
- ⚠️ Need to verify streaming requirements

---

## 9. Summary

### What's Working ✅

1. ✅ Using NEW `@google/genai` SDK correctly
2. ✅ Image generation uses correct SDK API
3. ✅ `AISDKService` is well-structured
4. ✅ Security/validation in API routes is good

### What Needs Fixing ❌

1. ❌ Remove unused `@google/generative-ai` package
2. ⚠️ Consider migrating internal API routes to server actions
3. ⚠️ Standardize on one pattern (API routes vs server actions)

### What's Unclear ❓

1. ❓ Are AI API routes used externally?
2. ❓ Is streaming needed for all endpoints?
3. ❓ Should we keep API routes for rate limiting/origin checking?

---

**Audit Completed**: 2025-01-27  
**Next Steps**: 
1. Remove old SDK
2. Audit API route usage
3. Decide on server action migration

