# Quick Setup: URL Masking for Auth Links

**Goal**: Use `auth.renderiq.io` instead of `projectid.supabase.co` in verification emails

---

## ✅ What's Already Done

1. ✅ URL masking utility created (`lib/utils/url-masker.ts`)
2. ✅ All email generation uses masked URLs
3. ✅ Middleware proxy created (`middleware.ts`)
4. ✅ API proxy route created (`app/api/auth-proxy/[...path]/route.ts`)

---

## 🚀 Setup Steps (5 minutes)

### Step 1: Disable Supabase Emails (Stop Duplicates)

1. Go to: https://supabase.com/dashboard
2. **Authentication** → **Settings** → **Email Auth**
3. Turn OFF **"Enable email confirmations"**
4. Save

### Step 2: Set Up DNS for auth.renderiq.io

#### Option A: Vercel Dashboard (Easiest)

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `auth.renderiq.io`
4. Follow DNS instructions (usually CNAME)

#### Option B: Manual DNS

Add to your domain DNS:
```
Type: CNAME
Name: auth
Value: [your-vercel-app].vercel.app
TTL: 3600
```

### Step 3: Test

1. Sign up with test email
2. Check verification email - should show `auth.renderiq.io`
3. Click link - should work correctly

---

## 📋 What Gets Masked

All these URLs will use `auth.renderiq.io`:
- ✅ Email verification: `/auth/v1/verify?token=...`
- ✅ Password reset: `/auth/v1/verify?token=...&type=recovery`
- ✅ Magic link: `/auth/v1/verify?token=...&type=magiclink`
- ✅ OAuth callbacks: `/auth/v1/callback?code=...`

---

## 🔧 How It Works

```
Original: https://projectid.supabase.co/auth/v1/verify?token=xyz
    ↓ (maskSupabaseUrl)
Masked:   https://auth.renderiq.io/auth/v1/verify?token=xyz
    ↓ (User clicks)
Middleware proxies to Supabase
    ↓
Supabase processes and redirects
```

---

## ⚠️ Important Notes

- DNS propagation can take 24-48 hours
- Test with [whatsmydns.net](https://www.whatsmydns.net)
- Middleware handles the proxying automatically
- No code changes needed after DNS setup

---

## ✅ Done!

After DNS setup, all auth links will automatically use `auth.renderiq.io` 🎉

