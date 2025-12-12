/**
 * Client-Side Country Detection Utility
 * 
 * Browser-only functions for country detection
 * No server-only imports
 */

export type CountryCode = string; // ISO 3166-1 alpha-2 country code

/**
 * Check if country should use Razorpay (India only)
 */
export function shouldUseRazorpay(country: CountryCode): boolean {
  return country === 'IN';
}

/**
 * Check if country should use Paddle (all except India)
 */
export function shouldUsePaddle(country: CountryCode): boolean {
  return country !== 'IN';
}

/**
 * Get payment provider for country
 */
export function getPaymentProviderForCountry(country: CountryCode): 'razorpay' | 'paddle' {
  return shouldUseRazorpay(country) ? 'razorpay' : 'paddle';
}

/**
 * Client-side country detection (browser only)
 * Less accurate than server-side, but useful for UI decisions
 */
export function detectCountryClientSide(): CountryCode {
  if (typeof window === 'undefined') {
    return 'US'; // Default to international
  }

  try {
    // Check localStorage for saved country
    const savedCountry = localStorage.getItem('user_country');
    if (savedCountry && /^[A-Z]{2}$/.test(savedCountry)) {
      return savedCountry;
    }

    // Try to detect from browser locale
    const locale = navigator.language || (navigator as any).userLanguage || 'en-US';
    const countryCode = locale.split('-')[1]?.toUpperCase();
    
    if (countryCode && countryCode.length === 2) {
      return countryCode;
    }

    // Default to US (international)
    return 'US';
  } catch (error) {
    console.error('Error detecting country client-side:', error);
    return 'US';
  }
}

/**
 * Save country to localStorage (client-side)
 */
export function saveCountryToStorage(country: CountryCode): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('user_country', country);
  } catch (error) {
    console.error('Error saving country to storage:', error);
  }
}

