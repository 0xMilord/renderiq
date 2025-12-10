'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import type { RenderChain } from '@/lib/db/schema';

interface DeleteChainDialogProps {
  chain: RenderChain;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeleteChainDialog({ chain, open, onOpenChange, onConfirm }: DeleteChainDialogProps) {
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const chainName = chain.name || '';

  // Reset confirmation name when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmName('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (confirmName.trim() !== chainName.trim()) {
      return; // Don't proceed if names don't match
    }

    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
      setConfirmName('');
    } catch (error) {
      console.error('Error deleting chain:', error);
    } finally {
      setLoading(false);
    }
  };

  const isNameMatch = confirmName.trim() === chainName.trim();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Chain</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            This action cannot be undone. This will permanently delete the chain{' '}
            <span className="font-semibold text-foreground">&quot;{chainName}&quot;</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Note: This will remove the chain, but renders will not be deleted. They will just be removed from this chain.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-name">
            Type <span className="font-mono font-semibold text-foreground">&quot;{chainName}&quot;</span> to confirm:
          </Label>
          <div className="relative">
            <Input
              id="confirm-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={chainName}
              className="font-mono relative z-10 bg-transparent"
              disabled={loading}
              autoFocus
            />
            {confirmName.length < chainName.length && (
              <div className="absolute inset-0 flex items-center pointer-events-none z-0 px-3 text-muted-foreground/50 font-mono">
                <span className="invisible">{confirmName}</span>
                <span>{chainName.slice(confirmName.length)}</span>
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isNameMatch || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete Chain'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

