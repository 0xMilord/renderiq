import { NextRequest, NextResponse } from 'next/server';

// Cache for exchange rates (5 minutes)
const exchangeRateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BASE_CURRENCY = 'INR';

/**
 * Get exchange rate from INR to target currency
 * Server-side API route to avoid CORS issues
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

    // Fetch from exchangerate-api.com
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status}`);
    }

    const data = await response.json();

    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid exchange rate API response');
    }

    const rate = data.rates[targetCurrency];

    if (!rate || typeof rate !== 'number') {
      // Return fallback rate
      const fallbackRates: Record<string, number> = {
        USD: 0.012, EUR: 0.011, GBP: 0.0095, CAD: 0.016, AUD: 0.018,
        SGD: 0.016, JPY: 1.8, AED: 0.044, SAR: 0.045, CNY: 0.086,
        KRW: 16.0, HKD: 0.094, MYR: 0.056, THB: 0.43, IDR: 190,
        PHP: 0.67, VND: 300, QAR: 0.044, KWD: 0.0037, OMR: 0.0046,
        BHD: 0.0045, ILS: 0.044, TRY: 0.39, CHF: 0.011, SEK: 0.13,
        NOK: 0.13, DKK: 0.082, PLN: 0.048, CZK: 0.28, HUF: 4.3,
        RON: 0.054, RUB: 1.1, MXN: 0.20, BRL: 0.060, ARS: 10.5,
        CLP: 11.0, COP: 47, PEN: 0.044, NZD: 0.019, ZAR: 0.22,
        EGP: 0.37, NGN: 18, KES: 1.6, PKR: 3.3, BDT: 1.3,
        LKR: 3.8, NPR: 1.6,
      };

      const fallbackRate = fallbackRates[targetCurrency] || 1;
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
      success: false,
      error: 'Failed to fetch exchange rate',
      currency: targetCurrency,
      rate: 1, // Fallback to 1:1
    }, { status: 500 });
  }
}

