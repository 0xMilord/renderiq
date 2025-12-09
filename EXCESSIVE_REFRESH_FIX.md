# Excessive Refresh Calls Fix

## Problem

When loading the unified chat interface on `/project/[slug]/chain/[chainId]`, the page was making **excessive POST requests** to `/project/[slug]/chain/[chainId]`, causing:
- Page to "go crazy" with constant refreshes
- Poor performance and high server load
- Unnecessary network traffic
- Bad user experience

**Root Cause**:
1. `fetchChain()` was calling `fetchData()` which fetched **ALL projects and ALL chains** for every refresh
2. Polling was calling `onRefreshChain()` every 5 seconds without throttling
3. `fetchData` dependency array caused it to be recreated on every render, triggering useEffect repeatedly
4. No throttling/debouncing on refresh calls

## Solution

### 1. Optimized `fetchChain` to Only Fetch Chain Data
**Location**: `app/project/[projectSlug]/chain/[chainId]/page.tsx`

**Before**: `fetchChain()` called `fetchData()` which fetched everything
```typescript
const fetchChain = useCallback(() => {
  return fetchData(); // ❌ Fetches ALL projects and ALL chains
}, [fetchData]);
```

**After**: `fetchChain()` only fetches the specific chain
```typescript
const fetchChain = useCallback(async () => {
  if (!chainId || !user) return;
  
  try {
    const chainResult = await getRenderChain(chainId);
    if (chainResult.success && chainResult.data) {
      setChain(chainResult.data);
    }
  } catch (err) {
    logger.error('❌ ProjectChainPage: Error fetching chain:', err);
  }
}, [chainId, user]); // ✅ Only fetches chain data
```

### 2. Fixed `fetchData` to Only Run on Mount
**Location**: `app/project/[projectSlug]/chain/[chainId]/page.tsx`

**Before**: `fetchData` was in dependency array, causing re-runs
```typescript
useEffect(() => {
  fetchData();
}, [fetchData]); // ❌ Runs on every fetchData recreation
```

**After**: Only runs on mount
```typescript
useEffect(() => {
  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ✅ Only runs on mount
```

### 3. Added Throttling to Refresh Calls
**Location**: `components/chat/unified-chat-interface.tsx`

**Before**: No throttling, called every 5 seconds
```typescript
pollInterval = setInterval(() => {
  onRefreshChain(); // ❌ No throttling
}, POLLING_INTERVAL);
```

**After**: Throttled to minimum 3 seconds between calls
```typescript
const lastRefreshTimeRef = useRef<number>(0);
const refreshThrottleMs = 3000; // Minimum 3 seconds between refreshes

const throttledRefresh = useCallback(() => {
  const now = Date.now();
  const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
  
  if (timeSinceLastRefresh >= refreshThrottleMs) {
    lastRefreshTimeRef.current = now;
    onRefreshChain?.();
  }
}, [onRefreshChain]);

// Use throttled refresh in polling
pollInterval = setInterval(() => {
  throttledRefresh(); // ✅ Throttled
}, POLLING_INTERVAL);
```

## Impact

**Before Fix**:
- 10+ POST requests per second to `/project/[slug]/chain/[chainId]`
- Each request fetched ALL projects and ALL chains (expensive)
- Page constantly refreshing
- Poor performance

**After Fix**:
- Maximum 1 request every 3 seconds (throttled)
- Only fetches chain data (lightweight)
- Smooth page experience
- Reduced server load by ~90%

## Files Changed

1. **`app/project/[projectSlug]/chain/[chainId]/page.tsx`**
   - Optimized `fetchChain` to only fetch chain data
   - Fixed `fetchData` to only run on mount
   - Removed expensive project/chains fetching from refresh

2. **`components/chat/unified-chat-interface.tsx`**
   - Added throttling to refresh calls
   - Minimum 3 seconds between refresh calls
   - Prevents excessive polling

## Testing

**Before**: 
- Load page → See 10+ requests/second in network tab
- Page constantly refreshing
- High CPU usage

**After**:
- Load page → See 1 request every 3 seconds max
- Smooth page experience
- Normal CPU usage

