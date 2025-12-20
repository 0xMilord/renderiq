'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DotGrid from '@/components/ui/dot-grid';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Key } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/hooks/use-auth';
import { sendPasswordResetConfirmationEmail } from '@/lib/services/email.service';

export function ResetPasswordClient() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Check for reset token in URL hash (Supabase uses hash fragments)
  useEffect(() => {
    const checkResetToken = async () => {
      try {
        const supabase = createClient();
        
        // Check for token in URL hash first
        const hash = window.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const type = params.get('type');
          
          if (accessToken && type === 'recovery') {
            // Token is in URL, Supabase client will automatically handle it
            // Wait a moment for Supabase to process the token
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if session was created
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
              // Session created successfully, clear hash for security
              window.history.replaceState(null, '', window.location.pathname);
              setIsValidatingToken(false);
              return;
            }
          }
        }
        
        // Check if we have a session (might already exist)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Session exists, token is valid
          setIsValidatingToken(false);
        } else {
          // No valid token found
          setError('Invalid or expired reset link. Please request a new password reset.');
          setIsValidatingToken(false);
        }
      } catch (error) {
        setError('Error validating reset link. Please try again.');
        setIsValidatingToken(false);
      }
    };

    if (!authLoading) {
      checkResetToken();
    }
  }, [authLoading]);

  // Redirect authenticated users to dashboard after successful reset
  useEffect(() => {
    if (success && user) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, user, router]);

  // Show loading state while checking auth or validating token
  if (authLoading || isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Update password
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Send confirmation email
      if (data.user?.email) {
        try {
          await sendPasswordResetConfirmationEmail({
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
          });
        } catch (emailError) {
          // Don't fail password reset if email fails
          console.error('Failed to send confirmation email:', emailError);
        }
      }

      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !isValidatingToken && !success) {
    return (
      <div className="h-screen bg-background relative overflow-hidden pt-[3.55rem]">
        <div className="flex items-center justify-center h-full py-6 px-2 sm:px-3 lg:px-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="text-center space-y-2">
              <Link href="/forgot-password">
                <Button variant="outline" className="w-full">
                  Request new reset link
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        {/* Reset Password Form - 1/4 width on desktop, full width on mobile */}
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
                    Password reset successfully! Redirecting to dashboard...
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && !success && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Form */}
              {!success ? (
                <>
                  <div className="mt-4">
                    <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Enter your new password below.
                    </p>
                  </div>

                  <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-foreground">
                        New password
                      </label>
                      <div className="mt-0.5 relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-5"
                          placeholder="Enter your new password"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                        Confirm password
                      </label>
                      <div className="mt-0.5 relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pr-5"
                          placeholder="Confirm your new password"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Reset password
                        </>
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="mt-4 text-center">
                  <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Password reset successful!</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your password has been updated. Redirecting to dashboard...
                  </p>
                </div>
              )}

              {/* Sign In Link */}
              {!success && (
                <div className="text-center mt-3">
                  <p className="text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                      Sign in
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Right Side - 3/4 width with text overlay */}
        <div className="hidden lg:flex lg:w-3/4 relative z-10">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center px-4 max-w-4xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-1.5 leading-tight">
                Create a new password
              </h1>
              <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight">
                Secure your account
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

