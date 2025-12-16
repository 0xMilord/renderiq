# Agent Mode Fixes

**Date**: 2025-01-XX  
**Status**: ✅ Fixed  
**Issues**: 
1. Image generation placeholder showing in agent mode
2. Duplicate messages when sending to agent

---

## Problem 1: Image Generation Placeholder Showing in Agent Mode

### Issue
In agent mode, when sending a message, the shimmer/placeholder with progress bar was showing even though no image generation was happening. Agent messages should only show text.

### Root Cause
The shimmer placeholder was shown whenever `message.isGenerating` was true, regardless of whether it was an agent message or image generation message.

### Solution
**File**: `components/chat/unified-chat-interface.tsx` (line ~3556)

**Before**:
```typescript
{message.isGenerating && (
  <div className="mt-3 space-y-3">
    {/* Image skeleton with shimmer */}
  </div>
)}
```

**After**:
```typescript
{/* ✅ FIX: Only show image generation placeholder if message has render (not agent messages) */}
{message.isGenerating && message.render && (
  <div className="mt-3 space-y-3">
    {/* Image skeleton with shimmer */}
  </div>
)}
```

Now the placeholder only shows for image generation messages (which have a `render`), not for agent messages (which are text-only).

---

## Problem 2: Duplicate Messages When Sending to Agent

### Issue
When sending a message in agent mode, the message appeared twice in the chat, and the agent processed it twice.

### Root Cause
1. In `handleSendMessage` (line ~1834), when agent mode was detected, it added a user message to the chat store
2. Then `agent.prompt()` was called, which added the prompt to the agent's chat history
3. In `use-renderiq-agent.ts` (line ~175), when the agent's chat history updated, it synced the prompt back to the chat store
4. This caused the message to appear twice

### Solution

**File**: `components/chat/unified-chat-interface.tsx` (line ~1830)

**Before**:
```typescript
if (routingDecision.mode === 'agent' && agent) {
  const agentPrompt = routingDecision.agentPrompt || inputValue;
  
  // Add user message
  const agentUserMessage: Message = {
    id: `user-${Date.now()}`,
    type: 'user',
    content: inputValue,
    timestamp: new Date(),
  };
  addMessage(agentUserMessage);
  
  // Save to database
  saveChatMessage({...});
  
  setInputValue('');
  setIsGenerating(true);
  
  await agent.prompt({...});
  setIsGenerating(false);
}
```

**After**:
```typescript
if (routingDecision.mode === 'agent' && agent) {
  const agentPrompt = routingDecision.agentPrompt || inputValue;
  
  // ✅ FIX: Don't add user message here - let agent's chat history sync handle it
  // This prevents duplicate messages (one from here, one from use-renderiq-agent sync)
  
  setInputValue('');
  // ✅ FIX: Don't set isGenerating for agent mode - agent has its own generating state
  // This prevents image generation placeholder from showing
  
  await agent.prompt({...});
  // ✅ FIX: Don't set isGenerating to false - agent manages its own state
}
```

**Changes**:
1. Removed manual user message addition - let `use-renderiq-agent.ts` handle it via chat history sync
2. Removed `setIsGenerating(true)` - agent has its own generating state
3. Removed `setIsGenerating(false)` - agent manages its own state
4. Removed database save - `use-renderiq-agent.ts` handles that too

---

## Result

- ✅ Agent messages only show text (no image placeholder)
- ✅ No duplicate messages when sending to agent
- ✅ Agent only processes each message once
- ✅ Agent's chat history sync handles message addition and database saving
- ✅ Image generation placeholder only shows for actual image generation

## Files Modified

1. **components/chat/unified-chat-interface.tsx**
   - Fixed shimmer placeholder condition (line ~3556)
   - Removed duplicate message addition in agent mode (line ~1830)
   - Removed isGenerating state management for agent mode

---

## Testing

- [x] Agent messages show only text (no placeholder)
- [x] No duplicate messages when sending to agent
- [x] Agent processes each message only once
- [x] Image generation placeholder still shows for image generation
- [x] Agent chat history syncs correctly

