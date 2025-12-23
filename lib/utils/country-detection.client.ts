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
 * Synchronous version for immediate use (uses cached/localStorage)
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

    // Fallback: Try to detect from browser locale
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
 * Async client-side country detection with API fallback
 * Fetches country from API route (uses IP geolocation)
 */
export async function detectCountryClientSideAsync(): Promise<CountryCode> {
  if (typeof window === 'undefined') {
    return 'US'; // Default to international
  }

  try {
    // Check localStorage for saved country first
    const savedCountry = localStorage.getItem('user_country');
    if (savedCountry && /^[A-Z]{2}$/.test(savedCountry)) {
      return savedCountry;
    }

    // Try to fetch from API route (uses IP geolocation)
    try {
      const response = await fetch('/api/geolocation', {
        cache: 'force-cache', // Cache for 1 hour
        next: { revalidate: 3600 }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.country && data.country.length === 2) {
          // Save to localStorage for future use
          localStorage.setItem('user_country', data.country);
          return data.country;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch country from API, using fallback:', error);
    }

    // Fallback: Try to detect from browser locale
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

