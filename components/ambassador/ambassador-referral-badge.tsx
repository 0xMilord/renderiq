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
    return <Skeleton className="h-8 w-56" />;
  }

  if (!ambassador?.code) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 h-8">
      <span className="text-xs text-muted-foreground">Referral code:</span>
      <code className="font-mono text-sm font-semibold">{ambassador.code}</code>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-5 w-5 p-0 shrink-0"
        title="Copy referral code"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

