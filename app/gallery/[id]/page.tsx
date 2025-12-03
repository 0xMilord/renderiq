import { notFound } from 'next/navigation';
import { RendersDAL } from '@/lib/dal/renders';
import { GalleryItemPageClient } from './gallery-item-client';
import { Metadata } from 'next';
import { getPublicGalleryItem, getSimilarGalleryItems } from '@/lib/actions/gallery.actions';
import Script from 'next/script';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

// ISR: Revalidate every 60 seconds (1 minute)
export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate static params for popular/recent gallery items
export async function generateStaticParams() {
  try {
    // Pre-generate the most popular gallery items (top 500)
    const itemIds = await RendersDAL.getAllPublicGalleryItemIds(500);
    
    return itemIds.map((id) => ({
      id: id,
    }));
  } catch (error) {
    console.error('Error generating static params for gallery items:', error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicGalleryItem(id);
  
  if (!result.success || !result.data) {
    return {
      title: 'Gallery Item | Renderiq',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const item = result.data;
  const prompt = item.render.prompt || 'AI-generated architectural render';
  const truncatedPrompt = prompt.length > 60 ? `${prompt.substring(0, 60)}...` : prompt;
  const imageUrl = item.render.outputUrl;
  const pageUrl = `${siteUrl}/gallery/${id}`;
  const creatorName = item.user?.name || 'Anonymous';
  const createdAt = new Date(item.createdAt).toISOString();
  
  // Generate rich description
  const description = `${truncatedPrompt} Created by ${creatorName}. ${item.views} views, ${item.likes} likes. Explore more AI-generated architectural renders on Renderiq Gallery.`;

  return {
    title: `${truncatedPrompt} | Renderiq Gallery`,
    description: description,
    keywords: [
      'AI architecture',
      'architectural render',
      'AI-generated design',
      'interior design',
      'architectural visualization',
      item.render.settings?.style || '',
      item.render.settings?.quality || '',
    ].filter(Boolean),
    authors: [{ name: creatorName }],
    creator: creatorName,
    publisher: 'Renderiq',
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: truncatedPrompt,
      description: description,
      type: 'article',
      url: pageUrl,
      siteName: 'Renderiq',
      publishedTime: createdAt,
      modifiedTime: createdAt,
      authors: [creatorName],
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: truncatedPrompt,
        },
      ] : [],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: truncatedPrompt,
      description: description,
      images: imageUrl ? [imageUrl] : [],
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
    other: {
      'article:author': creatorName,
      'article:published_time': createdAt,
      'article:modified_time': createdAt,
    },
  };
}

export default async function GalleryItemPage({ params }: PageProps) {
  const { id } = await params;
  
  const result = await getPublicGalleryItem(id);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const item = result.data;
  
  // Get similar items for "More like this" section (fetch more for scroll)
  const similarResult = await getSimilarGalleryItems(id, 18);

  const pageUrl = `${siteUrl}/gallery/${id}`;
  const imageUrl = item.render.outputUrl || '';
  const creatorName = item.user?.name || 'Anonymous';
  const createdAt = new Date(item.createdAt).toISOString();

  // Article Schema for individual gallery item
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.render.prompt || 'AI-generated architectural render',
    description: item.render.prompt || 'View this AI-generated architectural render on Renderiq Gallery',
    image: imageUrl,
    datePublished: createdAt,
    dateModified: createdAt,
    author: {
      '@type': 'Person',
      name: creatorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Renderiq',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
    keywords: [
      'AI architecture',
      'architectural render',
      item.render.settings?.style,
      item.render.settings?.quality,
    ].filter(Boolean).join(', '),
  };

  // ImageObject Schema
  const imageSchema = imageUrl ? {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: imageUrl,
    url: imageUrl,
    description: item.render.prompt || 'AI-generated architectural render',
    creator: {
      '@type': 'Person',
      name: creatorName,
    },
    copyrightHolder: {
      '@type': 'Person',
      name: creatorName,
    },
    license: `${siteUrl}/terms`,
  } : null;

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
      {
        '@type': 'ListItem',
        position: 3,
        name: item.render.prompt?.substring(0, 50) || 'Gallery Item',
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <Script
        id="gallery-item-article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      {imageSchema && (
        <Script
          id="gallery-item-image-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(imageSchema),
          }}
        />
      )}
      <Script
        id="gallery-item-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <GalleryItemPageClient 
        item={item} 
        similarItems={similarResult.success ? similarResult.data || [] : []}
      />
    </>
  );
}

