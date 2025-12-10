'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Copy, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { createCustomLinkAction, getAmbassadorDashboardAction } from '@/lib/actions/ambassador.actions';
import type { AmbassadorLink } from '@/lib/db/schema';

interface CustomLinksManagerProps {
  links: AmbassadorLink[];
  ambassadorCode: string;
  onLinkCreated?: () => void;
}

export function CustomLinksManager({ links: initialLinks, ambassadorCode, onLinkCreated }: CustomLinksManagerProps) {
  const [links, setLinks] = useState(initialLinks);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Update links when initialLinks changes
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const [formData, setFormData] = useState({
    campaignName: '',
    description: '',
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const defaultLink = `${baseUrl}/signup?ref=${ambassadorCode}`;

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
        // Refresh links from server to get accurate data
        const dashboardResult = await getAmbassadorDashboardAction();
        if (dashboardResult.success && dashboardResult.data) {
          setLinks(dashboardResult.data.links || []);
        } else {
          // Fallback: add the new link to the list
          setLinks([result.link, ...links]);
        }
        setFormData({ campaignName: '', description: '' });
        setShowForm(false);
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

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Default Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Default Referral Link</CardTitle>
          <CardDescription>Share this link to start earning commissions</CardDescription>
        </CardHeader>
        <CardContent>
          {!ambassadorCode ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your ambassador code is not set. Please contact support to activate your referral code.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-xs sm:text-sm break-all min-w-0">
                {defaultLink}
              </code>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(defaultLink, 'default')}
                  className="flex-shrink-0"
                >
                  {copiedId === 'default' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-shrink-0"
                >
                  <a href={defaultLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Custom Link */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Links</CardTitle>
              <CardDescription>Create custom tracking links for different campaigns</CardDescription>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            )}
          </div>
        </CardHeader>
        {showForm && (
          <CardContent>
            <form onSubmit={handleCreateLink} className="space-y-4">
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
                  placeholder="Describe this campaign..."
                  rows={3}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Link'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setFormData({ campaignName: '', description: '' });
                  setError(null);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Links List */}
      {links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Custom Links</CardTitle>
            <CardDescription>{links.length} custom link{links.length !== 1 ? 's' : ''} created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {links.map((link) => (
                <div key={link.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {link.campaignName && (
                        <h4 className="font-semibold mb-1 text-sm sm:text-base break-words">{link.campaignName}</h4>
                      )}
                      {link.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">{link.description}</p>
                      )}
                      <code className="text-xs bg-muted px-2 py-1 rounded break-all block">
                        {link.url}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link.url, link.id)}
                      >
                        {copiedId === link.id ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span>👆 {link.clickCount} clicks</span>
                    <span>👤 {link.signupCount} signups</span>
                    <span>💳 {link.conversionCount} conversions</span>
                    {!link.isActive && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

