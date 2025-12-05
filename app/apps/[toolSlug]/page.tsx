import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolBySlug } from "@/lib/tools/registry";
import { ToolPageClient } from "./tool-client";

export async function generateMetadata({ 
  params 
}: { 
  params: { toolSlug: string } 
}): Promise<Metadata> {
  const tool = getToolBySlug(params.toolSlug);
  
  if (!tool) {
    return {
      title: 'Tool Not Found | Renderiq',
    };
  }

  return {
    title: tool.seo.title,
    description: tool.seo.description,
    keywords: tool.seo.keywords,
    openGraph: {
      title: tool.seo.title,
      description: tool.seo.description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io'}/apps/${tool.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.seo.title,
      description: tool.seo.description,
    },
  };
}

export default function ToolPage({ params }: { params: { toolSlug: string } }) {
  const tool = getToolBySlug(params.toolSlug);
  
  if (!tool) {
    notFound();
  }

  return <ToolPageClient tool={tool} />;
}

