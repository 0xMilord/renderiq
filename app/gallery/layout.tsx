import { Metadata } from 'next';
import Script from 'next/script';
import { RendersDAL } from '@/lib/dal/renders';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: 'AI Architectural Render Gallery | Renderiq',
  description: 'Explore thousands of AI-generated architectural renders created by our community. Browse photorealistic interior and exterior designs, modern architecture, and creative visualizations.',
  keywords: [
    'AI architecture gallery',
    'architectural renders',
    'AI-generated architecture',
    'interior design gallery',
    'architectural visualization',
    'AI design gallery',
    '3D architecture renders',
    'photorealistic architecture'
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/gallery`,
  },
  openGraph: {
    title: 'AI Architectural Render Gallery | Renderiq',
    description: 'Explore thousands of AI-generated architectural renders created by our community. Browse photorealistic interior and exterior designs.',
    type: 'website',
    url: `${siteUrl}/gallery`,
    siteName: 'Renderiq',
    images: [
      {
        url: `${siteUrl}/og-gallery.jpg`,
        width: 1200,
        height: 630,
        alt: 'Renderiq Gallery - AI Architectural Renders',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Architectural Render Gallery | Renderiq',
    description: 'Explore thousands of AI-generated architectural renders created by our community.',
    images: [`${siteUrl}/og-gallery.jpg`],
    creator: '@Renderiq',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'Architecture',
  classification: 'Gallery',
};

// Gallery Collection Schema
const gallerySchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Renderiq Gallery',
  description: 'A curated collection of AI-generated architectural renders showcasing photorealistic interior and exterior designs.',
  url: `${siteUrl}/gallery`,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [],
  },
  publisher: {
    '@type': 'Organization',
    name: 'Renderiq',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/logo.png`,
    },
  },
};

// Breadcrumb Schema
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Gallery',
      item: `${siteUrl}/gallery`,
    },
  ],
};

export default async function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch initial gallery items for ItemList schema (top 20)
  let itemListElements: any[] = [];
  try {
    const initialItems = await RendersDAL.getPublicGallery(20, 0);
    itemListElements = initialItems.slice(0, 20).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'ImageObject',
        '@id': `${siteUrl}/gallery/${item.id}`,
        name: item.render.prompt || 'AI-generated architectural render',
        image: item.render.outputUrl,
        creator: {
          '@type': 'Person',
          name: item.user?.name || 'Anonymous',
        },
      },
    }));
  } catch (error) {
    console.error('Error fetching gallery items for schema:', error);
  }

  // Update gallery schema with dynamic ItemList
  const dynamicGallerySchema = {
    ...gallerySchema,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: itemListElements.length,
      itemListElement: itemListElements,
    },
  };

  return (
    <>
      <Script
        id="gallery-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(dynamicGallerySchema),
        }}
      />
      <Script
        id="gallery-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  );
}

