# Fix: Supabase CLI Config Issue

**Problem**: CLI can't find template files when running `npx supabase link`

**Error**: `Invalid config for auth.email.template.invite.content_path: open templates\invite.html: The system cannot find the path specified.`

---

## ✅ Solution

The `config.toml` paths are correct. The issue is that **Supabase CLI templates are only for local development**, not production deployment.

### Option 1: Ignore CLI Config for Production (Recommended)

For production, you don't need the CLI config. Just:
1. Copy templates manually to Dashboard (see `QUICK_DEPLOY_TEMPLATES.md`)
2. The `config.toml` is only used for local dev with `supabase start`

### Option 2: Fix Config for Local Dev Only

If you want to use templates locally, the paths are already correct:
- `content_path = "./templates/..."` (relative to `supabase/` directory)

The error might be because templates don't exist when CLI tries to validate. Make sure:
1. All template files exist in `supabase/templates/`
2. Paths in `config.toml` use forward slashes: `./templates/...`

---

## 🎯 What to Do

**For Production Deployment** (what you need):
1. ✅ Templates are ready in `supabase/templates/`
2. ✅ Copy-ready files in `supabase/dashboard-templates/`
3. ✅ Follow `QUICK_DEPLOY_TEMPLATES.md`

**For Local Development** (optional):
- The CLI config is for local Supabase instances
- Run `supabase start` to use templates locally
- Production templates must still be copied manually

---

## ⚠️ Important Note

**Supabase CLI cannot push templates to production.**  
The `config.toml` file is **only** for local development.  
Production templates **must** be copied manually to the Dashboard.

This is a Supabase limitation - there's no API endpoint for email templates.

---

## ✅ Your Templates Are Ready

All 13 templates are prepared and ready to copy:
- ✅ `supabase/templates/*.html` - Source files
- ✅ `supabase/dashboard-templates/*.html` - Copy-ready files
- ✅ `QUICK_DEPLOY_TEMPLATES.md` - Deployment guide

Just copy them to the Dashboard manually - it only takes 15 minutes!

