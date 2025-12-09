# Email Deliverability Fix - Stop Emails Going to Spam

**Date**: 2025-01-27  
**Priority**: 🔴 CRITICAL

---

## Why Emails Are Going to Spam

Based on analysis, here are the main issues:

### 🔴 CRITICAL Issues

1. **Using "noreply@" address** - Major spam trigger
   - Spam filters flag `noreply@` addresses as suspicious
   - Users can't reply, which reduces trust
   - **Fix**: Use `team@renderiq.io` or `hello@renderiq.io`

2. **Missing DMARC record** - Critical for deliverability
   - Your Resend email mentioned "No DMARC record found"
   - Without DMARC, emails are more likely to be marked as spam
   - **Fix**: Add DMARC DNS record

3. **Link tracking enabled** - Can trigger spam filters
   - Modified links can look suspicious
   - **Fix**: Disable click tracking for transactional emails

4. **Missing plain text version** - Some spam filters prefer plain text
   - **Fix**: Ensure all emails have plain text fallback (already implemented ✅)

5. **Domain not fully verified** - Unverified domains have lower deliverability
   - **Fix**: Ensure domain is fully verified in Resend

---

## Immediate Fixes

### Fix #1: Change From Address (CRITICAL)

**Current**: `Renderiq <noreply@renderiq.io>`  
**Change to**: `Renderiq <team@renderiq.io>` or `Renderiq <hello@renderiq.io>`

**Why**: 
- `noreply@` is a major spam trigger
- Using a real address improves trust
- Users can reply if needed

**Action**: Update `RESEND_FROM_EMAIL` environment variable

---

### Fix #2: Add DMARC Record (CRITICAL)

Add this DNS record to your domain:

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@renderiq.io; ruf=mailto:dmarc@renderiq.io; pct=100
```

**Explanation**:
- `p=quarantine` - Quarantine emails that fail authentication (start with this)
- `rua` - Aggregate reports email
- `ruf` - Forensic reports email
- `pct=100` - Apply to 100% of emails

**After 1-2 weeks of good deliverability**, change to:
```
v=DMARC1; p=reject; rua=mailto:dmarc@renderiq.io; ruf=mailto:dmarc@renderiq.io; pct=100
```

---

### Fix #3: Verify SPF and DKIM Records

**SPF Record** (should already exist):
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

**DKIM Records** (from Resend Dashboard):
- Go to Resend Dashboard → Domains → Your Domain
- Copy the DKIM CNAME records
- Add them to your DNS

---

### Fix #4: Disable Link Tracking

Update email service to disable tracking for transactional emails.

---

### Fix #5: Use Dedicated Subdomain (Optional but Recommended)

Use `auth.renderiq.io` or `mail.renderiq.io` for authentication emails:
- Isolates auth emails from marketing
- Better reputation management
- Easier to monitor

---

## Code Changes Needed

### 1. Update From Address

```env
# Change from:
RESEND_FROM_EMAIL=Renderiq <noreply@renderiq.io>

# To:
RESEND_FROM_EMAIL=Renderiq <team@renderiq.io>
```

### 2. Add Reply-To Header

Always include a reply-to address for better deliverability.

### 3. Disable Tracking

Add tracking options to Resend API calls.

---

## Testing Deliverability

1. **Use Email Testing Tools**:
   - [Mail-Tester.com](https://www.mail-tester.com) - Free spam score test
   - [MXToolbox](https://mxtoolbox.com) - Check DNS records
   - [DMARC Analyzer](https://dmarcian.com) - DMARC record checker

2. **Send Test Email**:
   - Send to multiple email providers (Gmail, Outlook, Yahoo)
   - Check spam folder
   - Monitor Resend dashboard for bounces/complaints

3. **Monitor Metrics**:
   - Open rates
   - Bounce rates
   - Spam complaints
   - Delivery rates

---

## Best Practices Checklist

- [ ] ✅ Use real email address (not noreply@)
- [ ] ✅ Add DMARC record
- [ ] ✅ Verify SPF record
- [ ] ✅ Verify DKIM records
- [ ] ✅ Disable link tracking for transactional emails
- [ ] ✅ Include plain text version
- [ ] ✅ Use verified domain
- [ ] ✅ Keep email content clean (no spam trigger words)
- [ ] ✅ Include unsubscribe link (for marketing emails)
- [ ] ✅ Monitor sender reputation
- [ ] ✅ Warm up domain (start with low volume)
- [ ] ✅ Use dedicated subdomain for auth emails (optional)

---

## Spam Trigger Words to Avoid

Avoid these words in subject lines and content:
- "Free", "Act now", "Limited time"
- "Click here", "Buy now", "Urgent"
- Excessive exclamation marks (!!!)
- ALL CAPS
- Suspicious links

---

## Next Steps

1. **Immediate** (Today):
   - Change from address to `team@renderiq.io`
   - Add DMARC record
   - Verify SPF/DKIM records

2. **This Week**:
   - Monitor deliverability
   - Test with Mail-Tester
   - Update code to disable tracking

3. **This Month**:
   - Monitor reputation
   - Adjust DMARC policy if needed
   - Consider dedicated subdomain

---

## Resources

- [Resend Deliverability Guide](https://resend.com/docs/dashboard/domains/introduction)
- [DMARC Guide](https://dmarc.org/wiki/FAQ)
- [Email Deliverability Best Practices](https://resend.com/docs/knowledge-base/how-do-i-maximize-deliverability)

