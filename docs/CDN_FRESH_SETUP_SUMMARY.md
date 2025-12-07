# CDN Fresh Setup Summary

## ✅ What Was Created

The script successfully created the following infrastructure:

1. **Backend Buckets** (with CDN enabled):
   - `renderiq-renders-cdn-backend` → points to `renderiq-renders` bucket
   - `renderiq-uploads-cdn-backend` → points to `renderiq-uploads` bucket

2. **URL Map**: `renderiq-cdn-map`
   - Default backend: `renderiq-renders-cdn-backend`
   - Path rules configured (URL rewrites need manual setup)

3. **SSL Certificate**: `renderiq-cdn-ssl-cert`
   - Domain: `cdn.renderiq.io`
   - Status: Provisioning (takes 10-60 minutes)

4. **HTTPS Target Proxy**: `renderiq-cdn-https-proxy`
   - Connected to URL map and SSL certificate

5. **Forwarding Rule**: `renderiq-cdn-rule`
   - **Load Balancer IP**: `136.110.226.162`
   - Port: 443 (HTTPS)
   - Network Tier: Premium

6. **Code Updated**: `lib/services/gcs-storage.ts`
   - Now generates URLs like:
     - `https://cdn.renderiq.io/uploads/projects/...`
     - `https://cdn.renderiq.io/renders/projects/...`

## ⚠️ Manual Steps Required

### 1. Configure URL Rewrites in Cloud Console

**Why?** Backend buckets don't support URL rewrites via gcloud CLI. They must be configured via the Cloud Console.

**Steps:**

1. Go to: https://console.cloud.google.com/net-services/loadbalancing/urlMaps/list?project=inheritage-viewer-sdk-v1
2. Click on: **renderiq-cdn-map**
3. Click **"EDIT"**
4. Under **"Host and path rules"**, click **"Advanced host and path rule (URL redirect, URL rewrite)"**
5. For the **/uploads/*** path rule:
   - Click the pencil icon to edit
   - Under **"Action"**, select **"Route traffic to a single backend"**
   - Select backend: **renderiq-uploads-cdn-backend**
   - Click **"Add-on action (URL rewrite)"**
   - Set **"Path prefix rewrite"** to: **`/`** (this strips `/uploads/` prefix)
   - Click **"Save"**
6. For the **/renders/*** path rule:
   - Click the pencil icon to edit
   - Under **"Action"**, select **"Route traffic to a single backend"**
   - Select backend: **renderiq-renders-cdn-backend**
   - Click **"Add-on action (URL rewrite)"**
   - Set **"Path prefix rewrite"** to: **`/`** (this strips `/renders/` prefix)
   - Click **"Save"**
7. Click **"Done"** and then **"Update"** to apply changes

**How it works:**
- Request: `https://cdn.renderiq.io/uploads/projects/file.jpg`
- URL rewrite strips `/uploads/` → Backend receives: `/projects/file.jpg`
- Backend bucket looks for: `projects/file.jpg` ✅ (matches bucket structure)

### 2. Wait for SSL Certificate Provisioning

The SSL certificate is currently provisioning. This can take 10-60 minutes.

**Check status:**
```bash
gcloud compute ssl-certificates describe renderiq-cdn-ssl-cert --project=inheritage-viewer-sdk-v1
```

Look for `managed.status: ACTIVE` in the output.

### 3. Configure DNS

Add an **A record** in your DNS provider (Namecheap):

- **Host**: `cdn`
- **Type**: `A`
- **Value**: `136.110.226.162`
- **TTL**: `Automatic` or `3600`

**Verify DNS propagation:**
```bash
nslookup cdn.renderiq.io 8.8.8.8
```

Should return: `136.110.226.162`

### 4. Test CDN URLs

After DNS propagates and SSL certificate is active, test:

```bash
# Test renders bucket
curl -I https://cdn.renderiq.io/renders/projects/tool-render-to-cad-20251206/4df4ace2-4109-4128-b935-8c51f0e03770/render_xxx.png

# Test uploads bucket
curl -I https://cdn.renderiq.io/uploads/projects/tool-render-to-cad-20251206/4df4ace2-4109-4128-b935-8c51f0e03770/file.jpg
```

**Expected:**
- Status: `200 OK`
- Headers should include CDN cache headers
- `server: ESF` or similar (not `UploadServer`)

## 📋 Current URL Structure

### Old URLs (Direct GCS):
- `https://storage.googleapis.com/renderiq-renders/projects/...`
- `https://storage.googleapis.com/renderiq-uploads/projects/...`

### New URLs (CDN):
- `https://cdn.renderiq.io/renders/projects/...`
- `https://cdn.renderiq.io/uploads/projects/...`

### Bucket Structure:
Both buckets store files at: `projects/tool-render-to-cad-20251206/user-id/file.ext`

The URL rewrite strips `/renders/` or `/uploads/` so the backend bucket receives just `projects/...`, which matches the bucket structure.

## 🔍 Troubleshooting

### If CDN returns 404:
1. Verify URL rewrites are configured (Step 1 above)
2. Check that files exist in buckets at the expected paths
3. Verify bucket IAM allows public access
4. Check CDN cache: May need to invalidate cache

### If SSL certificate fails:
- Ensure DNS is pointing to the Load Balancer IP
- Check certificate status in Cloud Console
- May need to wait longer (up to 60 minutes)

### If images don't load:
- Check browser console for errors
- Verify CDN domain is in `next.config.ts` remotePatterns
- Check that code is using new URL structure

## 📝 Next Steps After Setup

1. ✅ Configure URL rewrites (manual step above)
2. ⏳ Wait for SSL certificate (10-60 minutes)
3. 🌐 Configure DNS A record
4. 🧪 Test CDN URLs
5. 🚀 Deploy updated code (already done - `gcs-storage.ts` updated)

## 🔗 Useful Links

- **URL Maps**: https://console.cloud.google.com/net-services/loadbalancing/urlMaps/list?project=inheritage-viewer-sdk-v1
- **Backend Buckets**: https://console.cloud.google.com/net-services/loadbalancing/backendBuckets/list?project=inheritage-viewer-sdk-v1
- **SSL Certificates**: https://console.cloud.google.com/net-services/loadbalancing/sslCertificates/list?project=inheritage-viewer-sdk-v1
- **Forwarding Rules**: https://console.cloud.google.com/net-services/loadbalancing/forwardingRules/list?project=inheritage-viewer-sdk-v1

