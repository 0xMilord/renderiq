# Container Structure Audit Report - Output Node

## Issue
The outer container wrapper is still visible in the Output Node despite `skipContentWrapper={true}` being set.

## Current Container Hierarchy

### BaseNode Structure (from base-node.tsx)

```
<div className="w-80 bg-card border-2 shadow-lg relative rounded-lg">  // Main container (line 380-383)
  <div className="px-3 py-2 border-b-2 ...">  // Header (line 385-390)
    {/* Title, Icon, Close Button */}
  </div>
  
  <div className="p-3 space-y-2 relative" style="overflow: visible;">  // ⚠️ CONTENT CONTAINER (line 415-420)
    {/* Input Handles - Left Side */}
    {/* Input Handles - Top */}
    {/* Input Handles - Right Side */}
    {/* Input Handles - Bottom */}
    
    {/* Node Content - Properly contained */}
    {skipContentWrapper ? (
      children  // ✅ This wrapper is skipped
    ) : (
      <div className="nodrag nopan w-full">  // ❌ This wrapper is skipped when skipContentWrapper=true
        {children}
      </div>
    )}
    
    {/* Output Handles - Right Side */}
    {/* Output Handles - Bottom */}
    {/* Output Handles - Left Side */}
    {/* Output Handles - Top */}
  </div>
</div>
```

## Problem Identified

**The issue is the Content Container div** at line 415-420:
```tsx
<div className="p-3 space-y-2 relative" style={{ overflow: 'visible' }}>
```

This container:
1. Adds padding (`p-3` = 12px padding on all sides)
2. Adds vertical spacing (`space-y-2` = 0.5rem gap between children)
3. Is always present, regardless of `skipContentWrapper` prop

## Root Cause

The `skipContentWrapper` prop only removes the inner `<div className="nodrag nopan w-full">` wrapper, but **does NOT remove the outer Content Container** that has `p-3 space-y-2 relative` classes.

## Solution Options

### Option 1: Add `skipContentPadding` prop (Recommended)
Add a new prop to also skip the Content Container padding and spacing:

```tsx
interface BaseNodeProps {
  // ... existing props
  skipContentWrapper?: boolean;
  skipContentPadding?: boolean; // ✅ NEW: Skip the p-3 space-y-2 container
}
```

Then conditionally render:
```tsx
{skipContentPadding ? (
  <div className="relative" style={{ overflow: 'visible' }}>
    {/* Handles and content */}
  </div>
) : (
  <div className="p-3 space-y-2 relative" style={{ overflow: 'visible' }}>
    {/* Handles and content */}
  </div>
)}
```

### Option 2: Make `skipContentWrapper` also skip padding
When `skipContentWrapper={true}`, also remove the padding container:

```tsx
{skipContentWrapper ? (
  <div className="relative" style={{ overflow: 'visible' }}>
    {/* Handles */}
    {children}
    {/* Handles */}
  </div>
) : (
  <div className="p-3 space-y-2 relative" style={{ overflow: 'visible' }}>
    {/* Handles */}
    <div className="nodrag nopan w-full">
      {children}
    </div>
    {/* Handles */}
  </div>
)}
```

### Option 3: Remove padding container entirely for output node
Check nodeType and conditionally apply padding:

```tsx
const hasContentPadding = nodeType !== 'output';
<div className={cn('relative', hasContentPadding && 'p-3 space-y-2')} style={{ overflow: 'visible' }}>
```

## Recommended Fix

**✅ IMPLEMENTED: Option 1** - Added `skipContentPadding` prop for maximum flexibility:
- Output node can skip both wrapper and padding
- Other nodes can still use padding if needed
- Maintains backward compatibility

## Files Modified

1. ✅ `components/canvas/nodes/base-node.tsx`
   - Added `skipContentPadding?: boolean` to `BaseNodeProps`
   - Conditionally render Content Container with/without padding using `cn()` utility
   - Changed: `<div className="p-3 space-y-2 relative">` → `<div className={cn('relative', !skipContentPadding && 'p-3 space-y-2')}>`
   
2. ✅ `components/canvas/nodes/output-node.tsx`
   - Added `skipContentPadding={true}` to BaseNode props

## Implementation Details

### Before:
```tsx
<div className="p-3 space-y-2 relative" style={{ overflow: 'visible' }}>
  {skipContentWrapper ? (
    children
  ) : (
    <div className="nodrag nopan w-full">{children}</div>
  )}
</div>
```

### After:
```tsx
<div className={cn('relative', !skipContentPadding && 'p-3 space-y-2')} style={{ overflow: 'visible' }}>
  {skipContentWrapper ? (
    children
  ) : (
    <div className="nodrag nopan w-full">{children}</div>
  )}
</div>
```

## Testing Checklist

- [x] Output node has no outer padding container
- [x] Output node content is directly inside the main container
- [x] Handles are still properly positioned (relative positioning maintained)
- [x] Other nodes (image, variants, text) still have proper padding (default behavior)
- [x] No visual regressions in other nodes

## Status: ✅ FIXED

The outer container wrapper issue has been resolved. The output node now has:
- No padding container (`skipContentPadding={true}`)
- No inner wrapper div (`skipContentWrapper={true}`)
- Content directly inside the main container
- Handles still properly positioned with `relative` positioning

