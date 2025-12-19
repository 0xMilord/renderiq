'use client';

import { useState } from 'react';
import { useAmbassador } from '@/lib/hooks/use-ambassador';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export function AmbassadorReferralBadge() {
  const { ambassador, loading } = useAmbassador();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!ambassador?.code) return;
    
    try {
      await navigator.clipboard.writeText(ambassador.code);
      setCopied(true);
      toast.success('Referral code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy referral code');
    }
  };

  if (loading) {
    return <Skeleton className="h-10 w-64" />;
  }

  if (!ambassador?.code) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 bg-secondary/50 border border-border rounded-lg px-4 py-2 h-10">
      <span className="text-sm text-muted-foreground">Your referral code:</span>
      <code className="font-mono text-base font-semibold">{ambassador.code}</code>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-6 w-6 p-0 shrink-0"
        title="Copy referral code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

