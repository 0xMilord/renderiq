# Sybil Attack Prevention System

## Overview

This document describes the comprehensive sybil attack prevention system implemented to protect against users creating multiple accounts to claim free credits. The system uses multi-factor analysis including device fingerprinting, IP tracking, email pattern analysis, and behavioral monitoring.

## Problem Statement

**The Issue:**
- Users create multiple Gmail accounts (e.g., 10 accounts)
- Each account claims 25 free credits on signup
- Users consume ~100 credits/month across all accounts (worth ~500 INR)
- At scale (10k users), this results in significant financial loss

**The Solution:**
A multi-layered sybil detection system that:
1. Identifies suspicious account patterns
2. Reduces credits for suspicious accounts
3. Blocks critical risk accounts
4. Maintains good UX for genuine users

## Architecture

### Components

1. **Device Fingerprinting** (`lib/utils/device-fingerprint.ts`)
   - Collects browser/device characteristics
   - Generates stable SHA-256 hash
   - Tracks devices across accounts

2. **Sybil Detection Service** (`lib/services/sybil-detection.ts`)
   - Multi-factor risk analysis
   - Risk scoring (0-100)
   - Credit gating based on risk level

3. **Database Tables**
   - `device_fingerprints` - Device characteristics
   - `ip_addresses` - IP tracking with proxy/VPN detection
   - `sybil_detections` - Risk scores and detection results
   - `account_activity` - Behavioral tracking

4. **Integration Points**
   - User onboarding service
   - Auth callback (OAuth)
   - Signup flow

## Detection Methods

### 1. Device Fingerprint Analysis

**What it detects:**
- Multiple accounts from same device
- Rapid account creation from same device

**Risk Scoring:**
- 2+ accounts from same device in 24h: +40 points
- 1 account from known device: +20 points

**Threshold:** Max 2 accounts per device in 24 hours

### 2. IP Address Analysis

**What it detects:**
- Multiple accounts from same IP
- Proxy/VPN/Tor usage
- Rapid signups from same IP

**Risk Scoring:**
- 3+ accounts from same IP in 24h: +35 points
- 5+ accounts from same IP in 7 days: +25 points
- Proxy/VPN/Tor detected: +15 points
- 1 account from known IP: +15 points

**Thresholds:**
- Max 3 accounts per IP in 24 hours
- Max 5 accounts per IP in 7 days

### 3. Email Pattern Analysis

**What it detects:**
- Disposable/temporary emails
- Sequential email patterns (user1@gmail.com, user2@gmail.com)
- Common fake email patterns

**Risk Scoring:**
- Disposable email: +30 points
- Sequential pattern: +20 points
- Fake pattern match: +15 points

### 4. Behavioral Analysis

**What it detects:**
- Rapid signups from same IP/device
- Unusual activity patterns

**Risk Scoring:**
- 2+ signups in 1 hour: +25 points

## Risk Levels & Credit Gating

| Risk Level | Score Range | Credits Awarded | Action |
|------------|-------------|-----------------|--------|
| **Low** | 0-29 | 25 credits | Full credits, no restrictions |
| **Medium** | 30-49 | 5 credits | Reduced credits, monitor |
| **High** | 50-69 | 2 credits | Significantly reduced, flag for review |
| **Critical** | 70-100 | 0 credits | Account blocked, manual review required |

## Configuration

Edit thresholds in `lib/services/sybil-detection.ts`:

```typescript
const CONFIG = {
  MAX_ACCOUNTS_PER_DEVICE: 2,      // Max accounts from same device in 24h
  MAX_ACCOUNTS_PER_IP: 3,          // Max accounts from same IP in 24h
  MAX_ACCOUNTS_PER_IP_7DAYS: 5,    // Max accounts from same IP in 7 days
  RISK_THRESHOLDS: {
    LOW: 30,
    MEDIUM: 50,
    HIGH: 70,
    CRITICAL: 85,
  },
  INITIAL_CREDITS: {
    TRUSTED: 25,
    LOW_RISK: 25,
    MEDIUM_RISK: 5,
    HIGH_RISK: 2,
    CRITICAL_RISK: 0,
  },
};
```

## Implementation Flow

### Signup Flow (Email/Password)

1. User fills signup form
2. Client collects device fingerprint (`lib/utils/client-fingerprint.ts`)
3. Fingerprint sent to `/api/device-fingerprint`
4. Fingerprint stored in cookie/localStorage
5. User submits signup form
6. Server runs sybil detection during profile creation
7. Credits awarded based on risk score

### OAuth Flow (Google/GitHub)

1. User clicks OAuth button
2. Client collects device fingerprint
3. Fingerprint stored in cookie
4. User redirected to OAuth provider
5. OAuth callback receives fingerprint from cookie
6. Server runs sybil detection during profile creation
7. Credits awarded based on risk score

## Database Schema

### device_fingerprints
- `fingerprint_hash` - SHA-256 hash of device characteristics
- `user_id` - Links to user account
- Browser/OS/platform info

### ip_addresses
- `ip_address` - Normalized IP address
- `is_proxy`, `is_vpn`, `is_tor` - Proxy detection flags
- `first_seen_at`, `last_seen_at` - Timestamps

### sybil_detections
- `risk_score` - 0-100 risk score
- `risk_level` - low/medium/high/critical
- `detection_reasons` - Array of reasons
- `linked_accounts` - Array of linked user IDs
- `is_blocked` - Block status
- `credits_awarded` - Credits given

### account_activity
- `event_type` - signup/login/render/etc.
- `ip_address` - IP at time of event
- `device_fingerprint_id` - Links to device

## API Endpoints

### POST `/api/device-fingerprint`
Collects device fingerprint data from client.

**Request:**
```json
{
  "userAgent": "...",
  "language": "en",
  "timezone": "America/New_York",
  "screenResolution": "1920x1080",
  "hardwareConcurrency": 8,
  ...
}
```

**Response:**
```json
{
  "success": true,
  "fingerprintHash": "abc123...",
  "deviceInfo": {
    "browser": "chrome",
    "os": "windows",
    "platform": "desktop"
  }
}
```

## Monitoring & Review

### Admin Dashboard (Future)
- View sybil detections
- Review flagged accounts
- Manually approve/block accounts
- Adjust risk scores

### Logging
All sybil detection events are logged with:
- User ID
- Risk score
- Risk level
- Detection reasons
- Credits awarded

## Best Practices

1. **Tune Thresholds Carefully**
   - Start conservative (lower thresholds)
   - Monitor false positives
   - Adjust based on data

2. **Monitor Metrics**
   - False positive rate
   - Blocked account rate
   - Credit reduction impact
   - User complaints

3. **Progressive Enforcement**
   - Start with credit reduction
   - Escalate to blocking only for critical cases
   - Allow manual review for edge cases

4. **User Communication**
   - Explain reduced credits clearly
   - Provide appeal process
   - Be transparent about detection

## Future Enhancements

1. **Machine Learning**
   - Train models on known sybil accounts
   - Improve detection accuracy
   - Reduce false positives

2. **Phone Verification**
   - Require phone number for high-risk accounts
   - SMS verification
   - Phone number uniqueness check

3. **Payment Verification**
   - Require small payment for high-risk accounts
   - Verify payment method uniqueness
   - Refund after verification

4. **Reputation System**
   - Build reputation over time
   - Increase credits for trusted users
   - Reduce restrictions for verified accounts

5. **External Services**
   - Integrate with fraud detection APIs
   - Use IP reputation services
   - Leverage device intelligence platforms

## Migration

Run the migration to create tables:

```bash
# Apply migration
psql $DATABASE_URL < drizzle/0013_add_sybil_detection.sql
```

Or use your migration tool:
```bash
drizzle-kit push
```

## Testing

### Test Scenarios

1. **Genuine User**
   - Single account, unique device/IP
   - Should receive 10 credits
   - Risk score: 0-29

2. **Suspicious User (2 accounts)**
   - Same device, different emails
   - Should receive reduced credits (5 credits)
   - Risk score: 30-49

3. **High Risk User (5+ accounts)**
   - Same IP, multiple devices
   - Should receive minimal credits (2 credits)
   - Risk score: 50-69

4. **Critical Risk User (10+ accounts)**
   - Same device/IP, rapid signups
   - Should be blocked (0 credits)
   - Risk score: 70-100

## Support

For questions or issues:
1. Check logs for detection reasons
2. Review `sybil_detections` table
3. Check `account_activity` for patterns
4. Review device/IP linking in database

## Security Considerations

1. **Privacy**
   - Device fingerprints are hashed (SHA-256)
   - IP addresses stored securely
   - No PII in fingerprints

2. **GDPR Compliance**
   - Users can request data deletion
   - Fingerprints deleted with user account
   - IP addresses anonymized after 90 days

3. **False Positives**
   - Legitimate users on shared networks
   - Corporate VPNs
   - Family members on same IP
   - Manual review process available





