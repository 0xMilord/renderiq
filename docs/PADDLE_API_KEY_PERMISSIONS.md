# Paddle API Key Permissions Guide

## Issue: "You aren't permitted to perform this request" Error

If you're seeing the error `You aren't permitted to perform this request` with code `forbidden`, this means your Paddle API key doesn't have the required permissions, even if your account is verified and activated.

## Root Cause

Paddle API keys require specific **scopes/permissions** to perform different operations. Even if your Paddle account is fully verified, the API key itself must have the correct permissions assigned.

## Required Permissions

For the Renderiq payment system to work, your Paddle API key needs these permissions:

1. **customers:read** - To list and find existing customers
2. **customers:write** - To create new customers
3. **transactions:write** - To create transactions for one-time payments (credit packages)
4. **subscriptions:read** - To read subscription details (if using subscriptions)
5. **subscriptions:write** - To create and manage subscriptions (if using subscriptions)

## How to Fix

### Step 1: Check Your API Key Permissions

1. Log in to your [Paddle Dashboard](https://vendors.paddle.com/)
2. Navigate to **Developer Tools** > **Authentication**
3. Find your API key (the one set in `PADDLE_API_KEY` environment variable)
4. Click on the API key to view its details

### Step 2: Verify Permissions

Check that the following permissions are enabled:
- ✅ Customers: Read
- ✅ Customers: Write
- ✅ Transactions: Write
- ✅ Subscriptions: Read (if using subscriptions)
- ✅ Subscriptions: Write (if using subscriptions)

### Step 3: Verify Environment Match ⚠️ CRITICAL

**This is the most common cause of "forbidden" errors!**

Ensure your API key environment matches your `PADDLE_ENVIRONMENT` setting:
- **Sandbox API keys** (prefixed with `pdl_sdbx_`) should be used with `PADDLE_ENVIRONMENT=sandbox`
- **Live API keys** (prefixed with `pdl_live_`) should be used with `PADDLE_ENVIRONMENT=production`

**The code will now auto-detect the environment from your API key format**, but you should still set `PADDLE_ENVIRONMENT` correctly to avoid confusion.

**Example:**
```bash
# If your API key starts with pdl_live_*
PADDLE_ENVIRONMENT=production

# If your API key starts with pdl_sdbx_*
PADDLE_ENVIRONMENT=sandbox
```

### Step 4: Update Permissions

If permissions are missing:
1. Click **Edit** on your API key
2. Enable all required permissions listed above
3. Save the changes
4. Wait a few seconds for changes to propagate

### Step 5: Create a New API Key (if needed)

If you can't modify the existing key or it's been revoked:
1. Go to **Developer Tools** > **Authentication**
2. Click **Create API Key**
3. Select all required permissions during creation
4. Copy the new API key
5. Update your `PADDLE_API_KEY` environment variable
6. Restart your application

## Verification

After updating permissions, test the payment flow:
1. Try purchasing a credit package
2. Check the server logs for any permission errors
3. If errors persist, verify the API key is active and not revoked

## Additional Resources

- [Paddle Authentication Documentation](https://developer.paddle.com/api-reference/about/authentication)
- [Paddle API Key Management](https://developer.paddle.com/api-reference/about/api-keys)
- [Paddle Account Verification](https://www.paddle.com/help/start/account-verification)

## Common Issues

### Issue: "API key was revoked"
- **Solution**: Create a new API key with proper permissions. Revoked keys have a 60-minute grace period to reactivate.

### Issue: "Environment mismatch" ⚠️ MOST COMMON ISSUE
- **Symptom**: "You aren't permitted to perform this request" error even with all permissions
- **Cause**: Using a live API key (`pdl_live_*`) with `PADDLE_ENVIRONMENT=sandbox` or vice versa
- **Solution**: 
  1. Check your API key prefix: `pdl_live_*` = production, `pdl_sdbx_*` = sandbox
  2. Set `PADDLE_ENVIRONMENT` to match:
     - Live key → `PADDLE_ENVIRONMENT=production`
     - Sandbox key → `PADDLE_ENVIRONMENT=sandbox`
  3. The code now auto-detects the environment, but you should still set it correctly

### Issue: "Permissions not taking effect"
- **Solution**: Wait 30-60 seconds after updating permissions, then restart your application.

### Issue: "Forbidden error even with all permissions enabled"
If you're still getting "forbidden" errors despite having all read/write permissions, check these:

1. **IP Whitelisting**
   - Go to Paddle Dashboard > Developer Tools > Authentication
   - Check if your API key has IP restrictions
   - If yes, add your server's IP address to the whitelist
   - Or remove IP restrictions if not needed

2. **Account Verification Status**
   - Even if your account appears verified, there might be pending steps
   - Go to Paddle Dashboard > Settings > Account
   - Check for any pending verification notifications
   - Complete all verification steps (Domain Review, Business Identification, Identity Verification)

3. **API Key Activation**
   - Verify the API key is active (not revoked or expired)
   - Check the API key status in Developer Tools > Authentication
   - If inactive, reactivate or create a new key

4. **API Key Format**
   - Sandbox keys should start with `pdl_sdbx_`
   - Live keys should start with `pdl_live_`
   - Verify your key format matches your environment setting

5. **Check Server Logs**
   - The improved error logging will now show full error details
   - Look for the full error object in your server logs
   - This will help identify the specific issue

6. **Contact Paddle Support**
   - If all above checks pass, contact Paddle support
   - Provide them with:
     - Your API key prefix (first 12 characters)
     - The full error response from logs
     - Your account verification status
     - Any IP whitelisting settings

## Error Messages

The improved error handling in `PaddleService` will now provide more helpful error messages that include:
- Which permission is missing
- Where to check permissions in the Paddle Dashboard
- Links to relevant documentation

If you see a permission error, the error message will guide you to the exact solution.

