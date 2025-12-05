import { DemoSlideshow } from '@/components/demo/demo-slideshow';
import { DemoDataProvider } from '@/components/demo/demo-data-context';
import { getPublicGallery, getLongestChains } from '@/lib/actions/gallery.actions';
import { getProject } from '@/lib/actions/projects.actions';
import type { Project } from '@/lib/db/schema';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';

// Force dynamic rendering - demo page uses cookies for Supabase client
// This prevents static generation errors when accessing user-specific data
export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata = {
  title: 'Renderiq Demo - Transform Sketches into Photorealistic Renders',
  description: 'Experience Renderiq\'s AI-powered architectural visualization platform. See how we transform sketches into photorealistic renders using Google Gemini 3 Pro and Veo 3.1.',
  openGraph: {
    title: 'Renderiq Demo - Transform Sketches into Photorealistic Renders',
    description: 'Experience Renderiq\'s AI-powered architectural visualization platform. See how we transform sketches into photorealistic renders using Google Gemini 3 Pro and Veo 3.1.',
    type: 'website',
    url: `${siteUrl}/demo`,
    siteName: 'Renderiq',
    images: [
      {
        url: `${siteUrl}/og/demo.jpg`,
        width: 1200,
        height: 630,
        alt: 'Renderiq Demo - AI Architectural Visualization',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Renderiq Demo - Transform Sketches into Photorealistic Renders',
    description: 'Experience Renderiq\'s AI-powered architectural visualization platform.',
    images: [`${siteUrl}/og/demo.jpg`],
    creator: '@Renderiq',
  },
};

export default async function DemoPage() {
  try {
    // Admin user ID for demo
    const ADMIN_USER_ID = '2def3d01-6cfb-470b-9e89-ce34093daafa';
    
    // Fetch real gallery renders for demo - filter for admin user only
    // Get more items to ensure we have enough with before/after pairs
    const galleryResult = await getPublicGallery(1, 50);
    const allGalleryItems = galleryResult.success ? galleryResult.data || [] : [];
    
    // Filter for admin user only
    const galleryItems = allGalleryItems.filter(item => item.userId === ADMIN_USER_ID);

    console.log(`📊 Demo: Fetched ${allGalleryItems.length} total gallery items, ${galleryItems.length} from admin user`);
    
    // Fetch more chains (up to 20) to ensure we have chains with 1-2 renders
    // The component filters for short chains (1-2 renders), so we need more chains
    const longestChainsResult = await getLongestChains(20);
    const allLongestChains = longestChainsResult.success ? longestChainsResult.data || [] : [];
    
    // Filter chains for admin user only
    const longestChains = allLongestChains.filter(chain => {
      // Check if any render in the chain belongs to admin user
      return chain.renders?.some(render => {
        // Find the gallery item for this render to check userId
        const galleryItem = allGalleryItems.find(item => item.renderId === render.id);
        return galleryItem?.userId === ADMIN_USER_ID;
      });
    });
    
    console.log(`📊 Demo: Fetched ${allLongestChains.length} total chains, ${longestChains.length} from admin user`);
    
    // Log chain details for debugging
    longestChains.forEach((chain, idx) => {
      console.log(`  Chain ${idx + 1}: ${chain.name || 'Untitled'} - ${chain.renders?.length || 0} renders`);
    });
    
    // Prefetch project and chain data needed by slides
    // Note: We already have chain data from getLongestChains, so we can use that directly
    // We only need to prefetch projects, and only if we can access them
    
    // Collect unique projectIds from gallery renders and chains
    const projectIds = new Set<string>();
    
    galleryItems.forEach(item => {
      if (item.render.projectId) projectIds.add(item.render.projectId);
    });
    
    longestChains.forEach(chain => {
      if (chain.projectId) projectIds.add(chain.projectId);
    });
    
    console.log(`📊 Demo: Prefetching ${projectIds.size} projects`);
    
    // Prefetch projects in parallel (skip on errors - demo works without them)
    const projectsData = await Promise.allSettled(
      Array.from(projectIds).map(async (projectId) => {
        try {
          const result = await getProject(projectId);
          return result.success && result.data ? [projectId, result.data] : null;
        } catch (error) {
          // Silently skip projects we can't access (they belong to other users)
          return null;
        }
      })
    );
    
    // Convert to map for easy lookup
    const projectsMap: Record<string, Project> = {};
    projectsData.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        const tuple = result.value as [string, Project];
        const [id, project] = tuple;
        projectsMap[id] = project;
      }
    });
    
    // Data is already sorted by popularity from the database queries
    // No need to sort again - use directly
    const selectedRenders = galleryItems;
    const sortedChains = longestChains;
    
    // Use chains directly from getLongestChains (already have full data)
    // Sort chains by popularity before creating map
    const chainsMap: Record<string, RenderChainWithRenders> = {};
    sortedChains.forEach(chain => {
      if (chain.id) {
        chainsMap[chain.id] = chain;
      }
    });
    
    console.log(`✅ Demo: Prefetched ${Object.keys(projectsMap).length} projects and ${Object.keys(chainsMap).length} chains (sorted by popularity)`);
    
    return (
      <DemoDataProvider
        galleryRenders={selectedRenders}
        longestChains={sortedChains}
        projects={projectsMap}
        chains={chainsMap}
      >
        <DemoSlideshow galleryRenders={selectedRenders} longestChains={sortedChains} />
      </DemoDataProvider>
    );
  } catch (error) {
    console.error('❌ Demo page error:', error);
    // Return empty data rather than crashing
    return (
      <DemoDataProvider galleryRenders={[]} longestChains={[]} projects={{}} chains={{}}>
        <DemoSlideshow galleryRenders={[]} longestChains={[]} />
      </DemoDataProvider>
    );
  }
}

