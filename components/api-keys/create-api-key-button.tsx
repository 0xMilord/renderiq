'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateApiKeyDialog } from './create-api-key-dialog';
import { ApiKeyDisplayDialog } from './api-key-display-dialog';
import { Plus } from 'lucide-react';
import type { ApiKeyResponse } from '@/lib/actions/api-keys.actions';

export function CreateApiKeyButton() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [displayDialogOpen, setDisplayDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<ApiKeyResponse | null>(null);

  const handleCreateSuccess = (result: { success: boolean; data?: ApiKeyResponse }) => {
    if (result.success && result.data && result.data.key) {
      setNewApiKey(result.data);
      setCreateDialogOpen(false);
      setDisplayDialogOpen(true);
    }
  };

  return (
    <>
      <Button onClick={() => setCreateDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create API Key
      </Button>

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setNewApiKey(null);
          }
        }}
        onSuccess={handleCreateSuccess}
      />

      {newApiKey && newApiKey.key && (
        <ApiKeyDisplayDialog
          open={displayDialogOpen}
          onOpenChange={(open) => {
            setDisplayDialogOpen(open);
            if (!open) {
              setNewApiKey(null);
            }
          }}
          apiKey={{
            key: newApiKey.key,
            name: newApiKey.name,
            keyPrefix: newApiKey.keyPrefix,
            scopes: newApiKey.scopes,
          }}
        />
      )}
    </>
  );
}

