'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { duplicateRenderChain } from '@/lib/actions/projects.actions';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { RenderChain } from '@/lib/db/schema';

interface DuplicateChainModalProps {
  chain: RenderChain;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChainDuplicated?: (chain: RenderChain) => void;
}

export function DuplicateChainModal({ chain, open, onOpenChange, onChainDuplicated }: DuplicateChainModalProps) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [chainName, setChainName] = useState('');

  // Set default name when modal opens
  useEffect(() => {
    if (open && chain) {
      setChainName(`${chain.name} (Copy)`);
    }
  }, [open, chain]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    logger.log('🚀 [DuplicateChainModal] Form submitted');
    
    const name = chainName.trim();
    if (!name) {
      toast.error('Please enter a chain name');
      return;
    }

    setLoading(true);
    try {
      logger.log('📝 [DuplicateChainModal] Duplicating chain:', chain.id);

      const result = await duplicateRenderChain(chain.id, name);
      logger.log('📊 [DuplicateChainModal] duplicateRenderChain result:', result);
      
      if (result.success && result.data) {
        logger.log('✅ [DuplicateChainModal] Chain duplicated successfully');
        toast.success('Chain duplicated successfully');
        onOpenChange(false);
        setChainName('');
        // Reset form safely
        if (formRef.current) {
          formRef.current.reset();
        }
        // Notify parent component about the duplicated chain
        if (onChainDuplicated) {
          onChainDuplicated(result.data);
        }
      } else {
        console.error('❌ [DuplicateChainModal] Chain duplication failed:', result.error);
        toast.error(result.error || 'Failed to duplicate chain');
      }
    } catch (error) {
      console.error('❌ [DuplicateChainModal] Unexpected error:', error);
      toast.error('An error occurred while duplicating the chain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[95vw]" suppressHydrationWarning>
        <DialogHeader>
          <DialogTitle>Duplicate Chain</DialogTitle>
          <DialogDescription>
            Create a copy of &quot;{chain.name}&quot;. You can change the name if needed.
          </DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Chain Name */}
            <div className="space-y-2">
              <Label htmlFor="chainName">New Chain Name</Label>
              <Input
                id="chainName"
                name="chainName"
                placeholder="Enter chain name"
                value={chainName}
                onChange={(e) => setChainName(e.target.value)}
                required
                maxLength={100}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                This will create a copy of the chain. Renders will not be duplicated.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Duplicating...' : 'Duplicate Chain'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

