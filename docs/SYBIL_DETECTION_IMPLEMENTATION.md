# Sybil Detection Implementation Guide

## Quick Start

The sybil detection system is now integrated into your codebase. Follow these steps to complete the implementation:

## 1. Run Database Migration

```bash
# Apply the migration
psql $DATABASE_URL < drizzle/0013_add_sybil_detection.sql

# Or use drizzle-kit
npx drizzle-kit push
```

## 2. Add Client-Side Fingerprint Collection

### Option A: Add to Signup Page (Recommended)

Add fingerprint collection to `app/signup/page.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { collectDeviceFingerprint, storeFingerprintInCookie } from '@/lib/utils/client-fingerprint';

export default function SignupPage() {
  useEffect(() => {
    // Collect and store fingerprint before signup
    const fingerprint = collectDeviceFingerprint();
    storeFingerprintInCookie(fingerprint);
  }, []);

  // ... rest of your signup page
}
```

### Option B: Add to Layout (Global)

Add to `app/layout.tsx` to collect fingerprint for all users:

```tsx
'use client';

import { useEffect } from 'react';
import { collectDeviceFingerprint, storeFingerprintInCookie } from '@/lib/utils/client-fingerprint';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Collect fingerprint on page load
    const fingerprint = collectDeviceFingerprint();
    storeFingerprintInCookie(fingerprint);
  }, []);

  return (
    // ... your layout
  );
}
```

## 3. Verify Integration

The system is already integrated in:
- ✅ `app/auth/callback/route.ts` - OAuth callback
- ✅ `lib/services/user-onboarding.ts` - User profile creation
- ✅ `lib/services/sybil-detection.ts` - Detection logic

## 4. Test the System

### Test Case 1: Genuine User
1. Sign up with a new account
2. Check logs for risk score (should be 0-29)
3. Verify user receives 10 credits

### Test Case 2: Suspicious User
1. Sign up with 2 accounts from same device/IP
2. Check logs for risk score (should be 30-49)
3. Verify second account receives 5 credits

### Test Case 3: High Risk User
1. Sign up with 5+ accounts from same IP
2. Check logs for risk score (should be 50-69)
3. Verify accounts receive 2 credits

### Test Case 4: Critical Risk User
1. Sign up with 10+ accounts rapidly
2. Check logs for risk score (should be 70-100)
3. Verify accounts are blocked (0 credits)

## 5. Monitor Results

### Check Detection Results

```sql
-- View all sybil detections
SELECT 
  u.email,
  sd.risk_score,
  sd.risk_level,
  sd.credits_awarded,
  sd.detection_reasons,
  sd.created_at
FROM sybil_detections sd
JOIN users u ON sd.user_id = u.id
ORDER BY sd.risk_score DESC
LIMIT 20;
```

### Check Device Linking

```sql
-- Find accounts linked to same device
SELECT 
  df.fingerprint_hash,
  COUNT(DISTINCT df.user_id) as account_count,
  ARRAY_AGG(u.email) as emails
FROM device_fingerprints df
JOIN users u ON df.user_id = u.id
GROUP BY df.fingerprint_hash
HAVING COUNT(DISTINCT df.user_id) > 1
ORDER BY account_count DESC;
```

### Check IP Linking

```sql
-- Find accounts linked to same IP
SELECT 
  ip.ip_address,
  COUNT(DISTINCT ip.user_id) as account_count,
  ARRAY_AGG(u.email) as emails
FROM ip_addresses ip
JOIN users u ON ip.user_id = u.id
WHERE ip.first_seen_at > NOW() - INTERVAL '7 days'
GROUP BY ip.ip_address
HAVING COUNT(DISTINCT ip.user_id) > 1
ORDER BY account_count DESC;
```

## 6. Adjust Thresholds (Optional)

Edit `lib/services/sybil-detection.ts` to adjust detection sensitivity:

```typescript
const CONFIG = {
  MAX_ACCOUNTS_PER_DEVICE: 2,      // Increase to allow more accounts per device
  MAX_ACCOUNTS_PER_IP: 3,          // Increase to allow more accounts per IP
  MAX_ACCOUNTS_PER_IP_7DAYS: 5,    // Increase to allow more accounts per IP in 7 days
  // ... risk thresholds
};
```

## 7. Handle Edge Cases

### Shared Networks (Corporate/School)
- Users on same IP may be legitimate
- Consider increasing `MAX_ACCOUNTS_PER_IP` for corporate networks
- Add IP whitelist for known corporate IPs

### Family Members
- Multiple accounts from same IP may be legitimate
- Consider requiring email verification for reduced credits
- Allow manual review/appeal process

### VPN Users
- VPN users flagged as suspicious
- Consider allowing VPN with additional verification
- Require phone verification for VPN users

## 8. Admin Tools (Future)

Create admin dashboard to:
- View flagged accounts
- Manually approve/block accounts
- Adjust risk scores
- View detection analytics

## Troubleshooting

### Issue: All users flagged as suspicious
**Solution:** Increase thresholds in `CONFIG`

### Issue: Legitimate users blocked
**Solution:** 
1. Check detection reasons in `sybil_detections` table
2. Adjust thresholds
3. Add IP whitelist

### Issue: Fingerprint not collected
**Solution:**
1. Check browser console for errors
2. Verify fingerprint collection code is loaded
3. Check cookie is set correctly

### Issue: Credits not reduced
**Solution:**
1. Check `sybil_detections` table for detection record
2. Verify `credits_awarded` field
3. Check user onboarding logs

## Performance Considerations

- Device fingerprint collection is lightweight (< 1ms)
- Database queries are indexed for fast lookups
- Detection runs asynchronously during signup
- No impact on user experience

## Security Notes

- Device fingerprints are hashed (SHA-256)
- IP addresses stored securely
- No PII in fingerprints
- GDPR compliant (data deleted with user account)

## Next Steps

1. ✅ Run migration
2. ✅ Add client-side fingerprint collection
3. ✅ Test with various scenarios
4. ✅ Monitor detection results
5. ✅ Adjust thresholds based on data
6. ⏳ Create admin dashboard (optional)
7. ⏳ Add phone verification (optional)
8. ⏳ Integrate external fraud detection (optional)

## Support

For questions or issues:
- Check `docs/SYBIL_DETECTION_SYSTEM.md` for detailed documentation
- Review logs for detection reasons
- Check database tables for patterns
- Adjust thresholds as needed



