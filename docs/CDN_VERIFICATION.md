# CDN Verification Guide

## ✅ DNS Status: WORKING!

Your DNS is correctly configured:
- **Domain:** `cdn.renderiq.io`
- **IP Address:** `136.110.242.198`
- **Status:** ✅ Resolving globally (Google DNS confirms)

### Why Your Local DNS Shows Error

Your ISP DNS (Reliance) hasn't updated yet - this is **normal**:
- ✅ **Global DNS** (Google 8.8.8.8): Working ✅
- ⏳ **Local ISP DNS** (Reliance): Still propagating (will update in 1-24 hours)

**This doesn't affect your users** - they'll use different DNS servers that have already updated.

## Next Steps

### 1. Verify CDN is Accessible

Test if the CDN responds:

```powershell
# Test CDN access (should return HTTP response)
curl -I https://cdn.renderiq.io/renderiq-renders/test

# Or test with a browser
# Visit: https://cdn.renderiq.io/renderiq-renders/test
```

**Expected:** HTTP 404 or 403 (means CDN is working, just file doesn't exist)

### 2. Verify Load Balancer IP Matches

Make sure the IP from DNS (`136.110.242.198`) matches your Load Balancer IP:

```powershell
gcloud compute forwarding-rules describe renderiq-renders-cdn-rule --global --project=inheritage-viewer-sdk-v1 --format="value(IPAddress)"
```

**If IPs match:** ✅ Everything is correct!

### 3. Check SSL Certificate Status

If using HTTPS, verify SSL certificate is provisioned:

```powershell
gcloud compute ssl-certificates list --project=inheritage-viewer-sdk-v1
```

Look for certificate with domain `cdn.renderiq.io` - status should be `ACTIVE` (may take 10-60 minutes to provision).

### 4. Update Environment Variables

Make sure your `.env.local` has:

```env
GCS_CDN_DOMAIN=cdn.renderiq.io
NEXT_PUBLIC_GCS_CDN_DOMAIN=cdn.renderiq.io
```

### 5. Restart Your App

After setting environment variables:

```powershell
# Stop current dev server (Ctrl+C)
# Then restart
npm run dev
```

### 6. Test Image Loading

1. Upload a new image through your app
2. Check the URL in database - should be `https://cdn.renderiq.io/...`
3. Test loading speed from different locations

## Verification Checklist

- [x] DNS resolves to Load Balancer IP (`136.110.242.198`)
- [ ] CDN responds to requests (test with curl)
- [ ] Load Balancer IP matches DNS IP
- [ ] SSL certificate is ACTIVE (if using HTTPS)
- [ ] Environment variables are set
- [ ] App restarted with new env vars
- [ ] New uploads use CDN URLs
- [ ] Images load faster

## Troubleshooting

### CDN Not Responding

If `curl -I https://cdn.renderiq.io/...` fails:

1. **Check Load Balancer status:**
   ```powershell
   gcloud compute forwarding-rules describe renderiq-renders-cdn-rule --global --project=inheritage-viewer-sdk-v1
   ```

2. **Check backend bucket:**
   ```powershell
   gcloud compute backend-buckets describe renderiq-renders-cdn-backend --project=inheritage-viewer-sdk-v1
   ```

3. **Check URL map:**
   ```powershell
   gcloud compute url-maps describe renderiq-renders-cdn-map --project=inheritage-viewer-sdk-v1
   ```

### SSL Certificate Not Active

If SSL certificate shows `PROVISIONING`:

- Wait 10-60 minutes (Google-managed certs take time)
- Check certificate status:
  ```powershell
  gcloud compute ssl-certificates describe [CERT_NAME] --project=inheritage-viewer-sdk-v1
  ```

### Images Still Using Old URLs

If new uploads still use `storage.googleapis.com`:

1. Check `.env.local` has `GCS_CDN_DOMAIN=cdn.renderiq.io`
2. Restart Next.js app
3. Clear any build cache: `rm -rf .next` (or delete `.next` folder)

## Performance Testing

### Before CDN (Direct GCS)
```powershell
# Test direct GCS access
curl -w "@curl-format.txt" -o /dev/null -s https://storage.googleapis.com/renderiq-renders/[some-image].png
```

### After CDN
```powershell
# Test CDN access
curl -w "@curl-format.txt" -o /dev/null -s https://cdn.renderiq.io/renderiq-renders/[some-image].png
```

**Expected improvement:**
- **India → US (Direct):** ~200-300ms
- **India → India Edge (CDN):** ~20-50ms ⚡

## Summary

✅ **DNS is working!** (`136.110.242.198`)
⏳ **Local ISP DNS** will update in 1-24 hours (doesn't affect users)
✅ **Next:** Test CDN access, verify SSL, restart app

Your CDN should be fully functional now! 🎉

