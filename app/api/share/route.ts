import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';

/**
 * Share Target API Handler
 * Handles POST requests from Web Share Target API
 */
export async function POST(request: NextRequest) {
  // ⚡ Fast path: Handle CORS preflight immediately
  const preflight = handleCORSPreflight(request);
  if (preflight) return preflight;

  try {
    const formData = await request.formData();
    
    const title = formData.get('title') as string | null;
    const text = formData.get('text') as string | null;
    const url = formData.get('url') as string | null;
    const files = formData.getAll('files') as File[];

    logger.log('📤 Share Target API received:', {
      title,
      text,
      url,
      filesCount: files.length,
    });

    // Process shared content
    // In a real implementation, you might want to:
    // 1. Save files to storage
    // 2. Create a render with shared content
    // 3. Redirect to render page

    // For now, redirect to share page with query params
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (text) params.set('text', text);
    if (url) params.set('url', url);

    const redirectResponse = NextResponse.redirect(new URL(`/share?${params.toString()}`, request.url));
    return withCORS(redirectResponse, request);
  } catch (error) {
    logger.error('❌ Share Target API error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to process shared content' },
      { status: 500 }
    );
    return withCORS(errorResponse, request);
  }
}












