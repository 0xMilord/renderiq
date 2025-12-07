# Vercel Production Deployment Guide - GCS Service Account

## ⚠️ CRITICAL: Service Account Key on Vercel

**On Vercel, file paths DON'T WORK**. You must use JSON credentials as an environment variable.

---

## ✅ How Service Account Key Loads on Vercel

### Current Implementation (FIXED)

The code now supports **both methods**:

1. **Production/Vercel**: JSON credentials from environment variable ✅
2. **Local Development**: File path (backward compatible) ✅

### Loading Priority

1. ✅ First: Check `GOOGLE_APPLICATION_CREDENTIALS_JSON` (JSON content)
2. ✅ Second: Check `GOOGLE_APPLICATION_CREDENTIALS` (file path)
3. ✅ Third: Check `service-account-key.json` in project root
4. ✅ Fourth: Use Application Default Credentials (ADC) if available

---

## 🚀 Vercel Setup Steps

### Step 1: Prepare Service Account JSON

1. Download your service account key file (already have: `service-account-key.json`)
2. Open the file and copy the **ENTIRE JSON content** (all of it)
3. You'll paste this into Vercel environment variable

### Step 2: Add Environment Variables in Vercel

Go to: **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

#### 2.1 Add Service Account JSON (CRITICAL)

**Name**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`

**Value**: Paste the ENTIRE JSON content from `service-account-key.json`:
```json
{
  "type": "service_account",
  "project_id": "inheritage-viewer-sdk-v1",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "renderiq@inheritage-viewer-sdk-v1.iam.gserviceaccount.com",
  ...
}
```

**Settings**:
- ✅ Check **Production**
- ✅ Check **Preview** (optional)
- ✅ Mark as **Sensitive** (hides value)

#### 2.2 Add Other Required Variables

Add these environment variables:

```
GOOGLE_CLOUD_PROJECT_ID=inheritage-viewer-sdk-v1
GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS=renderiq-renders
GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS=renderiq-uploads
STORAGE_PROVIDER=gcs
```

**Optional** (if using CDN):
```
GCS_CDN_DOMAIN=cdn.renderiq.io
NEXT_PUBLIC_GCS_CDN_DOMAIN=cdn.renderiq.io
```

### Step 3: Deploy to Vercel

1. Commit and push your changes
2. Vercel will automatically deploy
3. Check deployment logs for any errors

---

## ✅ How It Works on Vercel

### Runtime Loading Process

1. **Code checks**: `process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON`
2. **If found**: Parses JSON and uses as credentials object
3. **If not found**: Falls back to file path (won't work on Vercel, but safe fallback)
4. **Storage client initialized**: With credentials or ADC

### Example Runtime Flow

```typescript
// 1. Check for JSON credentials (Vercel)
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
if (credentialsJson) {
  const credentials = JSON.parse(credentialsJson); // ✅ Works on Vercel
  return { projectId, credentials };
}

// 2. Fall back to file path (local dev only)
const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (isValidFile(keyFilename)) {
  return { projectId, keyFilename }; // ✅ Works locally
}

// 3. Use ADC as last resort
return { projectId }; // Will use default credentials if available
```

---

## 🔍 Verification Steps

### After Deployment

1. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Your Deployment → **Logs**
   - Look for: `✅ GCS: Using credentials from GOOGLE_APPLICATION_CREDENTIALS_JSON`

2. **Test File Upload**:
   - Upload a file through your app
   - Check if it appears in GCS bucket
   - Verify URL is correct

3. **Check Runtime Errors**:
   - Look for any GCS authentication errors
   - Should see successful upload logs

---

## ❌ Common Issues & Solutions

### Issue 1: "Service account key not found"

**Cause**: Environment variable not set correctly  
**Solution**: 
- Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set in Vercel
- Check it's enabled for Production environment
- Ensure entire JSON is copied (no missing parts)

### Issue 2: "Invalid credentials"

**Cause**: JSON parsing failed or incomplete JSON  
**Solution**:
- Verify JSON is valid (use JSON validator)
- Ensure all fields are included
- Check for extra quotes or formatting issues

### Issue 3: "Permission denied"

**Cause**: Service account doesn't have correct IAM roles  
**Solution**:
- Grant service account: Storage Object Admin
- Verify service account email matches key file

---

## 📋 Environment Variables Checklist

### Required for Production

- [ ] `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Entire JSON content
- [ ] `GOOGLE_CLOUD_PROJECT_ID` - Project ID
- [ ] `GOOGLE_CLOUD_STORAGE_BUCKET_RENDERS` - Bucket name
- [ ] `GOOGLE_CLOUD_STORAGE_BUCKET_UPLOADS` - Bucket name
- [ ] `STORAGE_PROVIDER` - Set to `gcs`

### Optional

- [ ] `GCS_CDN_DOMAIN` - CDN domain (if using CDN)
- [ ] `NEXT_PUBLIC_GCS_CDN_DOMAIN` - CDN domain for client

---

## 🔒 Security Notes

1. ✅ **Never commit** `service-account-key.json` to git
2. ✅ **Mark as sensitive** in Vercel dashboard
3. ✅ **Rotate keys** periodically for security
4. ✅ **Use minimal permissions** (only Storage Object Admin needed)

---

## 🎯 Quick Setup Commands

### Get JSON Content for Vercel

```bash
# On local machine - copy JSON content
cat service-account-key.json | pbcopy  # Mac
cat service-account-key.json | clip    # Windows
cat service-account-key.json | xclip   # Linux
```

Then paste into Vercel environment variable.

---

## ✅ Verification After Deployment

1. **Test Upload**:
   - Upload a test image through your app
   - Check GCS bucket - file should be there
   - Verify URL format is correct

2. **Check Logs**:
   ```
   ✅ GCS: Using credentials from GOOGLE_APPLICATION_CREDENTIALS_JSON env var (Vercel-safe)
   ✅ GCS: File uploaded successfully
   ```

3. **Verify URLs**:
   - URLs should use GCS format: `https://storage.googleapis.com/...`
   - Or CDN format if configured: `https://cdn.renderiq.io/...`

---

## 📝 Summary

**For Vercel Production**:
- ✅ Use `GOOGLE_APPLICATION_CREDENTIALS_JSON` with entire JSON content
- ✅ Code automatically detects and uses it
- ✅ Works seamlessly on Vercel runtime
- ✅ Backward compatible with local file-based setup

**Code is now Vercel-ready!** 🚀

---

**Status**: ✅ **READY FOR VERCEL DEPLOYMENT**

