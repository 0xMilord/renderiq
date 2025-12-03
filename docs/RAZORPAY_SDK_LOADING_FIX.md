# Razorpay SDK Loading Fix

## Issue
When navigating to the credit tab on `/pricing`, users were seeing a console error: "Failed to load Razorpay SDK" without any user-friendly feedback.

## Root Causes

1. **Silent Error Handling**: Script loading errors were only logged to console, not shown to users
2. **Missing Window Checks**: SSR safety checks were missing, causing potential hydration issues
3. **Poor Button State Management**: Buttons weren't properly disabled when SDK wasn't loaded
4. **No User Feedback**: Users had no indication that the payment gateway was loading or failed

## Fixes Applied

### 1. Improved Error Handling (`components/pricing/credit-packages.tsx`)

**Before:**
```typescript
script.onerror = () => {
  console.error('Failed to load Razorpay SDK');
  setRazorpayLoaded(true); // Wrong - enables buttons even on error
};
```

**After:**
```typescript
script.onerror = (error) => {
  console.error('Failed to load Razorpay SDK:', error);
  toast.error('Failed to load payment gateway. Please check your internet connection and refresh the page.', {
    duration: 5000,
  });
  // Don't set loaded to true - buttons will be disabled
};
```

### 2. Added SSR Safety Checks

**Before:**
```typescript
if (window.Razorpay) {
  setRazorpayLoaded(true);
}
```

**After:**
```typescript
if (typeof window !== 'undefined' && window.Razorpay) {
  setRazorpayLoaded(true);
}
```

### 3. Improved Script Loading

- Added `crossOrigin = 'anonymous'` for better CSP compliance
- Better timeout handling - doesn't enable buttons on timeout
- Improved script detection logic

### 4. Enhanced Button State Management

**Before:**
```typescript
<Button
  disabled={loading === pkg.id}
  title={!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'Payment gateway not configured' : ''}
>
```

**After:**
```typescript
<Button
  disabled={loading === pkg.id || !razorpayLoaded || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
  title={
    !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID 
      ? 'Payment gateway not configured' 
      : !razorpayLoaded 
        ? 'Payment gateway is loading...' 
        : ''
  }
>
  {!razorpayLoaded ? (
    <>
      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
      <span>Loading...</span>
    </>
  ) : (
    <span>Buy Now</span>
  )}
</Button>
```

### 5. Better Retry Logic in Purchase Handler

- Improved error messages with toast notifications
- Better handling when SDK isn't available
- Retry logic with user feedback

## User Experience Improvements

1. **Clear Error Messages**: Users now see toast notifications when SDK fails to load
2. **Loading States**: Buttons show "Loading..." state while SDK is loading
3. **Proper Disabled State**: Buttons are disabled until SDK is ready
4. **Helpful Tooltips**: Tooltips explain why buttons are disabled

## Testing Checklist

- [x] Script loads successfully on page load
- [x] Error toast appears if script fails to load
- [x] Buttons are disabled until SDK is loaded
- [x] Loading state shows while SDK is loading
- [x] Buttons work correctly after SDK loads
- [x] Retry logic works if SDK fails initially
- [x] No SSR hydration errors

## Common Issues & Solutions

### Issue: "Failed to load Razorpay SDK" error

**Possible Causes:**
1. Network connectivity issues
2. CSP (Content Security Policy) blocking the script
3. Razorpay CDN is down
4. Ad blockers blocking the script

**Solutions:**
1. Check internet connection
2. Verify CSP settings in `next.config.ts` allow `https://checkout.razorpay.com`
3. Check browser console for CSP violations
4. Try disabling ad blockers
5. Refresh the page

### Issue: Buttons stay disabled

**Possible Causes:**
1. `NEXT_PUBLIC_RAZORPAY_KEY_ID` not set
2. Script failed to load
3. SDK not initializing properly

**Solutions:**
1. Check `.env.local` has `NEXT_PUBLIC_RAZORPAY_KEY_ID` set
2. Restart Next.js dev server after adding env variable
3. Check browser console for errors
4. Verify script tag is in DOM: `document.querySelector('script[src*="razorpay"]')`

## Verification Steps

1. **Check Environment Variable:**
   ```bash
   # In .env.local
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_here
   ```

2. **Verify Script Loading:**
   - Open browser DevTools → Network tab
   - Navigate to `/pricing` → Credits tab
   - Look for `checkout.js` request
   - Should return 200 status

3. **Check Console:**
   - Should see no errors
   - `window.Razorpay` should be available after script loads

4. **Test Button States:**
   - Initially: Button shows "Loading..." and is disabled
   - After load: Button shows "Buy Now" and is enabled
   - On error: Toast error appears, button stays disabled

## Related Files

- `components/pricing/credit-packages.tsx` - Main component with fixes
- `next.config.ts` - CSP configuration
- `.env.local` - Environment variables

## Next Steps

If issues persist:
1. Check browser console for detailed errors
2. Verify CSP headers aren't blocking the script
3. Test in incognito mode (to rule out extensions)
4. Check Razorpay status page: https://status.razorpay.com

