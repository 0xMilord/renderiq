# DNS Troubleshooting for cdn.renderiq.io

## Issue: "Non-existent domain" Error

This means the DNS record either:
1. **Hasn't been created yet** in Namecheap
2. **Was just created** and hasn't propagated (can take 5-60 minutes)
3. **Was created incorrectly**

## Step-by-Step Troubleshooting

### Step 1: Verify DNS Record in Namecheap

1. Log in to Namecheap
2. Go to **Domain List** → Click **Manage** next to `renderiq.io`
3. Go to **Advanced DNS** tab
4. Look for an **A Record** with:
   - **Host:** `cdn`
   - **Type:** `A Record`
   - **Value:** Your Load Balancer IP

**If the record doesn't exist:**
- Click **Add New Record**
- Type: `A Record`
- Host: `cdn`
- Value: `YOUR_LOAD_BALANCER_IP`
- TTL: `Automatic`
- Click **Save**

**If the record exists but looks wrong:**
- Check the Value field has the correct Load Balancer IP
- Make sure Host is just `cdn` (not `cdn.renderiq.io`)
- Make sure Type is `A Record` (not CNAME or other)

### Step 2: Check Main Domain Resolves

First, verify your main domain works:

```powershell
nslookup renderiq.io
```

Should return an IP address. If this doesn't work, there's a bigger DNS issue.

### Step 3: Wait for DNS Propagation

After creating/updating the DNS record:
- **Minimum wait:** 5 minutes
- **Typical wait:** 15-30 minutes
- **Maximum wait:** Up to 48 hours (rare)

### Step 4: Check DNS Propagation Status

Use online tools to check if DNS has propagated globally:

1. **What's My DNS:** https://www.whatsmydns.net/#A/cdn.renderiq.io
2. **DNS Checker:** https://dnschecker.org/#A/cdn.renderiq.io

These show if DNS has propagated to different locations worldwide.

### Step 5: Try Different DNS Servers

Your local DNS cache might be stale. Try:

```powershell
# Clear DNS cache
ipconfig /flushdns

# Try again
nslookup cdn.renderiq.io

# Or use Google's DNS directly
nslookup cdn.renderiq.io 8.8.8.8
```

### Step 6: Verify Load Balancer IP

Make sure you're using the correct Load Balancer IP from the CDN setup script output.

To get it again:
```bash
gcloud compute forwarding-rules describe renderiq-renders-cdn-rule \
  --global \
  --project=inheritage-viewer-sdk-v1 \
  --format="value(IPAddress)"
```

## Common Issues

### Issue: "Host field is wrong"
- ✅ Correct: `cdn`
- ❌ Wrong: `cdn.renderiq.io`
- ❌ Wrong: `cdn.renderiq.io.`
- ❌ Wrong: `@cdn`

### Issue: "Wrong record type"
- ✅ Correct: `A Record`
- ❌ Wrong: `CNAME`
- ❌ Wrong: `AAAA` (unless you have IPv6)

### Issue: "IP address is wrong"
- Double-check the Load Balancer IP from the script output
- Make sure there are no extra spaces or characters

### Issue: "DNS not propagating"
- Wait longer (can take up to 48 hours in rare cases)
- Check with online DNS checker tools
- Try from different network/location
- Clear local DNS cache

## Quick Verification Commands

```powershell
# Check if main domain works
nslookup renderiq.io

# Check CDN subdomain (after waiting 5-30 minutes)
nslookup cdn.renderiq.io

# Use Google DNS directly (bypasses local cache)
nslookup cdn.renderiq.io 8.8.8.8

# Clear Windows DNS cache
ipconfig /flushdns
```

## Expected Result

Once DNS propagates, you should see:

```
Server:  [your DNS server]
Address:  [DNS server IP]

Name:    cdn.renderiq.io
Address:  [YOUR_LOAD_BALANCER_IP]
```

## Next Steps After DNS Works

Once `nslookup cdn.renderiq.io` returns your Load Balancer IP:

1. ✅ DNS is working
2. ✅ Wait for SSL certificate to provision (if using HTTPS)
3. ✅ Test CDN access: `curl -I https://cdn.renderiq.io/renderiq-renders/test.png`
4. ✅ Restart your Next.js app
5. ✅ Test image loading in your app

---

**Still not working?** 
- Double-check the DNS record in Namecheap
- Verify the Load Balancer IP is correct
- Wait longer for propagation
- Check Namecheap support if record looks correct but still not working

