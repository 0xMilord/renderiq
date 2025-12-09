# Excessive API Calls Fix

## Issues Fixed

### 1. Chain Query Parameter Handling
**Problem**: When navigating to `/render?chain=...`, the page didn't handle the query parameter and showed "project not found".

**Solution**: Added query parameter handling in `app/render/page.tsx` to:
- Check for `chain` query parameter
- Fetch chain data to get projectId
- Fetch project to get slug
- Redirect to proper `/project/{slug}/chain/{chainId}` route

### 2. Excessive API Calls in Hooks
**Problem**: Hooks were making repeated API calls on every render or state change:
- `useCredits` - called on every user change
- `useIsPro` - called on every userId change
- `useProjectRules` - called on every chainId change
- `useProjects` - called on every mount

**Solution**: 
- Created `lib/utils/request-deduplication.ts` utility for request deduplication and caching
- Added 2-second debouncing to prevent rapid successive calls
- Added 5-second cache TTL for completed requests
- Implemented request deduplication to prevent duplicate simultaneous requests

### 3. Unified Chat Interface Optimizations
**Problem**: Unified chat interface was triggering hook re-runs on every render.

**Solution**:
- Memoized profile ID to prevent unnecessary `useIsPro` calls
- Hooks now only re-fetch when their dependencies actually change

## Files Modified

1. `app/render/page.tsx` - Added chain query parameter handling
2. `lib/utils/request-deduplication.ts` - New utility for request deduplication
3. `lib/hooks/use-credits.ts` - Added debouncing and request deduplication
4. `lib/hooks/use-subscription.ts` - Added debouncing and request deduplication
5. `lib/hooks/use-project-rules.ts` - Added debouncing and request deduplication
6. `components/chat/unified-chat-interface.tsx` - Memoized profile ID

## Performance Improvements

- **Request Deduplication**: Multiple components requesting the same data simultaneously now share a single request
- **Caching**: Completed requests are cached for 5 seconds, preventing redundant calls
- **Debouncing**: Rapid successive calls are debounced by 2 seconds
- **Memoization**: Hooks only re-fetch when dependencies actually change

## Testing

To verify the fixes:
1. Navigate to `/render?chain={chainId}` - should redirect to proper project/chain route
2. Monitor network tab - should see fewer duplicate API calls
3. Check console logs - should see debouncing messages when requests are skipped
4. Verify hooks only fetch when dependencies change, not on every render

## Future Improvements

1. Consider increasing cache TTL for stable data (projects, chains)
2. Add request cancellation for stale requests
3. Implement optimistic updates for better UX
4. Add request retry logic with exponential backoff

