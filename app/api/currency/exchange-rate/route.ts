import { NextRequest, NextResponse } from 'next/server';

// Cache for exchange rates (5 minutes)
const exchangeRateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BASE_CURRENCY = 'INR';

/**
 * Get fallback exchange rates (updated January 2025)
 * These are approximate rates used when API fails
 */
function getFallbackRates(): Record<string, number> {
  // Current approximate rates (January 2025): 1 INR = X target currency
  return {
    USD: 0.012,      // 1 INR = 0.012 USD (83 INR = 1 USD)
    EUR: 0.011,      // 1 INR = 0.011 EUR
    GBP: 0.0095,     // 1 INR = 0.0095 GBP
    CAD: 0.016,      // 1 INR = 0.016 CAD
    AUD: 0.018,      // 1 INR = 0.018 AUD
    SGD: 0.016,      // 1 INR = 0.016 SGD
    JPY: 1.8,        // 1 INR = 1.8 JPY
    AED: 0.044,      // 1 INR = 0.044 AED
    SAR: 0.045,      // 1 INR = 0.045 SAR
    CNY: 0.086,      // 1 INR = 0.086 CNY
    KRW: 16.0,       // 1 INR = 16 KRW
    HKD: 0.094,      // 1 INR = 0.094 HKD
    MYR: 0.056,      // 1 INR = 0.056 MYR
    THB: 0.43,       // 1 INR = 0.43 THB
    IDR: 190,        // 1 INR = 190 IDR
    PHP: 0.67,       // 1 INR = 0.67 PHP
    VND: 300,        // 1 INR = 300 VND
    QAR: 0.044,      // 1 INR = 0.044 QAR
    KWD: 0.0037,     // 1 INR = 0.0037 KWD
    OMR: 0.0046,     // 1 INR = 0.0046 OMR
    BHD: 0.0045,     // 1 INR = 0.0045 BHD
    ILS: 0.044,      // 1 INR = 0.044 ILS
    TRY: 0.39,       // 1 INR = 0.39 TRY
    CHF: 0.011,      // 1 INR = 0.011 CHF
    SEK: 0.13,       // 1 INR = 0.13 SEK
    NOK: 0.13,       // 1 INR = 0.13 NOK
    DKK: 0.082,      // 1 INR = 0.082 DKK
    PLN: 0.048,      // 1 INR = 0.048 PLN
    CZK: 0.28,       // 1 INR = 0.28 CZK
    HUF: 4.3,        // 1 INR = 4.3 HUF
    RON: 0.054,      // 1 INR = 0.054 RON
    RUB: 1.1,        // 1 INR = 1.1 RUB
    MXN: 0.20,       // 1 INR = 0.20 MXN
    BRL: 0.060,      // 1 INR = 0.060 BRL
    ARS: 10.5,       // 1 INR = 10.5 ARS
    CLP: 11.0,       // 1 INR = 11.0 CLP
    COP: 47,         // 1 INR = 47 COP
    PEN: 0.044,      // 1 INR = 0.044 PEN
    NZD: 0.019,      // 1 INR = 0.019 NZD
    ZAR: 0.22,       // 1 INR = 0.22 ZAR
    EGP: 0.37,       // 1 INR = 0.37 EGP
    NGN: 18,         // 1 INR = 18 NGN
    KES: 1.6,        // 1 INR = 1.6 KES
    PKR: 3.3,        // 1 INR = 3.3 PKR
    BDT: 1.3,        // 1 INR = 1.3 BDT
    LKR: 3.8,        // 1 INR = 3.8 LKR
    NPR: 1.6,        // 1 INR = 1.6 NPR
  };
}

/**
 * Get exchange rate from INR to target currency
 * Server-side API route to avoid CORS issues
 * Supports multiple exchange rate APIs with fallback:
 * 1. Fixer.io (if EXCHANGE_RATE_API_KEY is set)
 * 2. exchangerate-api.com (free tier, no API key needed)
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

    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    let response: Response;
    let data: any;

    // Try Fixer.io first if API key is available (more reliable)
    if (apiKey) {
      try {
        response = await fetch(
          `https://api.fixer.io/latest?base=${BASE_CURRENCY}&access_key=${apiKey}`,
          {
            next: { revalidate: 300 }, // Cache for 5 minutes
          }
        );

        if (response.ok) {
          data = await response.json();
          if (data.success && data.rates) {
            const rate = data.rates[targetCurrency];
            if (rate && typeof rate === 'number') {
              exchangeRateCache.set(cacheKey, { rate, timestamp: now });
              return NextResponse.json({
                success: true,
                currency: targetCurrency,
                rate,
                source: 'fixer.io',
              });
            }
          }
        }
      } catch (fixerError) {
        console.warn('Fixer.io API failed, falling back to exchangerate-api.com:', fixerError);
        // Fall through to free API
      }
    }

    // Fallback to exchangerate-api.com (free, no API key needed)
    response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status}`);
    }

    data = await response.json();

    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid exchange rate API response');
    }

    const rate = data.rates[targetCurrency];

    if (!rate || typeof rate !== 'number') {
      // Return fallback rate
      const fallbackRates = getFallbackRates();
      const fallbackRate = fallbackRates[targetCurrency] || 1;
      exchangeRateCache.set(cacheKey, { rate: fallbackRate, timestamp: now - CACHE_DURATION + 60000 }); // Expire in 1 minute
      
      return NextResponse.json({
        success: true,
        currency: targetCurrency,
        rate: fallbackRate,
        fallback: true,
        source: 'fallback',
      });
    }

    // Cache the rate
    exchangeRateCache.set(cacheKey, { rate, timestamp: now });

    return NextResponse.json({
      success: true,
      currency: targetCurrency,
      rate,
      source: 'exchangerate-api.com',
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    const { searchParams } = new URL(request.url);
    const targetCurrency = searchParams.get('currency')?.toUpperCase() || BASE_CURRENCY;
    
    // Return fallback rate on error
    const fallbackRates = getFallbackRates();
    const fallbackRate = fallbackRates[targetCurrency] || 1;
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch exchange rate',
      currency: targetCurrency,
      rate: fallbackRate, // Use fallback instead of 1:1
      fallback: true,
      source: 'fallback',
    }, { status: 500 });
  }
}

