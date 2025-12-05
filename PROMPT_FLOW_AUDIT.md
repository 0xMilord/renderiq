# Prompt Flow Audit: Tool Prompts to Google Gemini

## Executive Summary

Audited the entire flow from tool prompt generation to Google Gemini API. Found **2 potential issues** where tool prompts could be modified. Both issues are **safe for tools** but documented for clarity.

## Flow Diagram

```
Tool Component (render-to-section-drawing.tsx)
  ↓
  buildSystemPrompt() → Creates structured XML prompt
  ↓
  onGenerate(formData) → Sets formData.set('prompt', buildSystemPrompt())
  ↓
  createRenderAction(formData) [Server Action]
  ↓
  Extracts: const prompt = formData.get('prompt')
  ↓
  processRenderAsync(renderId, { prompt, ... })
  ↓
  ⚠️ POTENTIAL MODIFICATION: Adds reference render context (line 376-379)
  ↓
  aiService.generateImage({ prompt: contextualPrompt, ... })
  ↓
  AISDKService.generateImage()
  ↓
  ⚠️ POTENTIAL MODIFICATION: Adds environment/effect modifiers (line 234-260)
  ↓
  Enhanced prompt sent to Gemini 3 Pro Image Preview
```

## Detailed Flow Analysis

### 1. Tool Component Layer ✅ SAFE

**File**: `components/tools/tools/render-to-section-drawing.tsx`

**Action**: 
- `buildSystemPrompt()` creates structured XML prompt with Gemini 3 best practices
- `onGenerate()` handler sets: `formData.set('prompt', buildSystemPrompt())`

**Status**: ✅ **SAFE** - Custom prompt is correctly set

### 2. Base Tool Component Layer ✅ SAFE

**File**: `components/tools/base-tool-component.tsx`

**Action**:
- Line 138: Uses `tool.systemPrompt` as default
- BUT: Custom tools with `onGenerate` handler override this (line 153-183)
- Tools without custom handler use default `tool.systemPrompt` from registry

**Status**: ✅ **SAFE** - Custom handlers correctly override default

### 3. Server Action Layer ⚠️ POTENTIAL MODIFICATION (But Safe for Tools)

**File**: `lib/actions/render.actions.ts`

**Action**:
- Line 60: Extracts prompt: `const prompt = formData.get('prompt') as string`
- Line 288-308: Passes to `processRenderAsync` with prompt
- Line 376-379: **MODIFIES PROMPT** if reference render exists:
  ```typescript
  let contextualPrompt = renderData.prompt;
  if (renderData.referenceRenderPrompt && renderData.uploadedImageData) {
    contextualPrompt = `Based on the previous render (${referenceRenderPrompt}), ${renderData.prompt}`;
  }
  ```

**Analysis**:
- Tools **DO NOT** pass `referenceRenderId` in FormData
- `referenceRenderPrompt` is only set if `referenceRenderId` is provided (line 216)
- Therefore, this modification **WILL NOT** trigger for tools

**Status**: ⚠️ **POTENTIAL MODIFICATION** but ✅ **SAFE FOR TOOLS** (tools don't pass referenceRenderId)

### 4. AISDKService Layer ⚠️ POTENTIAL MODIFICATION (But Safe for Tools)

**File**: `lib/services/ai-sdk-service.ts`

**Action**:
- Line 226: Starts with: `let enhancedPrompt = request.prompt.trim()`
- Line 234-245: Adds environment modifier if provided and not already mentioned
- Line 249-260: Adds effect modifier if provided and not already mentioned

**Analysis**:
- Tools pass `environment: undefined` and `effect: undefined` (not set in FormData)
- The checks on line 234 and 249 require `request.environment` and `request.effect` to be truthy
- Since tools don't pass these, the modifiers **WILL NOT** be added

**Status**: ⚠️ **POTENTIAL MODIFICATION** but ✅ **SAFE FOR TOOLS** (tools don't pass environment/effect)

### 5. Unified Chat Interface ✅ SEPARATE FLOW

**File**: `components/chat/unified-chat-interface.tsx`

**Action**:
- Uses `/api/renders` route (line 1065-1066)
- Tools use `createRenderAction` server action
- **These are completely separate flows**

**Status**: ✅ **NO INTERFERENCE** - Separate code paths

### 6. API Route `/api/renders` ✅ SEPARATE FLOW

**File**: `app/api/renders/route.ts`

**Action**:
- Used by unified chat interface
- Has similar prompt modification logic (line 540-544)
- Tools use server action, not this route

**Status**: ✅ **NO INTERFERENCE** - Tools don't use this route

## Issues Found

### Issue 1: Prompt Modification in processRenderAsync

**Location**: `lib/actions/render.actions.ts:376-379`

**Code**:
```typescript
let contextualPrompt = renderData.prompt;
if (renderData.referenceRenderPrompt && renderData.uploadedImageData) {
  contextualPrompt = `Based on the previous render (${referenceRenderPrompt}), ${renderData.prompt}`;
}
```

**Impact on Tools**: ✅ **NONE** - Tools don't pass `referenceRenderId`, so `referenceRenderPrompt` is always null

**Recommendation**: Add explicit check to skip modification for tool-generated prompts (identified by `imageType` field)

### Issue 2: Environment/Effect Modifiers in AISDKService

**Location**: `lib/services/ai-sdk-service.ts:234-260`

**Code**:
```typescript
if (request.environment && request.environment !== 'none') {
  // Adds environment modifier
}
if (request.effect && request.effect !== 'none') {
  // Adds effect modifier
}
```

**Impact on Tools**: ✅ **NONE** - Tools don't pass `environment` or `effect` parameters

**Recommendation**: Add explicit check to skip modifiers for tool-generated prompts (identified by structured XML format or `imageType`)

## Recommendations

### 1. Add Explicit Tool Prompt Protection

Add a check to prevent prompt modifications for tool-generated prompts:

**In `processRenderAsync`**:
```typescript
// Skip reference render context for tool-generated prompts
const isToolPrompt = renderData.imageType && renderData.imageType.startsWith('render-');
let contextualPrompt = renderData.prompt;
if (!isToolPrompt && renderData.referenceRenderPrompt && renderData.uploadedImageData) {
  contextualPrompt = `Based on the previous render (${referenceRenderPrompt}), ${renderData.prompt}`;
}
```

**In `AISDKService.generateImage`**:
```typescript
// Skip environment/effect modifiers for tool-generated prompts (structured XML format)
const isToolPrompt = request.prompt.includes('<role>') || request.prompt.includes('<task>');
if (!isToolPrompt && request.environment && request.environment !== 'none') {
  // Add environment modifier
}
```

### 2. Add Logging for Tool Prompts

Add logging to track when tool prompts are used:
```typescript
if (renderData.imageType) {
  logger.log('🔧 Tool prompt detected:', renderData.imageType);
}
```

### 3. Document Tool Prompt Format

Ensure all tools use structured XML format for consistency and easy detection.

## Current Status

✅ **TOOLS ARE PROTECTED** - Explicit protection added:

### Protection Added

1. **In `processRenderAsync` (render.actions.ts:377-384)**:
   - Detects tool prompts via `imageType` field (starts with 'render-')
   - Skips reference render context modification for tool prompts
   - Logs when tool prompt is detected

2. **In `AISDKService.generateImage` (ai-sdk-service.ts:230-260)**:
   - Detects tool prompts via structured XML format (`<role>`, `<task>`, `<constraints>` tags)
   - Skips environment/effect modifiers for tool prompts
   - Logs when tool prompt is detected

### Why Tools Are Safe

1. ✅ Tools pass `imageType` field → Detected and protected
2. ✅ Tool prompts use structured XML format → Detected and protected
3. ✅ Tools don't pass `referenceRenderId` → No reference render context
4. ✅ Tools don't pass `environment`/`effect` → No modifiers
5. ✅ Tools use separate flow (`createRenderAction`) → No interference from `/api/renders`
6. ✅ Unified chat uses separate route → No interference from tools

## Conclusion

✅ **EXPLICIT PROTECTION ADDED** - Tool prompts are now explicitly protected from modifications:
- Reference render context modification is skipped for tool prompts
- Environment/effect modifiers are skipped for structured XML prompts
- Logging added to track tool prompt detection
- Code is now more robust and prevents future issues

## Testing Recommendations

1. Test tool prompt generation to ensure XML structure is preserved
2. Verify logs show "Tool prompt detected" messages
3. Confirm no prompt modifications occur for tool-generated prompts
4. Test that unified chat prompts still work correctly (should still get modifiers)

