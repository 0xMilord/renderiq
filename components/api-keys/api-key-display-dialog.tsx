'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Copy, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyDisplayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: {
    key: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
  };
}

export function ApiKeyDisplayDialog({ open, onOpenChange, apiKey }: ApiKeyDisplayDialogProps) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  const displayKey = revealed ? apiKey.key : `${apiKey.keyPrefix}${'•'.repeat(32)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            API Key Created
          </DialogTitle>
          <DialogDescription>
            Your API key has been created. Copy it now - you won't be able to see it again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Key Name</label>
            <p className="text-sm text-muted-foreground">{apiKey.name}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-sm bg-muted p-3 rounded-lg border break-all">
                {displayKey}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setRevealed(!revealed)}
                title={revealed ? 'Hide key' : 'Reveal key'}
              >
                {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {apiKey.scopes.map((scope) => (
                <span
                  key={scope}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Warning:</strong> This is the only time you'll be able to see the full API key.
              Make sure to copy and store it securely. If you lose it, you'll need to create a new key.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              I've Saved My Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

