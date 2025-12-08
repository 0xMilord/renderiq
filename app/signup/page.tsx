'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DotGrid from '@/components/ui/dot-grid';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { logger } from '@/lib/utils/logger';
import { collectDeviceFingerprint, storeFingerprintInCookie } from '@/lib/utils/client-fingerprint';

export default function SignupPage() {
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
  const [success, setSuccess] = useState(false);
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

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      // Check for redirect parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
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

  // Don't render signup form if user is authenticated (will redirect)
  if (user) {
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
      } else {
        setSuccess(true);
        // Get redirect parameter if present
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/dashboard';
        setTimeout(() => {
          router.push(redirectTo);
        }, 2000);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
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


  if (success) {
    return (
      <div className="min-h-screen bg-background relative">
        {/* DotGrid Background */}
        <div className="absolute inset-0 overflow-hidden -z-0 opacity-30">
          <DotGrid
            dotSize={10}
            gap={15}
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
            className="h-full w-full"
          />
        </div>
        
        <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-md w-full text-center bg-background/80 backdrop-blur-sm rounded-lg p-8">
            <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Account Created Successfully!
            </h2>
            <p className="text-muted-foreground mb-6">
              Please check your email to verify your account before signing in.
            </p>
            <Link href="/login">
              <Button>Go to Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.55rem)] bg-background relative overflow-hidden" style={{ cursor: 'auto' }}>
      {/* DotGrid Background - shown on all devices */}
      <div className="absolute inset-0 overflow-hidden z-0 opacity-30">
        <DotGrid
          dotSize={10}
          gap={15}
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
          className="h-full w-full"
        />
      </div>

      <div className="flex h-full">
        {/* Signup Form - 1/4 width on desktop, full width on mobile */}
        <div className="w-full lg:w-1/4 flex flex-col border-r border-border relative z-20 bg-background/80 lg:bg-background backdrop-blur-sm lg:backdrop-blur-none">
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
          <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto">
          <div className="max-w-md w-full space-y-8">
          <div className="border border-border rounded-lg p-2">
            <h2 className="text-center text-xl font-extrabold text-foreground">
              Create your account
            </h2>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Or{' '}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                sign in to your existing account
              </Link>
            </p>
          </div>

          {/* Google Sign In - Prominent with Glow Effect */}
          <div className="mt-8">
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
                className="w-full flex items-center justify-center space-x-3 py-6 text-base font-semibold relative z-10 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
              >
                <svg 
                  className={`h-5 w-5 ${mounted && (resolvedTheme === 'dark' ? 'text-[hsl(0,0%,7%)]' : 'text-[hsl(0,0%,92%)]')}`}
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
            <p className="text-center text-sm text-muted-foreground mt-4">
              Sign up for free 10 credits!
            </p>
          </div>

          {/* Email/Password Form */}
          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
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
                  className="mt-1"
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
                  className="mt-1"
                  placeholder="Enter your email"
                />
              </div>
              
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pr-10"
                    placeholder="Create a password"
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
                <div className="mt-1 relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pr-10"
                    placeholder="Confirm your password"
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
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

                  <div className="grid grid-cols-[60%_40%] gap-4 items-center">
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                        className="h-4 w-4 text-primary focus:ring-primary border-input rounded flex-shrink-0"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-foreground">
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
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
                    </div>
            </div>
          </form>
          </div>
          </div>
          </div>
        </div>

        {/* Desktop Right Side - 3/4 width with text overlay */}
        <div className="hidden lg:flex lg:w-3/4 relative z-10">
          {/* Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center px-8 max-w-4xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-3 leading-tight">
                Create what you imagine
              </h1>
              <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight">
                Build what you imagine
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
