import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import * as Sentry from '@sentry/nextjs';

/**
 * Unified Middleware
 * Handles:
 * 1. Auth subdomain proxying (auth.renderiq.io -> Supabase)
 * 2. Normal request proxy for Supabase auth
 */
export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const pathname = request.nextUrl.pathname;

  // ========================================
  // 1. Handle auth.renderiq.io subdomain proxying
  // ========================================
  if (hostname === 'auth.renderiq.io' || hostname.startsWith('auth.')) {
    // Only proxy /auth/v1/* paths
    if (pathname.startsWith('/auth/v1/')) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!supabaseUrl) {
        return NextResponse.json(
          { error: 'Supabase URL not configured' },
          { status: 500 }
        );
      }

      // Extract the path after /auth/v1/
      const authPath = pathname.replace('/auth/v1/', '');
      const queryString = request.nextUrl.search;
      
      // Build Supabase URL
      const supabaseAuthUrl = `${supabaseUrl}/auth/v1/${authPath}${queryString}`;

      try {
        // Get request body for POST/PUT/PATCH requests
        let requestBody: string | undefined;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          try {
            requestBody = await request.text();
          } catch {
            requestBody = undefined;
          }
        }

        // Proxy the request to Supabase
        const response = await fetch(supabaseAuthUrl, {
          method: request.method,
          headers: {
            'Content-Type': request.headers.get('content-type') || 'application/json',
            'User-Agent': request.headers.get('user-agent') || 'Renderiq-Auth-Proxy',
            'Accept': request.headers.get('accept') || '*/*',
          },
          body: requestBody,
          redirect: 'manual',
        });

        // If Supabase returns a redirect, follow it
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (location) {
            return NextResponse.redirect(location);
          }
        }

        // Copy response headers (exclude problematic ones)
        const headers = new Headers();
        response.headers.forEach((value, key) => {
          if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(key.toLowerCase())) {
            headers.set(key, value);
          }
        });

        // Get response body
        const responseBody = await response.text();

        // Return the proxied response
        return new NextResponse(responseBody, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch (error) {
        console.error('❌ Middleware: Error proxying auth request:', error);
        Sentry.captureException(error, {
          tags: {
            middleware: true,
            auth_proxy: true,
          },
          extra: {
            hostname,
            pathname,
          },
        });
        return NextResponse.json(
          { error: 'Failed to proxy auth request' },
          { status: 500 }
        );
      }
    }

    // For non-auth paths on auth.renderiq.io, redirect to main domain
    if (pathname !== '/auth/v1/') {
      const url = request.nextUrl.clone();
      url.hostname = 'renderiq.io';
      return NextResponse.redirect(url);
    }
  }

  // ========================================
  // 2. Normal request handling (existing proxy logic)
  // ========================================
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user email is verified (for authenticated users)
  // Allow unverified users to access login, signup, auth callback, and home
  // They can verify their email from the dialog shown after signup
  if (user && !user.email_confirmed_at) {
    const allowedPaths = ['/login', '/signup', '/auth/callback', '/'];
    const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));
    
    if (!isAllowedPath) {
      // Redirect to signup page where they can see verification dialog
      const url = request.nextUrl.clone();
      url.pathname = '/signup';
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated and verified users away from login/signup pages
  // Allow unverified users to stay on signup page to see verification dialog
  if (user && user.email_confirmed_at && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Protect upload, render, dashboard, engine, and project routes
  // IMPORTANT: Don't redirect if user is on signup/login pages - they might be in the middle of signup
  // where no session exists yet (email confirmation required)
  if (
    !user &&
    pathname !== '/signup' &&
    pathname !== '/login' &&
    (pathname.startsWith('/upload') ||
     pathname.startsWith('/render') ||
     pathname.startsWith('/project') ||
     pathname.startsWith('/dashboard') ||
     pathname.startsWith('/api/protected') ||
     pathname.startsWith('/engine'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api (API routes - but we want auth-proxy)
     * - favicon.ico
     * - Static image files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

