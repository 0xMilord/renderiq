# OAuth Redirect URL Audit Report

## Issue
OAuth is still linking to "arqihive" despite environment variables being set to "Renderiq".

## Audit Date
2025-01-27

## Codebase Analysis

### ✅ Code Implementation Status

#### 1. OAuth Redirect Utility (`lib/utils/auth-redirect.ts`)
- **Status**: ✅ Correctly implemented
- **Function**: `getOAuthCallbackUrl()` constructs callback URLs
- **Logic**: 
  - Development: Uses `localhost:3000`
  - Production: Uses `NEXT_PUBLIC_SITE_URL` or falls back to `https://renderiq.io`
- **No hardcoded "arqihive" references found**

#### 2. OAuth Sign-In (`lib/services/auth.ts`)
- **Status**: ✅ Correctly using utility function
- **Line 209**: Uses `getOAuthCallbackUrl(request, '/', origin)`
- **No hardcoded "arqihive" references found**

#### 3. Email Redirect (`lib/services/auth.ts`)
- **Status**: ⚠️ **ISSUE FOUND**
- **Line 116**: Direct use of `process.env.NEXT_PUBLIC_SITE_URL` without utility function
- **Problem**: Doesn't handle development mode properly
- **Fix Required**: Use `getOAuthCallbackUrl()` or `getAuthRedirectUrl()`

#### 4. QR Signup Route (`app/api/qr-signup/route.ts`)
- **Status**: ✅ Correctly using utility functions
- **Line 40**: Uses `getOAuthCallbackUrl(request, '/dashboard')`
- **No hardcoded "arqihive" references found**

#### 5. Auth Callback Route (`app/auth/callback/route.ts`)
- **Status**: ✅ Correctly using utility function
- **Line 66**: Uses `getPostAuthRedirectUrl(request, next)`
- **No hardcoded "arqihive" references found**

### 🔍 Environment Variables Check

#### Required Variables:
1. `NEXT_PUBLIC_SITE_URL` - Production site URL
2. `NEXT_PUBLIC_BASE_URL` - Base URL for metadata (fallback: `https://renderiq.io`)
3. `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

#### Code References:
- `lib/utils/auth-redirect.ts:59` - Uses `NEXT_PUBLIC_SITE_URL` (fallback: `https://renderiq.io`)
- `lib/services/auth.ts:116` - Uses `NEXT_PUBLIC_SITE_URL` directly
- `app/layout.tsx:25,74` - Uses `NEXT_PUBLIC_BASE_URL` (fallback: `https://renderiq.io`)

### 🚨 Root Cause Analysis

The issue is **NOT in the codebase**. The code correctly:
1. Uses utility functions to construct redirect URLs
2. Falls back to `https://renderiq.io` if env vars are not set
3. Has no hardcoded "arqihive" references

**The problem is likely in Supabase Dashboard configuration:**

#### Supabase Dashboard Settings to Check:

1. **Authentication > URL Configuration**
   - Site URL: Should be `https://renderiq.io` (or your production URL)
   - Redirect URLs: Must include:
     - `https://renderiq.io/auth/callback`
     - `https://renderiq.io/auth/callback?next=*`
     - `http://localhost:3000/auth/callback` (for development)
     - **Remove any URLs containing "arqihive"**

2. **Authentication > Providers > Google**
   - Authorized redirect URIs in Google OAuth Console must include:
     - `https://[your-supabase-project].supabase.co/auth/v1/callback`
     - **Check Google OAuth Console for any "arqihive" references**

3. **Authentication > Providers > GitHub**
   - Authorized redirect URIs in GitHub OAuth App must include:
     - `https://[your-supabase-project].supabase.co/auth/v1/callback`
     - **Check GitHub OAuth App settings for any "arqihive" references**

### 📋 Action Items

#### Code Fixes:
1. ✅ Fix email redirect URL in `lib/services/auth.ts:116` to use utility function
2. ✅ Verify all redirect URLs use centralized utility functions

#### Supabase Dashboard Fixes (Manual):
1. ⚠️ **Go to Supabase Dashboard > Authentication > URL Configuration**
   - Update Site URL to `https://renderiq.io`
   - Review and update Redirect URLs list
   - **Remove all URLs containing "arqihive"**
   - Add `https://renderiq.io/auth/callback` if not present

2. ⚠️ **Check Google OAuth Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Credentials
   - Find your OAuth 2.0 Client ID
   - Check "Authorized redirect URIs"
   - **Remove any "arqihive" URLs**
   - Ensure Supabase callback URL is present

3. ⚠️ **Check GitHub OAuth App Settings**
   - Go to GitHub > Settings > Developer settings > OAuth Apps
   - Find your OAuth app
   - Check "Authorization callback URL"
   - **Remove any "arqihive" URLs**
   - Ensure Supabase callback URL is present

### 🔧 Code Fixes Applied

1. **Fixed email redirect URL** (`lib/services/auth.ts:116`)
   - Changed from direct `process.env.NEXT_PUBLIC_SITE_URL` usage
   - Now uses `getAuthRedirectUrl()` utility function
   - Properly handles development and production modes

### 📝 Verification Steps

After applying fixes:

1. **Check environment variables in production:**
   ```bash
   # Verify these are set correctly
   echo $NEXT_PUBLIC_SITE_URL
   echo $NEXT_PUBLIC_BASE_URL
   ```

2. **Test OAuth flow:**
   - Try Google OAuth sign-in
   - Check browser network tab for redirect URLs
   - Verify callback URL contains "Renderiq" not "arqihive"

3. **Check Supabase logs:**
   - Go to Supabase Dashboard > Logs > Auth Logs
   - Look for redirect URL errors
   - Verify redirect URLs are correct

4. **Test email verification:**
   - Sign up with email
   - Check verification email link
   - Verify it points to "renderiq.io" not "arqihive"

### 🎯 Summary

- **Code Status**: ✅ Mostly correct, one minor fix applied
- **Root Cause**: Supabase Dashboard configuration (not code)
- **Action Required**: Update Supabase Dashboard settings manually
- **Priority**: High - OAuth will fail until Supabase settings are updated

### 📌 Notes

- The codebase has no hardcoded "arqihive" references
- All redirect URLs are constructed dynamically
- The issue is in external configuration (Supabase Dashboard, OAuth providers)
- Environment variables must be set correctly in production
- Supabase Dashboard must have correct redirect URLs whitelisted

