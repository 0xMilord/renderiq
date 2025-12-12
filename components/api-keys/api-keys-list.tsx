'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Key, Trash2, Copy, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useApiKeys } from '@/lib/hooks/use-api-keys';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const SCOPE_LABELS: Record<string, string> = {
  'renders:create': 'Create Renders',
  'renders:read': 'Read Renders',
  'projects:read': 'Read Projects',
  'webhook:write': 'Manage Webhooks',
};

export function ApiKeysList() {
  const { keys, loading, revokeKey, revoking } = useApiKeys();
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<{ id: string; name: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRevokeClick = (key: { id: string; name: string }) => {
    setKeyToRevoke(key);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!keyToRevoke) return;
    const success = await revokeKey(keyToRevoke.id);
    if (success) {
      setRevokeDialogOpen(false);
      setKeyToRevoke(null);
    }
  };

  const handleCopyPrefix = async (keyPrefix: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(keyPrefix);
      setCopiedId(keyId);
      toast.success('Key prefix copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isExpiringSoon = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading API keys...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (keys.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first API key to start using the Renderiq API
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage your API keys. Revoke any key you no longer need.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => {
                  const expired = isExpired(key.expiresAt);
                  const expiringSoon = isExpiringSoon(key.expiresAt);
                  const isRevoking = revoking === key.id;

                  return (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {key.keyPrefix}...
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyPrefix(key.keyPrefix, key.id)}
                            title="Copy key prefix"
                          >
                            {copiedId === key.id ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.slice(0, 2).map((scope) => (
                            <Badge key={scope} variant="secondary" className="text-xs">
                              {SCOPE_LABELS[scope] || scope}
                            </Badge>
                          ))}
                          {key.scopes.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{key.scopes.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {key.isActive ? (
                            <Badge variant="default" className="w-fit">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="w-fit">
                              Revoked
                            </Badge>
                          )}
                          {expired && (
                            <Badge variant="destructive" className="w-fit text-xs">
                              Expired
                            </Badge>
                          )}
                          {expiringSoon && !expired && (
                            <Badge variant="outline" className="w-fit text-xs">
                              Expires Soon
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.lastUsedAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        {key.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevokeClick({ id: key.id, name: key.name })}
                            disabled={isRevoking}
                            className="text-destructive hover:text-destructive"
                          >
                            {isRevoking ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the API key <strong>{keyToRevoke?.name}</strong>?
              This action cannot be undone. Any applications using this key will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setKeyToRevoke(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

