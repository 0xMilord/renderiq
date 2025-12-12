'use client';

import { Button } from '@/components/ui/button';
import { useCurrency } from '@/lib/hooks/use-currency';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency';
import { useState, useEffect } from 'react';

export function CurrencyToggle() {
  const { currency, currencyInfo, changeCurrency } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleCurrencyChange = async (newCurrency: 'INR' | 'USD') => {
    if (changeCurrency) {
      // Call changeCurrency and wait for it to complete
      await changeCurrency(newCurrency);
      // Force a small delay to ensure state updates propagate
      // The components should re-render automatically via useEffect dependencies
    } else {
      // Fallback: directly update localStorage and reload
      localStorage.setItem('user_currency', newCurrency);
      window.location.reload();
    }
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg border">
      <Button
        variant={currency === 'INR' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleCurrencyChange('INR')}
        className={`flex-1 ${currency === 'INR' ? 'bg-primary text-primary-foreground' : ''}`}
      >
        <span className="mr-1">{SUPPORTED_CURRENCIES.INR.symbol}</span>
        INR
      </Button>
      <Button
        variant={currency === 'USD' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleCurrencyChange('USD')}
        className={`flex-1 ${currency === 'USD' ? 'bg-primary text-primary-foreground' : ''}`}
      >
        <span className="mr-1">{SUPPORTED_CURRENCIES.USD.symbol}</span>
        USD
      </Button>
    </div>
  );
}

