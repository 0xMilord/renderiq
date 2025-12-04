import { DemoSlideshow } from '@/components/demo/demo-slideshow';
import { DemoDataProvider } from '@/components/demo/demo-data-context';
import { getPublicGallery, getLongestChains } from '@/lib/actions/gallery.actions';
import { getProject } from '@/lib/actions/projects.actions';
import type { Project } from '@/lib/db/schema';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Renderiq Demo - Transform Sketches into Photorealistic Renders',
  description: 'Experience Renderiq\'s AI-powered architectural visualization platform. See how we transform sketches into photorealistic renders using Google Gemini 3 Pro and Veo 3.1.',
};

export default async function DemoPage() {
  try {
    // Fetch real gallery renders for demo - simple logic like gallery does
    // Get more items to ensure we have enough with before/after pairs
    const galleryResult = await getPublicGallery(1, 50);
    const galleryItems = galleryResult.success ? galleryResult.data || [] : [];

    console.log(`📊 Demo: Fetched ${galleryItems.length} gallery items`);
    
    // Fetch more chains (up to 20) to ensure we have chains with 1-2 renders
    // The component filters for short chains (1-2 renders), so we need more chains
    const longestChainsResult = await getLongestChains(20);
    const longestChains = longestChainsResult.success ? longestChainsResult.data || [] : [];
    
    console.log(`📊 Demo: Fetched ${longestChains.length} chains with public renders`);
    
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
        const [id, project] = result.value;
        projectsMap[id] = project;
      }
    });
    
    // Use chains directly from getLongestChains (already have full data)
    const chainsMap: Record<string, RenderChainWithRenders> = {};
    longestChains.forEach(chain => {
      if (chain.id) {
        chainsMap[chain.id] = chain;
      }
    });
    
    console.log(`✅ Demo: Prefetched ${Object.keys(projectsMap).length} projects and ${Object.keys(chainsMap).length} chains (using existing chain data)`);
    
    // Use gallery items directly in order (same as gallery page)
    // Filter for items with before/after pairs will be done in slide 2 component
    const selectedRenders = galleryItems;
    
    return (
      <DemoDataProvider
        galleryRenders={selectedRenders}
        longestChains={longestChains}
        projects={projectsMap}
        chains={chainsMap}
      >
        <DemoSlideshow galleryRenders={selectedRenders} longestChains={longestChains} />
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

