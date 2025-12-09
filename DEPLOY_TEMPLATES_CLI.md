# Deploy Supabase Email Templates via CLI

**Date**: 2025-01-27  
**Status**: ✅ READY

---

## Quick Deploy

The `supabase/config.toml` file is now configured with correct paths. Templates will be used for **local development** only.

### For Production (Dashboard)

**Important**: Supabase CLI templates are for local dev only. For production, you must copy templates manually to Dashboard.

---

## Step 1: Link Project (If Not Already Done)

```bash
npx supabase link --project-ref ncfgivjhkvorikuebtrl
```

---

## Step 2: Test Config (Local Development)

```bash
# Start local Supabase (uses templates from config.toml)
npx supabase start
```

This will use your custom templates locally.

---

## Step 3: Deploy Templates to Production Dashboard

**⚠️ IMPORTANT**: CLI cannot push templates to production. You must copy them manually.

### Manual Deployment:

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select project: `ncfgivjhkvorikuebtrl`
3. Go to **Authentication** → **Email Templates**
4. For each template:
   - Open the HTML file from `supabase/templates/`
   - Copy all content
   - Paste into Dashboard template editor
   - Save

### Templates to Copy:

1. **Confirm sign up** → `supabase/templates/confirmation.html`
2. **Reset password** → `supabase/templates/recovery.html`
3. **Magic link** → `supabase/templates/magic_link.html`
4. **Change email address** → `supabase/templates/email_change.html`
5. **Invite user** → `supabase/templates/invite.html`
6. **Reauthentication** → `supabase/templates/reauthentication.html`

### Security Templates (Optional):

7. **Password changed** → `supabase/templates/password_changed.html`
8. **Email changed** → `supabase/templates/email_changed.html`
9. **Phone changed** → `supabase/templates/phone_changed.html`
10. **MFA enrolled** → `supabase/templates/mfa_enrolled.html`
11. **MFA unenrolled** → `supabase/templates/mfa_unenrolled.html`
12. **Identity linked** → `supabase/templates/identity_linked.html`
13. **Identity unlinked** → `supabase/templates/identity_unlinked.html`

---

## Step 4: Test

After copying templates to Dashboard:

1. Sign up with test email
2. Check inbox - should receive styled email
3. Verify email styling matches app branding

---

## Troubleshooting

### "Invalid config for auth.email..."

**Fixed**: Template paths corrected in `supabase/config.toml`
- Changed from: `./supabase/templates/...`
- Changed to: `./templates/...`

The config.toml is relative to the `supabase/` directory, so paths should be `./templates/` not `./supabase/templates/`.

### CLI Not Pushing to Production?

**Expected**: Supabase CLI templates are for local development only. Production templates must be manually copied to Dashboard. This is a Supabase limitation.

---

## Files Structure

```
renderiq/
├── supabase/
│   ├── config.toml          ✅ Fixed paths (./templates/...)
│   └── templates/
│       ├── confirmation.html
│       ├── recovery.html
│       └── ... (all other templates)
```

---

## Next Steps

1. ✅ Test config: `npx supabase link` (should work now)
2. ✅ Copy templates to Dashboard (for production)
3. ✅ Test email flow
4. ✅ Verify no duplicate emails

---

## Notes

- ✅ Config paths fixed
- ✅ Templates ready for Dashboard
- ✅ URL masker is backward compatible
- ✅ All error handling in place

