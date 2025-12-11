/**
 * Utility to set default currency preference to INR if none is saved
 * Call this on app initialization to ensure INR is default for Razorpay
 * Note: Now allows any valid currency including USD
 */

export function resetCurrencyToINR() {
  if (typeof window === 'undefined') {
    return;
  }

  const savedCurrency = localStorage.getItem('user_currency');
  
  // Only set default to INR if no valid currency is saved
  // Allow any valid 3-letter currency code including USD
  if (!savedCurrency || !/^[A-Z]{3}$/.test(savedCurrency)) {
    localStorage.setItem('user_currency', 'INR');
  }
}

