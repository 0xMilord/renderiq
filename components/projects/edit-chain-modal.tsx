'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateRenderChain } from '@/lib/actions/projects.actions';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { RenderChain } from '@/lib/db/schema';

interface EditChainModalProps {
  chain: RenderChain;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChainUpdated?: (chain: RenderChain) => void;
}

export function EditChainModal({ chain, open, onOpenChange, onChainUpdated }: EditChainModalProps) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    name: chain.name || '',
    description: chain.description || '',
  });

  // Update form data when chain changes
  useEffect(() => {
    if (chain) {
      setFormData({
        name: chain.name || '',
        description: chain.description || '',
      });
    }
  }, [chain]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    logger.log('🚀 [EditChainModal] Form submitted');
    
    const chainName = event.currentTarget.chainName.value.trim();
    if (!chainName) {
      toast.error('Please enter a chain name');
      return;
    }

    setLoading(true);
    try {
      logger.log('📝 [EditChainModal] Updating chain:', chain.id);

      const updateData = {
        name: chainName,
        description: event.currentTarget.description.value.trim() || null,
      };

      logger.log('🎨 [EditChainModal] Calling updateRenderChain...');
      const result = await updateRenderChain(chain.id, updateData);
      logger.log('📊 [EditChainModal] updateRenderChain result:', result);
      
      if (result.success && result.data) {
        logger.log('✅ [EditChainModal] Chain updated successfully');
        toast.success('Chain updated successfully');
        onOpenChange(false);
        // Notify parent component about the updated chain
        if (onChainUpdated) {
          onChainUpdated(result.data);
        }
      } else {
        console.error('❌ [EditChainModal] Chain update failed:', result.error);
        toast.error(result.error || 'Failed to update chain');
      }
    } catch (error) {
      console.error('❌ [EditChainModal] Unexpected error:', error);
      toast.error('An error occurred while updating the chain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[95vw]" suppressHydrationWarning>
        <DialogHeader>
          <DialogTitle>Edit Chain</DialogTitle>
          <DialogDescription>
            Update your chain details. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Chain Name */}
            <div className="space-y-2">
              <Label htmlFor="chainName">Chain Name</Label>
              <Input
                id="chainName"
                name="chainName"
                placeholder="Enter chain name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={100}
                className="w-full"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter chain description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                maxLength={500}
                className="w-full resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/500 characters
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
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

