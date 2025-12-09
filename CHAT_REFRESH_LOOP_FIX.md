# Chat Refresh Loop Fix

## Problem

When sending a render, the entire chat refreshes and all data disappears, showing previous UI state. The image renders correctly, but only after a page refresh.

**Root Cause**: 
1. `onRefreshChain()` is called repeatedly during polling
2. This updates the `chain` prop from parent
3. The effect that syncs messages from `chain.renders` runs on every `chain` update
4. During generation, we have local messages (user message + generating assistant message) that aren't in `chain.renders` yet
5. The effect **replaces** all messages with only what's in `chain.renders`, wiping out local generating messages
6. This causes the UI to show empty/previous state until the render completes

## Solution

### 1. Prevent Message Reset During Generation
**Location**: Lines 770-860

**Before**: Messages were always replaced with `chain.renders` data
```typescript
// Always regenerate messages from chain.renders (single source of truth)
const newMessages = convertRendersToMessages(chain.renders);
setMessages(newMessages); // ❌ Wipes out local generating messages
```

**After**: Merge messages when generating, replace when not
```typescript
const isCurrentlyGenerating = isGenerating || isImageGenerating || isVideoGenerating || isRecovering;

if (isCurrentlyGenerating) {
  // Merge: keep local generating messages, update completed renders
  // Preserves user message + generating assistant message
} else {
  // Safe to replace when not generating
}
```

### 2. Prevent Initialization During Generation
**Location**: Lines 704-745

**Before**: Initialization could run during generation, resetting state

**After**: Skip initialization if generating
```typescript
if (isGenerating || isImageGenerating || isVideoGenerating || isRecovering) {
  logger.log('⚠️ UnifiedChatInterface: Skipping initialization - generation in progress');
  return;
}
```

### 3. Fixed Polling Logic
**Location**: Lines 862-900

**Before**: Polling effect recreated interval on every `chain.renders` change, causing excessive refreshes

**After**: 
- Single interval that checks refs (not closure values)
- Separate effect to update processing ref
- Prevents interval recreation on every chain update

### 4. Message Merging Logic
**Location**: Lines 790-826

**New Logic**:
1. Keep local messages that are generating or don't have renders yet
2. Update completed renders with latest data from chain
3. Add new renders from chain that aren't in local messages
4. Preserves user input and generating state

## Testing

**Before Fix**:
- Send render → Chat clears → Shows previous state → Image appears after refresh

**After Fix**:
- Send render → Chat shows user message + generating indicator → Image appears seamlessly

## Impact

- ✅ No more chat clearing during generation
- ✅ Messages persist during render generation
- ✅ Smooth UI updates without page refresh
- ✅ Reduced excessive polling/refreshing
- ✅ Better mobile performance

## Files Changed

- `components/chat/unified-chat-interface.tsx`
  - Lines 704-745: Initialization effect
  - Lines 770-860: Chain.renders sync effect
  - Lines 862-900: Polling logic

