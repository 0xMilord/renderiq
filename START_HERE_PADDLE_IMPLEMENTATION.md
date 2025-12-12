# 🚀 START HERE: Paddle Implementation Guide

**Complete end-to-end guide to implement Paddle payments**

---

## 📚 Documentation Files Created

I've created comprehensive guides for you:

1. **`PADDLE_SETUP_GUIDE.md`** - Complete step-by-step setup guide
2. **`PADDLE_QUICK_START.md`** - 5-minute quick setup
3. **`PADDLE_PRICE_ID_MAPPING_GUIDE.md`** - How to map prices
4. **`PADDLE_IMPLEMENTATION_CHECKLIST.md`** - Complete checklist
5. **`PADDLE_ENVIRONMENT_VARIABLES_TEMPLATE.env`** - Environment variables template

---

## 🎯 Quick Start (Choose Your Path)

### Option 1: Fast Track (5 minutes)
**For quick testing:**
1. Read: `PADDLE_QUICK_START.md`
2. Create Paddle account
3. Get API keys
4. Create one test product
5. Set environment variables
6. Test!

### Option 2: Complete Setup (30-60 minutes)
**For production-ready implementation:**
1. Follow: `PADDLE_SETUP_GUIDE.md` (complete guide)
2. Use: `PADDLE_IMPLEMENTATION_CHECKLIST.md` (track progress)
3. Reference: `PADDLE_PRICE_ID_MAPPING_GUIDE.md` (for price mapping)

---

## 📋 Implementation Steps Overview

### Step 1: Paddle Dashboard Setup (15 min)
1. Create account at https://www.paddle.com/signup
2. Get API credentials:
   - Vendor ID
   - API Key
   - Public Key
3. Create products & prices:
   - One product per credit package
   - One product per subscription plan
   - Create prices (USD, one-time for packages, monthly/yearly for plans)
   - Copy Price IDs
4. Configure webhook:
   - URL: `https://yourdomain.com/api/payments/paddle/webhook`
   - Select events
   - Copy webhook secret

### Step 2: Environment Variables (5 min)
1. Copy `PADDLE_ENVIRONMENT_VARIABLES_TEMPLATE.env` to `.env.local`
2. Fill in:
   - `PADDLE_API_KEY`
   - `PADDLE_PUBLIC_KEY`
   - `NEXT_PUBLIC_PADDLE_PUBLIC_KEY`
   - `PADDLE_WEBHOOK_SECRET`
   - `PADDLE_ENVIRONMENT=sandbox`
   - `PADDLE_PRICE_IDS` (see Step 3)

### Step 3: Generate Price Mapping (5 min)
1. Run: `npm run generate-paddle-price-mapping`
2. This shows your database IDs
3. Create prices in Paddle for each ID
4. Map database IDs to Paddle Price IDs
5. Add to `PADDLE_PRICE_IDS` environment variable

### Step 4: Database Migration (2 min)
1. Run: `npm run db:migrate`
2. Verify migration successful

### Step 5: Testing (10 min)
1. Deploy or run locally
2. Test credit package purchase (as international user)
3. Test subscription (as international user)
4. Verify webhooks working
5. Check emails sent

### Step 6: Production (15 min)
1. Switch Paddle to production mode
2. Get production credentials
3. Create production prices
4. Update environment variables
5. Deploy to production
6. Test production flow

---

## 🔑 Key Information You'll Need

### From Paddle Dashboard:
- ✅ Vendor ID
- ✅ API Key (starts with `test_` or `live_`)
- ✅ Public Key (starts with `test_` or `live_`)
- ✅ Webhook Secret (starts with `whsec_`)
- ✅ Price IDs (start with `pri_`) - one for each package/plan

### From Your Database:
- ✅ Credit package IDs
- ✅ Subscription plan IDs
- ✅ Package/plan names and prices

### Webhook URL:
- **Development:** `http://localhost:3000/api/payments/paddle/webhook` (use ngrok for testing)
- **Production:** `https://yourdomain.com/api/payments/paddle/webhook`

---

## 🛠️ Helper Scripts

### Generate Price Mapping
```bash
npm run generate-paddle-price-mapping
```
This script:
- Queries your database for packages/plans
- Shows database IDs
- Generates mapping template
- Shows approximate USD prices

---

## 📝 Environment Variables Format

```bash
# Required
PADDLE_API_KEY=test_xxxxxxxxx
PADDLE_PUBLIC_KEY=test_xxxxxxxxx
NEXT_PUBLIC_PADDLE_PUBLIC_KEY=test_xxxxxxxxx
PADDLE_WEBHOOK_SECRET=whsec_xxxxxxxxx
PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox

# Price mapping (one line, no breaks)
PADDLE_PRICE_IDS={"package_id_USD": "pri_xxxxx", "plan_id_USD": "pri_yyyyy"}
```

---

## ✅ Testing Checklist

Before going to production:

- [ ] Credit package purchase works (international user)
- [ ] Subscription works (international user)
- [ ] Indian users still use Razorpay
- [ ] Webhooks are received and processed
- [ ] Credits are added after payment
- [ ] Invoices are generated
- [ ] Receipts are generated
- [ ] Emails are sent (credits, invoice, receipt)
- [ ] Payment success page works
- [ ] Billing dashboard shows correct provider

---

## 🚨 Common Issues & Solutions

### "Price ID not configured"
- Check `PADDLE_PRICE_IDS` format is correct JSON
- Verify Price IDs exist in Paddle dashboard
- Ensure mapping key format: `"package_id_USD": "pri_xxxxx"`

### Webhook not receiving events
- Check webhook URL is correct
- Verify webhook secret matches
- Check server logs for errors
- Test webhook endpoint manually

### Payment redirect not working
- Check Paddle public key is set
- Verify country detection is working
- Check browser console for errors

### Credits not added
- Check webhook is processing
- Verify payment order is created
- Check database for payment records

---

## 📞 Need Help?

1. **Check the guides:**
   - `PADDLE_SETUP_GUIDE.md` - Detailed setup
   - `PADDLE_QUICK_START.md` - Quick reference
   - `PADDLE_IMPLEMENTATION_CHECKLIST.md` - Step-by-step checklist

2. **Paddle Resources:**
   - Documentation: https://developer.paddle.com/
   - Support: support@paddle.com
   - Dashboard: https://vendors.paddle.com

3. **Test Cards (Sandbox):**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

---

## 🎯 Next Steps

1. **Start with:** `PADDLE_QUICK_START.md` (5 min setup)
2. **Then follow:** `PADDLE_SETUP_GUIDE.md` (complete setup)
3. **Track progress:** `PADDLE_IMPLEMENTATION_CHECKLIST.md`
4. **For price mapping:** `PADDLE_PRICE_ID_MAPPING_GUIDE.md`

---

## ✅ Status

**Code Implementation:** ✅ 100% Complete  
**Documentation:** ✅ 100% Complete  
**Ready for Setup:** ✅ YES

**Your next step:** Open `PADDLE_QUICK_START.md` and follow the 5-minute setup!

---

**Last Updated:** December 12, 2024  
**Status:** 🚀 Ready to Implement

