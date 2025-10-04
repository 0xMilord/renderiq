# Production Fix Guide - Sharp Module Error

## 🚨 Issue Summary

**Error:** Pages returning 500 errors (`/chat`, `/dashboard/projects`)  
**Root Cause:** Sharp module loading failure with Turbopack in production  
**Status:** FIXED - Deploy required

---

## ✅ Fixes Applied

### 1. Removed Turbopack from Production Build
**Changed:** `package.json`
```json
// Before
"build": "next build --turbopack --no-lint"

// After
"build": "next build --no-lint"
```

**Why:** Turbopack is experimental and causes Sharp to fail on Vercel's linux-x64 runtime.

### 2. Downgraded Sharp Version
**Changed:** `package.json`
```json
// Before
"sharp": "^0.34.4"

// After
"sharp": "^0.33.5"
```

**Why:** Version 0.33.5 is more stable with Next.js 15 on Vercel.

---

## 🚀 Deploy Fix

### Step 1: Clean Install Dependencies
```bash
# Remove old dependencies
rm -rf node_modules package-lock.json

# Fresh install
npm install
```

### Step 2: Test Locally
```bash
# Test production build
npm run build
npm start

# Visit these pages to verify:
# - http://localhost:3000/chat
# - http://localhost:3000/dashboard/projects
```

### Step 3: Deploy to Vercel
```bash
git add package.json package-lock.json
git commit -m "fix: remove turbopack from production build - fixes sharp error"
git push origin production
```

### Step 4: Verify in Production
After deployment, check:
- ✅ https://arqihive.com/chat
- ✅ https://arqihive.com/dashboard/projects
- ✅ Check Vercel logs for Sharp errors

---

## 🔍 How to Monitor Production Issues

### 1. Check Vercel Logs
```bash
# Install Vercel CLI
npm i -g vercel

# View real-time logs
vercel logs arqihive.com --follow

# View last 100 logs
vercel logs arqihive.com -n 100
```

**Or via Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by "Errors" to see only failures

### 2. Add Error Monitoring Service

**Option A: Vercel Speed Insights (Free)**
```bash
npm install @vercel/speed-insights
```

```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**Option B: Sentry (Recommended)**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 3. Add Server-Side Error Logging

Create `app/error.tsx`:
```tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to your monitoring service
    console.error('Client Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}
```

Create `app/global-error.tsx`:
```tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
```

### 4. Check Which Pages Use Images

**Pages that may use Sharp:**
- `/chat` - Likely uses `next/image`
- `/dashboard/projects` - Project cards with images

**Verify image usage:**
```bash
# Find all next/image usage
grep -r "next/image" app/
grep -r "Image from" components/
```

---

## 🎯 Why These Pages Failed

### Working Pages
- ✅ `/` - No SSR image optimization
- ✅ `/gallery` - Uses client-side rendering
- ✅ `/dashboard` - Simple stats, no heavy images

### Failing Pages  
- ❌ `/chat` - SSR page + uses images + Sharp failure
- ❌ `/dashboard/projects` - SSR page + project images + Sharp failure

**Root Cause:**
1. Pages are Server-Side Rendered (SSR)
2. They import components using `next/image`
3. Sharp module fails to load on server
4. Entire page crashes with 500 error

---

## 🛠️ Alternative: Disable Image Optimization Temporarily

If the fix above doesn't work, disable image optimization:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // ⚠️ Temporary workaround
    domains: ['arqihive.com', 'ncfgivjhkvorikuebtrl.supabase.co'],
  },
  // ... rest of config
}
```

**Note:** This will make images larger but will fix the 500 errors.

---

## 📊 Monitoring Checklist

After deploying, monitor these metrics:

### Immediate (First Hour)
- [ ] No 500 errors in Vercel logs
- [ ] `/chat` page loads successfully
- [ ] `/dashboard/projects` loads successfully
- [ ] Check Sharp-related errors (should be zero)

### Short-term (First Day)
- [ ] Response times are normal (< 1s)
- [ ] No increase in error rate
- [ ] Database queries performing well
- [ ] Memory usage is stable

### Long-term (Weekly)
- [ ] Monitor Vercel analytics for errors
- [ ] Check database performance metrics
- [ ] Review slow API endpoints
- [ ] Monitor user complaints

---

## 🔧 Debugging Commands

### Check Build Locally
```bash
# Clean build
rm -rf .next
npm run build

# Check for Sharp errors in build output
npm run build 2>&1 | grep -i sharp
```

### Check Sharp Installation
```bash
# Verify Sharp is installed
npm list sharp

# Reinstall Sharp with platform-specific binaries
npm install --platform=linux --arch=x64 sharp
```

### Check Next.js Image Config
```bash
# Verify image domains are correct
grep -A 10 "images:" next.config.ts
```

---

## 📝 Quick Reference

### Error Patterns to Watch

**Sharp Loading Error:**
```
Error: Could not load the "sharp" module using the linux-x64 runtime
```
**Fix:** Remove Turbopack from production build ✅

**Database Connection Error:**
```
Error: Failed to initialize database connection
```
**Fix:** Check `DATABASE_URL` in Vercel env vars

**Supabase Auth Error:**
```
Error: Authentication failed
```
**Fix:** Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🎉 Expected Results

After deploying these fixes:

1. **`/chat` page:** Should load without 500 errors
2. **`/dashboard/projects` page:** Should display project cards
3. **Vercel logs:** No Sharp-related errors
4. **Performance:** Same or better (database optimizations applied)

---

## 🆘 If Issues Persist

### 1. Check Environment Variables
```bash
# Via Vercel CLI
vercel env ls

# Required vars:
# - DATABASE_URL
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - GOOGLE_GENERATIVE_AI_API_KEY
```

### 2. Force Rebuild
```bash
# In Vercel dashboard
# Deployments > Latest deployment > ... > Redeploy
```

### 3. Check Build Logs
Look for these in Vercel build logs:
- ✅ "Collecting page data"
- ✅ "Generating static pages"
- ❌ Any "Error:" lines

### 4. Rollback if Needed
```bash
# In Vercel dashboard
# Deployments > Previous working deployment > Promote to Production
```

---

## 📚 Additional Resources

- **Vercel Sharp Guide:** https://vercel.com/docs/image-optimization/managing-image-optimization-costs
- **Next.js Image Docs:** https://nextjs.org/docs/app/building-your-application/optimizing/images
- **Sharp Installation:** https://sharp.pixelplumbing.com/install

---

**Status:** Ready to deploy  
**ETA:** 5 minutes for Vercel build + deploy  
**Risk:** Low - Only removing experimental flag and downgrading Sharp

