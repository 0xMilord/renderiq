# User Messages Not Showing - Fix

**Date**: 2025-01-XX  
**Status**: ✅ Fixed  
**Issue**: User messages from render chat don't show, only agent chat messages show

---

## Problem

User messages saved to the database (messageType: 'render', contentType: 'user') were not appearing in the unified chat interface. Only agent chat messages (messageType: 'agent') were showing.

## Root Cause

In `mergeChatMessages()`, user messages with a `referenceRenderId` were being replaced by render messages from `chain.renders`. The logic was:

1. If a DB message has `render?.id` or `referenceRenderId`, try to find corresponding render message
2. If found, replace DB message with render message
3. This caused user messages to be lost because they were replaced by assistant messages with renders

## Solution

Modified `mergeChatMessages()` to **always preserve user messages**, regardless of whether they have a `referenceRenderId`. User messages are separate entities and should never be replaced by render messages.

### Changes Made

**File**: `lib/utils/load-chat-messages.ts`

1. **Added user message preservation** (lines 170-180):
   ```typescript
   // ✅ CRITICAL FIX: Always preserve user messages, even if they have a referenceRenderId
   // The referenceRenderId is just metadata - the user message should still be shown
   // User messages are NEVER replaced by render messages - they're separate entities
   if (dbMsg.type === 'user') {
     logger.log('✅ mergeChatMessages: Preserving user message from DB', {
       id: dbMsg.id,
       content: dbMsg.content.substring(0, 50),
       hasReferenceRenderId: !!dbMsg.referenceRenderId,
       hasRender: !!dbMsg.render,
     });
     merged.push(dbMsg);
     processedMessageIds.add(dbMsg.id);
     continue;
   }
   ```

2. **Updated assistant message replacement logic** (lines 182-198):
   - Only replace assistant messages with renders, not user messages
   - Check `dbMsg.type === 'assistant'` before attempting replacement

3. **Added detailed logging**:
   - Log user message counts during merge
   - Warn if user messages are lost
   - Log first few user messages for debugging

## How It Works Now

### Message Merging Flow

```
Load from DB
  ↓
Convert to Message format
  ↓
Merge with render messages:
  1. User messages → ALWAYS preserved (never replaced)
  2. Assistant messages with renders → Replaced with full render data if available
  3. Agent messages → Preserved as-is
  4. New renders → Added if not in DB
  ↓
Sort by timestamp
  ↓
Display in UI ✅
```

### Message Types Handled

1. **User Messages (render chat)**:
   - messageType: 'render', contentType: 'user'
   - ✅ Always preserved, even with referenceRenderId
   - Never replaced by render messages

2. **User Messages (agent chat)**:
   - messageType: 'agent', contentType: 'prompt'
   - ✅ Always preserved
   - Never replaced

3. **Assistant Messages (render chat)**:
   - messageType: 'render', contentType: 'assistant'
   - Replaced with full render data from chain.renders if available
   - Preserved if no render data available

4. **Agent Messages**:
   - messageType: 'agent', contentType: 'message' | 'action'
   - ✅ Always preserved as-is

## Testing

- [x] User messages from render chat appear correctly
- [x] User messages with referenceRenderId are preserved
- [x] Agent chat messages still appear
- [x] Render messages are merged correctly
- [x] Message ordering is correct

## Files Modified

1. **lib/utils/load-chat-messages.ts**
   - Added user message preservation logic
   - Updated assistant message replacement logic
   - Added detailed logging

## Related Issues

- ✅ User messages don't show (FIXED)
- ✅ Messages don't appear without refresh (FIXED in previous commit)
- ⚠️ State sync gap (partially addressed)

---

## Conclusion

User messages are now always preserved during the merge process, ensuring they appear in the unified chat interface. The fix ensures that user messages are never replaced by render messages, as they are separate entities in the conversation flow.

