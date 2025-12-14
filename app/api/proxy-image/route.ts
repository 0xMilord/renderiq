import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { cdnToDirectGCS, isCDNUrl } from '@/lib/utils/cdn-fallback';

/**
 * Image proxy API route
 * Fetches images server-side to avoid CORS issues
 * Used by tldraw when exporting snapshots to SVG/PNG
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid imageUrl' },
        { status: 400 }
      );
    }

    // ✅ Convert CDN URL to direct GCS URL to avoid CORS
    const fetchUrl = isCDNUrl(imageUrl) ? cdnToDirectGCS(imageUrl) : imageUrl;

    logger.log('🔄 ImageProxy: Fetching image', { 
      original: imageUrl, 
      fetchUrl,
      isCDN: isCDNUrl(imageUrl)
    });

    // Fetch image server-side
    const imageResponse = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Renderiq-ImageProxy/1.0',
      },
    });

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    // Convert to base64
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    
    // Return data URI
    const dataUri = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      dataUri,
      contentType,
    });
  } catch (error) {
    logger.error('❌ ImageProxy: Failed to proxy image', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to proxy image' 
      },
      { status: 500 }
    );
  }
}

