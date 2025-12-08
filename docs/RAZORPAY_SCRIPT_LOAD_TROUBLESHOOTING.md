# Razorpay SDK Script Load Troubleshooting Guide

## Error: "Script load failed - network error or CSP violation"

This error occurs when the Razorpay checkout.js script fails to load. Here's how to diagnose and fix it.

## Quick Diagnostic Steps

### 1. Check Browser Console
Open browser DevTools (F12) and check:
- **Console Tab**: Look for CSP violation messages (usually in red)
- **Network Tab**: Filter by "checkout.js" and check if request is:
  - Blocked (red/canceled)
  - Failed (4xx/5xx status)
  - Pending (timeout)

### 2. Check CSP Violations
Look for messages like:
```
Refused to load the script 'https://checkout.razorpay.com/v1/checkout.js' because it violates the following Content Security Policy directive: "script-src ..."
```

### 3. Test Script URL Directly
Open in browser: `https://checkout.razorpay.com/v1/checkout.js`
- Should return JavaScript code
- If blocked/error, it's a network/firewall issue

## Common Causes & Solutions

### Cause 1: CSP (Content Security Policy) Blocking
**Symptoms:**
- Console shows CSP violation message
- Script element exists in DOM but doesn't load
- Error mentions "Content Security Policy"

**Solution:**
1. Verify CSP in `next.config.ts` includes:
   ```
   script-src 'self' ... https://checkout.razorpay.com https://*.razorpay.com https://razorpay.com
   ```

2. Check if CSP headers are actually being applied:
   - Open DevTools → Network tab
   - Select any request
   - Check Response Headers for `Content-Security-Policy`

3. **Restart Next.js dev server** after CSP changes (CSP is cached)

### Cause 2: Ad Blocker / Browser Extension
**Symptoms:**
- Script loads but `window.Razorpay` is undefined
- No network errors in console
- Works in incognito mode

**Solution:**
1. Disable ad blockers (uBlock Origin, AdBlock Plus, etc.)
2. Disable privacy extensions (Privacy Badger, Ghostery, etc.)
3. Add site to whitelist in ad blocker settings
4. Test in incognito/private mode

### Cause 3: Network / Firewall Issue
**Symptoms:**
- Network tab shows failed/canceled request
- Cannot access `https://checkout.razorpay.com` directly
- Works on different network

**Solution:**
1. Check internet connection
2. Check firewall/proxy settings
3. Verify corporate network isn't blocking Razorpay
4. Test from different network (mobile hotspot)

### Cause 4: CORS (Cross-Origin) Restrictions
**Symptoms:**
- Network tab shows CORS error
- Error mentions "CORS policy" or "Access-Control"

**Solution:**
- Usually not an issue for script tags (CORS doesn't apply)
- If it is, check browser security settings

### Cause 5: Browser Security Settings
**Symptoms:**
- Only happens in specific browsers
- Works in Chrome but not Firefox/Safari
- User has strict security settings

**Solution:**
1. Check browser security/privacy settings
2. Disable strict tracking protection temporarily
3. Allow scripts from third-party sites

## Verification Steps

### Step 1: Check CSP Headers
```bash
# In browser console or via curl
curl -I http://localhost:3000/pricing
# Look for Content-Security-Policy header
```

### Step 2: Check Script in DOM
```javascript
// In browser console
document.getElementById('razorpay-checkout-script')
// Should return the script element
```

### Step 3: Check Network Request
1. Open DevTools → Network tab
2. Filter: "checkout.js"
3. Check request status:
   - ✅ 200 OK = Script loaded
   - ❌ Blocked = CSP/Ad blocker
   - ❌ Failed = Network issue
   - ⏳ Pending = Timeout

### Step 4: Check window.Razorpay
```javascript
// In browser console
window.Razorpay
// Should return function/object
// If undefined, script loaded but not initialized
```

## Current CSP Configuration

Our CSP in `next.config.ts` includes:
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://checkout.razorpay.com https://*.razorpay.com https://razorpay.com
```

This should allow Razorpay scripts. If still blocked:
1. Verify CSP is actually applied (check response headers)
2. Check for conflicting CSP headers (middleware, server, etc.)
3. Some browsers don't support wildcards - try explicit domains

## Debugging Commands

### In Browser Console
```javascript
// Check if script exists
document.getElementById('razorpay-checkout-script')

// Check if Razorpay is loaded
window.Razorpay

// Test script URL
fetch('https://checkout.razorpay.com/v1/checkout.js', {mode: 'no-cors'})
  .then(() => console.log('URL accessible'))
  .catch(e => console.error('URL blocked:', e))
```

## Temporary Workaround

If CSP is blocking, temporarily disable CSP for testing:
1. Comment out CSP header in `next.config.ts`
2. Restart dev server
3. Test if script loads
4. If it works, CSP is the issue - fix CSP rules
5. Re-enable CSP with correct rules

## Production Considerations

In production:
1. CSP is critical for security - don't disable it
2. Use explicit domains instead of wildcards if possible
3. Test with different browsers/devices
4. Monitor error logs for CSP violations
5. Consider using CSP reporting endpoint

## Next Steps

If issue persists:
1. Check browser console for specific error messages
2. Check Network tab for request details
3. Test in incognito mode (rules out extensions)
4. Test on different network
5. Check Razorpay status page: https://status.razorpay.com/







