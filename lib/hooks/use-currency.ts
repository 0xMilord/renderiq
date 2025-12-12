'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, SUPPORTED_CURRENCIES, type CurrencyInfo } from '@/lib/utils/currency';
import { detectCountryClientSide, shouldUseRazorpay } from '@/lib/utils/country-detection.client';

/**
 * Currency Hook with Manual Toggle Support
 * 
 * Simple logic:
 * - India (IN) → Defaults to INR (no conversion)
 * - Not India → Defaults to USD (convert from INR base prices)
 * - User can manually toggle between INR and USD
 */
export function useCurrency() {
  const [currency, setCurrency] = useState<string>('INR');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const loadExchangeRate = useCallback(async (targetCurrency: string) => {
    try {
      setLoading(true);
      // Use server-side API route to avoid CORS issues
      const response = await fetch(`/api/currency/exchange-rate?currency=${targetCurrency}`);
      const data = await response.json();
      
      if (data.success && data.rate) {
        setExchangeRate(data.rate);
      } else {
        // Fallback to approximate rate: 1 INR = 0.01 USD (100 INR = 1 USD)
        console.warn('Failed to fetch exchange rate, using fallback');
        setExchangeRate(0.01); // 1 INR = 0.01 USD (100 INR = 1 USD)
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      // Fallback to approximate rate: 1 INR = 0.01 USD (100 INR = 1 USD)
      setExchangeRate(0.01);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Check if user has manually selected a currency
    const savedCurrency = localStorage.getItem('user_currency');
    
    if (savedCurrency && (savedCurrency === 'INR' || savedCurrency === 'USD')) {
      // Use saved currency (user preference)
      setCurrency(savedCurrency);
      if (savedCurrency === 'USD') {
        loadExchangeRate('USD');
      } else {
        setExchangeRate(1);
        setLoading(false);
      }
    } else {
      // Auto-detect based on country (first time only)
      const country = detectCountryClientSide();
      const isIndia = shouldUseRazorpay(country);
      
      // Simple logic: India → INR, Not India → USD
      const detectedCurrency = isIndia ? 'INR' : 'USD';
      
      setCurrency(detectedCurrency);
      localStorage.setItem('user_currency', detectedCurrency);
      
      // Load exchange rate only if USD (INR doesn't need conversion)
      if (detectedCurrency === 'USD') {
        loadExchangeRate('USD');
      } else {
        setExchangeRate(1); // No conversion needed for INR
        setLoading(false);
      }
    }
  }, [loadExchangeRate]);

  // Listen for storage changes (when currency is changed in another tab/window)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_currency' && e.newValue && (e.newValue === 'INR' || e.newValue === 'USD')) {
        setCurrency(e.newValue);
        if (e.newValue === 'USD') {
          loadExchangeRate('USD');
        } else {
          setExchangeRate(1);
          setLoading(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadExchangeRate]);

  const changeCurrency = useCallback(async (newCurrency: 'INR' | 'USD') => {
    // Update currency immediately to trigger re-render
    setCurrency(newCurrency);
    localStorage.setItem('user_currency', newCurrency);
    
    if (newCurrency === 'USD') {
      // Load exchange rate for USD
      await loadExchangeRate('USD');
    } else {
      // INR doesn't need conversion
      setExchangeRate(1);
      setLoading(false);
    }
  }, [loadExchangeRate]);

  // Convert using the cached exchange rate (synchronous)
  const convert = (amountInINR: number): number => {
    if (currency === 'INR') {
      return amountInINR;
    }
    // Convert INR to USD: amount * 0.012 (approximate)
    return amountInINR * exchangeRate;
  };

  const format = (amount: number): string => {
    return formatCurrency(amount, currency);
  };

  const currencyInfo: CurrencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR'];

  return {
    currency,
    currencyInfo,
    exchangeRate,
    loading,
    changeCurrency,
    convert,
    format,
  };
}

