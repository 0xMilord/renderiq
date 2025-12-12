import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/json-ld';
import { generateProductSchema } from '@/components/seo/json-ld';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

// Product schema for pricing page
const pricingProductSchema = generateProductSchema({
  name: 'Renderiq AI Architectural Visualization Platform',
  description: 'Professional AI-powered architectural rendering and visualization software for architects, engineers, and designers. Transform sketches into photorealistic renders and videos.',
  offers: [
    {
      name: 'Free Plan',
      price: '0',
      priceCurrency: 'USD',
      availability: 'InStock',
      url: `${siteUrl}/signup`,
      description: '10 free credits to get started with AI rendering'
    },
    {
      name: 'Starter Plan',
      price: '7.99',
      priceCurrency: 'USD',
      availability: 'InStock',
      url: `${siteUrl}/signup`,
      description: '100 AI rendering credits per month'
    },
    {
      name: 'Pro Plan',
      price: '24.99',
      priceCurrency: 'USD',
      availability: 'InStock',
      url: `${siteUrl}/signup`,
      description: '400 AI rendering credits per month'
    },
    {
      name: 'Enterprise Plan',
      price: '64.99',
      priceCurrency: 'USD',
      availability: 'InStock',
      url: `${siteUrl}/signup`,
      description: '1,200 AI rendering credits per month'
    },
  ]
});

export const metadata: Metadata = {
  title: "Pricing | Renderiq - AI Architectural Visualization Plans & Credits",
  description: "Affordable AI architectural rendering pricing. Free tier with 10 credits. Starter $7.99/month (₹799, 100 credits), Pro $24.99/month (₹2,499, 400 credits), Enterprise $64.99/month (₹6,499, 1,200 credits). Annual plans available. Compare pricing for AEC visualization software.",
  keywords: [
    "AI architecture pricing", "architectural rendering cost", "AI rendering pricing", "architecture software pricing",
    "AEC software pricing", "architectural visualization pricing", "rendering software cost", "AI architecture tools pricing",
    "architectural rendering software price", "how much does architectural rendering cost", "architecture rendering software free",
    "professional architectural rendering cost", "commercial rendering pricing", "residential rendering pricing",
    "architectural visualization services pricing", "AI rendering software pricing", "architecture software subscription",
    "rendering software subscription", "AEC software cost", "architectural design software pricing"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    title: "Pricing | Renderiq - AI Architectural Visualization Plans & Credits",
    description: "Affordable AI architectural rendering pricing. Free tier available. Starter $7.99/month (₹799), Pro $24.99/month (₹2,499), Enterprise $64.99/month (₹6,499). Annual plans available.",
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
    description: "Affordable AI architectural rendering pricing. Free tier available. Starter $7.99/month (₹799), Pro $24.99/month (₹2,499), Enterprise $64.99/month (₹6,499).",
    images: [`${siteUrl}/og/pricing.jpg`],
    creator: "@Renderiq",
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

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pricingProductSchema} />
      {children}
    </>
  );
}

