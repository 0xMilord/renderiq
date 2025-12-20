'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect';
import { VercelCard } from '@/components/ui/vercel-card';
import { TestimonialSlideshow } from '@/components/auth/testimonial-slideshow';
import { Eye, EyeOff, Loader2, CheckCircle, Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { logger } from '@/lib/utils/logger';
import { collectDeviceFingerprint, storeFingerprintInCookie } from '@/lib/utils/client-fingerprint';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SignupPageClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Collect device fingerprint on page load (for email/password signup)
  useEffect(() => {
    try {
      const fingerprint = collectDeviceFingerprint();
      storeFingerprintInCookie(fingerprint);
      logger.log('✅ Signup: Device fingerprint collected and stored');
    } catch (error) {
      logger.warn('⚠️ Signup: Failed to collect fingerprint:', error);
      // Continue without fingerprint - will use minimal detection
    }
  }, []);

  // Store referral code in cookie if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      // Store referral code in cookie (expires in 30 days)
      document.cookie = `ambassador_ref=${refCode}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    }
  }, []);

  // Redirect authenticated and verified users to dashboard
  // Don't redirect unverified users - they need to see the verification dialog
  useEffect(() => {
    if (!authLoading && user && user.email_confirmed_at) {
      // Check for redirect parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    }
  }, [user, authLoading, router]);

  // Poll for email verification status when dialog is open
  useEffect(() => {
    if (!showVerifyDialog || !user) return;

    // If user is already verified, close dialog and redirect
    if (user.email_confirmed_at) {
      setShowVerifyDialog(false);
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
      return;
    }

    // Poll every 3 seconds to check if email is verified
    const pollInterval = setInterval(async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user: refreshedUser } } = await supabase.auth.getUser();
        
        if (refreshedUser?.email_confirmed_at) {
          clearInterval(pollInterval);
          setShowVerifyDialog(false);
          const urlParams = new URLSearchParams(window.location.search);
          const redirectTo = urlParams.get('redirect') || '/dashboard';
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('Error polling for email verification:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [showVerifyDialog, user, router]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render signup form if user is authenticated AND verified (will redirect)
  // Allow unverified users to see the form and verification dialog
  if (user && user.email_confirmed_at) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(formData.email, formData.password, formData.name);
      if (error) {
        setError(error instanceof Error ? error.message : String(error));
        setIsLoading(false);
      } else {
        // Show verification dialog immediately
        // Don't wait for auth state changes - show dialog right away
        setIsLoading(false);
        setShowVerifyDialog(true);
        
        // Log for debugging
        logger.log('✅ Signup: Account created, showing verification dialog');
      }
    } catch (err) {
      logger.error('❌ Signup: Unexpected error:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    logger.log('🔐 Signup: Starting Google sign in');
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error);
        setIsLoading(false);
      }
      // Don't set loading to false here as user will be redirected
    } catch {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setResendError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      setResendSuccess(true);
    } catch (error) {
      setResendError(error instanceof Error ? error.message : 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="h-screen bg-background relative overflow-hidden pt-[3.55rem]" style={{ cursor: 'auto' }}>
      {/* Background Ripple Effect */}
      <div className="absolute inset-0 overflow-hidden z-[5]">
        <BackgroundRippleEffect />
      </div>

      <div className="flex h-full">
        {/* Signup Form - 1/4 width on desktop, full width on mobile */}
        <VercelCard className="w-full lg:w-1/4 flex flex-col border-r border-border relative z-20 bg-background/80 lg:bg-background backdrop-blur-sm lg:backdrop-blur-none overflow-visible" showIcons={true} bordered={true}>
           {/* Header Banner - matches SVG dimensions (1282x645), 0 padding */}
           <div className="w-full aspect-[1282/645] relative flex-shrink-0">
              <Image
               src="/signup-form-hero.svg"
                alt="Renderiq"
               fill
               className="object-contain object-top"
               priority
              />
            </div>
          
          {/* Form Content */}
          <div className="flex-1 flex items-start justify-center py-6 px-2 sm:px-3 lg:px-4 overflow-y-auto">
          <div className="max-w-md w-full space-y-4">
          {/* Google Sign In - Prominent with Glow Effect */}
          <div className="mt-4">
            <div className="relative w-full">
              {/* Glow/Aura effect */}
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-lg -z-10" style={{
                filter: 'blur(20px)',
                opacity: 0.6
              }}></div>
              
              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-1.5 py-3 text-base font-semibold relative z-10 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
              >
                <svg 
                  className="h-5 w-5 text-primary-foreground"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Sign up for free 25 credits!
            </p>
          </div>

          {/* Email/Password Form */}
          <div className="mt-3">
            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-1 bg-background text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Full name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-0.5"
                  placeholder="Enter your full name"
                />
              </div>
              
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
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-0.5"
                  placeholder="Enter your email"
                />
              </div>
              
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="mt-0.5 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pr-5"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-1.5 flex items-center"
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
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pr-5"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-1.5 flex items-center"
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
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-1.5">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

                  <div className="grid grid-cols-[60%_40%] gap-2 items-center">
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                        className="h-4 w-4 text-primary focus:ring-primary border-input rounded flex-shrink-0"
              />
              <label htmlFor="terms" className="ml-1 block text-sm text-foreground">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:text-primary/80">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:text-primary/80">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
                    </div>
            </div>
          </form>
          
          {/* Sign In Link */}
          <div className="text-center mt-3">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                Sign in
              </Link>
            </p>
          </div>
          </div>
          </div>
          </div>
        </VercelCard>

        {/* Desktop Right Side - 3/4 width */}
        <div className="hidden lg:flex lg:w-3/4 relative z-10 pointer-events-auto">
          {/* Twitter Testimonials Slideshow */}
          <TestimonialSlideshow
            testimonials={[
              {
                url: 'https://x.com/CasshyapSa79802/status/1995905411946611051',
                fallback: {
                  text: 'Renderiq has completely transformed how we present designs to clients. The AI renders are incredibly realistic and save us hours of work.',
                  author: 'CasshyapSa79802',
                  username: 'CasshyapSa79802',
                },
              },
              {
                url: 'https://x.com/0xmilords/status/1995907216311025866',
                fallback: {
                  text: 'Amazing AI rendering tool for architecture!',
                  author: '0xmilords',
                  username: '0xmilords',
                },
              },
              {
                url: 'https://x.com/titanidex/status/1995907578480787870',
                fallback: {
                  text: 'Renderiq is a game-changer for architectural visualization.',
                  author: 'titanidex',
                  username: 'titanidex',
                },
              },
              {
                url: 'https://x.com/mogisterate/status/1995907751596490837',
                fallback: {
                  text: 'Love using Renderiq for my design projects!',
                  author: 'mogisterate',
                  username: 'mogisterate',
                },
              },
              {
                url: 'https://x.com/retrobrah/status/1995908179365105973',
                fallback: {
                  text: 'Best AI rendering tool I\'ve tried. Highly recommend!',
                  author: 'retrobrah',
                  username: 'retrobrah',
                },
              },
              {
                url: 'https://x.com/spymilking/status/1995908547490840802',
                fallback: {
                  text: 'Renderiq makes architectural rendering so easy and fast.',
                  author: 'spymilking',
                  username: 'spymilking',
                },
              },
              {
                url: 'https://x.com/0xK4471L/status/1995908727111909851',
                fallback: {
                  text: 'Incredible results with Renderiq! The quality is outstanding.',
                  author: '0xK4471L',
                  username: '0xK4471L',
                },
              },
            ]}
            interval={6000}
          />
        </div>
      </div>

      {/* Email Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Verify your email
            </DialogTitle>
            <DialogDescription className="text-center">
              We've sent a verification link to{' '}
              <span className="font-medium text-foreground">
                {formData.email}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3 text-center">
              <strong>📧 Check your inbox</strong> (and spam folder) for the verification email from Renderiq. 
              Click the link in the email to verify your account.
            </p>

            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Check your inbox</p>
                  <p className="text-xs text-muted-foreground">
                    Look for an email from Renderiq with a verification link
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Click the verification link</p>
                  <p className="text-xs text-muted-foreground">
                    This confirms your email address and activates your account
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Start creating</p>
                  <p className="text-xs text-muted-foreground">
                    Once verified, you'll have full access to all features
                  </p>
                </div>
              </div>
            </div>

            {/* Success message */}
            {resendSuccess && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Verification email sent! Check your inbox.
                </AlertDescription>
              </Alert>
            )}

            {/* Error message */}
            {resendError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resendError}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleResendEmail}
                disabled={isResending || resendSuccess}
                variant="outline"
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : resendSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Email sent!
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend verification email
                  </>
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

