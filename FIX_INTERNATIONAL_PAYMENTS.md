# Fix International Payments - Real Solution

## Problem Summary

1. **Exchange rate API failing 100%** - `exchangerate-api.com` is blocked/failing on Google Cloud
2. **International users can't subscribe** - Everything defaults to INR, blocking international payments
3. **Currency detection broken** - USD and other currencies are explicitly blocked

## Solution Overview

1. **Use reliable exchange rate API** - Replace free API with paid service (Open Exchange Rates/Fixer.io)
2. **Fix currency detection** - Remove INR hardcoding, properly detect user location
3. **Enable Razorpay international payments** - Razorpay supports 100+ currencies, settles in INR
4. **Use Google Cloud Functions** - If needed, wrap API calls in Cloud Functions for reliability

---

## Razorpay International Payments - How It Works

### Key Facts:
- ✅ **Accepts 100+ currencies** (USD, EUR, GBP, etc.)
- ✅ **Settlement always in INR** (Razorpay's base currency)
- ✅ **Automatic conversion** - Razorpay handles currency conversion at payment time
- ✅ **No special setup needed** - Just pass currency code in order creation

### How to Enable:
1. **Razorpay Dashboard** → Account & Settings → International Payments
2. **Activate International Cards** - Enable international payment methods
3. **Website Compliance** - Ensure you have required policies (Terms, Privacy, etc.)

### API Usage:
```typescript
// Create order with USD
const order = await razorpay.orders.create({
  amount: 1000, // $10.00 (in cents)
  currency: 'USD', // Pass currency code
  receipt: 'order_123'
});

// Razorpay will:
// 1. Accept payment in USD
// 2. Convert to INR at bank's rate
// 3. Settle in INR to your account
```

---

## Exchange Rate API Solutions

### Option 1: Open Exchange Rates (Recommended)
- **Free tier:** 1,000 requests/month
- **Paid:** $12/month for 10,000 requests
- **Reliability:** 99.9% uptime
- **Real-time rates:** Yes
- **API:** `https://openexchangerates.org/api/latest.json?app_id=YOUR_APP_ID`

### Option 2: Fixer.io
- **Free tier:** 100 requests/month
- **Paid:** $10/month for 10,000 requests
- **Reliability:** High
- **Real-time rates:** Yes
- **API:** `https://api.fixer.io/latest?access_key=YOUR_ACCESS_KEY`

### Option 3: CurrencyLayer
- **Free tier:** 1,000 requests/month
- **Paid:** $9.99/month for 10,000 requests
- **Reliability:** High
- **Real-time rates:** Yes
- **API:** `https://api.currencylayer.com/live?access_key=YOUR_ACCESS_KEY`

### Option 4: Google Cloud Functions + Exchange Rate API
- Wrap API calls in Cloud Functions for reliability
- Add retry logic and caching
- Use Google Cloud Secret Manager for API keys

---

## Implementation Plan

### Step 1: Fix Currency Detection (Remove INR Hardcoding)

**File: `lib/utils/currency.ts`**

```typescript
// OLD - Blocks USD, forces INR
export function detectUserCurrency(): string {
  if (typeof window === 'undefined') {
    return BASE_CURRENCY; // INR
  }

  try {
    const savedCurrency = localStorage.getItem('user_currency');
    // ❌ BLOCKS USD
    if (savedCurrency && /^[A-Z]{3}$/.test(savedCurrency) && savedCurrency !== 'USD') {
      return savedCurrency;
    }
    
    // ❌ FORCES INR
    if (savedCurrency === 'USD' || !savedCurrency) {
      return BASE_CURRENCY; // INR
    }
    // ...
  }
}

// NEW - Properly detects currency, allows all currencies
export function detectUserCurrency(): string {
  if (typeof window === 'undefined') {
    return 'USD'; // Default to USD for international users
  }

  try {
    // Check localStorage first
    const savedCurrency = localStorage.getItem('user_currency');
    if (savedCurrency && /^[A-Z]{3}$/.test(savedCurrency)) {
      return savedCurrency; // Allow ALL currencies including USD
    }

    // Detect from browser locale
    const locale = navigator.language || (navigator as any).userLanguage || 'en-US';
    const countryCode = locale.split('-')[1]?.toUpperCase();

    // Map country codes to currencies
    const countryToCurrency: Record<string, string> = {
      'IN': 'INR', 'US': 'USD', 'GB': 'GBP', 'CA': 'CAD', 'AU': 'AUD',
      'SG': 'SGD', 'JP': 'JPY', 'AE': 'AED', 'SA': 'SAR', 'CN': 'CNY',
      'KR': 'KRW', 'HK': 'HKD', 'MY': 'MYR', 'TH': 'THB', 'ID': 'IDR',
      'PH': 'PHP', 'VN': 'VND', 'QA': 'QAR', 'KW': 'KWD', 'OM': 'OMR',
      'BH': 'BHD', 'IL': 'ILS', 'TR': 'TRY', 'CH': 'CHF', 'SE': 'SEK',
      'NO': 'NOK', 'DK': 'DKK', 'PL': 'PLN', 'CZ': 'CZK', 'HU': 'HUF',
      'RO': 'RON', 'RU': 'RUB', 'MX': 'MXN', 'BR': 'BRL', 'AR': 'ARS',
      'CL': 'CLP', 'CO': 'COP', 'PE': 'PEN', 'NZ': 'NZD', 'ZA': 'ZAR',
      'EG': 'EGP', 'NG': 'NGN', 'KE': 'KES', 'PK': 'PKR', 'BD': 'BDT',
      'LK': 'LKR', 'NP': 'NPR',
    };

    // Check EU countries for EUR
    const euCountries = ['AT', 'BE', 'CY', 'DE', 'EE', 'FI', 'FR', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'];
    if (euCountries.includes(countryCode || '')) {
      return 'EUR';
    }

    if (countryCode && countryToCurrency[countryCode]) {
      return countryToCurrency[countryCode];
    }

    // Default to USD for international users (not INR)
    return 'USD';
  } catch (error) {
    console.error('Error detecting currency:', error);
    return 'USD'; // Default to USD, not INR
  }
}
```

**File: `lib/hooks/use-currency.ts`**

```typescript
// OLD - Forces INR, blocks USD
export function useCurrency() {
  const [currency, setCurrency] = useState<string>('INR');
  
  useEffect(() => {
    const savedCurrency = localStorage.getItem('user_currency');
    
    // ❌ BLOCKS USD
    if (!savedCurrency || savedCurrency === 'USD') {
      localStorage.setItem('user_currency', 'INR');
      setCurrency('INR');
      loadExchangeRate('INR');
      return;
    }
    // ...
  }, []);
}

// NEW - Allows all currencies, defaults to detected currency
export function useCurrency() {
  const [currency, setCurrency] = useState<string>('USD'); // Default to USD
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const savedCurrency = localStorage.getItem('user_currency');
    
    // ✅ Allow ALL currencies including USD
    if (savedCurrency && /^[A-Z]{3}$/.test(savedCurrency)) {
      setCurrency(savedCurrency);
      loadExchangeRate(savedCurrency);
    } else {
      // Detect currency from browser
      const detected = detectUserCurrency();
      setCurrency(detected);
      localStorage.setItem('user_currency', detected);
      loadExchangeRate(detected);
    }
  }, []);

  // ... rest of the code
}
```

### Step 2: Replace Exchange Rate API

**File: `app/api/currency/exchange-rate/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Cache for exchange rates (5 minutes)
const exchangeRateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BASE_CURRENCY = 'USD'; // Changed from INR to USD

// Use Open Exchange Rates (or Fixer.io/CurrencyLayer)
const EXCHANGE_RATE_API_KEY = process.env.OPEN_EXCHANGE_RATES_API_KEY || process.env.FIXER_API_KEY;
const EXCHANGE_RATE_API_URL = process.env.OPEN_EXCHANGE_RATES_API_KEY
  ? `https://openexchangerates.org/api/latest.json?app_id=${EXCHANGE_RATE_API_KEY}`
  : process.env.FIXER_API_KEY
  ? `https://api.fixer.io/latest?access_key=${process.env.FIXER_API_KEY}`
  : null;

/**
 * Get exchange rate from USD to target currency
 * Uses Open Exchange Rates or Fixer.io (reliable paid APIs)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetCurrency = searchParams.get('currency')?.toUpperCase() || BASE_CURRENCY;

    if (targetCurrency === BASE_CURRENCY) {
      return NextResponse.json({ 
        success: true, 
        currency: targetCurrency,
        rate: 1 
      });
    }

    const cacheKey = `${BASE_CURRENCY}_${targetCurrency}`;
    const cached = exchangeRateCache.get(cacheKey);
    const now = Date.now();

    // Return cached rate if still valid
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        currency: targetCurrency,
        rate: cached.rate,
        cached: true,
      });
    }

    // Check if API key is configured
    if (!EXCHANGE_RATE_API_URL) {
      console.warn('Exchange rate API key not configured, using fallback rates');
      return NextResponse.json({
        success: true,
        currency: targetCurrency,
        rate: getFallbackRate(targetCurrency),
        fallback: true,
      });
    }

    // Fetch from reliable exchange rate API
    const response = await fetch(EXCHANGE_RATE_API_URL, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Exchange rate API failed: ${response.status}`);
      // Use cached rate if available, otherwise fallback
      if (cached) {
        return NextResponse.json({
          success: true,
          currency: targetCurrency,
          rate: cached.rate,
          cached: true,
        });
      }
      return NextResponse.json({
        success: true,
        currency: targetCurrency,
        rate: getFallbackRate(targetCurrency),
        fallback: true,
      });
    }

    const data = await response.json();

    // Handle different API response formats
    let rates: Record<string, number>;
    if (data.rates) {
      // Open Exchange Rates format: { rates: { USD: 1, EUR: 0.92, ... } }
      rates = data.rates;
    } else if (data.success && data.rates) {
      // Fixer.io format: { success: true, rates: { USD: 1, EUR: 0.92, ... } }
      rates = data.rates;
    } else {
      throw new Error('Invalid exchange rate API response format');
    }

    const rate = rates[targetCurrency];

    if (!rate || typeof rate !== 'number') {
      console.warn(`Exchange rate not found for ${targetCurrency}, using fallback`);
      const fallbackRate = getFallbackRate(targetCurrency);
      exchangeRateCache.set(cacheKey, { rate: fallbackRate, timestamp: now });
      return NextResponse.json({
        success: true,
        currency: targetCurrency,
        rate: fallbackRate,
        fallback: true,
      });
    }

    // Cache the rate
    exchangeRateCache.set(cacheKey, { rate, timestamp: now });

    return NextResponse.json({
      success: true,
      currency: targetCurrency,
      rate,
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    const { searchParams } = new URL(request.url);
    const targetCurrency = searchParams.get('currency')?.toUpperCase() || BASE_CURRENCY;
    
    // Return fallback rate on error
    return NextResponse.json({
      success: true,
      currency: targetCurrency,
      rate: getFallbackRate(targetCurrency),
      fallback: true,
    });
  }
}

/**
 * Get fallback exchange rates (USD base)
 * These are approximate rates - should be updated regularly
 */
function getFallbackRate(targetCurrency: string): number {
  const fallbackRates: Record<string, number> = {
    // Major currencies (approximate, update regularly)
    USD: 1.0,
    INR: 83.0,    // 1 USD = 83 INR
    EUR: 0.92,    // 1 USD = 0.92 EUR
    GBP: 0.79,    // 1 USD = 0.79 GBP
    JPY: 149.0,   // 1 USD = 149 JPY
    AUD: 1.52,    // 1 USD = 1.52 AUD
    CAD: 1.35,    // 1 USD = 1.35 CAD
    CHF: 0.88,    // 1 USD = 0.88 CHF
    CNY: 7.24,    // 1 USD = 7.24 CNY
    // Add more as needed
  };

  return fallbackRates[targetCurrency] || 1.0;
}
```

**File: `lib/utils/currency.ts`**

```typescript
// Update getExchangeRate to use USD base
export async function getExchangeRate(targetCurrency: string): Promise<number> {
  if (targetCurrency === 'USD') { // Changed from INR to USD
    return 1;
  }

  const cacheKey = `USD_${targetCurrency}`; // Changed from INR_ to USD_
  // ... rest of the code, but use USD as base
}
```

### Step 3: Update Environment Variables

**File: `.env.local` or `.env`**

```bash
# Exchange Rate API (choose one)
# Option 1: Open Exchange Rates (recommended)
OPEN_EXCHANGE_RATES_API_KEY=your_app_id_here

# Option 2: Fixer.io
# FIXER_API_KEY=your_access_key_here

# Option 3: CurrencyLayer
# CURRENCY_LAYER_API_KEY=your_access_key_here
```

### Step 4: Update Payment Order Creation

**File: `app/api/payments/create-order/route.ts`**

```typescript
// OLD - Defaults to INR, blocks other currencies
let currency = requestedCurrency && SUPPORTED_CURRENCIES[requestedCurrency]
  ? getRazorpayCurrencyCode(requestedCurrency)
  : 'INR'; // ❌ Hardcoded INR

// NEW - Defaults to USD, allows all currencies
let currency = requestedCurrency && SUPPORTED_CURRENCIES[requestedCurrency]
  ? getRazorpayCurrencyCode(requestedCurrency)
  : 'USD'; // ✅ Default to USD for international users

// Convert price if currency is different from base (USD)
let orderAmount = parseFloat(packageData.price);
if (currency !== 'USD' && packageData.currency === 'USD') {
  // Convert from USD to target currency
  orderAmount = await convertCurrency(orderAmount, currency);
  
  // Ensure minimum amount after conversion
  const minimumAmounts: Record<string, number> = {
    USD: 0.01, INR: 0.83, EUR: 0.01, GBP: 0.01, JPY: 1,
    AUD: 0.01, CAD: 0.01, SGD: 0.01, AED: 0.01, SAR: 0.01,
  };
  const minimumAmount = minimumAmounts[currency] || 0.01;
  
  if (orderAmount < minimumAmount) {
    logger.log(`⚠️ API: Converted amount ${orderAmount} ${currency} is below minimum ${minimumAmount}, using USD instead`);
    orderAmount = parseFloat(packageData.price);
    currency = 'USD'; // ✅ Fallback to USD, not INR
  }
}
```

### Step 5: Remove INR Forcing

**File: `app/pricing/page.tsx`**

```typescript
// OLD - Forces INR on page load
import { resetCurrencyToINR } from '@/lib/utils/reset-currency-to-inr';

useEffect(() => {
  resetCurrencyToINR(); // ❌ Forces INR
  loadData();
}, []);

// NEW - Let currency detection work naturally
useEffect(() => {
  loadData(); // ✅ No currency forcing
}, []);
```

**File: `lib/utils/reset-currency-to-inr.ts`**

```typescript
// DELETE THIS FILE or update to not force INR
// Or rename to reset-currency-to-usd.ts if needed
```

---

## Testing Checklist

- [ ] Test USD user can see prices in USD
- [ ] Test EUR user can see prices in EUR
- [ ] Test INR user can see prices in INR
- [ ] Test currency detection from browser locale
- [ ] Test manual currency selection
- [ ] Test exchange rate API calls
- [ ] Test payment order creation with USD
- [ ] Test payment order creation with EUR
- [ ] Test payment order creation with INR
- [ ] Test Razorpay payment processing
- [ ] Test fallback rates when API fails
- [ ] Test caching of exchange rates

---

## Quick Start

1. **Get API Key:**
   - Sign up at https://openexchangerates.org (free tier: 1,000 requests/month)
   - Or use Fixer.io: https://fixer.io (free tier: 100 requests/month)

2. **Add to Environment:**
   ```bash
   OPEN_EXCHANGE_RATES_API_KEY=your_app_id_here
   ```

3. **Update Code:**
   - Fix currency detection (remove INR hardcoding)
   - Update exchange rate API endpoint
   - Change base currency to USD

4. **Test:**
   - Test with different currencies
   - Verify Razorpay accepts payments
   - Check settlement in INR

---

## Cost Estimate

- **Open Exchange Rates:** Free tier (1,000 requests/month) or $12/month (10,000 requests)
- **Fixer.io:** Free tier (100 requests/month) or $10/month (10,000 requests)
- **CurrencyLayer:** Free tier (1,000 requests/month) or $9.99/month (10,000 requests)

**Recommendation:** Start with Open Exchange Rates free tier, upgrade if needed.

---

## Razorpay Settlement

**Important:** Razorpay always settles in INR, regardless of payment currency.

- User pays in USD → Razorpay converts → You receive INR
- User pays in EUR → Razorpay converts → You receive INR
- User pays in INR → You receive INR

This is normal and expected. Your accounting should track:
- Payment currency (what user paid)
- Settlement currency (INR - what you received)
- Exchange rate at time of payment

---

## Next Steps

1. ✅ Get exchange rate API key
2. ✅ Update currency detection code
3. ✅ Replace exchange rate API
4. ✅ Test with international users
5. ✅ Enable Razorpay international payments in dashboard
6. ✅ Monitor payment success rates

---

**Last Updated:** 2025-01-XX

