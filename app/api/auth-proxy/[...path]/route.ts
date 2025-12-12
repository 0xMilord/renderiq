import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { unmaskAuthUrl } from '@/lib/utils/url-masker';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';

/**
 * Auth URL Proxy Route
 * 
 * This route proxies requests from auth.renderiq.io/* to Supabase auth endpoints
 * 
 * Example:
 *   User clicks: https://auth.renderiq.io/auth/v1/verify?token=xyz
 *   This proxies to: https://projectid.supabase.co/auth/v1/verify?token=xyz
 *   Supabase processes the request and redirects back
 * 
 * Setup:
 *   1. Point auth.renderiq.io DNS to your Vercel/deployment
 *   2. Configure Vercel to route auth.renderiq.io to this app
 *   3. Update verification links to use masked URLs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // ⚡ Fast path: Handle CORS preflight immediately
  const preflight = handleCORSPreflight(request);
  if (preflight) return preflight;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      logger.error('❌ AuthProxy: NEXT_PUBLIC_SUPABASE_URL not configured');
      const configErrorResponse = NextResponse.json(
        { error: 'Auth proxy not configured' },
        { status: 500 }
      );
      return withCORS(configErrorResponse, request);
    }

    // Reconstruct the path from the catch-all route
    const pathSegments = params.path || [];
    const path = pathSegments.join('/');
    
    // Get query string from original request
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';

    // Build the Supabase auth URL
    const supabaseAuthUrl = `${supabaseUrl}/auth/v1/${path}${queryString}`;

    logger.log('🔄 AuthProxy: Proxying request:', {
      from: request.nextUrl.href,
      to: supabaseAuthUrl,
    });

    // Forward the request to Supabase
    const response = await fetch(supabaseAuthUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'Renderiq-Auth-Proxy',
        'Accept': request.headers.get('accept') || '*/*',
      },
      redirect: 'manual', // Handle redirects manually
    });

    // If Supabase returns a redirect, follow it but preserve the redirect location
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      
      if (location) {
        logger.log('🔄 AuthProxy: Supabase redirect detected:', location);
        // Redirect to the location provided by Supabase
        return NextResponse.redirect(location);
      }
    }

    // Copy response headers
    const headers = new Headers();
    response.headers.forEach((value, key) => {
      // Don't copy content-encoding, transfer-encoding, or connection headers
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Return the response from Supabase
    const body = await response.text();
    
    const proxyResponse = new NextResponse(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    
    // Add CORS headers to proxied response
    return withCORS(proxyResponse, request);
  } catch (error) {
    logger.error('❌ AuthProxy: Error proxying request:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to proxy auth request' },
      { status: 500 }
    );
    return withCORS(errorResponse, request);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // ⚡ Fast path: Handle CORS preflight immediately
  const preflight = handleCORSPreflight(request);
  if (preflight) return preflight;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      logger.error('❌ AuthProxy: NEXT_PUBLIC_SUPABASE_URL not configured');
      const configErrorResponse = NextResponse.json(
        { error: 'Auth proxy not configured' },
        { status: 500 }
      );
      return withCORS(configErrorResponse, request);
    }

    // Reconstruct the path
    const pathSegments = params.path || [];
    const path = pathSegments.join('/');
    
    // Get query string
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';

    // Build the Supabase auth URL
    const supabaseAuthUrl = `${supabaseUrl}/auth/v1/${path}${queryString}`;

    // Get request body
    const body = await request.text();

    logger.log('🔄 AuthProxy: Proxying POST request:', {
      from: request.nextUrl.href,
      to: supabaseAuthUrl,
    });

    // Forward the request to Supabase
    const response = await fetch(supabaseAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'Renderiq-Auth-Proxy',
      },
      body,
      redirect: 'manual',
    });

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      
      if (location) {
        logger.log('🔄 AuthProxy: Supabase redirect detected:', location);
        return NextResponse.redirect(location);
      }
    }

    // Copy response headers
    const headers = new Headers();
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Return response
    const responseBody = await response.text();
    
    const proxyResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    
    // Add CORS headers to proxied response
    return withCORS(proxyResponse, request);
  } catch (error) {
    logger.error('❌ AuthProxy: Error proxying POST request:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to proxy auth request' },
      { status: 500 }
    );
    return withCORS(errorResponse, request);
  }
}

// Support all HTTP methods that Supabase might use
export const runtime = 'nodejs'; // Use nodejs runtime for better compatibility with fetch

