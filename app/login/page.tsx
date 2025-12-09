'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DotGrid from '@/components/ui/dot-grid';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { logger } from '@/lib/utils/logger';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading, signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Don't render login form if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    logger.log('🔐 Login: Starting Google sign in');
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error || 'An error occurred');
        setIsLoading(false);
      }
      // Don't set loading to false here as user will be redirected
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };


  return (
    <div className="h-screen bg-background relative overflow-hidden pt-[3.55rem]" style={{ cursor: 'auto' }}>
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
        {/* Login Form - 1/4 width on desktop, full width on mobile */}
        <div className="w-full lg:w-1/4 flex flex-col border-r border-border relative z-20 bg-background/80 lg:bg-background backdrop-blur-sm lg:backdrop-blur-none">
          {/* Header Banner - matches SVG dimensions (1282x645), 0 padding */}
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
                  className="h-5 w-5 text-foreground"
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
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="mt-0.5 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-5"
                    placeholder="Enter your password"
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
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-1.5">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                />
                <label htmlFor="remember-me" className="ml-1 block text-sm text-foreground">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                  Forgot your password?
                </Link>
              </div>
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
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
          </form>
          
          {/* Create Account Link */}
          <div className="text-center mt-3">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
                Create a new account
              </Link>
            </p>
          </div>
          </div>
          </div>
          </div>
        </div>

        {/* Desktop Right Side - 3/4 width with text overlay */}
        <div className="hidden lg:flex lg:w-3/4 relative z-10">
          {/* Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center px-4 max-w-4xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-1.5 leading-tight">
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
