import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

/**
 * Twitter Tweet API
 * Fetches tweet data using Twitter's oEmbed API
 * Supports both twitter.com and x.com URLs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tweetId } = await params;
    
    // Extract username from query params if provided, otherwise use default
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username') || 'user';

    // Ensure username is valid (not default 'user')
    const validUsername = username && username !== 'user' ? username : null;
    if (!validUsername) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    logger.log('📱 Fetching tweet:', tweetId, 'from user:', validUsername);

    // Use Twitter oEmbed API (no auth required)
    // Support both twitter.com and x.com URLs
    const tweetUrl = `https://twitter.com/${validUsername}/status/${tweetId}`;
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;
    
    try {
      const response = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Renderiq/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`Twitter API returned ${response.status}`);
      }

      const oembedData = await response.json();
      
      // Parse HTML to extract tweet text and author info
      // oEmbed returns HTML, we need to extract text from it
      const html = oembedData.html || '';
      
      // Extract text from blockquote (Twitter oEmbed format)
      // Twitter oEmbed wraps content in <blockquote> with <p> tags
      let text = '';
      const blockquoteMatch = html.match(/<blockquote[^>]*>(.*?)<\/blockquote>/s);
      if (blockquoteMatch) {
        const blockquoteContent = blockquoteMatch[1];
        // Extract all <p> tags and combine their text
        const pMatches = blockquoteContent.match(/<p[^>]*>(.*?)<\/p>/gs);
        if (pMatches) {
          text = pMatches
            .map(p => p.replace(/<[^>]*>/g, '').trim())
            .filter(t => t.length > 0)
            .join('\n');
        }
      }
      
      // Extract author username from HTML - look for @username pattern in links
      // Twitter oEmbed format: <a href="https://twitter.com/username">@username</a>
      let authorUsername = username;
      const usernameMatches = html.match(/<a[^>]*href="https?:\/\/(?:twitter\.com|x\.com)\/([^"\/]+)"[^>]*>@([^<]+)<\/a>/);
      if (usernameMatches) {
        authorUsername = usernameMatches[1] || usernameMatches[2];
      } else {
        // Fallback: try to find any @username pattern
        const altMatch = html.match(/@([a-zA-Z0-9_]+)/);
        if (altMatch && altMatch[1] !== 'renderiq_ai') {
          authorUsername = altMatch[1];
        }
      }
      
      // Extract author name - Twitter oEmbed sometimes includes it in the HTML
      // Look for the author name in the blockquote or use the provided username
      let authorName = authorUsername;
      const nameMatch = html.match(/<a[^>]*class="[^"]*"[^>]*>([^<@]+)<\/a>/);
      if (nameMatch && !nameMatch[1].includes('@')) {
        authorName = nameMatch[1].trim();
      }
      
      // Use oEmbed author_name if available and different from renderiq_ai
      if (oembedData.author_name && oembedData.author_name.toLowerCase() !== 'renderiq_ai') {
        authorName = oembedData.author_name;
      }
      
      // Extract avatar URL - use unavatar.io as reliable fallback
      // Twitter oEmbed doesn't reliably provide avatar URLs
      const avatarUrl = `https://unavatar.io/twitter/${authorUsername}`;
      
      // Try to extract metrics from HTML if available (Twitter oEmbed doesn't provide this)
      // We'll use 0 as default since oEmbed doesn't include metrics

      // Always prioritize the username from URL parameter
      const finalUsername = validUsername;
      
      // Use parsed author name if different from username, otherwise use username
      const displayName = (authorName && authorName !== finalUsername && !authorName.includes('renderiq')) 
        ? authorName 
        : finalUsername;
      
      logger.log('✅ Tweet data extracted:', {
        username: finalUsername,
        name: displayName,
        textLength: text.length,
      });
      
      return NextResponse.json({
        success: true,
        data: {
          id: tweetId,
          text: text || oembedData.text || '',
          author: {
            name: displayName,
            username: finalUsername,
            avatar: `https://unavatar.io/twitter/${finalUsername}`,
          },
          createdAt: oembedData.created_at || new Date().toISOString(),
          url: `https://twitter.com/${finalUsername}/status/${tweetId}`,
          metrics: {
            likes: 0, // oEmbed doesn't provide metrics - would need Twitter API v2 (requires auth)
            retweets: 0,
            replies: 0,
          },
          html: html, // Include HTML for embedding if needed
        },
      });
    } catch (fetchError) {
      logger.error('❌ Error fetching from Twitter oEmbed:', fetchError);
      
      // Return structure with username from URL so fallback can be used
      return NextResponse.json({
        success: false,
        data: {
          id: tweetId,
          text: '',
          author: {
            name: validUsername,
            username: validUsername,
            avatar: `https://unavatar.io/twitter/${validUsername}`,
          },
          createdAt: new Date().toISOString(),
          url: `https://twitter.com/${validUsername}/status/${tweetId}`,
          metrics: {
            likes: 0,
            retweets: 0,
            replies: 0,
          },
        },
        error: 'Failed to fetch tweet data',
      });
    }
  } catch (error) {
    logger.error('❌ Error in tweet API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tweet' },
      { status: 500 }
    );
  }
}


