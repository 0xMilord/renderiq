# Sybil Detection System - End-to-End Audit

## ✅ Implementation Status

### Core Components
- ✅ Database schema (4 tables)
- ✅ Device fingerprinting utility
- ✅ Sybil detection service
- ✅ OAuth callback integration
- ⚠️ Email/password signup integration (PARTIAL - see issues below)
- ✅ Credit gating system
- ✅ Migration script

---

## 🚨 Critical Issues Found

### 1. **Email/Password Signup Missing Fingerprint Collection**

**Problem:**
- Email/password signup creates profile via `use-user-onboarding.ts` hook
- Hook calls `createUserProfileAction` without device fingerprint context
- No fingerprint collected for email signups → No sybil detection

**Impact:** High - Email signups bypass sybil detection entirely

**Location:**
- `lib/hooks/use-user-onboarding.ts` (line 39)
- `lib/services/auth.ts` (line 69 - sign-in also affected)

**Fix Required:**
```typescript
// Need to pass device fingerprint from client to server action
// Client must collect fingerprint before calling createUserProfileAction
```

### 2. **Sign-In Creates Profile Without Fingerprint**

**Problem:**
- `AuthService.signIn()` calls `createUserProfile` without context
- Existing users signing in get profile created without fingerprint
- No sybil detection on sign-in

**Impact:** Medium - Existing users bypass detection

**Location:** `lib/services/auth.ts` (line 69)

**Fix:** Pass request context or skip fingerprint for existing users

### 3. **Bug in recordActivity Call**

**Problem:**
- Line 81 in `user-onboarding.ts`: `sybilResult.linkedAccounts?.[0]` passed as fingerprintHash
- Should pass actual fingerprint hash, not linked account ID

**Impact:** Medium - Activity tracking incorrect

**Location:** `lib/services/user-onboarding.ts` (line 81)

**Fix:** Pass fingerprint hash from deviceData

---

## ⚠️ Edge Cases & False Positives

### 1. **Shared Networks (High False Positive Risk)**

**Scenario:**
- Coffee shops, libraries, coworking spaces
- Multiple legitimate users from same IP
- Corporate networks with NAT

**Current Behavior:**
- All flagged as suspicious (30-49 risk score)
- Reduced credits (5 credits)

**Recommendation:**
- Add IP whitelist for known corporate networks
- Consider time-based analysis (signups spread over days vs. minutes)
- Require email verification for reduced credits

**Code Location:** `lib/services/sybil-detection.ts` (line 232-280)

### 2. **Family Members / Roommates**

**Scenario:**
- Multiple family members on same IP
- Same device shared by family
- Legitimate multiple accounts

**Current Behavior:**
- Flagged as suspicious
- Reduced credits

**Recommendation:**
- Allow 2-3 accounts per IP with email verification
- Increase threshold for family scenarios
- Manual review option

### 3. **VPN/Proxy Users**

**Scenario:**
- Legitimate users behind VPN
- Corporate VPNs
- Privacy-conscious users

**Current Behavior:**
- +15 risk score for proxy/VPN
- May push to medium risk

**Recommendation:**
- Don't penalize VPN alone
- Combine with other signals
- Whitelist known corporate VPNs

**Code Location:** `lib/services/sybil-detection.ts` (line 255-259)

### 4. **Mobile Networks (NAT)**

**Scenario:**
- Mobile carriers use NAT
- Multiple users share same public IP
- Legitimate users flagged

**Current Behavior:**
- Flagged as suspicious

**Recommendation:**
- Detect mobile carriers
- Adjust thresholds for mobile IPs
- Use device fingerprint more heavily for mobile

### 5. **Browser Privacy Modes**

**Scenario:**
- Incognito/Private browsing
- Limited fingerprint data
- May generate different fingerprints

**Current Behavior:**
- Falls back to minimal fingerprint
- Less accurate detection

**Recommendation:**
- Accept reduced fingerprint data
- Don't penalize privacy modes
- Use IP + email patterns more heavily

### 6. **Email Verification Flow**

**Scenario:**
- Email/password signup → email verification → profile creation
- Fingerprint collected at signup, but profile created later
- Cookie may expire between signup and verification

**Current Behavior:**
- Fingerprint cookie may be lost
- Falls back to minimal fingerprint

**Recommendation:**
- Store fingerprint in database during signup
- Link to user after email verification
- Or collect fingerprint after verification

---

## 🔄 Race Conditions

### 1. **Simultaneous Signups**

**Scenario:**
- Two users sign up from same IP at exact same time
- Both queries run before either is committed
- Both see 0 existing accounts → both get full credits

**Current Behavior:**
- Possible race condition
- Both may pass detection

**Recommendation:**
- Add database-level constraints
- Use transactions with proper isolation
- Add unique constraint on (user_id, fingerprint_hash)

**Code Location:** `lib/services/sybil-detection.ts` (line 190-227)

### 2. **Rapid Sequential Signups**

**Scenario:**
- Attacker creates 5 accounts in 1 minute
- Detection runs for each, but queries may overlap
- All accounts created before detection completes

**Current Behavior:**
- May miss rapid signups
- Detection runs async

**Recommendation:**
- Add rate limiting at API level
- Use database locks for critical sections
- Queue detection if needed

---

## 🐛 Bugs & Issues

### 1. **Missing Fingerprint Hash in recordActivity**

**Location:** `lib/services/user-onboarding.ts` (line 81)

**Current:**
```typescript
sybilResult.linkedAccounts?.[0] // Wrong - this is a user ID
```

**Should be:**
```typescript
fingerprintHash // From deviceData
```

### 2. **Proxy Detection Too Aggressive**

**Location:** `lib/services/sybil-detection.ts` (line 427)

**Current:**
```typescript
const isProxy = headers.get('x-forwarded-for') !== null && headers.get('x-forwarded-for') !== ipAddress;
```

**Issue:** This detects ALL proxied requests (including Vercel/Cloudflare), not just suspicious proxies

**Fix:** Only flag if multiple proxies or known proxy headers

### 3. **No Error Handling for Database Failures**

**Location:** Multiple places in `sybil-detection.ts`

**Issue:** If database insert fails, detection silently fails
- User gets full credits
- No logging of failure

**Fix:** Add try-catch and fallback behavior

### 4. **Timezone Detection Missing**

**Location:** `app/auth/callback/route.ts` (line 85)

**Issue:** Falls back to 'UTC' for timezone
- Less accurate fingerprint
- May cause false negatives

**Fix:** Store timezone in cookie or detect from IP

---

## 📊 Performance Concerns

### 1. **Multiple Database Queries**

**Current:** 4-6 queries per signup:
1. Check device fingerprint
2. Check IP address
3. Check recent signups
4. Insert device fingerprint
5. Insert IP address
6. Insert detection result

**Impact:** ~50-100ms per signup

**Optimization:**
- Combine queries where possible
- Use batch inserts
- Add connection pooling

### 2. **No Caching**

**Current:** Every signup queries full history

**Impact:** Slower as database grows

**Optimization:**
- Cache recent IP/device lookups
- Use Redis for hot data
- Add materialized views

### 3. **Index Usage**

**Current:** Good indexes on fingerprint_hash and ip_address

**Status:** ✅ Good

---

## 🔒 Security Concerns

### 1. **Fingerprint Hash Collision**

**Risk:** Two different devices generate same hash

**Probability:** Very low (SHA-256)

**Mitigation:** ✅ Already using SHA-256

### 2. **Fingerprint Spoofing**

**Risk:** Attacker modifies fingerprint data

**Mitigation:** 
- Server-side validation
- Check for impossible combinations
- Monitor for fingerprint changes

### 3. **IP Spoofing**

**Risk:** Attacker spoofs IP address

**Mitigation:**
- ✅ Using server-side IP detection
- ✅ Normalizing IP addresses
- Consider additional validation

---

## 🎯 Recommendations

### Immediate Fixes (Critical)

1. **Fix email/password signup fingerprint collection**
   - Add fingerprint collection to signup page
   - Pass fingerprint to server action
   - Store fingerprint before email verification

2. **Fix recordActivity bug**
   - Pass actual fingerprint hash
   - Not linked account ID

3. **Add error handling**
   - Wrap database operations in try-catch
   - Log failures
   - Fallback behavior

### Short-term Improvements

1. **Reduce false positives**
   - Increase thresholds for shared networks
   - Add IP whitelist
   - Time-based analysis

2. **Fix proxy detection**
   - Only flag suspicious proxies
   - Whitelist known proxies (Vercel, Cloudflare)

3. **Add rate limiting**
   - API-level rate limiting
   - Prevent rapid signups

### Long-term Enhancements

1. **Machine learning**
   - Train on known sybil accounts
   - Improve detection accuracy
   - Reduce false positives

2. **Reputation system**
   - Build reputation over time
   - Increase credits for trusted users
   - Reduce restrictions

3. **Phone verification**
   - Require for high-risk accounts
   - Verify phone uniqueness
   - Additional signal

---

## 📝 Testing Checklist

### Test Scenarios

- [ ] Single user, unique device/IP → Should get 10 credits
- [ ] Two users, same IP, different devices → Should get 10 credits each
- [ ] Two users, same device, different IPs → Should get 5 credits (medium risk)
- [ ] Three users, same IP in 24h → Should get 5 credits (medium risk)
- [ ] Five users, same IP in 7 days → Should get 2 credits (high risk)
- [ ] Ten users, same device/IP rapidly → Should get 0 credits (critical)
- [ ] Email/password signup → Should collect fingerprint
- [ ] OAuth signup → Should collect fingerprint
- [ ] VPN user → Should not be penalized alone
- [ ] Corporate network → Should not be penalized
- [ ] Mobile network → Should handle NAT correctly
- [ ] Privacy mode browser → Should work with reduced data

### Edge Cases

- [ ] Cookie expires between signup and verification
- [ ] Simultaneous signups from same IP
- [ ] Database connection failure
- [ ] Invalid fingerprint data
- [ ] Missing request headers
- [ ] Very old accounts (should not affect new signups)

---

## 🎓 Lessons Learned

1. **Always collect fingerprint on client** - Don't rely on server-side only
2. **Handle missing data gracefully** - Fallback to minimal detection
3. **Test shared networks** - Common false positive source
4. **Monitor false positives** - Adjust thresholds based on data
5. **Log everything** - Helps debug issues

---

## 📈 Metrics to Monitor

1. **False Positive Rate**
   - Users flagged but legitimate
   - Should be < 5%

2. **Detection Rate**
   - Sybil accounts detected
   - Should catch > 90% of attacks

3. **Credit Reduction Impact**
   - Average credits awarded
   - Should reduce abuse by > 80%

4. **User Complaints**
   - Support tickets about reduced credits
   - Should be minimal

5. **Performance**
   - Signup time increase
   - Should be < 100ms overhead

