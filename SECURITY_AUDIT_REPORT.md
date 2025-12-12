# Security Audit Report
**Date:** 2024-12-19  
**Scope:** CORS Policies, Security Headers, Enforcement, Next.js Config

---

## Executive Summary

The codebase has a **mixed security implementation** with both centralized and standalone security measures. Several critical issues were identified that could cause unexpected behaviors and security vulnerabilities.

### Risk Level: **MEDIUM-HIGH**

---

## 🔴 Critical Issues

### 1. **Security Flaw in `isAllowedOrigin()` Function**
**Location:** `lib/utils/security.ts:26-50`

**Issue:** The function returns `true` (allows) when origin parsing fails:
```typescript
} catch {
  // If origin parsing fails, allow (better UX than blocking)
  return true;  // ❌ SECURITY RISK
}
```

**Impact:** Malicious or malformed origins could bypass origin validation.

**Recommendation:** Return `false` on parse failure, or log and investigate.

---

### 2. **Wildcard CORS in Manifest Route**
**Location:** `app/manifest/route.ts:16`

**Issue:** Uses `Access-Control-Allow-Origin: *` (wildcard):
```typescript
'Access-Control-Allow-Origin': '*',  // ❌ SECURITY RISK
```

**Impact:** Any origin can access the manifest, potentially exposing sensitive PWA configuration.

**Recommendation:** Use centralized `isAllowedOrigin()` or restrict to specific origins.

---

### 3. **Inconsistent Origin Validation**
**Location:** Multiple API routes

**Routes WITH origin validation:**
- ✅ `/api/renders` - Uses `isAllowedOrigin()`
- ✅ `/api/ai/generate-image` - Uses `isAllowedOrigin()`

**Routes WITHOUT origin validation:**
- ❌ `/api/auth-proxy/[...path]` - No origin check
- ❌ `/api/plugins/*` - No origin check (multiple routes)
- ❌ `/api/payments/*` - No origin check
- ❌ `/api/currency/exchange-rate` - No origin check
- ❌ `/api/ai/chat` - No origin check
- ❌ `/api/ai/completion` - No origin check
- ❌ `/api/ai/enhance-prompt` - No origin check
- ❌ `/api/ai/extract-style` - No origin check
- ❌ `/api/ai/generate-video` - No origin check

**Impact:** Inconsistent security posture; some routes vulnerable to CSRF/unauthorized access.

---

## ⚠️ High Priority Issues

### 4. **Overly Permissive Content Security Policy (CSP)**
**Location:** `next.config.ts:197-219`

**Issues:**
- `script-src` includes `'unsafe-inline'` and `'unsafe-eval'` - **reduces XSS protection**
- Multiple directives use `https:` wildcard - **allows any HTTPS domain**
- `frame-src 'self' https:` - **allows any HTTPS iframe** (potential clickjacking)

**Current CSP:**
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https: ...
connect-src 'self' https: wss: ...
frame-src 'self' https:
```

**Impact:** 
- XSS vulnerabilities possible despite CSP
- Any HTTPS site can embed your app in iframes
- Any HTTPS domain can make connections

**Recommendation:** 
- Remove `'unsafe-eval'` if possible (check Razorpay requirements)
- Use nonce-based CSP instead of `'unsafe-inline'`
- Restrict `frame-src` to specific domains (Razorpay, etc.)
- Restrict `connect-src` to specific API domains

---

### 5. **Conflicting Frame Protection**
**Location:** `next.config.ts:181-182` and `next.config.ts:217`

**Issue:** Both `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` are set, which is redundant but also:
- `frame-src 'self' https:` in CSP allows embedding
- `X-Frame-Options: DENY` blocks ALL embedding

**Impact:** 
- Legitimate iframe usage (e.g., Razorpay payment modal) might be blocked
- Confusing configuration

**Recommendation:** 
- Remove `X-Frame-Options` (CSP `frame-ancestors` is more modern)
- Use `frame-ancestors 'self'` or specific domains instead of `'none'` if iframes are needed

---

### 6. **Missing CORS Response Headers**
**Location:** API routes using `isAllowedOrigin()`

**Issue:** Routes check origin but don't set CORS response headers:
- No `Access-Control-Allow-Origin` header
- No `Access-Control-Allow-Methods` header
- No `Access-Control-Allow-Credentials` header

**Impact:** 
- Preflight OPTIONS requests may fail
- Browser CORS checks may block legitimate cross-origin requests
- Inconsistent behavior between same-origin and cross-origin requests

**Recommendation:** Create centralized CORS middleware that:
1. Validates origin using `isAllowedOrigin()`
2. Sets appropriate CORS response headers
3. Handles OPTIONS preflight requests

---

## 📋 Medium Priority Issues

### 7. **Standalone Security Implementation in Manifest Route**
**Location:** `app/manifest/route.ts`

**Issue:** Uses hardcoded CORS headers instead of centralized security utilities.

**Recommendation:** Use centralized CORS utility or at least use `isAllowedOrigin()`.

---

### 8. **GCS Bucket CORS Configuration**
**Location:** `scripts/setup-gcs-buckets.ts:105-154`

**Status:** ✅ Properly configured with specific origins
- Allows: `renderiq.io`, `localhost:3000`, `localhost:3001`
- Methods: GET, HEAD, OPTIONS (and POST/PUT for uploads bucket)

**Note:** This is separate from Next.js CORS and is correctly configured.

---

### 9. **Missing Security Headers in API Responses**
**Location:** Most API routes

**Issue:** API routes don't explicitly set security headers (rely on Next.js config).

**Impact:** 
- Headers from `next.config.ts` apply to all routes (including API)
- But API routes might need different headers (e.g., CORS)

**Recommendation:** Consider API-specific header configuration if needed.

---

## 🔍 Security Configuration Analysis

### Next.js Config Headers (`next.config.ts:171-225`)

| Header | Value | Status | Notes |
|--------|-------|--------|-------|
| `X-Content-Type-Options` | `nosniff` | ✅ Good | Prevents MIME sniffing |
| `X-Frame-Options` | `DENY` | ⚠️ Too Strict | Conflicts with CSP, may break iframes |
| `X-XSS-Protection` | `1; mode=block` | ⚠️ Deprecated | Modern browsers ignore this |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ Good | Balanced privacy/functionality |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | ✅ Good | Strong HTTPS enforcement |
| `Content-Security-Policy` | See below | ⚠️ Too Permissive | See Issue #4 |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | ✅ Good | Restricts permissions |

### Content Security Policy Breakdown

| Directive | Current Value | Risk Level | Recommendation |
|-----------|---------------|------------|---------------|
| `default-src` | `'self'` | ✅ Good | - |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval' https: ...` | 🔴 High | Remove unsafe-*, use nonces |
| `style-src` | `'self' 'unsafe-inline' https:` | ⚠️ Medium | Use nonces if possible |
| `img-src` | `'self' data: https: blob: ...` | ⚠️ Medium | Restrict to specific domains |
| `connect-src` | `'self' https: wss: ...` | 🔴 High | Restrict to specific APIs |
| `frame-src` | `'self' https:` | 🔴 High | Restrict to specific domains |
| `frame-ancestors` | `'none'` | ⚠️ Conflicting | See Issue #5 |

---

## 📊 Usage Analysis

### Centralized Security Utilities (`lib/utils/security.ts`)

**Functions Available:**
- ✅ `isAllowedOrigin()` - Used in 2 routes
- ✅ `sanitizeInput()` - Used in 2 routes
- ✅ `validatePrompt()` - Used in 2 routes
- ✅ `securityLog()` - Used in 8 routes
- ✅ `getSafeErrorMessage()` - Used in 2 routes

**Adoption Rate:** ~20% of API routes use centralized security

**Routes Using Centralized Security:**
1. `/api/renders` - ✅ Full security suite
2. `/api/ai/generate-image` - ✅ Full security suite
3. `/api/ai/extract-style` - ⚠️ Partial (no origin check)
4. `/api/plugins/*` - ⚠️ Partial (only securityLog)
5. `/api/security/console-access` - ⚠️ Partial (only securityLog)

---

## 🎯 Recommendations Summary

### Immediate Actions (Critical)

1. **Fix `isAllowedOrigin()` security flaw**
   - Return `false` on parse failure
   - Log failed parse attempts

2. **Fix manifest route CORS**
   - Use `isAllowedOrigin()` instead of wildcard
   - Set proper CORS headers

3. **Add origin validation to all API routes**
   - Create middleware wrapper
   - Apply to all public API routes

### Short-term Actions (High Priority)

4. **Tighten Content Security Policy**
   - Remove `'unsafe-eval'` if possible
   - Use nonces for inline scripts
   - Restrict wildcard `https:` to specific domains

5. **Fix frame protection conflicts**
   - Remove `X-Frame-Options` (use CSP only)
   - Update `frame-ancestors` to allow specific domains if needed

6. **Create centralized CORS middleware**
   - Validate origin
   - Set CORS response headers
   - Handle OPTIONS preflight

### Long-term Actions (Medium Priority)

7. **Standardize security across all routes**
   - Create security middleware
   - Apply consistently to all API routes
   - Document security requirements

8. **Remove deprecated headers**
   - Remove `X-XSS-Protection` (browsers ignore it)

9. **Implement security monitoring**
   - Track failed origin validations
   - Monitor CSP violations
   - Alert on suspicious patterns

---

## 📝 Files Requiring Changes

### High Priority
1. `lib/utils/security.ts` - Fix `isAllowedOrigin()` security flaw
2. `app/manifest/route.ts` - Fix wildcard CORS
3. `next.config.ts` - Tighten CSP, fix frame protection
4. Create: `lib/middleware/cors.ts` - Centralized CORS middleware

### Medium Priority
5. `app/api/auth-proxy/[...path]/route.ts` - Add origin validation
6. `app/api/plugins/*` - Add origin validation (multiple files)
7. `app/api/payments/*` - Add origin validation
8. `app/api/ai/*` - Add origin validation (multiple files)

---

## 🔒 Security Best Practices Not Followed

1. ❌ **Defense in Depth** - Some routes lack multiple security layers
2. ❌ **Fail Secure** - `isAllowedOrigin()` fails open (allows on error)
3. ❌ **Principle of Least Privilege** - CSP uses wildcards instead of specific domains
4. ⚠️ **Consistent Security** - Mixed centralized/standalone implementations
5. ✅ **Input Validation** - Good usage of sanitization functions
6. ✅ **Security Logging** - Good usage of `securityLog()`

---

## 📈 Metrics

- **Total API Routes:** ~30+
- **Routes with Origin Validation:** 2 (6.7%)
- **Routes with Security Logging:** 8 (26.7%)
- **Routes with Input Sanitization:** 2 (6.7%)
- **Centralized Security Adoption:** 20%

---

## ✅ Positive Findings

1. ✅ Centralized security utilities exist (`lib/utils/security.ts`)
2. ✅ Good input validation and sanitization functions
3. ✅ Security logging implemented
4. ✅ GCS bucket CORS properly configured
5. ✅ Strong HTTPS enforcement (HSTS)
6. ✅ Good referrer policy
7. ✅ Permissions policy restricts sensitive APIs

---

## 🚨 Unexpected Behaviors Likely Caused By

1. **CSP blocking legitimate scripts** - `'unsafe-inline'` and `'unsafe-eval'` are needed but reduce security
2. **Frame protection blocking iframes** - `X-Frame-Options: DENY` + `frame-ancestors 'none'` might block Razorpay modals
3. **Missing CORS headers** - Cross-origin requests might fail even with valid origins
4. **Inconsistent origin validation** - Some routes work, others don't, causing confusion
5. **Wildcard CORS in manifest** - Might expose PWA config to unauthorized origins

---

## 📚 References

- [OWASP CORS Security](https://owasp.org/www-community/attacks/CORS)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)

---

**Report Generated:** 2024-12-19  
**Auditor:** AI Security Analysis  
**Next Review:** After implementing critical fixes

