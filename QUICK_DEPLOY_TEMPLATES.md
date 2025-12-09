# 🚀 Quick Deploy: Supabase Email Templates

**Status**: ✅ Templates Ready - Manual Copy Required

---

## ⚠️ Important

**Supabase does NOT provide an API for email templates.**  
Templates must be manually copied to the Dashboard.

---

## 📁 Ready-to-Use Files

All templates have been prepared in:
```
supabase/dashboard-templates/
```

Each template has:
- `.html` file - Template content (copy this)
- `.md` file - Instructions (reference)

---

## 🚀 Quick Deployment (15 minutes)

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select project: **ncfgivjhkvorikuebtrl**
3. Go to: **Authentication** → **Email Templates**

### Step 2: Copy Authentication Templates (6 templates)

For each template, open the `.html` file and copy all content:

1. **Confirm sign up**
   - File: `supabase/dashboard-templates/confirmation.html`
   - Location: Dashboard → **Confirm sign up**
   - Subject: "Verify Your Email Address - Renderiq"

2. **Reset password**
   - File: `supabase/dashboard-templates/recovery.html`
   - Location: Dashboard → **Reset password**
   - Subject: "Reset Your Password - Renderiq"

3. **Magic link**
   - File: `supabase/dashboard-templates/magic_link.html`
   - Location: Dashboard → **Magic link**
   - Subject: "Your Magic Link - Renderiq"

4. **Change email address**
   - File: `supabase/dashboard-templates/email_change.html`
   - Location: Dashboard → **Change email address**
   - Subject: "Confirm Email Change - Renderiq"

5. **Invite user**
   - File: `supabase/dashboard-templates/invite.html`
   - Location: Dashboard → **Invite user**
   - Subject: "You're Invited to Renderiq"

6. **Reauthentication**
   - File: `supabase/dashboard-templates/reauthentication.html`
   - Location: Dashboard → **Reauthentication**
   - Subject: "Confirm Reauthentication - Renderiq"

### Step 3: Copy Security Templates (7 templates)

Go to: Dashboard → **Security** tab

7. **Password changed**
   - File: `supabase/dashboard-templates/password_changed.html`
   - Enable the notification in Settings

8. **Email changed**
   - File: `supabase/dashboard-templates/email_changed.html`

9. **Phone changed**
   - File: `supabase/dashboard-templates/phone_changed.html`

10. **MFA enrolled**
    - File: `supabase/dashboard-templates/mfa_enrolled.html`

11. **MFA unenrolled**
    - File: `supabase/dashboard-templates/mfa_unenrolled.html`

12. **Identity linked**
    - File: `supabase/dashboard-templates/identity_linked.html`

13. **Identity unlinked**
    - File: `supabase/dashboard-templates/identity_unlinked.html`

### Step 4: Test

1. Sign up with test email
2. Check inbox - should receive styled email
3. Verify all templates work

---

## ✅ Checklist

- [ ] Confirmation (signup)
- [ ] Recovery (password reset)
- [ ] Magic link
- [ ] Email change
- [ ] Invite
- [ ] Reauthentication
- [ ] Password changed (Security)
- [ ] Email changed (Security)
- [ ] Phone changed (Security)
- [ ] MFA enrolled (Security)
- [ ] MFA unenrolled (Security)
- [ ] Identity linked (Security)
- [ ] Identity unlinked (Security)

---

## 📝 Copy Instructions

For each template:
1. Open the `.html` file in `supabase/dashboard-templates/`
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into Dashboard template editor
5. Save

---

## 🎯 Quick Links

- **Dashboard Templates**: https://supabase.com/dashboard/project/ncfgivjhkvorikuebtrl/auth/templates
- **Generated Files**: `supabase/dashboard-templates/`
- **Source Files**: `supabase/templates/`

---

## ⚡ Quick Copy Command

If you're on Windows and have Notepad++ or similar:
```powershell
# Open all HTML files for easy copying
Get-ChildItem supabase\dashboard-templates\*.html | ForEach-Object { notepad $_.FullName }
```

Or use VS Code:
```powershell
code supabase/dashboard-templates
```

---

## ✅ Done!

After copying all templates, your emails will:
- ✅ Match Renderiq branding
- ✅ Be responsive and mobile-friendly
- ✅ Use custom styling
- ✅ Have proper security notices

