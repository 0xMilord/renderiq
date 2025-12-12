# Paddle Quick Start - 5 Minute Setup

**Fast track to get Paddle working**

---

## ⚡ Quick Steps

### 1. Create Paddle Account (2 min)
- Go to: https://www.paddle.com/signup
- Sign up as Merchant
- Verify email

### 2. Get API Keys (1 min)
- Dashboard → Developer Tools → Authentication
- Copy **Vendor ID**
- Create **API Key** → Copy it
- Copy **Public Key**

### 3. Create One Test Product (1 min)
- Catalog → Products → New Product
- Name: `Test Credit Package`
- Add Price:
  - Name: `Test Package - USD`
  - Billing: `One-time`
  - Price: `$1.00`
  - Currency: `USD`
- Copy **Price ID** (starts with `pri_`)

### 4. Set Up Webhook (1 min)
- Developer Tools → Events → New Destination
- Type: **Webhook**
- URL: `https://yourdomain.com/api/payments/paddle/webhook`
- Events: Select `transaction.completed`
- Copy **Webhook Secret**

### 5. Add Environment Variables

```bash
# .env.local
PADDLE_API_KEY=test_xxxxxxxxx
PADDLE_PUBLIC_KEY=test_xxxxxxxxx
NEXT_PUBLIC_PADDLE_PUBLIC_KEY=test_xxxxxxxxx
PADDLE_WEBHOOK_SECRET=whsec_xxxxxxxxx
PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox

# Get your package ID from database, then:
PADDLE_PRICE_IDS={"your_package_id_USD": "pri_xxxxxxxxx"}
```

### 6. Run Migration

```bash
npm run db:migrate
```

### 7. Test

1. Deploy or run locally
2. Visit pricing page (as international user)
3. Click purchase
4. Should redirect to Paddle checkout
5. Use test card: `4242 4242 4242 4242`
6. Complete payment
7. Verify credits added

---

## ✅ Done!

You now have Paddle working. For full setup, see `PADDLE_SETUP_GUIDE.md`

---

**Last Updated:** December 12, 2024

