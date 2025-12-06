import { MetadataRoute } from 'next'
import { RendersDAL } from '@/lib/dal/renders'
import { db } from '@/lib/db'
import { users, galleryItems } from '@/lib/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'

// Helper function to get all blog posts
function getAllBlogs(): any[] {
  try {
    const path = require('path');
    const fs = require('fs');
    const blogDir = path.join(process.cwd(), '.contentlayer', 'generated', 'Blog');
    
    if (!fs.existsSync(blogDir)) {
      return [];
    }
    
    const jsonFiles = fs.readdirSync(blogDir).filter((file: string) => 
      file.endsWith('.json') && file !== '_index.json'
    );
    
    const blogs = jsonFiles.map((file: string) => {
      const filePath = path.join(blogDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return content;
    });
    
    return blogs;
  } catch (error: any) {
    console.error('Error loading blogs:', error?.message || error);
    return [];
  }
}

// ISR: Revalidate sitemap every hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'
  
  const currentDate = new Date()
  
  // Static pages
  const staticPages = [
    '',
    '/login',
    '/signup',
    '/pricing',
    '/gallery',
    '/use-cases',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  // Use case pages - Enhanced for AI discoverability
  const useCasePages = [
    '/use-cases/concept-renders',
    '/use-cases/material-testing-built-spaces',
    '/use-cases/instant-floor-plan-renders',
    '/use-cases/style-testing-white-renders',
    '/use-cases/rapid-concept-video',
    '/use-cases/massing-testing',
    '/use-cases/2d-elevations-from-images',
    '/use-cases/presentation-ready-graphics',
    '/use-cases/social-media-content',
    '/use-cases/matching-render-mood',
    '/use-cases/residential',
    '/use-cases/commercial',
    '/use-cases/hospitality',
    '/use-cases/retail',
    '/use-cases/educational',
    '/use-cases/landscape',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // AI tool pages for better discoverability
  const aiToolPages = [
    '/ai-architecture-tools',
    '/ai-rendering-software',
    '/architectural-visualization-ai',
    '/ai-design-assistant',
    '/sketch-to-render-ai',
    '/ai-interior-design',
    '/ai-exterior-rendering',
    '/ai-furniture-placement',
    '/ai-site-planning',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Tutorial and help pages
  const tutorialPages = [
    '/tutorials/getting-started',
    '/tutorials/advanced-techniques',
    '/tutorials/best-practices',
    '/tutorials/workflow-integration',
    '/tutorials/export-options',
    '/help/faq',
    '/help/support',
    '/help/api-documentation',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Engine pages
  const enginePages = [
    '/render',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Dashboard pages (lower priority, some require auth)
  const dashboardPages = [
    '/dashboard',
    '/dashboard/projects',
    '/dashboard/billing',
    '/dashboard/profile',
    '/dashboard/settings',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.5,
  }))

  // Dynamic: Blog posts
  const blogPosts = getAllBlogs().map((blog: any) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.publishedAt ? new Date(blog.publishedAt) : currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Dynamic: Blog categories
  const blogCategories = Array.from(new Set(
    getAllBlogs()
      .map((blog: any) => blog.category || blog.collection)
      .filter(Boolean)
  )).map((category: string) => ({
    url: `${baseUrl}/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Dynamic: Gallery items (top 100 most popular - further reduced for faster deployment)
  let galleryItemPages: MetadataRoute.Sitemap = [];
  try {
    // Add aggressive timeout to prevent hanging during deployment
    const fetchPromise = db
      .select({
        id: galleryItems.id,
        createdAt: galleryItems.createdAt,
        views: galleryItems.views,
        likes: galleryItems.likes,
      })
      .from(galleryItems)
      .where(eq(galleryItems.isPublic, true))
      .orderBy(desc(sql`COALESCE(${galleryItems.likes}, 0) + COALESCE(${galleryItems.views}, 0)`), desc(galleryItems.createdAt))
      .limit(100); // Further reduced from 200 to 100 for faster generation
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Sitemap gallery query timeout')), 3000) // Reduced to 3 seconds
    );
    
    const items = await Promise.race([fetchPromise, timeoutPromise]);

    galleryItemPages = items.map((item) => {
      // Calculate priority based on engagement (0.5 to 0.9)
      const engagementScore = (item.views || 0) + (item.likes || 0) * 2;
      const priority = Math.min(0.5 + (engagementScore / 10000) * 0.4, 0.9);
      
      return {
        url: `${baseUrl}/gallery/${item.id}`,
        lastModified: new Date(item.createdAt),
        changeFrequency: 'weekly' as const,
        priority: priority as 0.5 | 0.6 | 0.7 | 0.8 | 0.9,
      };
    });
  } catch (error) {
    // Silently fail - sitemap will work with static pages only
    console.error('Error generating gallery item sitemap entries (skipping):', error);
  }

  // Dynamic: User profiles (users with public gallery items - further reduced for faster deployment)
  let userProfilePages: MetadataRoute.Sitemap = [];
  try {
    // Add aggressive timeout to prevent hanging during deployment
    const fetchPromise = db
      .selectDistinct({
        userId: galleryItems.userId,
        userName: users.name,
        createdAt: sql<Date>`min(${galleryItems.createdAt})`,
      })
      .from(galleryItems)
      .innerJoin(users, eq(galleryItems.userId, users.id))
      .where(and(
        eq(galleryItems.isPublic, true),
        eq(users.isActive, true)
      ))
      .groupBy(galleryItems.userId, users.name)
      .limit(50); // Further reduced from 100 to 50 for faster generation
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Sitemap user query timeout')), 3000) // Reduced to 3 seconds
    );
    
    const usersWithGallery = await Promise.race([fetchPromise, timeoutPromise]);

    userProfilePages = usersWithGallery
      .filter(u => u.userName)
      .map((u) => {
        const username = u.userName!
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        return {
          url: `${baseUrl}/${username}`,
          lastModified: u.createdAt || currentDate,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        };
      });
  } catch (error) {
    // Silently fail - sitemap will work with static pages only
    console.error('Error generating user profile sitemap entries (skipping):', error);
  }

  return [
    ...staticPages,
    ...useCasePages,
    ...aiToolPages,
    ...tutorialPages,
    ...enginePages,
    ...dashboardPages,
    ...blogPosts,
    ...blogCategories,
    ...galleryItemPages,
    ...userProfilePages,
  ]
}

