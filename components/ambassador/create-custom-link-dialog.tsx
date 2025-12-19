'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { createCustomLinkAction, getAmbassadorDashboardAction } from '@/lib/actions/ambassador.actions';
import { toast } from 'sonner';

interface CreateCustomLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkCreated?: () => void;
}

export function CreateCustomLinkDialog({ open, onOpenChange, onLinkCreated }: CreateCustomLinkDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    campaignName: '',
    description: '',
  });

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const result = await createCustomLinkAction(
        formData.campaignName || undefined,
        formData.description || undefined
      );

      if (result.success && result.link) {
        toast.success('Custom link created successfully');
        setFormData({ campaignName: '', description: '' });
        onOpenChange(false);
        onLinkCreated?.();
      } else {
        setError(result.error || 'Failed to create link');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Custom Link</DialogTitle>
          <DialogDescription>
            Create a custom tracking link for your campaigns
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateLink} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="campaignName">Campaign Name (Optional)</Label>
            <Input
              id="campaignName"
              value={formData.campaignName}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              placeholder="e.g., Summer 2025"
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this campaign"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Link'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

