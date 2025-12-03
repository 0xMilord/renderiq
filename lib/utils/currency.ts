/**
 * Currency Conversion Utility
 * Uses free APIs for real-time currency conversion
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  country?: string;
}

/**
 * Major currencies supported by Razorpay (100+ currencies supported)
 * This list includes the most commonly used currencies for UI display
 * Razorpay supports all ISO 4217 currencies, but we list the most popular ones
 * The exchange rate API supports ALL currencies dynamically
 */
export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  // Major currencies
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'IN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', country: 'US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', country: 'EU' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', country: 'GB' },
  
  // Asia-Pacific
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'JP' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'CN' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', country: 'KR' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'SG' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', country: 'HK' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'MY' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'TH' },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', country: 'ID' },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', country: 'PH' },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', country: 'VN' },
  
  // Middle East
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', country: 'AE' },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', country: 'SA' },
  QAR: { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', country: 'QA' },
  KWD: { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', country: 'KW' },
  OMR: { code: 'OMR', symbol: '﷼', name: 'Omani Rial', country: 'OM' },
  BHD: { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar', country: 'BH' },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', country: 'IL' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', country: 'TR' },
  
  // Europe
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'CH' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', country: 'SE' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', country: 'NO' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', country: 'DK' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', country: 'PL' },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', country: 'CZ' },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', country: 'HU' },
  RON: { code: 'RON', symbol: 'lei', name: 'Romanian Leu', country: 'RO' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', country: 'RU' },
  
  // Americas
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'CA' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', country: 'MX' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', country: 'BR' },
  ARS: { code: 'ARS', symbol: '$', name: 'Argentine Peso', country: 'AR' },
  CLP: { code: 'CLP', symbol: '$', name: 'Chilean Peso', country: 'CL' },
  COP: { code: 'COP', symbol: '$', name: 'Colombian Peso', country: 'CO' },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', country: 'PE' },
  
  // Oceania
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'AU' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', country: 'NZ' },
  
  // Africa
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'ZA' },
  EGP: { code: 'EGP', symbol: '£', name: 'Egyptian Pound', country: 'EG' },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', country: 'NG' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', country: 'KE' },
  
  // South Asia
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', country: 'PK' },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', country: 'BD' },
  LKR: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', country: 'LK' },
  NPR: { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', country: 'NP' },
};

// Base currency (INR)
const BASE_CURRENCY = 'INR';

// Cache for exchange rates (5 minutes)
let exchangeRateCache: Map<string, { rate: number; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Detect user's currency based on browser locale
 * Defaults to INR since Razorpay is primarily for Indian market
 */
export function detectUserCurrency(): string {
  if (typeof window === 'undefined') {
    return BASE_CURRENCY; // INR
  }

  try {
    // Try to get from localStorage first
    const savedCurrency = localStorage.getItem('user_currency');
    // Accept any valid 3-letter currency code EXCEPT USD (default to INR for Razorpay)
    // If USD is saved, treat it as no preference and default to INR
    if (savedCurrency && /^[A-Z]{3}$/.test(savedCurrency) && savedCurrency !== 'USD') {
      return savedCurrency;
    }
    
    // If USD or invalid, default to INR for Razorpay
    if (savedCurrency === 'USD' || !savedCurrency) {
      return BASE_CURRENCY; // INR
    }

    // Try to detect from browser locale
    const locale = navigator.language || (navigator as any).userLanguage || 'en-IN';
    const countryCode = locale.split('-')[1]?.toUpperCase();

    // Map country codes to currencies (expanded list)
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

    // Default to INR for Razorpay (Indian payment gateway)
    // This ensures Indian users and users without clear locale get INR
    return BASE_CURRENCY; // INR
  } catch (error) {
    console.error('Error detecting currency:', error);
    return BASE_CURRENCY; // INR
  }
}

/**
 * Get exchange rate from INR to target currency
 * Uses free API: exchangerate-api.com (no API key needed, supports 160+ currencies)
 * 
 * API Details:
 * - Free tier: No API key required
 * - Updates: Daily (at midnight UTC)
 * - Supports: All ISO 4217 currencies (160+)
 * - Rate limits: Generous free tier
 * - Endpoint: https://api.exchangerate-api.com/v4/latest/INR
 */
export async function getExchangeRate(targetCurrency: string): Promise<number> {
  if (targetCurrency === BASE_CURRENCY) {
    return 1;
  }

  const cacheKey = `${BASE_CURRENCY}_${targetCurrency}`;
  const cached = exchangeRateCache.get(cacheKey);
  const now = Date.now();

  // Return cached rate if still valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.rate;
  }

  try {
    // Use exchangerate-api.com (free, no API key needed, supports 160+ currencies)
    // This API returns rates for ALL currencies in one call
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`,
      { 
        next: { revalidate: 300 }, // Cache for 5 minutes (Next.js)
        cache: 'force-cache', // Browser cache
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status}`);
    }

    const data = await response.json();
    
    // The API returns rates object with all currencies
    // Example: { rates: { USD: 0.012, EUR: 0.011, ... } }
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid exchange rate API response');
    }

    const rate = data.rates[targetCurrency];

    if (!rate || typeof rate !== 'number') {
      console.warn(`Exchange rate not found for ${targetCurrency}, using 1`);
      // Cache a fallback rate to avoid repeated failed lookups
      exchangeRateCache.set(cacheKey, { rate: 1, timestamp: now });
      return 1;
    }

    // Cache the rate
    exchangeRateCache.set(cacheKey, { rate, timestamp: now });

    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    // Return cached rate even if expired
    if (cached) {
      console.log(`Using cached exchange rate for ${targetCurrency}`);
      return cached.rate;
    }
    
    // Fallback rates (approximate, will be updated on next successful fetch)
    // These are rough estimates - real rates will be fetched on next attempt
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

    const fallbackRate = fallbackRates[targetCurrency];
    if (fallbackRate) {
      // Cache fallback rate temporarily
      exchangeRateCache.set(cacheKey, { rate: fallbackRate, timestamp: now - CACHE_DURATION + 60000 }); // Expire in 1 minute
      return fallbackRate;
    }

    // Last resort: return 1 (no conversion)
    return 1;
  }
}

/**
 * Convert amount from INR to target currency
 */
export async function convertCurrency(amountInINR: number, targetCurrency: string): Promise<number> {
  if (targetCurrency === BASE_CURRENCY) {
    return amountInINR;
  }

  const rate = await getExchangeRate(targetCurrency);
  return amountInINR * rate;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES[BASE_CURRENCY];
  const symbol = currencyInfo.symbol;

  // Format number with appropriate decimals
  const decimals = currency === 'JPY' ? 0 : 2;
  const formatted = amount.toFixed(decimals);

  // Add thousand separators
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${symbol}${parts.join('.')}`;
}

/**
 * Get Razorpay currency code
 * Razorpay supports 100+ currencies using standard ISO 4217 codes
 * We validate the currency code and return it if valid, otherwise default to INR
 */
export function getRazorpayCurrencyCode(currency: string): string {
  // Razorpay supports all ISO 4217 currencies (100+)
  // Validate it's a 3-letter uppercase code
  if (/^[A-Z]{3}$/.test(currency)) {
    return currency;
  }
  
  // Invalid format, default to INR
  console.warn(`Invalid currency code: ${currency}, defaulting to INR`);
  return 'INR';
}

/**
 * Check if a currency is supported (for UI display purposes)
 * Note: Razorpay supports 100+ currencies, but we only show popular ones in the UI
 */
export function isCurrencySupported(currency: string): boolean {
  return currency in SUPPORTED_CURRENCIES || /^[A-Z]{3}$/.test(currency);
}

