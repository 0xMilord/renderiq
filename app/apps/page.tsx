import { Metadata } from "next";
import { AppsPageClient } from "./apps-client";
import { getAllTools, CATEGORIES } from "@/lib/tools/registry";
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: "AI Architecture Tools | 21 Specialized Tools for Architects | Renderiq",
  description: "Discover 21 specialized AI architecture tools: render transformations, floor plan tools, diagrams, material testing, interior design, 3D visualization, and presentation tools. Transform your architectural workflow.",
  keywords: [
    "AI architecture tools",
    "architectural software",
    "AI rendering tools",
    "architecture presentation tools",
    "floor plan tools",
    "architectural visualization",
    "presentation board maker",
    "architect tools"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'}/apps`,
  },
  openGraph: {
    title: "AI Architecture Tools - 21 Specialized Tools for Architects",
    description: "Discover 21 specialized AI architecture tools for every stage of your design workflow. From concept to presentation.",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'}/apps`,
    siteName: "Renderiq",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Architecture Tools - 21 Specialized Tools",
    description: "Discover 21 specialized AI architecture tools for every stage of your design workflow.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AppsPage() {
  const tools = getAllTools();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io';
  
  // CollectionPage schema for apps listing
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Architecture Tools',
    description: 'A collection of 21 specialized AI architecture tools for architects and designers, including render transformations, floor plan tools, diagrams, material testing, interior design, 3D visualization, and presentation tools.',
    url: `${siteUrl}/apps`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: tools.length,
      itemListElement: tools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: tool.name,
          description: tool.description,
          url: `${siteUrl}/${tool.slug}`,
          applicationCategory: 'DesignApplication',
        },
      })),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Renderiq',
      url: siteUrl,
    },
  };
  
  return (
    <>
      <JsonLd data={collectionPageSchema} />
      <AppsPageClient tools={tools} categories={CATEGORIES} />
    </>
  );
}

