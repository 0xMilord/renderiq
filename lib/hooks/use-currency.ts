'use client';

import { useState, useEffect } from 'react';
import { detectUserCurrency, formatCurrency, SUPPORTED_CURRENCIES, type CurrencyInfo } from '@/lib/utils/currency';

export function useCurrency() {
  // Default to INR since Razorpay is primarily for Indian market
  const [currency, setCurrency] = useState<string>('INR');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Default to INR for Razorpay (Indian payment gateway), but allow any valid currency
    if (typeof window === 'undefined') {
      return;
    }

    const savedCurrency = localStorage.getItem('user_currency');
    
    // Use saved currency if it's valid, otherwise default to INR
    if (savedCurrency && /^[A-Z]{3}$/.test(savedCurrency)) {
      setCurrency(savedCurrency);
      loadExchangeRate(savedCurrency);
    } else {
      // No valid currency saved, default to INR
      localStorage.setItem('user_currency', 'INR');
      setCurrency('INR');
      loadExchangeRate('INR');
    }
  }, []);

  const loadExchangeRate = async (targetCurrency: string) => {
    try {
      setLoading(true);
      // Use server-side API route to avoid CORS issues
      const response = await fetch(`/api/currency/exchange-rate?currency=${targetCurrency}`);
      const data = await response.json();
      
      if (data.success && data.rate) {
        setExchangeRate(data.rate);
      } else {
        // Fallback to 1 if API fails
        console.warn('Failed to fetch exchange rate, using fallback');
        setExchangeRate(1);
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      // Fallback to 1 on error
      setExchangeRate(1);
    } finally {
      setLoading(false);
    }
  };

  const changeCurrency = async (newCurrency: string) => {
    // Validate currency code format (3 uppercase letters)
    if (!/^[A-Z]{3}$/.test(newCurrency)) {
      console.warn(`Invalid currency code format: ${newCurrency}`);
      return;
    }

    setCurrency(newCurrency);
    localStorage.setItem('user_currency', newCurrency);
    await loadExchangeRate(newCurrency);
  };

  // Convert using the cached exchange rate (synchronous)
  const convert = (amountInINR: number): number => {
    if (currency === 'INR') {
      return amountInINR;
    }
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

