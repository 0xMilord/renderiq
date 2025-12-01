import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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
  if (user && !user.email_confirmed_at) {
    // Allow access to verification-related pages and public pages
    const allowedPaths = ['/verify-email', '/login', '/signup', '/auth/callback', '/'];
    const isAllowedPath = allowedPaths.some(path => request.nextUrl.pathname.startsWith(path));
    
    if (!isAllowedPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/verify-email';
      return NextResponse.redirect(url);
    }
  }

  // Protect upload, render, dashboard, engine, and project routes
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/upload') ||
     request.nextUrl.pathname.startsWith('/render') ||
     request.nextUrl.pathname.startsWith('/project') ||
     request.nextUrl.pathname.startsWith('/dashboard') ||
     request.nextUrl.pathname.startsWith('/api/protected') ||
     request.nextUrl.pathname.startsWith('/engine'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
