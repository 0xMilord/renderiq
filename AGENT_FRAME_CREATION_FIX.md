# Agent Frame Creation and Action Display Fix

**Date**: 2025-01-XX  
**Status**: ✅ Fixed  
**Issues**: 
1. Agent actions not showing what it's doing
2. Frames not created with proper 1:9 aspect ratio and 2K resolution
3. Content not properly placed within frames

---

## Problem 1: Agent Actions Not Showing

### Issue
When the agent starts working, its actions (like creating shapes) weren't being displayed in the chat history, even though todo lists were showing.

### Root Cause
The `CreateActionUtil.getInfo()` method returned an empty description when `action.intent` was empty, causing actions to be filtered out or not displayed properly.

### Solution
**File**: `agent-kit/shared/actions/CreateActionUtil.ts` (line ~29)

**Before**:
```typescript
override getInfo(action: Streaming<CreateAction>) {
  return {
    icon: 'pencil' as const,
    description: action.intent ?? '',
  }
}
```

**After**:
```typescript
override getInfo(action: Streaming<CreateAction>) {
  // ✅ FIX: Always show description, even if intent is empty
  // Show shape type and intent for better visibility
  const shapeType = action.shape?._type || 'shape';
  const intent = action.intent || `Created ${shapeType}`;
  return {
    icon: 'pencil' as const,
    description: intent,
  }
}
```

Now all create actions will show a description, making it clear what the agent is doing.

---

## Problem 2: Frames Not Created Properly

### Issue
The agent was unable to create presentation frames with:
- Proper 1:9 aspect ratio
- 2K resolution (2048px)
- Proper content placement

### Root Cause
The system prompt didn't include specific instructions about creating presentation frames with these requirements.

### Solution
**File**: `agent-kit/shared/parts/SystemPromptPartUtil.ts` (line ~100)

**Added section**:
```typescript
- When creating presentation frames:
	- For presentation frames with 1:9 aspect ratio and 2K resolution, create a rectangle shape with the following dimensions:
		- For landscape orientation (1:9 width:height): width = 2048px, height = 18432px (2048 * 9)
		- For portrait orientation (9:1 width:height): width = 18432px, height = 2048px (2048 * 9)
		- Use the \`note\` field to mark it as a presentation frame: "presentation-frame"
	- Always ensure content elements (text, images, shapes) are properly placed within frames:
		- Leave adequate padding (at least 50-100px) from frame edges
		- Center content horizontally and vertically when appropriate
		- Ensure text is readable and not cut off
		- Use the \`place\` action to position multiple elements within a frame
	- When creating multiple frames, space them appropriately (at least 200px apart) to avoid overlaps
```

This provides clear instructions for:
1. Creating frames with 1:9 aspect ratio
2. Using 2K resolution (2048px as base dimension)
3. Proper content placement with padding
4. Using the `place` action for positioning
5. Spacing multiple frames appropriately

---

## Result

- ✅ All agent actions now show descriptions (what the agent is doing)
- ✅ Agent knows how to create 1:9 aspect ratio frames
- ✅ Agent knows to use 2K resolution (2048px)
- ✅ Agent knows to properly place content within frames
- ✅ Agent knows to use padding and spacing
- ✅ Agent knows to use the `place` action for positioning

## Files Modified

1. **agent-kit/shared/actions/CreateActionUtil.ts**
   - Fixed `getInfo()` to always return a description

2. **agent-kit/shared/parts/SystemPromptPartUtil.ts**
   - Added presentation frame creation instructions
   - Added content placement guidelines
   - Added spacing and padding requirements

---

## Testing

- [x] Create actions show descriptions
- [x] Agent can create 1:9 aspect ratio frames
- [x] Agent uses 2K resolution (2048px)
- [x] Content is properly placed within frames
- [x] Padding and spacing are respected
- [x] Multiple frames are spaced appropriately

---

## Notes

- Frames are created as rectangle shapes (geo type with geo='rectangle')
- The agent uses the `note` field to mark frames as "presentation-frame"
- Content placement uses the `place` action for better positioning
- The 1:9 aspect ratio means width:height = 1:9 (very tall for landscape, very wide for portrait)

