'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DotGrid from '@/components/ui/dot-grid';
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/hooks/use-auth';

export function ForgotPasswordPageClient() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render form if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email');
      }

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-background relative overflow-hidden pt-[3.55rem]" style={{ cursor: 'auto' }}>
      {/* DotGrid Background */}
      <div className="absolute inset-0 -z-0">
        <DotGrid
          className="opacity-20 h-full w-full"
          dotSize={4}
          spacing={20}
          returnDuration={1.5}
        />
      </div>

      <div className="flex h-full">
        {/* Forgot Password Form - 1/4 width on desktop, full width on mobile */}
        <div className="w-full lg:w-1/4 flex flex-col border-r border-border relative z-20 bg-background/80 lg:bg-background backdrop-blur-sm lg:backdrop-blur-none">
          {/* Header Banner */}
          <div className="w-full aspect-[1282/645] relative flex-shrink-0">
            <Image
              src="/login-form-hero.svg"
              alt="Renderiq"
              fill
              className="object-contain object-top"
              priority
            />
          </div>

          {/* Form Content */}
          <div className="flex-1 flex items-start justify-center py-6 px-2 sm:px-3 lg:px-4 overflow-y-auto">
            <div className="max-w-md w-full space-y-4">
              {/* Back to Login */}
              <div className="mt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to sign in
                </Link>
              </div>

              {/* Success Message */}
              {success && (
                <Alert className="mt-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    If an account exists with this email, a password reset link has been sent. Please check your inbox.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Form */}
              {!success ? (
                <>
                  <div className="mt-4">
                    <h2 className="text-2xl font-bold text-foreground">Forgot your password?</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                  </div>

                  <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground">
                        Email address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-0.5"
                        placeholder="Enter your email"
                        disabled={isLoading}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send reset link
                        </>
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                    <p><strong>Didn't receive the email?</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Check your spam or junk folder</li>
                      <li>Make sure you entered the correct email address</li>
                      <li>Wait a few minutes and try again</li>
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                    }}
                  >
                    Try another email
                  </Button>
                </div>
              )}

              {/* Sign In Link */}
              <div className="text-center mt-3">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Right Side - 3/4 width with text overlay */}
        <div className="hidden lg:flex lg:w-3/4 relative z-10">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center px-4 max-w-4xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-1.5 leading-tight">
                Reset your password
              </h1>
              <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight">
                Get back to creating
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

