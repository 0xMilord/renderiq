import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Pricing | Renderiq - AI Architectural Visualization Plans & Credits",
  description: "Choose the perfect plan for your needs. Free tier available. Pro plans with unlimited renders, private projects, and priority support. Credit packages for flexible usage.",
  openGraph: {
    title: "Pricing | Renderiq - AI Architectural Visualization Plans & Credits",
    description: "Choose the perfect plan for your needs. Free tier available. Pro plans with unlimited renders, private projects, and priority support.",
    type: "website",
    url: `${siteUrl}/pricing`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/pricing.jpg`,
        width: 1200,
        height: 630,
        alt: "Pricing - Renderiq AI Architectural Visualization",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Renderiq - AI Architectural Visualization Plans",
    description: "Choose the perfect plan for your needs. Free tier available. Pro plans with unlimited renders.",
    images: [`${siteUrl}/og/pricing.jpg`],
    creator: "@Renderiq",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

