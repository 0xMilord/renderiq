import { DemoSlideshow } from '@/components/demo/demo-slideshow';
import { getPublicGallery, getLongestChains } from '@/lib/actions/gallery.actions';

export const metadata = {
  title: 'Renderiq Demo - Transform Sketches into Photorealistic Renders',
  description: 'Experience Renderiq\'s AI-powered architectural visualization platform. See how we transform sketches into photorealistic renders using Google Gemini 3 Pro and Veo 3.1.',
};

export default async function DemoPage() {
  // Fetch real gallery renders for demo
  const galleryResult = await getPublicGallery(1, 20);
  const galleryItems = galleryResult.success ? galleryResult.data || [] : [];
  
  // Fetch longest chains (chains with most renders)
  const longestChainsResult = await getLongestChains(3);
  const longestChains = longestChainsResult.success ? longestChainsResult.data || [] : [];
  
  // Find gallery items from longest chains
  const chainIds = longestChains.map(chain => chain?.id).filter(Boolean) as string[];
  const chainGalleryItems = galleryItems.filter(item => 
    item.render.chainId && chainIds.includes(item.render.chainId)
  );
  
  // Use longest chain items if available, otherwise use random selection
  const selectedRenders = chainGalleryItems.length > 0 
    ? chainGalleryItems.slice(0, 6)
    : galleryItems.slice(0, 6);
  
  return <DemoSlideshow galleryRenders={selectedRenders} longestChains={longestChains} />;
}

