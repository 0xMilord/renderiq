'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// ✅ FIX: Dynamically import ALL providers to prevent module-level evaluation during SSR
// This ensures Zustand stores and other context-dependent code is never loaded during SSR
const ThemeProvider = dynamic(() => import('@/components/theme-provider').then(mod => ({ default: mod.ThemeProvider })), { ssr: false });
const ErrorBoundary = dynamic(() => import('@/components/error-boundary'), { ssr: false });
const AuthProvider = dynamic(() => import('@/components/providers/auth-provider').then(mod => ({ default: mod.AuthProvider })), { ssr: false });
const UserOnboardingProvider = dynamic(() => import('@/components/user-onboarding-provider').then(mod => ({ default: mod.UserOnboardingProvider })), { ssr: false });
const ConditionalNavbar = dynamic(() => import('@/components/conditional-navbar').then(mod => ({ default: mod.ConditionalNavbar })), { ssr: false });
const ConditionalFooter = dynamic(() => import('@/components/conditional-footer').then(mod => ({ default: mod.ConditionalFooter })), { ssr: false });
const BottomNav = dynamic(() => import('@/components/bottom-nav').then(mod => ({ default: mod.BottomNav })), { ssr: false });

interface ClientProvidersProps {
  children: React.ReactNode;
}

// ✅ FIX: Wrap all providers that use context in a client-only component
// This prevents Zustand, next-themes, and other context-dependent providers
// from being rendered during SSR where React context is null
export function ClientProviders({ children }: ClientProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render providers during SSR - they all use React context
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ErrorBoundary>
        <AuthProvider>
          <UserOnboardingProvider>
            <ConditionalNavbar />
            <main>
              {children}
            </main>
            <ConditionalFooter />
            <BottomNav />
          </UserOnboardingProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

