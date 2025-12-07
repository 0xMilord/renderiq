# Vercel Production - GCS Service Account Key Setup

## ⚠️ CRITICAL: Service Account Key on Vercel

**Problem**: File paths don't work on Vercel production. You MUST use JSON credentials as an environment variable.

**Solution**: Store entire JSON key as environment variable, not file path.

---

## ✅ Correct Setup for Vercel

### Step 1: Get Your Service Account JSON Key

1. Download your service account JSON key file (e.g., `service-account-key.json`)
2. Copy the **entire JSON content** (all of it, including braces)

### Step 2: Add to Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add new variable:

**Name**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`

**Value**: Paste the ENTIRE JSON content from your service account key file:
```json
{
  "type": "service_account",
  "project_id": "inheritage-viewer-sdk-v1",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "renderiq@inheritage-viewer-sdk-v1.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "...",
  "universe_domain": "googleapis.com"
}
```

3. **Important Settings**:
   - ✅ Check **Production**
   - ✅ Check **Preview** (optional)
   - ✅ Check **Development** (optional, for Vercel dev)
   - ✅ Mark as **Sensitive** (hides value in dashboard)

### Step 3: Add Other Required Environment Variables

Also add these in Vercel:

```
GOOGLE_CLOUD_PROJECT_ID=inheritage-viewer-sdk-v1
GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS=renderiq-renders
GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS=renderiq-uploads
STORAGE_PROVIDER=gcs
GCS_CDN_DOMAIN=cdn.renderiq.io (if using CDN)
NEXT_PUBLIC_GCS_CDN_DOMAIN=cdn.renderiq.io (if using CDN)
```

---

## ❌ What WON'T Work on Vercel

```env
# ❌ WRONG - File paths don't exist on Vercel
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# ❌ WRONG - File won't exist in production
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

---

## ✅ What WILL Work

```env
# ✅ CORRECT - JSON content as environment variable
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

---

## 🔧 Code Update Required

The code needs to be updated to:
1. Check for `GOOGLE_APPLICATION_CREDENTIALS_JSON` first (Vercel)
2. Fall back to file path if JSON not available (local dev)
3. Parse JSON and use as credentials object

---

## 📝 Quick Checklist

- [ ] Service account JSON key downloaded
- [ ] Entire JSON content copied
- [ ] Added as `GOOGLE_APPLICATION_CREDENTIALS_JSON` in Vercel
- [ ] Marked as sensitive
- [ ] Enabled for Production environment
- [ ] Other GCS env vars added
- [ ] Code updated to use JSON credentials
- [ ] Tested in production

---

**Status**: ⚠️ **CODE UPDATE REQUIRED** - Current code uses file paths which won't work on Vercel

