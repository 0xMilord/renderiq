# Quick Guide: Deploy Supabase Email Templates

**Goal**: Replace Resend emails with custom Supabase email templates

---

## ✅ What's Done

- ✅ All email templates created in `supabase/templates/`
- ✅ Config file created: `supabase/config.toml`
- ✅ Templates match Renderiq branding

---

## 🚀 Deploy Steps (15 minutes)

### Step 1: Go to Supabase Dashboard

1. Visit: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Email Templates**

### Step 2: Copy Templates

For each template, copy the HTML from the file to the dashboard:

#### Authentication Templates:

1. **Confirm sign up** (`confirmation.html`)
   - Copy content from: `supabase/templates/confirmation.html`
   - Paste into: Dashboard → Email Templates → **Confirm sign up**
   - Subject: "Verify Your Email Address - Renderiq"

2. **Reset password** (`recovery.html`)
   - Copy from: `supabase/templates/recovery.html`
   - Paste into: Dashboard → **Reset password**
   - Subject: "Reset Your Password - Renderiq"

3. **Magic link** (`magic_link.html`)
   - Copy from: `supabase/templates/magic_link.html`
   - Paste into: Dashboard → **Magic link**
   - Subject: "Your Magic Link - Renderiq"

4. **Change email address** (`email_change.html`)
   - Copy from: `supabase/templates/email_change.html`
   - Paste into: Dashboard → **Change email address**
   - Subject: "Confirm Email Change - Renderiq"

5. **Invite user** (`invite.html`)
   - Copy from: `supabase/templates/invite.html`
   - Paste into: Dashboard → **Invite user**
   - Subject: "You're Invited to Renderiq"

6. **Reauthentication** (`reauthentication.html`)
   - Copy from: `supabase/templates/reauthentication.html`
   - Paste into: Dashboard → **Reauthentication**
   - Subject: "Confirm Reauthentication - Renderiq"

#### Security Templates (Optional):

7. **Password changed** (`password_changed.html`)
   - Go to: Dashboard → Email Templates → **Security** tab
   - Copy from: `supabase/templates/password_changed.html`
   - Enable the notification in Settings

8. **Email changed** (`email_changed.html`)
   - Copy from: `supabase/templates/email_changed.html`
   - Enable in Settings

9. **Phone changed** (`phone_changed.html`)
   - Copy from: `supabase/templates/phone_changed.html`
   - Enable in Settings

10. **MFA enrolled/unenrolled** (`mfa_enrolled.html`, `mfa_unenrolled.html`)
    - Copy respective templates
    - Enable in Settings

11. **Identity linked/unlinked** (`identity_linked.html`, `identity_unlinked.html`)
    - Copy respective templates
    - Enable in Settings

### Step 3: Enable Security Notifications (Optional)

1. Go to **Authentication** → **Settings** → **Email Auth**
2. Scroll to **Security** section
3. Enable notifications you want:
   - ✅ Password changed
   - ✅ Email changed
   - ✅ Phone changed
   - ✅ MFA changes
   - ✅ Identity linking

### Step 4: Test

1. **Sign up** with a test email → Should receive styled confirmation email
2. **Reset password** → Should receive styled recovery email
3. **Request magic link** → Should receive styled magic link email

---

## 🔄 Remove Resend Calls (Optional)

Once templates are deployed, you can stop sending emails via Resend:

### Update `lib/stores/auth-store.ts`

Remove this code block (lines ~167-188):
```typescript
// ✅ Send custom styled verification email via Resend (instead of Supabase's default)
if (data.user && !data.user.email_confirmed_at) {
  try {
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    // ... rest of code
  } catch (emailError) {
    // ...
  }
}
```

**Note**: Supabase will automatically send emails using your custom templates, so this Resend call is no longer needed.

---

## ✅ Done!

After deployment:
- ✅ All auth emails use custom Supabase templates
- ✅ Emails match Renderiq branding
- ✅ No need for Resend for auth flows
- ✅ URL masking still works (if configured)

---

## 🐛 Troubleshooting

**Emails still using default templates?**
- Wait 5-10 minutes for changes to propagate
- Clear browser cache
- Verify templates are saved in dashboard

**Templates not saving?**
- Check HTML syntax is valid
- Remove any invalid characters
- Try saving one template at a time

**Variables not working?**
- Ensure you're using correct variable syntax: `{{ .VariableName }}`
- Check Supabase docs for available variables per template type

---

## 📋 Quick Checklist

- [ ] Copy all 6 authentication templates to dashboard
- [ ] Copy security templates (if using)
- [ ] Enable security notifications (if using)
- [ ] Test signup email
- [ ] Test password reset email
- [ ] Remove Resend calls (optional)
- [ ] Verify URL masking works

