import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools/registry";
import { ToolPageClient } from "./tool-client";
import { JsonLd } from '@/components/seo/json-ld';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ toolSlug: string }>
}): Promise<Metadata> {
  const { toolSlug } = await params;
  const tool = getToolBySlug(toolSlug);
  
  if (!tool) {
    return {
      title: 'Tool Not Found | Renderiq',
    };
  }

  const toolUrl = `${siteUrl}/apps/${tool.slug}`;

  return {
    title: tool.seo.title,
    description: tool.seo.description,
    keywords: [
      ...(tool.seo.keywords || []),
      // Add comprehensive AEC keywords
      'AI architecture tools', 'architectural software', 'AEC software', 'architecture rendering tools',
      'architectural visualization', 'architecture design software', 'building design software',
      'construction visualization', 'engineering software', 'architectural rendering software'
    ],
    authors: [{ name: 'Renderiq' }],
    creator: 'Renderiq',
    publisher: 'Renderiq',
    alternates: {
      canonical: toolUrl,
    },
    openGraph: {
      title: tool.seo.title,
      description: tool.seo.description,
      type: 'website',
      url: toolUrl,
      siteName: 'Renderiq',
      images: [
        {
          url: `${siteUrl}/og/apps/${tool.slug}.jpg`,
          width: 1200,
          height: 630,
          alt: tool.seo.title,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.seo.title,
      description: tool.seo.description,
      images: [`${siteUrl}/og/apps/${tool.slug}.jpg`],
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
  };
}

export default async function ToolPage({ params }: { params: Promise<{ toolSlug: string }> }) {
  const { toolSlug } = await params;
  const tool = getToolBySlug(toolSlug);
  
  if (!tool) {
    notFound();
  }

  // SoftwareApplication schema for each tool
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web Browser',
    url: `${siteUrl}/apps/${tool.slug}`,
    description: tool.seo.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Available with Renderiq subscription or credits'
    },
    featureList: tool.features || [],
    screenshot: `${siteUrl}/og/apps/${tool.slug}.jpg`,
    author: {
      '@type': 'Organization',
      name: 'Renderiq'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1'
    }
  };

  return (
    <>
      <JsonLd data={softwareApplicationSchema} />
      <ToolPageClient tool={tool} />
    </>
  );
}

