import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';

/**
 * Manifest route handler
 * Serves PWA manifest with proper CORS headers
 */
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const preflight = handleCORSPreflight(request, {
    allowedMethods: ['GET', 'OPTIONS'],
  });
  if (preflight) return preflight;

  try {
    // Read manifest.json from public folder
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    const response = NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=86400',
      },
    });

    // Add CORS headers using centralized middleware
    return withCORS(response, request, {
      allowedMethods: ['GET'],
      allowCredentials: false, // Manifest doesn't need credentials
    });
  } catch (error) {
    console.error('Error reading manifest:', error);
    const errorResponse = NextResponse.json(
      { error: 'Manifest not found' },
      { status: 404 }
    );
    return withCORS(errorResponse, request);
  }
}

