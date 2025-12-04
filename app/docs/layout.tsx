import { Metadata } from 'next';
import { DocsLayout } from '@/components/docs/docs-layout';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Documentation | Renderiq - AI Architectural Visualization Platform",
  description: "Learn how to use Renderiq's AI-powered architectural visualization platform. Guides, tutorials, and API documentation.",
  openGraph: {
    title: "Documentation | Renderiq - AI Architectural Visualization Platform",
    description: "Learn how to use Renderiq's AI-powered architectural visualization platform. Guides, tutorials, and API documentation.",
    type: "website",
    url: `${siteUrl}/docs`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/docs.jpg`,
        width: 1200,
        height: 630,
        alt: "Renderiq Documentation",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Documentation | Renderiq",
    description: "Learn how to use Renderiq's AI-powered architectural visualization platform.",
    images: [`${siteUrl}/og/docs.jpg`],
    creator: "@Renderiq",
  },
};

export default function DocsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

