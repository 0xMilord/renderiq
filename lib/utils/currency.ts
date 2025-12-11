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
    // Accept any valid 3-letter currency code
    if (savedCurrency && /^[A-Z]{3}$/.test(savedCurrency)) {
      return savedCurrency;
    }
    
    // If invalid or not saved, default to INR for Razorpay
    if (!savedCurrency) {
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
 * Supports multiple exchange rate APIs with fallback:
 * 1. Fixer.io (if EXCHANGE_RATE_API_KEY is set)
 * 2. exchangerate-api.com (free tier, no API key needed)
 * 
 * API Details:
 * - Fixer.io: Paid service with reliable rates, requires API key
 * - exchangerate-api.com: Free tier, daily updates at midnight UTC
 * - Supports: All ISO 4217 currencies (160+)
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
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    let response: Response;
    let data: any;

    // Try Fixer.io first if API key is available (more reliable)
    if (apiKey) {
      try {
        response = await fetch(
          `https://api.fixer.io/latest?base=${BASE_CURRENCY}&access_key=${apiKey}`,
          { 
            next: { revalidate: 300 }, // Cache for 5 minutes (Next.js)
            cache: 'force-cache', // Browser cache
          }
        );

        if (response.ok) {
          data = await response.json();
          if (data.success && data.rates) {
            const rate = data.rates[targetCurrency];
            if (rate && typeof rate === 'number') {
              exchangeRateCache.set(cacheKey, { rate, timestamp: now });
              return rate;
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
        next: { revalidate: 300 }, // Cache for 5 minutes (Next.js)
        cache: 'force-cache', // Browser cache
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status}`);
    }

    data = await response.json();
    
    // The API returns rates object with all currencies
    // Example: { rates: { USD: 0.012, EUR: 0.011, ... } }
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid exchange rate API response');
    }

    const rate = data.rates[targetCurrency];

    if (!rate || typeof rate !== 'number') {
      console.warn(`Exchange rate not found for ${targetCurrency}, using fallback`);
      // Use fallback rate
      const fallbackRates = getFallbackRates();
      const fallbackRate = fallbackRates[targetCurrency] || 1;
      // Cache fallback rate temporarily (expire in 1 minute)
      exchangeRateCache.set(cacheKey, { rate: fallbackRate, timestamp: now - CACHE_DURATION + 60000 });
      return fallbackRate;
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
    
    // Use fallback rates
    const fallbackRates = getFallbackRates();
    const fallbackRate = fallbackRates[targetCurrency];
    if (fallbackRate) {
      // Cache fallback rate temporarily (expire in 1 minute)
      exchangeRateCache.set(cacheKey, { rate: fallbackRate, timestamp: now - CACHE_DURATION + 60000 });
      return fallbackRate;
    }

    // Last resort: return 1 (no conversion)
    console.warn(`No exchange rate available for ${targetCurrency}, using 1:1 conversion`);
    return 1;
  }
}

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
 * Format number with k, m, b suffixes (no decimals)
 */
export function formatNumberCompact(num: number | string | null | undefined): string {
  // Convert to number and handle edge cases
  const number = typeof num === 'string' ? parseFloat(num) : (num || 0);
  const value = isNaN(number) ? 0 : number;
  
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return Math.round(value).toString();
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
 * Format currency amount compact (no decimals, with k/m/b)
 */
export function formatCurrencyCompact(amount: number, currency: string): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES[BASE_CURRENCY];
  const symbol = currencyInfo.symbol;
  const compact = formatNumberCompact(amount);
  return `${symbol}${compact}`;
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

