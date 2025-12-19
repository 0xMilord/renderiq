import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeysList } from '@/components/api-keys/api-keys-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Shield, Lock } from 'lucide-react';

export default function ApiKeysPage() {
  return (
    <div className="h-full w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="w-full space-y-6">
          {/* API Keys List */}
          <Suspense fallback={
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading API keys...</div>
                </div>
              </CardContent>
            </Card>
          }>
            <ApiKeysList />
          </Suspense>

          {/* Documentation and Security in same row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Using API Keys */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Using API Keys
                </CardTitle>
                <CardDescription>
                  Learn how to use your API keys to authenticate requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Include your API key in the <code className="px-1.5 py-0.5 bg-muted rounded text-xs">Authorization</code> header:
                  </p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    <code>Authorization: Bearer rk_live_your_api_key_here</code>
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Available Scopes</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <code className="text-xs font-mono">renders:create</code>
                        <p className="text-xs text-muted-foreground">Create new render requests</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <code className="text-xs font-mono">renders:read</code>
                        <p className="text-xs text-muted-foreground">View render status and details</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <code className="text-xs font-mono">projects:read</code>
                        <p className="text-xs text-muted-foreground">View project information</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <code className="text-xs font-mono">webhook:write</code>
                        <p className="text-xs text-muted-foreground">Register and manage webhooks</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    For complete API documentation, visit{' '}
                    <a
                      href="/api-docs"
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      API Documentation
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                  <li>Store API keys securely and never commit them to version control</li>
                  <li>Use environment variables or secure storage mechanisms</li>
                  <li>Only grant the minimum permissions (scopes) needed</li>
                  <li>Revoke keys immediately if they're compromised or no longer needed</li>
                  <li>Rotate keys periodically for enhanced security</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

