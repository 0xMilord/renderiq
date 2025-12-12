'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, AlertCircle, Info } from 'lucide-react';
import { useApiKeys } from '@/lib/hooks/use-api-keys';
import type { CreateApiKeyInput } from '@/lib/actions/api-keys.actions';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: { success: boolean; data?: any; error?: string }) => void;
}

const VALID_SCOPES = [
  { id: 'renders:create', label: 'Create Renders', description: 'Create new render requests' },
  { id: 'renders:read', label: 'Read Renders', description: 'View render status and details' },
  { id: 'projects:read', label: 'Read Projects', description: 'View project information' },
  { id: 'webhook:write', label: 'Manage Webhooks', description: 'Register and manage webhooks' },
];

export function CreateApiKeyDialog({ open, onOpenChange, onSuccess }: CreateApiKeyDialogProps) {
  const { createKey, creating } = useApiKeys();
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['renders:create', 'renders:read']);
  const [error, setError] = useState<string | null>(null);

  const handleScopeToggle = (scopeId: string) => {
    setSelectedScopes(prev =>
      prev.includes(scopeId)
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('API key name is required');
      return;
    }

    if (selectedScopes.length === 0) {
      setError('At least one scope must be selected');
      return;
    }

    const input: CreateApiKeyInput = {
      name: name.trim(),
      scopes: selectedScopes,
      expiresAt: null,
    };

    const result = await createKey(input);
    if (result.success && result.data) {
      // Reset form
      setName('');
      setSelectedScopes(['renders:create', 'renders:read']);
      setError(null);
      // Notify parent of success
      onSuccess?.(result);
      return result;
    } else {
      setError(result.error || 'Failed to create API key');
    }
  };

  const handleCancel = () => {
    setName('');
    setSelectedScopes(['renders:create', 'renders:read']);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Create API Key
          </DialogTitle>
          <DialogDescription>
            Create a new API key to authenticate requests from your plugins or applications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">API Key Name</Label>
            <Input
              id="name"
              placeholder="e.g., SketchUp Plugin, Production Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
              required
            />
            <p className="text-xs text-muted-foreground">
              Give your API key a descriptive name to identify it later.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Permissions (Scopes)</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Select the permissions this API key should have. Only grant the minimum permissions needed.
            </p>
            <div className="space-y-3 border rounded-lg p-4">
              {VALID_SCOPES.map((scope) => (
                <div key={scope.id} className="flex items-start gap-3">
                  <Checkbox
                    id={scope.id}
                    checked={selectedScopes.includes(scope.id)}
                    onCheckedChange={() => handleScopeToggle(scope.id)}
                    disabled={creating}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={scope.id}
                      className="text-sm font-medium cursor-pointer leading-none"
                    >
                      {scope.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{scope.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Important:</strong> You'll only be able to see the full API key once after creation.
              Make sure to copy and store it securely.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !name.trim() || selectedScopes.length === 0}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Create API Key
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

