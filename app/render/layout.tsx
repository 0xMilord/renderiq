import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Render | Renderiq - AI Architectural Visualization Platform",
  description: "Transform your architectural sketches and prompts into photorealistic renders and videos using Renderiq's AI-powered visualization platform. Start creating stunning visualizations in seconds.",
  openGraph: {
    title: "Render | Renderiq - AI Architectural Visualization Platform",
    description: "Transform your architectural sketches and prompts into photorealistic renders and videos using Renderiq's AI-powered visualization platform.",
    type: "website",
    url: `${siteUrl}/render`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/render.jpg`,
        width: 1200,
        height: 630,
        alt: "Render - AI Architectural Visualization Platform",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Render | Renderiq - AI Architectural Visualization Platform",
    description: "Transform your architectural sketches into photorealistic renders and videos in seconds.",
    images: [`${siteUrl}/og/render.jpg`],
    creator: "@Renderiq",
  },
};

export default function RenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

