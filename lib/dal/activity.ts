import { db } from '@/lib/db';
import { renders, userLikes, galleryItems, users } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export type ActivityType = 'render' | 'like';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  timestamp: Date;
  // Render activity
  render?: {
    id: string;
    type: 'image' | 'video';
    prompt: string;
    outputUrl: string | null;
    status: string;
    createdAt: Date;
  };
  // Like activity
  like?: {
    id: string;
    galleryItemId: string;
    render: {
      id: string;
      type: 'image' | 'video';
      prompt: string;
      outputUrl: string | null;
      status: string;
    };
    user: {
      id: string;
      name: string | null;
      avatar: string | null;
    };
  };
}

export class ActivityDAL {
  /**
   * Get unified activity feed for a user
   * Combines renders and likes into a single timeline
   */
  static async getUserActivity(userId: string, limit = 100): Promise<ActivityItem[]> {
    logger.log('📊 ActivityDAL: Fetching user activity:', { userId, limit });

    try {
      // Fetch renders
      const userRenders = await db
        .select({
          id: renders.id,
          type: renders.type,
          prompt: renders.prompt,
          outputUrl: renders.outputUrl,
          status: renders.status,
          createdAt: renders.createdAt,
        })
        .from(renders)
        .where(eq(renders.userId, userId))
        .orderBy(desc(renders.createdAt))
        .limit(limit);

      // Fetch likes
      const userLikedItems = await db
        .select({
          id: userLikes.id,
          galleryItemId: userLikes.galleryItemId,
          createdAt: userLikes.createdAt,
          render: {
            id: renders.id,
            type: renders.type,
            prompt: renders.prompt,
            outputUrl: renders.outputUrl,
            status: renders.status,
          },
          user: {
            id: users.id,
            name: users.name,
            avatar: users.avatar,
          },
        })
        .from(userLikes)
        .innerJoin(galleryItems, eq(userLikes.galleryItemId, galleryItems.id))
        .innerJoin(renders, eq(galleryItems.renderId, renders.id))
        .innerJoin(users, eq(galleryItems.userId, users.id))
        .where(eq(userLikes.userId, userId))
        .orderBy(desc(userLikes.createdAt))
        .limit(limit);

      // Combine and sort by timestamp
      const activities: ActivityItem[] = [
        ...userRenders.map(render => ({
          id: `render-${render.id}`,
          type: 'render' as ActivityType,
          timestamp: render.createdAt,
          render: {
            id: render.id,
            type: render.type as 'image' | 'video',
            prompt: render.prompt,
            outputUrl: render.outputUrl,
            status: render.status,
            createdAt: render.createdAt,
          },
        })),
        ...userLikedItems.map(like => ({
          id: `like-${like.id}`,
          type: 'like' as ActivityType,
          timestamp: like.createdAt,
          like: {
            id: like.id,
            galleryItemId: like.galleryItemId,
            render: {
              id: like.render.id,
              type: like.render.type as 'image' | 'video',
              prompt: like.render.prompt,
              outputUrl: like.render.outputUrl,
              status: like.render.status,
            },
            user: {
              id: like.user.id,
              name: like.user.name,
              avatar: like.user.avatar,
            },
          },
        })),
      ];

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      logger.log(`✅ ActivityDAL: Found ${activities.length} activities (${userRenders.length} renders, ${userLikedItems.length} likes)`);
      return activities.slice(0, limit);
    } catch (error) {
      logger.error('❌ ActivityDAL: Error fetching user activity:', error);
      throw error;
    }
  }
}

