import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatMessages } from '@/lib/db/schema';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';
import { eq, and, desc } from 'drizzle-orm';

/**
 * POST /api/chat/messages - Save a chat message to database
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getCachedUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      chainId,
      projectId,
      messageType, // 'render' | 'agent'
      contentType, // 'user' | 'assistant' | 'video' | 'action' | 'prompt' | 'think' | 'message'
      content,
      renderId,
      agentActionData,
      uploadedImageUrl,
      uploadedImageKey,
    } = body;

    if (!chainId || !projectId || !messageType || !contentType || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current max position for this chain
    const existingMessages = await db
      .select({ position: chatMessages.position })
      .from(chatMessages)
      .where(eq(chatMessages.chainId, chainId))
      .orderBy(desc(chatMessages.position))
      .limit(1);

    const nextPosition = existingMessages.length > 0 
      ? (existingMessages[0].position || 0) + 1 
      : 0;

    // Insert message
    const [message] = await db
      .insert(chatMessages)
      .values({
        chainId,
        projectId,
        userId: user.id,
        messageType,
        contentType,
        content,
        renderId: renderId || null,
        agentActionData: agentActionData || null,
        uploadedImageUrl: uploadedImageUrl || null,
        uploadedImageKey: uploadedImageKey || null,
        position: nextPosition,
      })
      .returning();

    logger.log('💾 ChatMessage: Saved message to database', {
      id: message.id,
      chainId,
      messageType,
      contentType,
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    logger.error('❌ ChatMessage: Failed to save message', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save message' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/messages - Get chat messages for a chain
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getCachedUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId');
    const projectId = searchParams.get('projectId');

    if (!chainId || !projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing chainId or projectId' },
        { status: 400 }
      );
    }

    // Get messages for this chain
    const messages = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.chainId, chainId),
          eq(chatMessages.projectId, projectId),
          eq(chatMessages.userId, user.id)
        )
      )
      .orderBy(chatMessages.position);

    logger.log('📖 ChatMessage: Retrieved messages from database', {
      chainId,
      count: messages.length,
    });

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    logger.error('❌ ChatMessage: Failed to retrieve messages', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}

