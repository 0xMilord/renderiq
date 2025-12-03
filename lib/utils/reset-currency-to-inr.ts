/**
 * Utility to reset user currency preference to INR
 * Call this on app initialization to ensure INR is default for Razorpay
 */

export function resetCurrencyToINR() {
  if (typeof window === 'undefined') {
    return;
  }

  const savedCurrency = localStorage.getItem('user_currency');
  
  // Reset to INR if USD or no currency saved
  if (!savedCurrency || savedCurrency === 'USD') {
    localStorage.setItem('user_currency', 'INR');
  }
}

