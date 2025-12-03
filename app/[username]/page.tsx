import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { users, galleryItems, renders } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { UserProfilePageClient } from './user-profile-client';
import { Metadata } from 'next';
import Script from 'next/script';

// ISR: Revalidate every 300 seconds (5 minutes)
export const revalidate = 300;

interface PageProps {
  params: Promise<{ username: string }>;
}

// Generate static params for users with public gallery items
export async function generateStaticParams() {
  try {
    // Get users who have public gallery items
    const usersWithGallery = await db
      .selectDistinct({
        userId: galleryItems.userId,
        userName: users.name,
      })
      .from(galleryItems)
      .innerJoin(users, eq(galleryItems.userId, users.id))
      .where(and(
        eq(galleryItems.isPublic, true),
        eq(users.isActive, true)
      ))
      .limit(500); // Pre-generate top 500 users

    return usersWithGallery
      .filter(u => u.userName)
      .map((u) => {
        const username = u.userName!
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        return {
          username: username,
        };
      });
  } catch (error) {
    console.error('Error generating static params for user profiles:', error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';
  
  // Decode URL-encoded characters (e.g., %20 for spaces)
  const decodedUsername = decodeURIComponent(username);
  
  // Convert slug back to readable name
  const userName = decodedUsername
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Fetch user data for richer metadata
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
    })
    .from(users)
    .where(eq(users.isActive, true));

  const user = allUsers.find(u => {
    if (!u.name) return false;
    const userSlug = u.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return userSlug === decodedUsername.toLowerCase();
  });

  if (!user) {
    return {
      title: `${userName}'s Gallery | Renderiq`,
      description: `View ${userName}'s AI-generated architectural renders on Renderiq Gallery`,
    };
  }

  // Get user's gallery stats
  const userStats = await db
    .select({
      totalItems: sql<number>`count(*)::int`,
      totalLikes: sql<number>`sum(${galleryItems.likes})::int`,
      totalViews: sql<number>`sum(${galleryItems.views})::int`,
    })
    .from(galleryItems)
    .where(and(
      eq(galleryItems.userId, user.id),
      eq(galleryItems.isPublic, true)
    ));

  const stats = userStats[0] || { totalItems: 0, totalLikes: 0, totalViews: 0 };
  const profileUrl = `${siteUrl}/${username}`;
  const avatarUrl = user.avatar || `${siteUrl}/default-avatar.png`;
  
  const description = `${userName} has created ${stats.totalItems} AI-generated architectural renders with ${stats.totalLikes} total likes and ${stats.totalViews} views. Explore ${userName}'s portfolio on Renderiq Gallery.`;

  return {
    title: `${userName}'s Gallery | Renderiq`,
    description: description,
    keywords: [
      userName,
      'AI architecture',
      'architectural renders',
      'AI-generated design',
      'architectural visualization',
      'Renderiq gallery',
    ],
    authors: [{ name: userName }],
    creator: userName,
    publisher: 'Renderiq',
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title: `${userName}'s Gallery | Renderiq`,
      description: description,
      type: 'profile',
      url: profileUrl,
      siteName: 'Renderiq',
      images: [
        {
          url: avatarUrl,
          width: 400,
          height: 400,
          alt: `${userName}'s profile picture`,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary',
      title: `${userName}'s Gallery | Renderiq`,
      description: description,
      images: [avatarUrl],
      creator: '@Renderiq',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  
  // Decode URL-encoded characters (e.g., %20 for spaces)
  const decodedUsername = decodeURIComponent(username);
  
  // Find user by matching slugified username
  // Since we can't query by slug directly, we need to fetch users and match
  // For better performance, we can filter users with names that start with the same character
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
    })
    .from(users)
    .where(eq(users.isActive, true));

  // Match by slugified username
  const user = allUsers.find(u => {
    if (!u.name) return false;
    const userSlug = u.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return userSlug === decodedUsername.toLowerCase();
  });

  if (!user) {
    notFound();
  }

  // Get user's gallery items
  const userGalleryItems = await db
    .select({
      id: galleryItems.id,
      renderId: galleryItems.renderId,
      userId: galleryItems.userId,
      isPublic: galleryItems.isPublic,
      likes: galleryItems.likes,
      views: galleryItems.views,
      createdAt: galleryItems.createdAt,
      render: {
        id: renders.id,
        type: renders.type,
        prompt: renders.prompt,
        settings: renders.settings,
        outputUrl: renders.outputUrl,
        status: renders.status,
        processingTime: renders.processingTime,
        uploadedImageUrl: renders.uploadedImageUrl,
        uploadedImageKey: renders.uploadedImageKey,
        uploadedImageId: renders.uploadedImageId,
        projectId: renders.projectId,
        chainId: renders.chainId,
        createdAt: renders.createdAt,
      },
      user: {
        id: users.id,
        name: users.name,
        avatar: users.avatar,
      },
    })
    .from(galleryItems)
    .innerJoin(renders, eq(galleryItems.renderId, renders.id))
    .innerJoin(users, eq(galleryItems.userId, users.id))
    .where(and(
      eq(galleryItems.userId, user.id),
      eq(galleryItems.isPublic, true)
    ))
    .orderBy(desc(galleryItems.createdAt))
    .limit(100);

  return (
    <UserProfilePageClient 
      user={user} 
      galleryItems={userGalleryItems}
    />
  );
}

