# Razorpay SDK Load Error Fix

## Issue
Console error: "Failed to load Razorpay SDK: {}" when visiting credit packages page.

## Root Causes

1. **Empty Error Object**: The error event doesn't provide detailed information
2. **CSP Violations**: Content Security Policy might be blocking the script
3. **Network Issues**: Script might fail to load due to network problems
4. **Script Loading Race Conditions**: Multiple components trying to load the script

## Fixes Applied

### 1. Enhanced Error Handling (`components/pricing/credit-packages.tsx`)

**Before:**
```typescript
script.onerror = (error) => {
  console.error('Failed to load Razorpay SDK:', error);
  toast.error('Failed to load payment gateway...');
};
```

**After:**
```typescript
script.onerror = (error) => {
  console.error('Failed to load Razorpay SDK:', error);
  
  const errorDetails = {
    message: error instanceof Error ? error.message : 'Script load failed',
    src: script.src,
    timestamp: new Date().toISOString(),
  };
  console.error('Razorpay script error details:', errorDetails);
  
  // Check if script was blocked
  const scriptElement = document.getElementById('razorpay-checkout-script');
  if (!scriptElement) {
    console.error('Script element was removed or never added - possible CSP violation');
  }
  
  toast.error('Failed to load payment gateway. Please check your internet connection and refresh the page.');
};
```

### 2. Improved CSP Configuration (`next.config.ts`)

**Before:**
```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://checkout.razorpay.com",
```

**After:**
```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://checkout.razorpay.com https://*.razorpay.com",
```

This allows Razorpay scripts from all subdomains.

### 3. Added Script ID and Better Tracking

- Added `id="razorpay-checkout-script"` for easier debugging
- Added console logs to track script loading progress
- Added try-catch around script append to catch DOM errors

### 4. Improved Retry Logic

- Better error messages in retry scenarios
- Consistent script loading in both initial load and retry
- Removed `crossOrigin` attribute (not needed for Razorpay)

## Debugging Steps

If the error persists:

1. **Check Browser Console:**
   - Look for CSP violation errors
   - Check network tab for failed script requests
   - Verify script element exists in DOM

2. **Check Network Tab:**
   - Open DevTools → Network tab
   - Filter by "checkout.js"
   - Check if request returns 200 or is blocked

3. **Verify CSP:**
   - Check browser console for CSP violations
   - Look for messages like "Refused to load the script..."

4. **Check Environment:**
   - Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
   - Check if ad blockers are blocking Razorpay
   - Try in incognito mode

5. **Test Script URL:**
   - Open `https://checkout.razorpay.com/v1/checkout.js` directly in browser
   - Should return JavaScript code, not an error

## Common Issues & Solutions

### Issue: CSP Violation

**Symptoms:**
- Console shows "Refused to load the script..."
- Script element exists but doesn't load

**Solution:**
1. Check `next.config.ts` CSP settings
2. Ensure `https://checkout.razorpay.com` and `https://*.razorpay.com` are allowed
3. Restart Next.js dev server after CSP changes

### Issue: Network Error

**Symptoms:**
- Network tab shows failed request
- Script URL returns error

**Solution:**
1. Check internet connection
2. Verify Razorpay CDN is accessible
3. Check firewall/proxy settings
4. Try accessing script URL directly

### Issue: Ad Blocker

**Symptoms:**
- Script loads but `window.Razorpay` is undefined
- No network errors but SDK not available

**Solution:**
1. Disable ad blockers
2. Add Razorpay to whitelist
3. Test in incognito mode

### Issue: Multiple Script Tags

**Symptoms:**
- Multiple script elements in DOM
- Race conditions

**Solution:**
- Code now checks for existing scripts before creating new ones
- Uses script ID to prevent duplicates

## Verification

After fixes, verify:

1. ✅ Script loads without errors
2. ✅ `window.Razorpay` is available
3. ✅ Buttons are enabled after SDK loads
4. ✅ No CSP violations in console
5. ✅ Network request returns 200

## Related Files

- `components/pricing/credit-packages.tsx` - Main component with fixes
- `next.config.ts` - CSP configuration
- `.env.local` - Environment variables

